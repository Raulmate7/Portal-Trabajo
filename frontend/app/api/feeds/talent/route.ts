import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const client = await pool.connect();
  try {
    const res = await client.query(
      "SELECT id, title, company, location, description_snippet, created_at, salary FROM jobs WHERE is_active = TRUE ORDER BY created_at DESC LIMIT 500"
    );
    const jobs = res.rows;

    const talentItems = jobs.map((job: any) => {
      // Formatear fecha a YYYY-MM-DD
      const date = new Date(job.created_at);
      const formattedDate = date.toISOString().split('T')[0];

      // Detectar país básico
      const locLower = (job.location || '').toLowerCase();
      let country = 'ES';
      if (locLower.includes('usa') || locLower.includes('united states') || locLower.includes('remote') || locLower.includes('worldwide')) {
        country = 'US'; // USA / Global
      }

      const cleanDesc = job.description_snippet
        ? job.description_snippet.replace(/\[Fuente:.*?\]/, '').trim()
        : 'Oferta de empleo tecnológica en Portal Trabajo IT.';

      const salaryText = job.salary && job.salary !== 'Consultar' ? job.salary : '';

      return `
  <job>
    <title><![CDATA[${job.title}]]></title>
    <date><![CDATA[${formattedDate}]]></date>
    <referencenumber><![CDATA[${job.id}]]></referencenumber>
    <url><![CDATA[https://portal-trabajo.vercel.app/job/${job.id}]]></url>
    <company><![CDATA[${job.company || 'Desconocida'}]]></company>
    <city><![CDATA[${job.location || 'Remoto'}]]></city>
    <country><![CDATA[${country}]]></country>
    <description><![CDATA[${cleanDesc}]]></description>
    ${salaryText ? `<salary><![CDATA[${salaryText}]]></salary>` : ''}
  </job>`;
    }).join('');

    const xml = `<?xml version="1.0" encoding="utf-8"?>
<publisher>
  ${talentItems}
</publisher>`;

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=1800, s-maxage=1800',
      },
    });
  } catch (error) {
    console.error("Error generating Talent.com XML Feed:", error);
    return new Response("Error generating Feed", { status: 500 });
  } finally {
    client.release();
  }
}
