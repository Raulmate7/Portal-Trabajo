import pool from "@/lib/db";
import JobCard from "@/components/JobCard";
import { Metadata } from "next";

export const dynamic = 'force-dynamic';

// Tipos
interface Job {
  id: string | number;
  title: string;
  company: string;
  location: string;
  url_source: string;
  description_snippet?: string | null;
  category?: string | null;
  created_at: string;
}

const categoryMap: Record<string, string> = {
  'backend': 'Backend',
  'frontend': 'Frontend',
  'data': 'Data & AI',
  'cloud': 'Cloud & DevOps',
  'mobile': 'Mobile',
  'sistemas': 'Cloud & DevOps',
  'inteligencia-artificial': 'Data & AI'
};

const adMap: Record<string, { title: string, text: string, link: string }> = {
  'backend': { 
    title: '¿Quieres ser experto en Java/Spring?', 
    text: 'Las empresas pagan +40k a los seniors. Fórmate aquí.', 
    link: 'https://ejemplo.com/curso-java' 
  },
  'data': { 
    title: 'Domina el Big Data y PowerBI', 
    text: 'El perfil más demandado de 2025.', 
    link: 'https://ejemplo.com/curso-data'
  }
};

type Params = Promise<{ sector: string }>;

function parseSector(sectorSlug: string) {
  let tec = sectorSlug;
  let ciudad = '';
  
  if (sectorSlug.includes('-en-')) {
    [tec, ciudad] = sectorSlug.split('-en-');
  } else if (sectorSlug.endsWith('-remoto')) {
    tec = sectorSlug.replace('-remoto', '');
    ciudad = 'remoto';
  }

  const dbCategory = categoryMap[tec];
  return { tec, ciudad, dbCategory };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { sector } = await params;
  const sectorSlug = sector.toLowerCase();
  
  const { tec, ciudad, dbCategory } = parseSector(sectorSlug);
  
  const categoriaBonita = dbCategory || tec.replace(/-/g, ' ');
  const tituloCategoria = categoriaBonita.charAt(0).toUpperCase() + categoriaBonita.slice(1);
  
  let tituloSeo = `Ofertas de trabajo de ${tituloCategoria}`;
  let descSeo = `Encuentra las mejores vacantes de ${tituloCategoria}`;
  
  if (ciudad) {
    const ciudadBonita = ciudad.charAt(0).toUpperCase() + ciudad.slice(1);
    tituloSeo += ` en ${ciudadBonita}`;
    descSeo += ` en ${ciudadBonita}`;
  }
  
  return {
    title: `${tituloSeo} en España | Portal Trabajo`,
    description: `${descSeo} actualizadas hoy. Recopilamos ofertas de las mejores empresas tecnológicas.`,
    openGraph: {
      title: `${tituloSeo} - Vacantes Urgentes`,
      description: `Listado actualizado de ${descSeo.toLowerCase()}.`,
    }
  };
}

async function getJobs(tec: string, ciudad: string, dbCategory: string | undefined) {
  try {
    const client = await pool.connect();
    
    let sql = "SELECT * FROM jobs WHERE 1=1";
    const paramsQuery: any[] = [];
    let paramIndex = 1;

    if (dbCategory) {
      sql += ` AND category = $${paramIndex}`;
      paramsQuery.push(dbCategory);
      paramIndex++;
    } else if (tec !== 'informatica-tecnologia') {
      sql += ` AND title ILIKE $${paramIndex}`;
      paramsQuery.push(`%${tec}%`);
      paramIndex++;
    }

    if (ciudad) {
      sql += ` AND location ILIKE $${paramIndex}`;
      paramsQuery.push(`%${ciudad}%`);
      paramIndex++;
    }

    sql += " ORDER BY created_at DESC LIMIT 50";

    const result = await client.query(sql, paramsQuery);
    client.release();
    return result.rows;
  } catch (error) {
    console.error("Error cargando ofertas de BD:", error);
    return [];
  }
}

export default async function SectorPage({ params }: { params: Params }) {
  const { sector } = await params;
  const sectorSlug = sector.toLowerCase();
  
  const { tec, ciudad, dbCategory } = parseSector(sectorSlug);
  
  const jobs = await getJobs(tec, ciudad, dbCategory);
  
  const ad = adMap[tec];
  
  const categoriaBonita = dbCategory || tec.replace(/-/g, ' ');
  const tituloMostrado = ciudad 
    ? `${categoriaBonita} en ${ciudad.charAt(0).toUpperCase() + ciudad.slice(1)}` 
    : categoriaBonita;

  return (
    <div className="container mx-auto px-4 py-8">
      
      <h1 className="text-3xl font-bold mb-2 capitalize text-gray-900">
        Ofertas de {tituloMostrado}
      </h1>
      <p className="text-gray-600 mb-8">
        {jobs.length} ofertas encontradas hoy.
      </p>

      {ad && !ciudad && (
        <div className="mb-8 p-6 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl">
          <h3 className="text-lg font-bold text-indigo-900">{ad.title}</h3>
          <p className="text-indigo-700 mb-3">{ad.text}</p>
          <a href={ad.link} target="_blank" rel="noopener noreferrer" className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition">
            Ver Curso Recomendado →
          </a>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs && jobs.length > 0 ? (
          jobs.map((job) => (
            <JobCard key={job.id} job={job as Job} />
          ))
        ) : (
          <div className="col-span-full text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500">No hay ofertas de {tituloMostrado} ahora mismo.</p>
            <p className="text-sm text-gray-400 mt-2">Vuelve mañana a las 08:00.</p>
          </div>
        )}
      </div>
    </div>
  );
}
