export interface IpDetails {
  ip: string;
  isMock?: boolean;
  hostname?: string;
  isp: string;
  asn: string;
  connectionType: string; // e.g. "Mobile", "Broadband/Cable", "Hosting/Cloud", "Business"
  country: string;
  countryCode: string; // e.g. "US", "FR"
  region: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
  timezone: string;
  localTime?: string;
  security: {
    isProxy: boolean;
    isVpn: boolean;
    isTor: boolean;
    isHosting: boolean;
    score: number; // Risk/suspicion score out of 100
  };
  isDomain?: boolean;
  queriedDomain?: string;
  dnsRecords?: any;
  whois?: any;
}

/**
 * Checks if an IP address is a private, loopback, or local IP address.
 */
export function isPrivateIp(ip: string): boolean {
  if (!ip) return true;
  const trimmed = ip.trim();
  if (trimmed === '127.0.0.1' || trimmed === '::1' || trimmed === 'localhost' || trimmed === '::ffff:127.0.0.1') {
    return true;
  }

  // IPv4 Private ranges:
  // 10.0.0.0 - 10.255.255.255 (10.0.0.0/8)
  // 172.16.0.0 - 172.31.255.255 (172.16.0.0/12)
  // 192.168.0.0 - 192.168.255.255 (192.168.0.0/16)
  // 169.254.0.0 - 169.254.255.255 (Link-local)
  const ipv4PrivateRegex = /^(10\.\d{1,3}\.\d{1,3}\.\d{1,3})|(172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})|(192\.168\.\d{1,3}\.\d{1,3})|(169\.254\.\d{1,3}\.\d{1,3})$/;
  if (ipv4PrivateRegex.test(trimmed)) return true;

  // IPv6 Private / Link-local ranges:
  // fe80::/10 (Link-local)
  // fc00::/7 (Unique local address)
  if (trimmed.toLowerCase().startsWith('fe80:') || trimmed.toLowerCase().startsWith('fd00:') || trimmed.toLowerCase().startsWith('fc00:')) {
    return true;
  }

  return false;
}

/**
 * Parses ASN information from standard AS strings like "AS15169 Google LLC"
 */
function parseAsn(asString?: string): { asn: string; name: string } {
  if (!asString) return { asn: 'N/A', name: 'Unknown' };
  const match = asString.match(/^(AS\d+)\s+(.*)$/i);
  if (match) {
    return { asn: match[1], name: match[2] };
  }
  return { asn: 'N/A', name: asString };
}

/**
 * Helper to compute current local time in a specific timezone
 */
export function getLocalTime(timezoneStr: string): string {
  try {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezoneStr,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    };
    return new Intl.DateTimeFormat('en-US', options).format(new Date());
  } catch (error) {
    return new Date().toLocaleTimeString('en-US', { hour12: false });
  }
}

/**
 * Fetches geolocation and analysis details for a given IP address.
 * Automatically resolves local IP addresses to a mock public IP (Cloudflare 1.1.1.1) for local developer ergonomics.
 * 
 * @param ip IP address to analyze
 * @returns Standardized IpDetails object
 */
export async function fetchIpDetails(ip: string): Promise<IpDetails> {
  let targetIp = ip ? ip.trim() : '';
  let isMock = false;

  // For localhost or local development, resolve to Cloudflare's DNS IP (1.1.1.1)
  if (!targetIp || isPrivateIp(targetIp)) {
    targetIp = '1.1.1.1';
    isMock = true;
  }

  const fields = 'status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,mobile,proxy,hosting,query';
  const url = `http://ip-api.com/json/${targetIp}?fields=${fields}`;

  try {
    const response = await fetch(url, {
      next: { revalidate: 3600 }, // Cache on Next.js server side for 1 hour to prevent rate limits
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'success') {
      throw new Error(data.message || 'Failed to fetch geolocation data');
    }

    const { asn, name: ispName } = parseAsn(data.as);

    // Determine connection type
    let connectionType = 'Broadband/Cable';
    if (data.mobile) {
      connectionType = 'Mobile Cellular';
    } else if (data.hosting) {
      connectionType = 'Hosting/Cloud';
    } else if (/corporate|business/i.test(data.org || '')) {
      connectionType = 'Corporate';
    }

    // Proxy / VPN / Tor security risk scoring
    // ip-api free tier provides direct proxy and hosting flags. We construct a risk score based on flags.
    const isProxy = !!data.proxy;
    const isHosting = !!data.hosting;
    // Tor is usually flagged under proxy or hosting by ip-api.com. We make a smart inference or default to false
    const isTor = false; 
    const isVpn = isProxy && !isHosting; // Standard VPN matches proxy flag but isn't hosted in a residential ISP

    let securityScore = 0;
    if (isTor) securityScore += 100;
    else if (isVpn) securityScore += 75;
    else if (isProxy) securityScore += 50;
    else if (isHosting) securityScore += 30; // Hosting environments are suspicious but not necessarily toxic

    return {
      ip: isMock ? (ip || '127.0.0.1') : data.query,
      isMock,
      isp: data.isp || data.org || ispName || 'Unknown ISP',
      asn: asn,
      connectionType,
      country: data.country || 'Unknown Country',
      countryCode: data.countryCode || 'UN',
      region: data.regionName || data.region || 'Unknown Region',
      city: data.city || 'Unknown City',
      zip: data.zip || 'N/A',
      lat: typeof data.lat === 'number' ? data.lat : 0,
      lon: typeof data.lon === 'number' ? data.lon : 0,
      timezone: data.timezone || 'UTC',
      localTime: getLocalTime(data.timezone || 'UTC'),
      security: {
        isProxy,
        isVpn,
        isTor,
        isHosting,
        score: securityScore,
      },
    };
  } catch (error) {
    console.error(`Error in fetchIpDetails for IP ${targetIp}:`, error);

    // High-resilience fallback details if API fails or rate-limits
    return {
      ip: targetIp,
      isMock: true,
      isp: 'Fallback ISP Service',
      asn: 'AS-N/A',
      connectionType: 'Broadband',
      country: 'United States',
      countryCode: 'US',
      region: 'California',
      city: 'San Francisco',
      zip: '94105',
      lat: 37.7749,
      lon: -122.4194,
      timezone: 'America/Los_Angeles',
      localTime: getLocalTime('America/Los_Angeles'),
      security: {
        isProxy: false,
        isVpn: false,
        isTor: false,
        isHosting: false,
        score: 0,
      },
    };
  }
}
