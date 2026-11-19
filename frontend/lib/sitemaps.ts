import { BASE_URL } from '@/lib/constants';

export interface SitemapUrlEntry {
  url: string;
  lastModified?: Date | string | null;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  alternates?: Record<string, string>;
}

export function escapeXml(unsafe: string | null | undefined): string {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]/g, '')
    .replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case "'": return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
}

export function buildUrlSetXml(entries: SitemapUrlEntry[]): string {
  const hasAlternates = entries.some((e) => e.alternates && Object.keys(e.alternates).length > 0);
  const xmlnsXhtml = hasAlternates ? ' xmlns:xhtml="http://www.w3.org/1999/xhtml"' : '';

  const nodes = entries.map((entry) => {
    const loc = escapeXml(entry.url);
    let lastmodTag = '';
    if (entry.lastModified) {
      const d = entry.lastModified instanceof Date ? entry.lastModified : new Date(entry.lastModified);
      if (!isNaN(d.getTime())) {
        lastmodTag = `\n    <lastmod>${d.toISOString()}</lastmod>`;
      }
    }
    const changefreqTag = entry.changeFrequency ? `\n    <changefreq>${entry.changeFrequency}</changefreq>` : '';
    const priorityTag = entry.priority !== undefined ? `\n    <priority>${entry.priority.toFixed(2)}</priority>` : '';
    const altTags = entry.alternates
      ? Object.entries(entry.alternates)
          .map(([lang, href]) => `\n    <xhtml:link rel="alternate" hreflang="${escapeXml(lang)}" href="${escapeXml(href)}" />`)
          .join('')
      : '';

    return `  <url>\n    <loc>${loc}</loc>${lastmodTag}${changefreqTag}${priorityTag}${altTags}\n  </url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${xmlnsXhtml}>\n${nodes.join('\n')}\n</urlset>`;
}

export function xmlResponse(xml: string, maxAgeSeconds = 3600): Response {
  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': `public, max-age=${maxAgeSeconds}, s-maxage=${maxAgeSeconds}, stale-while-revalidate=${maxAgeSeconds * 2}`,
    },
  });
}

export const STRUCTURAL_FALLBACK_DATE = new Date('2026-11-18T00:00:00Z');
export { BASE_URL };
