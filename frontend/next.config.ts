import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(__dirname),
  // Le decimos a Next.js que 'mysql2' es una librería de servidor y no debe empaquetarla
  serverExternalPackages: ['mysql2'],
  // Habilitar compresión gzip/brotli en el servidor Next.js
  compress: true,
  // Vector 32: Deshabilitar cabecera informativa de tecnología para prevenir fingerprinting
  poweredByHeader: false,
  experimental: {
    serverActions: {
      allowedOrigins: ['portalempleoit.com', 'www.portalempleoit.com', 'localhost:3000'],
    },
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'logo.clearbit.com',
      },
    ],
  },
  async headers() {
    return [
      // Cabeceras de Seguridad Globales (Vector 31)
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
      // Caché de larga duración para assets estáticos de Next.js (hashes en el nombre)
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Caché moderada para assets públicos (imágenes, fonts, og-image, etc.)
      {
        source: '/public/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
      // Caché existente para páginas de trabajos
      {
        source: '/trabajos/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=300, stale-while-revalidate=600',
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/oferta/:id',
        destination: '/job/:id',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/:key([a-fA-F0-9]{16,64}).txt',
        destination: '/api/indexnow-key?key=:key',
      },
      {
        source: '/trabajo-:ciudad/:tech',
        destination: '/trabajo/:ciudad/:tech',
      },
    ];
  },
};

export default nextConfig;
