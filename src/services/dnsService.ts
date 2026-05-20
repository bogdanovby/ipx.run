import dns from 'dns';

export interface DnsRecords {
  A?: string[];
  AAAA?: string[];
  MX?: { exchange: string; priority: number }[];
  TXT?: string[][];
  NS?: string[];
  CNAME?: string[];
}

/**
 * Performs a Reverse DNS lookup on an IP address.
 * Resolves the IP address to its associated hostname (rDNS).
 * This function can only be run in a Node.js environment (Server Components/API Routes).
 */
export async function resolveReverseDns(ip: string): Promise<string | undefined> {
  // Guard against invalid IP or localhost
  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') {
    return 'localhost';
  }

  try {
    const hostnames = await dns.promises.reverse(ip);
    return hostnames && hostnames.length > 0 ? hostnames[0] : undefined;
  } catch (error) {
    return undefined;
  }
}

/**
 * Resolves a domain name to its first IPv4 address.
 * Falls back to IPv6 if no IPv4 is available, or returns undefined if resolution fails.
 */
export async function resolveDomainToIp(domain: string): Promise<string | undefined> {
  if (!domain) return undefined;
  const trimmed = domain.trim().toLowerCase();

  try {
    const ipv4s = await dns.promises.resolve4(trimmed);
    if (ipv4s && ipv4s.length > 0) return ipv4s[0];
  } catch (error) {
    try {
      const ipv6s = await dns.promises.resolve6(trimmed);
      if (ipv6s && ipv6s.length > 0) return ipv6s[0];
    } catch (err6) {
      // Both IPv4 and IPv6 resolution failed
    }
  }
  return undefined;
}

/**
 * Queries all standard DNS record types for a domain.
 * Wraps each record query in an individual try/catch block so that empty/non-existent records
 * do not cause the entire request to fail.
 */
export async function fetchDnsRecords(domain: string): Promise<DnsRecords> {
  const records: DnsRecords = {};
  const trimmed = domain.trim().toLowerCase();

  const safeResolve = async <T>(fn: () => Promise<T>): Promise<T | undefined> => {
    try {
      return await fn();
    } catch {
      return undefined;
    }
  };

  const [A, AAAA, MX, TXT, NS, CNAME] = await Promise.all([
    safeResolve(() => dns.promises.resolve4(trimmed)),
    safeResolve(() => dns.promises.resolve6(trimmed)),
    safeResolve(() => dns.promises.resolveMx(trimmed)),
    safeResolve(() => dns.promises.resolveTxt(trimmed)),
    safeResolve(() => dns.promises.resolveNs(trimmed)),
    safeResolve(() => dns.promises.resolveCname(trimmed)),
  ]);

  if (A && A.length > 0) records.A = A;
  if (AAAA && AAAA.length > 0) records.AAAA = AAAA;
  if (MX && MX.length > 0) records.MX = MX;
  if (TXT && TXT.length > 0) records.TXT = TXT;
  if (NS && NS.length > 0) records.NS = NS;
  if (CNAME && CNAME.length > 0) records.CNAME = CNAME;

  return records;
}
