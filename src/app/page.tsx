import { headers } from 'next/headers';
import { fetchIpDetails } from '@/services/ipService';
import { resolveReverseDns } from '@/services/dnsService';
import { fetchWhoisData } from '@/services/whoisService';
import Dashboard from '@/components/Dashboard';

// Force dynamic rendering so headers are evaluated at request time
export const dynamic = 'force-dynamic';

/**
 * Server Component - Entry Page
 * Performs initial request header inspection and SSRs the visitor's IP data.
 */
export default async function Page() {
  const headersList = await headers();

  // Extract client IP address from common reverse proxy headers
  let clientIp = 
    headersList.get('cf-connecting-ip') || 
    headersList.get('x-forwarded-for') || 
    headersList.get('x-real-ip') || 
    '';

  // If x-forwarded-for is a comma-separated chain, extract the client's true IP (first)
  if (clientIp && clientIp.includes(',')) {
    clientIp = clientIp.split(',')[0].trim();
  }

  // Fallback to loopback if no header was found (typically during local npm run dev)
  clientIp = clientIp ? clientIp.trim() : '127.0.0.1';

  // Gather User Agent header to analyze system/browser specifications
  const userAgent = headersList.get('user-agent') || 'Unknown';

  // 1. Fetch initial geolocation and ISP info on the server
  const ipDetails = await fetchIpDetails(clientIp);

  // 2. Perform Reverse DNS (rDNS) resolution and WHOIS lookup in parallel on the server
  const [rDnsHostname, whoisData] = await Promise.all([
    resolveReverseDns(ipDetails.ip).catch(() => null),
    fetchWhoisData(ipDetails.ip, 'ip').catch((err) => {
      console.warn(`[Page SSR] WHOIS failed for ${ipDetails.ip}:`, err.message);
      return null;
    }),
  ]);

  // Combine resolved properties
  const initialData = {
    ...ipDetails,
    hostname: rDnsHostname || 'No rDNS record found',
    whois: whoisData || null,
    dnsRecords: null, // No initial dns records as we are starting from IP, not domain
  };

  // Deliver pre-rendered dashboard HTML directly to the browser
  return <Dashboard initialData={initialData} userAgent={userAgent} />;
}
