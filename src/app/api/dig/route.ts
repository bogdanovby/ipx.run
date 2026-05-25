import { NextRequest, NextResponse } from 'next/server';
import { performDig, isValidDomain } from '@/services/digService';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

const RATE_LIMIT = { limit: 5, windowMs: 60_000 };

const ALLOWED_NAMESERVERS = ['8.8.8.8', '1.1.1.1', '208.67.222.222', 'authoritative'];

/**
 * GET /api/dig
 * Params:
 *  - domain: string (the domain to query)
 *  - type: string (the DNS record type: A, AAAA, MX, TXT, etc.)
 *  - nameserver: string (target IP or 'authoritative')
 */
export async function GET(request: NextRequest) {
  const clientIp = getClientIp(request);
  const rl = checkRateLimit(`dig-route:${clientIp}`, RATE_LIMIT);
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

  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain')?.trim() || '';
    const type = searchParams.get('type')?.trim() || 'A';
    const nameserver = searchParams.get('nameserver')?.trim() || '8.8.8.8';

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain parameter is required' },
        { status: 400 }
      );
    }

    if (!isValidDomain(domain)) {
      return NextResponse.json(
        { error: 'Invalid domain name format provided.' },
        { status: 400 }
      );
    }

    // Double-check nameserver format
    const isIp = /^[0-9.]+$/.test(nameserver) || /^[0-9a-fA-F:]+$/.test(nameserver);
    const isAllowed = ALLOWED_NAMESERVERS.includes(nameserver) || isIp;
    
    if (!isAllowed || nameserver.length > 100) {
      return NextResponse.json(
        { error: 'Invalid nameserver format provided.' },
        { status: 400 }
      );
    }

    const result = await performDig(domain, type, nameserver);

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Error in /api/dig route handler:', error);
    return NextResponse.json(
      { error: 'An error occurred while executing the DNS dig query.' },
      { status: 500 }
    );
  }
}
