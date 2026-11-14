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
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://pagead2.googlesyndication.com https://cdn.onesignal.com https://onesignal.com https://www.googletagmanager.com https://js.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https:; frame-src 'self' https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.youtube.com https://js.stripe.com https://checkout.stripe.com; object-src 'none'; base-uri 'self'; form-action 'self' https://checkout.stripe.com; frame-ancestors 'none'; upgrade-insecure-requests;"
          }
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
    ];
  },
};

export default nextConfig;
