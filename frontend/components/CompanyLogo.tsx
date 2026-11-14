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

interface CompanyLogoProps {
  company: string;
  size?: number; // Tailwind class size (e.g. 10, 12, 16)
}

const SIZE_MAP: Record<number, { tailwind: string; px: number }> = {
  10: { tailwind: 'w-10 h-10', px: 40 },
  12: { tailwind: 'w-12 h-12', px: 48 },
  16: { tailwind: 'w-16 h-16', px: 64 },
};

function getCompanyInitials(name: string): string {
  const cleaned = name
    .replace(/\b(S\.?L\.?U?\.?|S\.?A\.?|Inc\.?|Ltd\.?|GmbH|LLC|Corp\.?)\b/gi, '')
    .trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'IT';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase();
}

export default function CompanyLogo({ company, size = 12 }: CompanyLogoProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const cleanCompany = company ? company.trim() : 'Empresa';
  const initials = getCompanyInitials(cleanCompany);

  // Intentar inferir el dominio (SEC-041: servido vía proxy propio cacheado sin exponer IP/Referer del usuario a terceros)
  let logoUrl = null;
  const nameLower = cleanCompany.toLowerCase();
  const DOMAIN_PATTERN = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))*\.[a-z]{2,24}$/;

  if (nameLower.includes('.') && !nameLower.includes(' ') && DOMAIN_PATTERN.test(nameLower)) {
    logoUrl = `/api/company-logo?domain=${encodeURIComponent(nameLower)}`;
  } else {
    const matchedKey = Object.keys(COMMON_DOMAINS).find((key) => nameLower.includes(key));
    if (matchedKey) {
      logoUrl = `/api/company-logo?domain=${encodeURIComponent(COMMON_DOMAINS[matchedKey])}`;
    }
    // No realizar conjeturas ciegas de dominio .com para evitar colisión de marcas registradas ajenas
  }

  // Clases de tamaño estáticas y dimensiones fijas inline para evitar CLS
  const sizeConfig = SIZE_MAP[size] || { tailwind: 'w-12 h-12', px: 48 };
  const sizeClass = sizeConfig.tailwind;
  const containerStyle = { width: `${sizeConfig.px}px`, height: `${sizeConfig.px}px` };
  const textClass = size >= 16 ? 'text-lg' : size >= 12 ? 'text-sm' : 'text-xs';

  if (logoUrl && !imgFailed) {
    return (
      <div 
        style={containerStyle}
        title={`Signo distintivo referencial de ${cleanCompany} (Art. 37 Ley de Marcas)`}
        className={`relative ${sizeClass} rounded-lg overflow-hidden border border-[var(--border-subtle)] shrink-0 bg-white dark:bg-slate-900 flex items-center justify-center`}
      >
        <Image
          src={logoUrl}
          alt={`Logo referencial de ${cleanCompany} (uso nominativo)`}
          fill
          unoptimized
          sizes="(max-width: 768px) 40px, 48px"
          className="object-contain p-1.5"
          onError={() => setImgFailed(true)}
        />
      </div>
    );
  }

  return (
    <div
      style={containerStyle}
      className={`shrink-0 ${sizeClass} rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-secondary)] font-mono font-semibold tracking-tight flex items-center justify-center ${textClass} select-none uppercase`}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}
