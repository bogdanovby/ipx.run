import { NextRequest, NextResponse } from 'next/server';
import net from 'net';
import { fetchIpDetails } from '@/services/ipService';
import { resolveReverseDns, resolveDomainToIp, fetchDnsRecords } from '@/services/dnsService';
import { fetchWhoisData } from '@/services/whoisService';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

const RATE_LIMIT = { limit: 30, windowMs: 60_000 };

/**
 * GET handler for /api/ip/[ip]
 * Analyzes and returns detailed geolocation, DNS records, and WHOIS registry details
 * for a custom IP address or Domain Name.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ip: string }> }
) {
  const clientIp = getClientIp(request);
  const rl = checkRateLimit(`ip-route:${clientIp}`, RATE_LIMIT);
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
    const { ip } = await params;
    const decodedInput = decodeURIComponent(ip).trim();

    let targetIp = '';
    let isDomain = false;
    let queriedDomain = '';

    // Check if input is a valid IP address
    const ipType = net.isIP(decodedInput);

    if (ipType > 0) {
      // It is a valid IPv4 or IPv6 address
      targetIp = decodedInput;
    } else {
      // Treat as domain name, try to resolve it
      isDomain = true;
      queriedDomain = decodedInput.toLowerCase();
      
      const resolvedIp = await resolveDomainToIp(queriedDomain);
      if (!resolvedIp) {
        return NextResponse.json(
          { error: `Could not resolve domain name '${queriedDomain}' to a valid IP address.` },
          { status: 400 }
        );
      }
      targetIp = resolvedIp;
    }

    // Parallel fetch: Geolocation, reverse DNS, DNS Records, and WHOIS/RDAP
    const ipDetailsPromise = fetchIpDetails(targetIp);
    const rDnsPromise = resolveReverseDns(targetIp);

    // Dynamic DNS and WHOIS fetches depending on query type
    let dnsRecordsPromise = isDomain 
      ? fetchDnsRecords(queriedDomain)
      : Promise.resolve(undefined);

    let whoisPromise = isDomain
      ? fetchWhoisData(queriedDomain, 'domain')
      : fetchWhoisData(targetIp, 'ip');

    const [ipDetails, rDns, dnsRecords, whois] = await Promise.all([
      ipDetailsPromise,
      rDnsPromise,
      dnsRecordsPromise,
      whoisPromise,
    ]);

    // Construct the enriched payload
    const payload = {
      ...ipDetails,
      hostname: rDns || 'No rDNS record found',
      isDomain,
      queriedDomain: isDomain ? queriedDomain : undefined,
      dnsRecords: dnsRecords || null,
      whois: whois || null,
    };

    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error in custom IP / Domain API route:', error);
    return NextResponse.json(
      { error: 'An internal server error occurred while analyzing the target.' },
      { status: 500 }
    );
  }
}
