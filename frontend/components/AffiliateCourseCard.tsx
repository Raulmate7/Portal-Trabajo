'use client';

import { useState, useEffect } from 'react';
import { sendGAEvent } from '@next/third-parties/google';

const TECH_COURSES: Record<string, { title: string; desc: string; url: string }> = {
  'react': {
    title: 'React - La Guía Completa (Hooks, Next.js, Redux)',
    desc: 'Domina la librería de frontend más popular del mundo de cero a experto con proyectos reales.',
    url: 'https://click.linksynergy.com/deeplink?id=RAIOLE&mid=39197&murl=https%3A%2F%2Fwww.udemy.com%2Fcourses%2Fsearch%2F%3Fq%3Dreact%2520completo'
  },
  'node': {
    title: 'Node: De cero a experto (Backend y APIs REST/GraphQL)',
    desc: 'Aprende a construir backends escalables, seguros y rápidos usando Node.js, Express y bases de datos.',
    url: 'https://click.linksynergy.com/deeplink?id=RAIOLE&mid=39197&murl=https%3A%2F%2Fwww.udemy.com%2Fcourses%2Fsearch%2F%3Fq%3Dnode%2520de%2520cero%2520a%2520experto'
  },
  'python': {
    title: 'Python Total - Programación Avanzada y Data Science',
    desc: 'Aprende Python desde las bases hasta Inteligencia Artificial, análisis de datos y web scraping.',
    url: 'https://click.linksynergy.com/deeplink?id=RAIOLE&mid=39197&murl=https%3A%2F%2Fwww.udemy.com%2Fcourses%2Fsearch%2F%3Fq%3Dpython%2520total'
  },
  'java': {
    title: 'Universidad Java - De Cero a Master (JDK, Spring Boot)',
    desc: 'Conviértete en desarrollador Java e ingresa en el mercado enterprise dominando Spring Boot y microservicios.',
    url: 'https://click.linksynergy.com/deeplink?id=RAIOLE&mid=39197&murl=https%3A%2F%2Fwww.udemy.com%2Fcourses%2Fsearch%2F%3Fq%3Djava%2520spring%2520boot'
  },
  'typescript': {
    title: 'TypeScript Guía Completa - Tipado Seguro para JavaScript',
    desc: 'Aprende TypeScript a fondo e intégralo en tus proyectos de Angular, React o Node para escribir código profesional.',
    url: 'https://click.linksynergy.com/deeplink?id=RAIOLE&mid=39197&murl=https%3A%2F%2Fwww.udemy.com%2Fcourses%2Fsearch%2F%3Fq%3Dtypescript%2520completo'
  },
  'aws': {
    title: 'AWS Certified Solutions Architect - Prep. Examen Oficial',
    desc: 'Certifícate y aprende a diseñar arquitecturas tolerantes a fallos y altamente escalables en AWS.',
    url: 'https://click.linksynergy.com/deeplink?id=RAIOLE&mid=39197&murl=https%3A%2F%2Fwww.udemy.com%2Fcourses%2Fsearch%2F%3Fq%3Daws%2520architect'
  },
  'docker': {
    title: 'Docker y Kubernetes de cero a experto en DevOps',
    desc: 'Domina los contenedores y su orquestación a nivel profesional en producción.',
    url: 'https://click.linksynergy.com/deeplink?id=RAIOLE&mid=39197&murl=https%3A%2F%2Fwww.udemy.com%2Fcourses%2Fsearch%2F%3Fq%3Ddocker%2520kubernetes'
  }
};

export default function AffiliateCourseCard({ technology }: { technology: string }) {
  const [ctaVariant, setCtaVariant] = useState<'A' | 'B'>('A');
  const techLower = technology.toLowerCase().trim();
  
  // Buscar coincidencia de curso o fallback genérico
  const course = TECH_COURSES[techLower] || {
    title: `Curso de ${technology} Profesional y Certificaciones`,
    desc: `Actualiza tu stack de programación y certifícate en ${technology} con los mejores instructores calificados.`,
    url: `https://click.linksynergy.com/deeplink?id=RAIOLE&mid=39197&murl=https%3A%2F%2Fwww.udemy.com%2Fcourses%2Fsearch%2F%3Fq%3D${encodeURIComponent(techLower)}`
  };

  useEffect(() => {
    // Asignación persistente de la variante para el test A/B de afiliados
    const savedVariant = localStorage.getItem('affiliate_cta_variant');
    if (savedVariant === 'A' || savedVariant === 'B') {
      setCtaVariant(savedVariant);
    } else {
      const chosenVariant = Math.random() < 0.5 ? 'A' : 'B';
      localStorage.setItem('affiliate_cta_variant', chosenVariant);
      setCtaVariant(chosenVariant);
    }
  }, []);

  const handleCtaClick = () => {
    // Evento de GA4 para medir rendimiento del test A/B
    sendGAEvent({ 
      event: 'affiliate_click', 
      value: `Udemy_${techLower}_variant_${ctaVariant}`
    });
  };

  // Textos y copys del Test A/B
  const buttonText = ctaVariant === 'A' 
    ? '🎓 Ver Curso Recomendado' 
    : '🔥 Certificar mi stack de programación (Udemy)';

  return (
    <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 p-6 rounded-2xl border border-indigo-500/20 shadow-xl text-white my-8 hover:shadow-indigo-500/10 transition-all duration-300 transform hover:-translate-y-0.5">
      <div className="flex items-center gap-2.5 mb-3">
        <span className="text-2xl">🎓</span>
        <span className="bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full">
          Recomendación de Formación
        </span>
      </div>
      
      <h3 className="font-extrabold text-xl text-white mb-2 leading-snug">
        {course.title}
      </h3>
      
      <p className="text-gray-300 text-sm mb-5 leading-relaxed">
        {course.desc}
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-indigo-900/40">
        <div className="flex items-center gap-2">
          <span className="text-yellow-400 text-lg">⭐</span>
          <span className="text-gray-300 text-xs font-medium">Valoración 4.7/5 • Garantía de reembolso de 30 días</span>
        </div>
        
        <a
          href={course.url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          onClick={handleCtaClick}
          className="w-full sm:w-auto bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-extrabold text-sm py-3 px-6 rounded-xl transition-all duration-350 shadow-lg text-center active:scale-[0.98]"
        >
          {buttonText}
        </a>
      </div>
    </div>
  );
}
