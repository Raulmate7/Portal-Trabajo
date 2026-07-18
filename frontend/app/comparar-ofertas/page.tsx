import React from 'react';
import pool from "@/lib/db";
import AdBanner from "@/components/AdBanner";
import StickyDesktopAd from "@/components/StickyDesktopAd";
import Breadcrumbs from "@/components/Breadcrumbs";
import Link from "next/link";
import { Metadata } from "next";
import { BASE_URL } from "@/lib/constants";
import CompareClientHelper from './CompareClientHelper';

export const revalidate = 300; // Cache de 5 minutos — los datos de oferta comparada no cambian a cada segundo

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const title = 'Comparador de Ofertas de Empleo IT | Portal Trabajo IT';
  const description = 'Compara características clave de múltiples ofertas de empleo tecnológico en España lado a lado de forma interactiva.';

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/comparar-ofertas`,
    }
  };
}

export default async function CompararOfertasPage({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams;
  const idsParam = resolvedSearchParams.ids as string || '';
  const lang = resolvedSearchParams.lang === 'en' ? 'en' : 'es';
  const isEnglish = lang === 'en';
  const queryParam = isEnglish ? '?lang=en' : '';

  const idList = idsParam
    ? idsParam.split(',').map(id => id.trim()).filter(Boolean)
    : [];

  let jobs: any[] = [];
  
  if (idList.length > 0) {
    try {
      const placeholders = idList.map((_, i) => `$${i + 1}`).join(',');
      const res = await pool.query(
        `SELECT id, title, company, location, salary, description_snippet, category, created_at 
         FROM jobs 
         WHERE id IN (${placeholders})`,
        idList
      );
      jobs = res.rows || [];
    } catch (e) {
      console.error("Error retrieving compared jobs:", e);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-16">
      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 text-white py-12 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.25),transparent_50%)]" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold mb-4">
            ⚖️ Evalúa tus Opciones Lado a Lado
          </span>
          <h1 className="text-3xl md:text-4xl font-black mb-3 tracking-tight">
            Comparador de Ofertas de Empleo
          </h1>
          <p className="text-gray-300 text-sm md:text-base max-w-lg mx-auto leading-relaxed">
            Compara salarios, ubicación, modalidad de teletrabajo y stacks tecnológicos de tus ofertas seleccionadas para tomar la mejor decisión profesional.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Inicio', href: '/' },
          { label: 'Comparador de Ofertas' }
        ]} />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        
        <AdBanner variant="inline" />

        {jobs.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-gray-150 dark:border-slate-800 text-center max-w-xl mx-auto shadow-sm space-y-4">
            <span className="text-6xl block">⚖️</span>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Tu comparador está vacío</h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
              Explora las ofertas de empleo en nuestro buscador y pulsa en el botón de la báscula ⚖️ de cualquier tarjeta para agregarla a esta pantalla.
            </p>
            <div className="pt-2">
              <Link 
                href="/trabajos/informatica-tecnologia"
                className="inline-block py-2.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors shadow-md"
              >
                🔍 Buscar Ofertas de Empleo
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-150 dark:border-slate-800 shadow-sm p-6 overflow-hidden">
            <CompareClientHelper jobs={jobs} queryParam={queryParam} />
          </div>
        )}

        <div className="mt-10">
          <AdBanner variant="multiplex" />
        </div>

      </div>
      <StickyDesktopAd />
    </main>
  );
}
