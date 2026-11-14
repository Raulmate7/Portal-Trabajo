'use client';

import { useState, useEffect } from 'react';
import { sendSafeGAEvent, hasAnalyticsConsent } from '@/lib/analytics';

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
    // Asignación persistente de la variante para el test A/B respetando consentimiento de cookies (LSSI Art. 22.2)
    if (hasAnalyticsConsent()) {
      const savedVariant = localStorage.getItem('affiliate_cta_variant');
      if (savedVariant === 'A' || savedVariant === 'B') {
        setCtaVariant(savedVariant);
      } else {
        const chosenVariant = Math.random() < 0.5 ? 'A' : 'B';
        localStorage.setItem('affiliate_cta_variant', chosenVariant);
        setCtaVariant(chosenVariant);
      }
    } else {
      setCtaVariant(Math.random() < 0.5 ? 'A' : 'B');
    }
  }, []);

  const handleCtaClick = () => {
    // Evento seguro de GA4 para medir rendimiento del test A/B sólo con consentimiento previo
    sendSafeGAEvent({ 
      event: 'affiliate_click', 
      value: `Udemy_${techLower}_variant_${ctaVariant}`
    });
  };

  // Textos y copys del Test A/B
  const buttonText = ctaVariant === 'A'
    ? 'Ver curso recomendado →'
    : 'Certificar mi stack (Udemy) →';

  return (
    <div className="relative ui-card ui-card-interactive rounded-xl border-[var(--border-accent)] p-5 sm:p-6 my-8 overflow-hidden">
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-0.5 bg-[var(--accent-primary)]" />

      <div className="flex items-center gap-2 mb-2.5">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[var(--accent-tint)] border border-[var(--border-accent)] text-[var(--accent-primary)]">
          Recurso Formativo Verificado
        </span>
      </div>

      <h3 className="font-semibold text-base sm:text-lg tracking-tight text-[var(--text-primary)] mb-1.5 leading-snug">
        {course.title}
      </h3>

      <p className="text-[var(--text-secondary)] text-xs sm:text-sm mb-4 leading-relaxed">
        {course.desc}
      </p>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3.5 border-t border-[var(--border-subtle)]">
        <div className="flex items-center gap-2 font-mono tabular-nums text-[11px] text-[var(--text-muted)]">
          <span className="text-[var(--status-amber)] font-semibold">4.7/5</span>
          <span aria-hidden="true">·</span>
          <span>Garantía 30 días (Udemy)</span>
        </div>

        <a
          href={course.url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          onClick={handleCtaClick}
          className="ui-btn-press w-full sm:w-auto bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white font-medium text-xs sm:text-sm py-2 px-4 rounded-lg transition-colors text-center"
        >
          {buttonText}
        </a>
      </div>
    </div>
  );
}
