import { execFile } from 'child_process';
import { Resolver } from 'dns/promises';

export interface DigRecord {
  name: string;
  ttl: string;
  class: string;
  type: string;
  value: string;
}

export interface DigResult {
  status: string;
  queryTime: string;
  server: string;
  when: string;
  records: DigRecord[];
  rawOutput: string;
}

const SUPPORTED_RECORD_TYPES = [
  'A', 'AAAA', 'MX', 'NS', 'CNAME', 'TXT', 'ANY', 'SOA', 'SRV', 'CAA', 'PTR'
];

/**
 * Validates domain string for shell safety.
 */
export function isValidDomain(domain: string): boolean {
  if (!domain || domain.length > 253) return false;
  // Allow letters, digits, hyphens, dots, underscores
  const domainRegex = /^[a-zA-Z0-9._-]+$/;
  return domainRegex.test(domain);
}

/**
 * Resolves the first authoritative nameserver for a domain.
 */
export async function getAuthoritativeNameserver(domain: string): Promise<string | null> {
  try {
    const resolver = new Resolver();
    // Use system resolver first to get the NS records
    const nsRecords = await resolver.resolveNs(domain);
    if (nsRecords && nsRecords.length > 0) {
      // Resolve the first NS domain to an IP address
      const nsHost = nsRecords[0];
      const ips = await resolver.resolve4(nsHost).catch(async () => {
        return await resolver.resolve6(nsHost).catch(() => [] as string[]);
      });
      if (ips && ips.length > 0) {
        return ips[0];
      }
      return nsHost; // Return hostname if IP resolution fails (dig can resolve nameservers)
    }
  } catch (err) {
    console.error(`Error resolving authoritative NS for ${domain}:`, err);
  }
  return null;
}

/**
 * Runs dig using child_process.execFile to query the selected nameserver.
 * Parses the raw output into a structured DigResult.
 */
export function performDig(
  domain: string,
  type: string = 'A',
  nameserver: string = '8.8.8.8'
): Promise<DigResult> {
  return new Promise(async (resolve) => {
    const cleanType = SUPPORTED_RECORD_TYPES.includes(type.toUpperCase()) ? type.toUpperCase() : 'A';
    let targetServer = nameserver;

    // Resolve authoritative if requested
    if (nameserver.toLowerCase() === 'authoritative') {
      const authNs = await getAuthoritativeNameserver(domain);
      if (authNs) {
        targetServer = authNs;
      } else {
        // Fallback to Google DNS if authoritative NS lookup fails
        targetServer = '8.8.8.8';
      }
    }

    const args = [`@${targetServer}`, domain, cleanType];

    execFile('/usr/bin/dig', args, (error, stdout, stderr) => {
      if (error || stderr) {
        console.warn('dig binary execution failed or warning raised, falling back to node dns:', stderr || error);
        return resolve(performNodeDnsFallback(domain, cleanType, targetServer));
      }

      try {
        const parsed = parseDigOutput(stdout, targetServer);
        resolve(parsed);
      } catch (parseError) {
        console.error('Error parsing dig output, falling back to node dns:', parseError);
        resolve(performNodeDnsFallback(domain, cleanType, targetServer));
      }
    });
  });
}

/**
 * Parses raw stdout from the standard Linux `dig` utility.
 */
function parseDigOutput(stdout: string, queryServer: string): DigResult {
  const lines = stdout.split('\n');
  
  let status = 'UNKNOWN';
  let queryTime = 'N/A';
  let server = queryServer;
  let when = '';
  const records: DigRecord[] = [];

  let inAnswerSection = false;

  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Parse header fields (status)
    if (trimmed.startsWith(';; ->>HEADER<<-')) {
      const statusMatch = trimmed.match(/status:\s*([A-Z]+)/);
      if (statusMatch) {
        status = statusMatch[1];
      }
      continue;
    }

    // Identify sections
    if (trimmed.startsWith(';; ANSWER SECTION:')) {
      inAnswerSection = true;
      continue;
    } else if (trimmed.startsWith(';;') && inAnswerSection) {
      inAnswerSection = false; // Left the answer section
    }

    // Parse records in answer section
    if (inAnswerSection && !trimmed.startsWith(';')) {
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 5) {
        const name = parts[0];
        const ttl = parts[1];
        const recordClass = parts[2];
        const recordType = parts[3];
        const value = parts.slice(4).join(' ');

        records.push({
          name,
          ttl,
          class: recordClass,
          type: recordType,
          value,
        });
      }
      continue;
    }

    // Parse footer stats
    if (trimmed.startsWith(';; Query time:')) {
      const match = trimmed.match(/Query time:\s*(\d+)\s*msec/);
      if (match) {
        queryTime = `${match[1]} ms`;
      }
    } else if (trimmed.startsWith(';; SERVER:')) {
      const match = trimmed.match(/SERVER:\s*(.+)/);
      if (match) {
        server = match[1];
      }
    } else if (trimmed.startsWith(';; WHEN:')) {
      const match = trimmed.match(/WHEN:\s*(.+)/);
      if (match) {
        when = match[1];
      }
    }
  }

  // Fallback for empty status if headers are missing
  if (status === 'UNKNOWN' && records.length > 0) {
    status = 'NOERROR';
  }

  return {
    status,
    queryTime,
    server,
    when: when || new Date().toUTCString(),
    records,
    rawOutput: stdout,
  };
}

/**
 * pure Node JS Resolver fallback to resolve queries when '/usr/bin/dig' is not functional.
 * Simulates a standard dig output format.
 */
async function performNodeDnsFallback(
  domain: string,
  type: string,
  nameserver: string
): Promise<DigResult> {
  const resolver = new Resolver();
  // Attempt to use custom server
  try {
    resolver.setServers([nameserver]);
  } catch {
    // Ignore invalid nameserver format and use system defaults
  }

  const startTime = Date.now();
  let status = 'NOERROR';
  const records: DigRecord[] = [];
  let simulatedRaw = `; <<>> Simulated DiG 9.0 <<>> @${nameserver} ${domain} ${type}\n`;
  simulatedRaw += `; (1 server found)\n;; Got answer:\n`;

  try {
    let rawResults: any;
    if (type === 'A') {
      rawResults = await resolver.resolve4(domain);
      rawResults.forEach((val: string) => records.push({ name: `${domain}.`, ttl: '300', class: 'IN', type: 'A', value: val }));
    } else if (type === 'AAAA') {
      rawResults = await resolver.resolve6(domain);
      rawResults.forEach((val: string) => records.push({ name: `${domain}.`, ttl: '300', class: 'IN', type: 'AAAA', value: val }));
    } else if (type === 'MX') {
      rawResults = await resolver.resolveMx(domain);
      rawResults.forEach((val: any) => records.push({ name: `${domain}.`, ttl: '300', class: 'IN', type: 'MX', value: `${val.priority} ${val.exchange}` }));
    } else if (type === 'TXT') {
      rawResults = await resolver.resolveTxt(domain);
      rawResults.forEach((val: string[]) => records.push({ name: `${domain}.`, ttl: '300', class: 'IN', type: 'TXT', value: `"${val.join(' ')}"` }));
    } else if (type === 'NS') {
      rawResults = await resolver.resolveNs(domain);
      rawResults.forEach((val: string) => records.push({ name: `${domain}.`, ttl: '300', class: 'IN', type: 'NS', value: val }));
    } else if (type === 'CNAME') {
      rawResults = await resolver.resolveCname(domain);
      rawResults.forEach((val: string) => records.push({ name: `${domain}.`, ttl: '300', class: 'IN', type: 'CNAME', value: val }));
    } else if (type === 'SOA') {
      const val = await resolver.resolveSoa(domain);
      records.push({
        name: `${domain}.`,
        ttl: '300',
        class: 'IN',
        type: 'SOA',
        value: `${val.nsname} ${val.hostmaster} ${val.serial} ${val.refresh} ${val.retry} ${val.expire} ${val.minttl}`,
      });
    } else {
      // Basic resolve as fallback
      const ips = await resolver.resolve(domain).catch(() => [] as string[]);
      ips.forEach((val: string) => records.push({ name: `${domain}.`, ttl: '300', class: 'IN', type: type, value: val }));
    }
  } catch (err: any) {
    if (err.code === 'ENOTFOUND' || err.code === 'ENODATA') {
      status = 'NXDOMAIN';
    } else {
      status = 'SERVFAIL';
    }
  }

  const queryTime = `${Date.now() - startTime} ms`;
  
  simulatedRaw += `;; ->>HEADER<<- opcode: QUERY, status: ${status}, id: 00000\n`;
  simulatedRaw += `;; flags: qr rd ra; QUERY: 1, ANSWER: ${records.length}, AUTHORITY: 0, ADDITIONAL: 0\n\n`;
  simulatedRaw += `;; QUESTION SECTION:\n;${domain}. IN ${type}\n\n`;

  if (records.length > 0) {
    simulatedRaw += `;; ANSWER SECTION:\n`;
    records.forEach(r => {
      simulatedRaw += `${r.name}\t${r.ttl}\t${r.class}\t${r.type}\t${r.value}\n`;
    });
    simulatedRaw += `\n`;
  }

  simulatedRaw += `;; Query time: ${queryTime}\n`;
  simulatedRaw += `;; SERVER: ${nameserver}#53\n`;
  simulatedRaw += `;; WHEN: ${new Date().toUTCString()}\n`;

  return {
    status,
    queryTime,
    server: nameserver,
    when: new Date().toUTCString(),
    records,
    rawOutput: simulatedRaw,
  };
}
