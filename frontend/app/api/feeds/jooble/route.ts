import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

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
  <job id="${job.id}">
    <link><![CDATA[https://portal-trabajo.vercel.app/job/${job.id}]]></link>
    <name><![CDATA[${job.title}]]></name>
    <region><![CDATA[${job.location || 'Remoto'}]]></region>
    <company><![CDATA[${job.company || 'Desconocida'}]]></company>
    <description><![CDATA[${cleanDesc}]]></description>
    <pubdate>${formattedDate}</pubdate>
    <updated>${formattedDate}</updated>
    ${salaryText ? `<salary><![CDATA[${salaryText}]]></salary>` : ''}
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
