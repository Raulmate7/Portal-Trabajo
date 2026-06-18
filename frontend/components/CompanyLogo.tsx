'use client';

import React, { useState } from 'react';
import Image from 'next/image';

const COMMON_DOMAINS: Record<string, string> = {
  idealista: 'idealista.com',
  indra: 'indracompany.com',
  glovo: 'glovoapp.com',
  cabify: 'cabify.com',
  mercadona: 'mercadona.es',
  adevinta: 'adevinta.com',
  wallapop: 'wallapop.com',
  fever: 'feverup.com',
  softonic: 'softonic.com',
  edreams: 'edreamsodigeo.com',
  ontruck: 'ontruck.com',
  bnext: 'bnext.es',
  singular: 'sngular.com',
  sngular: 'sngular.com',
  babel: 'babelgroup.com',
  gft: 'gft.com',
  capgemini: 'capgemini.com',
  accenture: 'accenture.com',
  deloitte: 'deloitte.com',
  ntt: 'nttdata.com',
  everis: 'nttdata.com',
  telefonica: 'telefonica.com',
  telefónica: 'telefonica.com',
  orange: 'orange.es',
  vodafone: 'vodafone.es',
  google: 'google.com',
  microsoft: 'microsoft.com',
  amazon: 'amazon.com',
  meta: 'meta.com',
  netflix: 'netflix.com',
  apple: 'apple.com',
  stripe: 'stripe.com',
  shopify: 'shopify.com',
  spotify: 'spotify.com',
  github: 'github.com',
  gitlab: 'gitlab.com',
};

const GRADIENTS = [
  'from-blue-500 to-indigo-600 text-white',
  'from-emerald-400 to-teal-600 text-white',
  'from-rose-500 to-pink-600 text-white',
  'from-amber-400 to-orange-500 text-white',
  'from-violet-500 to-purple-600 text-white',
  'from-cyan-500 to-blue-600 text-white',
  'from-fuchsia-500 to-purple-600 text-white',
];

interface CompanyLogoProps {
  company: string;
  size?: number; // Tailwind class size (e.g. 10, 12, 16)
}

const SIZE_MAP: Record<number, { tailwind: string; px: number }> = {
  10: { tailwind: 'w-10 h-10', px: 40 },
  12: { tailwind: 'w-12 h-12', px: 48 },
  16: { tailwind: 'w-16 h-16', px: 64 },
};

export default function CompanyLogo({ company, size = 12 }: CompanyLogoProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const cleanCompany = company ? company.trim() : 'Empresa';
  const firstLetter = cleanCompany.charAt(0).toUpperCase();

  // Calcular un degradado consistente basado en el hash del nombre
  const charCodeSum = cleanCompany.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const gradientClass = GRADIENTS[charCodeSum % GRADIENTS.length];

  // Intentar inferir el dominio
  let logoUrl = null;
  const nameLower = cleanCompany.toLowerCase();
  
  if (nameLower.includes('.') && !nameLower.includes(' ')) {
    logoUrl = `https://logo.clearbit.com/${nameLower}`;
  } else {
    const matchedKey = Object.keys(COMMON_DOMAINS).find((key) => nameLower.includes(key));
    if (matchedKey) {
      logoUrl = `https://logo.clearbit.com/${COMMON_DOMAINS[matchedKey]}`;
    } else {
      // Intentar una conjetura directa quitando caracteres raros y espacios
      const sanitized = nameLower.replace(/[^a-z0-9]/g, '');
      if (sanitized) {
        logoUrl = `https://logo.clearbit.com/${sanitized}.com`;
      }
    }
  }

  // Clases de tamaño estáticas y dimensiones fijas inline para evitar CLS
  const sizeConfig = SIZE_MAP[size] || { tailwind: 'w-12 h-12', px: 48 };
  const sizeClass = sizeConfig.tailwind;
  const containerStyle = { width: `${sizeConfig.px}px`, height: `${sizeConfig.px}px` };
  const textClass = size >= 16 ? 'text-2xl' : size >= 12 ? 'text-lg font-bold' : 'text-xs font-semibold';

  if (logoUrl && !imgFailed) {
    return (
      <div 
        style={containerStyle}
        className={`relative ${sizeClass} rounded-xl overflow-hidden border border-gray-200 dark:border-slate-800 shrink-0 bg-white flex items-center justify-center shadow-sm`}
      >
        <Image
          src={logoUrl}
          alt={`Logo de ${cleanCompany}`}
          fill
          sizes="(max-width: 768px) 40px, 48px"
          className="object-contain p-1"
          onError={() => setImgFailed(true)}
        />
      </div>
    );
  }

  return (
    <div
      style={containerStyle}
      className={`shrink-0 ${sizeClass} rounded-xl bg-gradient-to-br ${gradientClass} flex items-center justify-center ${textClass} shadow-sm border border-black/5 dark:border-white/5 uppercase`}
      aria-hidden="true"
    >
      {firstLetter}
    </div>
  );
}
