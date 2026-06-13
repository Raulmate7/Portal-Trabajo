import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Le decimos a Next.js que 'pg' es una librería de servidor y no debe empaquetarla
  serverExternalPackages: ['pg'],
  async redirects() {
    return [
      {
        source: '/oferta/:id',
        destination: '/job/:id',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
