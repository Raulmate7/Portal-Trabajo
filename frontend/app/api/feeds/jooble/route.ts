import pool from '@/lib/db';
import { BASE_URL } from '@/lib/constants';

export const dynamic = 'force-dynamic';

function cleanCdata(text: string | null | undefined): string {
  if (!text) return '';
  return String(text).replace(/\]\]>/g, ']]]]><![CDATA[>');
}

function escapeXmlAttr(text: string | null | undefined): string {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export async function GET() {
  const client = await pool.connect();
  try {
    const res = await client.query(
      "SELECT id, title, company, location, description_snippet, created_at, salary FROM jobs WHERE is_active = TRUE ORDER BY created_at DESC LIMIT 500"
    );
    const jobs = res.rows;

    const joobleItems = jobs.map((job: any) => {
      // Formatear fecha a DD.MM.YYYY
      const date = new Date(job.created_at);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const formattedDate = `${day}.${month}.${year}`;

      const cleanDesc = job.description_snippet
        ? job.description_snippet.replace(/\[Fuente:.*?\]/, '').trim()
        : 'Oferta de empleo tecnológica en Portal Trabajo IT.';

      const salaryText = job.salary && job.salary !== 'Consultar' ? job.salary : '';

      return `
  <job id="${escapeXmlAttr(job.id)}">
    <link><![CDATA[${cleanCdata(`${BASE_URL}/job/${job.id}`)}]]></link>
    <name><![CDATA[${cleanCdata(job.title)}]]></name>
    <region><![CDATA[${cleanCdata(job.location || 'Remoto')}]]></region>
    <company><![CDATA[${cleanCdata(job.company || 'Desconocida')}]]></company>
    <description><![CDATA[${cleanCdata(cleanDesc)}]]></description>
    <pubdate>${formattedDate}</pubdate>
    <updated>${formattedDate}</updated>
    ${salaryText ? `<salary><![CDATA[${cleanCdata(salaryText)}]]></salary>` : ''}
  </job>`;
    }).join('');

    const xml = `<?xml version="1.0" encoding="utf-8"?>
<jobs>
  ${joobleItems}
</jobs>`;

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=1800, s-maxage=1800',
      },
    });
  } catch (error) {
    console.error("Error generating Jooble XML Feed:", error);
    return new Response("Error generating Feed", { status: 500 });
  } finally {
    client.release();
  }
}
