import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import net from 'net';

/**
 * Spawns the native Linux `/usr/bin/ping` command.
 * Returns the child process instance, enabling streaming of stdout to the client.
 */
export function spawnSystemPing(target: string, count: number = 4): ChildProcessWithoutNullStreams {
  // Use standard flags:
  // -c count: number of packets
  // -W timeout: wait timeout in seconds (default 2 seconds)
  return spawn('/usr/bin/ping', ['-c', count.toString(), '-W', '2', target]);
}

/**
 * Validates whether the given string is a safe ping target (domain name or IP).
 * Prevents command injection and malformed arguments.
 */
export function isValidPingTarget(target: string): boolean {
  if (!target || target.length > 253) return false;
  
  // Accept standard IPv4, IPv6, and domain names (letters, digits, dots, hyphens)
  const targetRegex = /^[a-zA-Z0-9.:-]+$/;
  return targetRegex.test(target);
}

/**
 * Fallback TCP Ping.
 * Initiates raw TCP socket handshakes to a specific port (default 80 or 443) 
 * to measure latency when ICMP pinging is blocked or unavailable in the environment.
 */
export async function performTcpPing(
  target: string,
  port: number = 80,
  count: number = 4
): Promise<string[]> {
  const lines: string[] = [];
  lines.push(`TCP-PING ${target}:${port} (simulating ping over TCP handshake)`);
  
  let min = Infinity;
  let max = 0;
  let sum = 0;
  let successCount = 0;

  for (let i = 1; i <= count; i++) {
    const start = process.hrtime();
    try {
      await new Promise<void>((resolve, reject) => {
        const socket = net.createConnection({
          host: target,
          port: port,
          timeout: 1500,
        });

        socket.on('connect', () => {
          socket.destroy();
          resolve();
        });

        socket.on('error', (err) => {
          socket.destroy();
          reject(err);
        });

        socket.on('timeout', () => {
          socket.destroy();
          reject(new Error('Request timed out'));
        });
      });

      const diff = process.hrtime(start);
      // Convert to milliseconds
      const ms = (diff[0] * 1e9 + diff[1]) / 1e6;

      min = Math.min(min, ms);
      max = Math.max(max, ms);
      sum += ms;
      successCount++;

      lines.push(`64 bytes connection from ${target}: tcp_seq=${i} port=${port} time=${ms.toFixed(2)} ms`);
    } catch (err: any) {
      lines.push(`Connection to ${target}: tcp_seq=${i} port=${port} failed: ${err.message || 'Error'}`);
    }

    // Short gap between checks (250ms), avoiding spamming the target
    if (i < count) {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  const loss = ((count - successCount) / count) * 100;
  lines.push('');
  lines.push(`--- ${target} TCP ping statistics ---`);
  lines.push(`${count} packets transmitted, ${successCount} received, ${loss.toFixed(0)}% packet loss`);

  if (successCount > 0) {
    const avg = sum / successCount;
    lines.push(`rtt min/avg/max = ${min.toFixed(3)}/${avg.toFixed(3)}/${max.toFixed(3)} ms`);
  }

  return lines;
}
