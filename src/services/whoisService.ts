import { isPrivateIp } from './ipService';

export interface ParsedWhois {
  name: string; // Domain name or Net range
  status: string[];
  registrar?: string;
  registrant?: string;
  registrantOrg?: string;
  createdDate?: string;
  expirationDate?: string;
  updatedDate?: string;
  nameServers?: string[];
  // For IP WHOIS specifically:
  networkRange?: string;
  networkName?: string;
  rir?: string; // Regional Internet Registry (e.g. ARIN, RIPE, etc.)
  countryCode?: string;
}

export interface WhoisData {
  parsed: ParsedWhois;
  raw: any;
}

/**
 * Safely extracts a property value from a standard RDAP vcardArray.
 */
function extractVcardProperty(vcardArray: any, propName: string): string | undefined {
  if (!Array.isArray(vcardArray) || vcardArray[0] !== 'vcard' || !Array.isArray(vcardArray[1])) {
    return undefined;
  }
  const prop = vcardArray[1].find((item: any) => Array.isArray(item) && item[0] === propName);
  return prop ? prop[3] : undefined;
}

/**
 * Recursively searches entities for registrar/registrant information.
 */
function parseEntities(entities: any[], parsed: Partial<ParsedWhois>) {
  if (!Array.isArray(entities)) return;

  for (const entity of entities) {
    const roles = entity.roles || [];
    const vcard = entity.vcardArray;

    if (roles.includes('registrar') && !parsed.registrar) {
      parsed.registrar = extractVcardProperty(vcard, 'fn') || extractVcardProperty(vcard, 'org') || entity.handle;
    }
    if (roles.includes('registrant')) {
      if (!parsed.registrant) {
        parsed.registrant = extractVcardProperty(vcard, 'fn');
      }
      if (!parsed.registrantOrg) {
        parsed.registrantOrg = extractVcardProperty(vcard, 'org');
      }
    }

    // Check sub-entities if any
    if (Array.isArray(entity.entities)) {
      parseEntities(entity.entities, parsed);
    }
  }
}

/**
 * Fetches domain or IP WHOIS metadata using RDAP (Registration Data Access Protocol).
 * 
 * @param query The domain name or IP address to query
 * @param type Whether the query is a domain or an IP
 */
export async function fetchWhoisData(query: string, type: 'domain' | 'ip'): Promise<WhoisData> {
  const trimmed = query.trim().toLowerCase();

  // Instantly handle private/loopback IPs to avoid useless external API requests and 400 errors
  if (type === 'ip' && isPrivateIp(trimmed)) {
    return {
      parsed: {
        name: query,
        status: ['private-range'],
        networkRange: 'Local Loopback / Private IP Space',
        networkName: 'Local/Private Network Range',
      },
      raw: { message: 'WHOIS/RDAP queries are not supported for private IP addresses.' }
    };
  }

  const url = type === 'domain' 
    ? `https://rdap.org/domain/${encodeURIComponent(trimmed)}`
    : `https://rdap.org/ip/${encodeURIComponent(trimmed)}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/rdap+json, application/json',
      },
      next: { revalidate: 86400 }, // Cache on server for 24 hours
    });

    if (!response.ok) {
      // Return a clean fallback object instead of throwing, which Next.js dev server intercepts and crashes the overlay
      return {
        parsed: {
          name: query,
          status: [],
        },
        raw: { error: `RDAP server returned status ${response.status}` },
      };
    }

    const data = await response.json();

    const parsed: ParsedWhois = {
      name: data.ldhName || data.name || query,
      status: Array.isArray(data.status) ? data.status : [],
    };

    // Parse main entities (Registrar, Registrant, Owner etc.)
    if (Array.isArray(data.entities)) {
      parseEntities(data.entities, parsed);
    }

    // Parse Events (Created, Expires, Updated)
    if (Array.isArray(data.events)) {
      for (const event of data.events) {
        const action = event.eventAction;
        if (action === 'registration') {
          parsed.createdDate = event.eventDate;
        } else if (action === 'expiration') {
          parsed.expirationDate = event.eventDate;
        } else if (action === 'last changed') {
          parsed.updatedDate = event.eventDate;
        }
      }
    }

    // Parse Name Servers
    if (Array.isArray(data.nameservers)) {
      parsed.nameServers = data.nameservers
        .map((ns: any) => ns.ldhName || ns.unicodeName)
        .filter(Boolean);
    }

    // IP Specific fields
    if (type === 'ip') {
      if (data.startAddress && data.endAddress) {
        parsed.networkRange = `${data.startAddress} - ${data.endAddress}`;
      }
      parsed.networkName = data.name;
      parsed.rir = data.port43 || 'N/A'; // Often points to whois.arin.net / whois.ripe.net etc.
      if (parsed.rir && parsed.rir.includes('.')) {
        // e.g. "whois.arin.net" -> "ARIN"
        const parts = parsed.rir.split('.');
        if (parts.length >= 2) {
          parsed.rir = parts[parts.length - 2].toUpperCase();
        }
      }
      parsed.countryCode = data.country;
    }

    return {
      parsed,
      raw: data,
    };
  } catch (error: any) {
    console.error(`Error fetching WHOIS/RDAP data for ${query}:`, error);
    
    // Return empty but valid WHOIS payload so UI doesn't crash
    return {
      parsed: {
        name: query,
        status: [],
      },
      raw: { error: error.message || 'Failed to query RDAP registry' },
    };
  }
}
