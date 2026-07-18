import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import pool from '@/lib/db';
import { BASE_URL } from '@/lib/constants';
import RedirectClient from './RedirectClient';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  return {
    title: 'Redirigiendo a la oferta... | Portal Trabajo IT',
    description: 'Accede directamente a la oferta de empleo seleccionada.',
    robots: { index: false, follow: false },
    alternates: {
      canonical: `${BASE_URL}/redirect/${id}`,
    },
  };
}

async function getJobRedirectData(id: string) {
  const client = await pool.connect();
  try {
    const res = await client.query(
      `SELECT id, title, company, url_source FROM jobs WHERE id = $1 AND is_active = TRUE LIMIT 1`,
      [id]
    );
    const job = res.rows[0] || null;
    if (job) {
      // Incrementar clics de forma asíncrona no bloqueante
      client.query("UPDATE jobs SET clicks_count = COALESCE(clicks_count, 0) + 1 WHERE id = $1", [id]).catch(e => {
        console.error('Error incrementing clicks:', e);
      });
    }
    return job;
  } catch (error) {
    console.error('Error fetching job redirect data:', error);
    return null;
  } finally {
    client.release();
  }
}

export default async function RedirectPage({ params, searchParams }: Props) {
  const { id } = await params;
  const resolvedSearch = await searchParams;
  const lang = resolvedSearch.lang === 'en' ? 'en' : 'es';

  const job = await getJobRedirectData(id);

  if (!job || !job.url_source) {
    notFound();
  }

  return (
    <RedirectClient
      url={job.url_source}
      company={job.company}
      title={job.title}
      lang={lang}
    />
  );
}
