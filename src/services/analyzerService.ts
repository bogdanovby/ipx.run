import tls from 'tls';

export interface SslDetails {
  subject: string;
  issuer: string;
  validFrom: string;
  validTo: string;
  serialNumber: string;
  fingerprint: string;
  isExpired: boolean;
}

export interface TechStackItem {
  name: string;
  category: 'Framework' | 'CMS' | 'Web Server/CDN' | 'Analytics' | 'Library';
}

/**
 * Initiates an active TLS handshake over port 443 to retrieve the peer SSL certificate details.
 */
export function getSslDetails(domain: string): Promise<SslDetails | null> {
  return new Promise((resolve) => {
    try {
      const socket = tls.connect({
        host: domain,
        port: 443,
        servername: domain,
        rejectUnauthorized: false, // Do not throw error on self-signed certs so we can inspect details
        timeout: 3000,
      }, () => {
        const cert = socket.getPeerCertificate(true);
        socket.destroy();

        if (!cert || Object.keys(cert).length === 0) {
          resolve(null);
          return;
        }

        // Standardize Issuer and Subject strings
        const parseCertOrg = (entity: any) => {
          if (!entity) return 'Unknown';
          return entity.O || entity.CN || (typeof entity === 'string' ? entity : 'Unknown');
        };

        resolve({
          subject: parseCertOrg(cert.subject),
          issuer: parseCertOrg(cert.issuer),
          validFrom: cert.valid_from,
          validTo: cert.valid_to,
          serialNumber: cert.serialNumber || 'N/A',
          fingerprint: cert.fingerprint || 'N/A',
          isExpired: new Date() > new Date(cert.valid_to),
        });
      });

      socket.on('error', () => {
        socket.destroy();
        resolve(null);
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve(null);
      });
    } catch {
      resolve(null);
    }
  });
}

/**
 * Safe, low-timeout HTTP request to the domain to fetch and parse tech signatures and contacts.
 */
export async function analyzeWebPage(domain: string): Promise<WebPageAnalysis> {
  const techs: TechStackItem[] = [];
  const contacts: ContactDetails = { emails: [], phones: [], socials: [] };
  const url = `https://${domain}`;

  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    }).catch(async () => {
      // Fallback to HTTP if HTTPS fails
      return await fetch(`http://${domain}`, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        }
      });
    });

    clearTimeout(id);

    // Extract Server and tech details from Response Headers
    const headers = response.headers;
    const serverHeader = headers.get('server')?.toLowerCase() || '';
    const poweredBy = headers.get('x-powered-by')?.toLowerCase() || '';
    const cacheHeader = headers.get('x-nextjs-cache') || headers.get('x-vercel-cache') || '';
    const vercelId = headers.get('x-vercel-id') || '';

    // 1. Detect Servers and CDNs
    if (serverHeader.includes('cloudflare')) {
      techs.push({ name: 'Cloudflare CDN', category: 'Web Server/CDN' });
    }
    if (serverHeader.includes('nginx')) {
      techs.push({ name: 'Nginx', category: 'Web Server/CDN' });
    } else if (serverHeader.includes('apache')) {
      techs.push({ name: 'Apache HTTP Server', category: 'Web Server/CDN' });
    } else if (serverHeader.includes('litespeed')) {
      techs.push({ name: 'LiteSpeed Web Server', category: 'Web Server/CDN' });
    } else if (serverHeader.includes('gws') || serverHeader.includes('gfe')) {
      techs.push({ name: 'Google Web Server', category: 'Web Server/CDN' });
    }

    if (vercelId || cacheHeader || poweredBy.includes('vercel')) {
      techs.push({ name: 'Vercel hosting', category: 'Web Server/CDN' });
    }

    // 2. Detect Language backend signatures
    if (poweredBy.includes('php')) {
      techs.push({ name: 'PHP', category: 'Library' });
    } else if (poweredBy.includes('express') || poweredBy.includes('node')) {
      techs.push({ name: 'Node.js/Express', category: 'Framework' });
    } else if (poweredBy.includes('asp.net')) {
      techs.push({ name: 'ASP.NET', category: 'Framework' });
    }

    // Read body text for source code signatures
    const body = await response.text();
    const bodyLower = body.toLowerCase();

    // 3. Detect Frameworks & Sitebuilders
    if (bodyLower.includes('_next/static') || bodyLower.includes('__next_data__')) {
      techs.push({ name: 'Next.js', category: 'Framework' });
      techs.push({ name: 'React', category: 'Library' });
    } else if (bodyLower.includes('nuxt') || bodyLower.includes('__nuxt_')) {
      techs.push({ name: 'Nuxt.js', category: 'Framework' });
      techs.push({ name: 'Vue.js', category: 'Library' });
    } else if (bodyLower.includes('wp-content') || bodyLower.includes('wp-includes')) {
      techs.push({ name: 'WordPress CMS', category: 'CMS' });
      techs.push({ name: 'PHP', category: 'Library' });
    } else if (bodyLower.includes('cdn.shopify.com') || bodyLower.includes('shopify-pay')) {
      techs.push({ name: 'Shopify Store', category: 'CMS' });
    } else if (bodyLower.includes('w-webflow') || bodyLower.includes('data-wf-page')) {
      techs.push({ name: 'Webflow', category: 'CMS' });
    } else if (bodyLower.includes('astro-island') || bodyLower.includes('astro-route')) {
      techs.push({ name: 'Astro', category: 'Framework' });
    }

    // Detect React/Vue inside non-framework structures
    const hasReact = bodyLower.includes('react.production') || bodyLower.includes('react-dom');
    const hasVue = bodyLower.includes('vue.global') || bodyLower.includes('vuejs');
    if (hasReact && !techs.some(t => r(t.name, 'React'))) {
      techs.push({ name: 'React', category: 'Library' });
    }
    if (hasVue && !techs.some(t => r(t.name, 'Vue.js'))) {
      techs.push({ name: 'Vue.js', category: 'Library' });
    }

    // 4. Detect CSS frameworks & libraries
    if (bodyLower.includes('tailwind') || bodyLower.includes('tw-')) {
      techs.push({ name: 'Tailwind CSS', category: 'Library' });
    }
    if (bodyLower.includes('bootstrap') || bodyLower.includes('.btn-primary')) {
      techs.push({ name: 'Bootstrap CSS', category: 'Library' });
    }

    // 5. Detect Javascript helpers and utilities
    if (bodyLower.includes('jquery') || bodyLower.includes('$.fn.')) {
      techs.push({ name: 'jQuery', category: 'Library' });
    }

    // 6. Detect Analytics systems
    if (bodyLower.includes('googletagmanager.com/gtm.js') || bodyLower.includes('gtag(')) {
      techs.push({ name: 'Google Tag Manager', category: 'Analytics' });
    }
    if (bodyLower.includes('google-analytics.com/analytics.js') || bodyLower.includes('ga-disable-')) {
      techs.push({ name: 'Google Analytics', category: 'Analytics' });
    }
    if (bodyLower.includes('static.hotjar.com') || bodyLower.includes('hj(')) {
      techs.push({ name: 'Hotjar Analytics', category: 'Analytics' });
    }

    // 7. Parse Contact Info from HTML
    const parsedContacts = extractContactsFromHtml(body);
    contacts.emails = parsedContacts.emails;
    contacts.phones = parsedContacts.phones;
    contacts.socials = parsedContacts.socials;

  } catch {
    // Fail silently, defaults handled at API level
  }

  // Deduplicate techs
  const uniqueTechs: TechStackItem[] = [];
  const seen = new Set<string>();
  for (const t of techs) {
    if (!seen.has(t.name)) {
      seen.add(t.name);
      uniqueTechs.push(t);
    }
  }

  return {
    techs: uniqueTechs,
    contacts,
  };
}

/**
 * Backwards compatibility wrapper for detectTechStack.
 */
export async function detectTechStack(domain: string): Promise<TechStackItem[]> {
  const result = await analyzeWebPage(domain);
  return result.techs;
}

export interface ContactDetails {
  emails: string[];
  phones: string[];
  socials: Array<{ platform: string; url: string }>;
}

export interface WebPageAnalysis {
  techs: TechStackItem[];
  contacts: ContactDetails;
}

/**
 * Extracts emails, phone numbers, and social links from raw HTML page body source.
 */
export function extractContactsFromHtml(html: string): ContactDetails {
  const emails = new Set<string>();
  const phones = new Set<string>();
  const socials: Array<{ platform: string; url: string }> = [];
  const seenSocialUrls = new Set<string>();

  // 1. Explicit mailto: links
  const mailtoRegex = /href=["']mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
  let mailtoMatch;
  while ((mailtoMatch = mailtoRegex.exec(html)) !== null) {
    emails.add(mailtoMatch[1].trim().toLowerCase());
  }

  // 2. Plaintext emails
  const emailRegex = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}\b/g;
  let emailMatch;
  while ((emailMatch = emailRegex.exec(html)) !== null) {
    const email = emailMatch[0].trim().toLowerCase();
    // Ignore images & media signatures
    if (!/\.(png|jpg|jpeg|gif|svg|webp|js|css|json)$/i.test(email)) {
      emails.add(email);
    }
  }

  // 3. Explicit tel: links
  const telRegex = /href=["']tel:(\+?[0-9\s().-]{7,20})/gi;
  let telMatch;
  while ((telMatch = telRegex.exec(html)) !== null) {
    const phone = telMatch[1].trim();
    const cleanDigits = phone.replace(/[^\d+]/g, '');
    if (cleanDigits.replace('+', '').length >= 7 && cleanDigits.replace('+', '').length <= 15) {
      phones.add(phone);
    }
  }

  // 4. Plaintext phone numbers (matches various global patterns)
  const phoneRegex = /(?:\+?([1-9]\d{0,3})[-.\s]?)?\(?(\d{2,4})\)?[-.\s]?(\d{3,5})[-.\s]?(\d{2,5})[-.\s]?(\d{2,5})/g;
  let phoneMatch;
  while ((phoneMatch = phoneRegex.exec(html)) !== null) {
    const rawPhone = phoneMatch[0].trim();
    const cleanDigits = rawPhone.replace(/[^\d+]/g, '');
    
    if (cleanDigits.replace('+', '').length >= 9 && cleanDigits.replace('+', '').length <= 15) {
      // Exclude simple date/year patterns, version numbers, or image formats
      if (!/^\d{4}-\d{2}-\d{2}$/.test(rawPhone) && !/^\d{8,14}$/.test(rawPhone) && !rawPhone.includes('.')) {
        phones.add(rawPhone);
      }
    }
  }

  // 5. Social media platform patterns
  const platforms = [
    { name: 'telegram', regex: /t\.me\/([a-zA-Z0-9_]{5,})/i },
    { name: 'whatsapp', regex: /(?:wa\.me|api\.whatsapp\.com\/send\?phone=)(\+?[0-9]+)/i },
    { name: 'facebook', regex: /(?:facebook\.com|fb\.me|fb\.com)\/([a-zA-Z0-9._-]+)/i },
    { name: 'instagram', regex: /instagram\.com\/([a-zA-Z0-9._-]+)/i },
    { name: 'linkedin', regex: /linkedin\.com\/(?:in|company|school)\/([a-zA-Z0-9._-]+)/i },
    { name: 'twitter', regex: /(?:twitter\.com|x\.com)\/([a-zA-Z0-9._-]+)/i },
    { name: 'youtube', regex: /youtube\.com\/(?:c\/|channel\/|user\/|@)?([a-zA-Z0-9._-]+)/i },
    { name: 'vk', regex: /vk\.com\/([a-zA-Z0-9._-]+)/i },
    { name: 'github', regex: /github\.com\/([a-zA-Z0-9._-]+)/i }
  ];

  // Match links in anchors (href="...")
  const hrefUrlRegex = /href=["'](https?:\/\/[^"']+)["']/gi;
  let hrefMatch;
  while ((hrefMatch = hrefUrlRegex.exec(html)) !== null) {
    const url = hrefMatch[1].trim();
    for (const platform of platforms) {
      if (platform.regex.test(url)) {
        if (!seenSocialUrls.has(url)) {
          seenSocialUrls.add(url);
          socials.push({ platform: platform.name, url });
        }
      }
    }
  }

  return {
    emails: Array.from(emails).slice(0, 5),
    phones: Array.from(phones).slice(0, 5),
    socials: socials.slice(0, 8),
  };
}

// Case insensitive match helper
function r(str: string, pattern: string) {
  return str.toLowerCase().includes(pattern.toLowerCase());
}
