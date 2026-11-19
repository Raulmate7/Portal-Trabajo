import pool from '@/lib/db';
import { getBlogPosts } from '@/lib/blog';
import { GLOSSARY_TERMS } from '@/lib/glosario';
import { PROFESSIONS } from '@/lib/convertirse';
import { CERTIFICATIONS } from '@/lib/certificaciones';
import { INTERVIEW_TECHS } from '@/lib/entrevistas';
import { ALL_COMPARE_SLUGS } from '@/lib/comparar';
import { BASE_URL, buildUrlSetXml, SitemapUrlEntry, STRUCTURAL_FALLBACK_DATE, xmlResponse } from '@/lib/sitemaps';

export const revalidate = 14400; // 4h

const STATIC_EDITORIAL_PATHS = [
  '/empresas',
  '/empresas-remotas',
  '/ranking-empresas-it',
  '/tendencias',
  '/informe-mercado-it',
  '/noticias',
  '/blog',
  '/glosario',
  '/entrevistas',
  '/comparar',
  '/comparar-ofertas',
  '/convertirse-en',
  '/certificaciones',
  '/recursos',
  '/recursos/plantillas-cv',
  '/recursos/guia-entrevistas',
  '/recursos/guia-salarios-it',
  '/recursos/portfolio',
  '/orientacion-profesional',
  '/trabajo-freelance-it',
  '/practicas-informatica',
  '/trabajo-media-jornada-it',
  '/mejores-ofertas-semana',
  '/ofertas-hoy',
  '/empleo-del-dia',
  '/test-nivel',
  '/mapa-empleo',
  '/sobre-nosotros',
  '/faq',
  '/publicar-oferta',
  '/precios',
  '/publicidad',
  '/afiliados-empresa',
  '/newsletter',
  '/newsletter/archivo',
  '/herramientas/widget-empleo',
  '/api-docs',
];

const ALL_COMPARATIVAS = ALL_COMPARE_SLUGS;

export async function GET() {
  const entries: SitemapUrlEntry[] = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
      alternates: {
        'es-ES': BASE_URL,
        'en': `${BASE_URL}/en`,
        'x-default': BASE_URL,
      },
    },
    ...STATIC_EDITORIAL_PATHS.map((p) => ({
      url: `${BASE_URL}${p}`,
      lastModified: STRUCTURAL_FALLBACK_DATE,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...GLOSSARY_TERMS.map((term) => ({
      url: `${BASE_URL}/glosario/${term.slug}`,
      lastModified: STRUCTURAL_FALLBACK_DATE,
      changeFrequency: 'monthly' as const,
      priority: 0.65,
      alternates: {
        'es-ES': `${BASE_URL}/glosario/${term.slug}`,
        'en': `${BASE_URL}/en/glosario/${term.slug}`,
        'x-default': `${BASE_URL}/glosario/${term.slug}`,
      },
    })),
    ...INTERVIEW_TECHS.map((t) => ({
      url: `${BASE_URL}/entrevistas/${t.slug}`,
      lastModified: STRUCTURAL_FALLBACK_DATE,
      changeFrequency: 'monthly' as const,
      priority: 0.75,
      alternates: {
        'es-ES': `${BASE_URL}/entrevistas/${t.slug}`,
        'en': `${BASE_URL}/en/entrevistas/${t.slug}`,
        'x-default': `${BASE_URL}/entrevistas/${t.slug}`,
      },
    })),
    ...ALL_COMPARATIVAS.map((slug) => ({
      url: `${BASE_URL}/comparar/${slug}`,
      lastModified: STRUCTURAL_FALLBACK_DATE,
      changeFrequency: 'monthly' as const,
      priority: 0.75,
    })),
    ...Object.keys(PROFESSIONS).map((prof) => ({
      url: `${BASE_URL}/convertirse-en/${prof}`,
      lastModified: STRUCTURAL_FALLBACK_DATE,
      changeFrequency: 'monthly' as const,
      priority: 0.75,
    })),
    ...Object.keys(CERTIFICATIONS).map((slug) => ({
      url: `${BASE_URL}/certificaciones/${slug}`,
      lastModified: STRUCTURAL_FALLBACK_DATE,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ];

  const posts = await getBlogPosts();
  for (const post of posts) {
    const seg = post.slug.startsWith('tendencias-') ? 'noticias' : 'blog';
    entries.push({
      url: `${BASE_URL}/${seg}/${post.slug}`,
      lastModified: post.date ? new Date(post.date) : STRUCTURAL_FALLBACK_DATE,
      changeFrequency: 'monthly',
      priority: 0.7,
    });
  }

  // Asegurar noticias en BD si las hay fuera de getBlogPosts
  const client = await pool.connect();
  try {
    const newsRes = await client.query(
      "SELECT slug, date FROM blog_posts WHERE slug LIKE 'tendencias-%' OR author = 'Sistema de Tendencias IT' ORDER BY date DESC LIMIT 500"
    );
    const seen = new Set(entries.map((e) => e.url));
    for (const row of newsRes.rows || []) {
      const url = `${BASE_URL}/noticias/${row.slug}`;
      if (!seen.has(url)) {
        seen.add(url);
        entries.push({
          url,
          lastModified: row.date ? new Date(row.date) : STRUCTURAL_FALLBACK_DATE,
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      }
    }
  } catch {
    // fallback silencioso
  } finally {
    client.release();
  }

  return xmlResponse(buildUrlSetXml(entries), 14400);
}
