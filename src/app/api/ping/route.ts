import { NextRequest, NextResponse } from 'next/server';
import { spawnSystemPing, isValidPingTarget, performTcpPing } from '@/services/pingService';
import { ChildProcessWithoutNullStreams } from 'child_process';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

const RATE_LIMIT = { limit: 5, windowMs: 60_000 };

/**
 * GET /api/ping
 * Parameters:
 *  - target: string (domain name or IP to ping)
 * 
 * Returns a text/event-stream (SSE) yielding real-time output.
 */
export async function GET(request: NextRequest) {
  const clientIp = getClientIp(request);
  const rl = checkRateLimit(`ping-route:${clientIp}`, RATE_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)),
        },
      }
    );
  }

  const { searchParams } = new URL(request.url);
  const target = searchParams.get('target')?.trim() || '';

  if (!target || !isValidPingTarget(target)) {
    return NextResponse.json(
      { error: 'Invalid target format provided. Target must be a valid IP or domain.' },
      { status: 400 }
    );
  }

  const encoder = new TextEncoder();
  let activeChildProcess: ChildProcessWithoutNullStreams | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      // Utility to enqueue SSE messages
      const sendEvent = (dataObj: { line: string }) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(dataObj)}\n\n`)
          );
        } catch (e) {
          // Stream might have been closed already
        }
      };

      try {
        // Attempt system ping
        const child = spawnSystemPing(target);
        activeChildProcess = child;

        child.stdout.on('data', (data) => {
          const chunk = data.toString();
          // Split by newline and stream individual lines
          const lines = chunk.split('\n');
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Don't send empty lines at the end of output blocks unless structural
            if (line.trim() || i < lines.length - 1) {
              sendEvent({ line });
            }
          }
        });

        child.stderr.on('data', (data) => {
          const chunk = data.toString();
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.trim()) {
              sendEvent({ line: `[Warning] ${line}` });
            }
          }
        });

        // Promisify the process termination
        const exitCode = await new Promise<number>((resolve) => {
          child.on('close', (code) => {
            resolve(code === null ? 0 : code);
          });

          child.on('error', (err) => {
            console.warn('Ping command execution failed or unavailable. Falling back to TCP ping.', err);
            resolve(-999); // Flag for fallback execution
          });
        });

        // Trigger TCP ping fallback if standard ping binary isn't executable
        if (exitCode === -999) {
          sendEvent({ line: 'System ping command unavailable. Starting TCP-PING socket simulation...' });
          sendEvent({ line: '' });
          
          const tcpLines = await performTcpPing(target);
          for (const line of tcpLines) {
            sendEvent({ line });
          }
        }
      } catch (err: any) {
        sendEvent({ line: `Server Error: ${err.message || 'Error occurred'}` });
      } finally {
        try {
          controller.close();
        } catch {
          // Ignored
        }
      }
    },
    cancel() {
      // Triggered when client disconnects or aborts the request
      if (activeChildProcess) {
        console.log(`Client disconnected from ping SSE. Terminating ping process pid=${activeChildProcess.pid}`);
        try {
          activeChildProcess.kill('SIGTERM');
        } catch (e) {
          console.error('Error killing abandoned ping child process:', e);
        }
      }
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
