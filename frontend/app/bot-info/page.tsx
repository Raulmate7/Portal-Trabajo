import { Metadata } from 'next';
import Link from 'next/link';
import { LEGAL_CONFIG } from '@/lib/legalConfig';

export const metadata: Metadata = {
  title: 'Información del Rastreador (PortalEmpleoITBot) | Portal Trabajo IT',
  description:
    'Información técnica y canal de exclusión (opt-out) para el bot indexador PortalEmpleoITBot conforme a la Directiva (UE) 2019/790 (TDM).',
  robots: { index: true, follow: true },
};

export default function BotInfoPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-200 p-8 shadow-sm space-y-6">
        <div className="space-y-2 border-b border-gray-100 pb-4">
          <h1 className="text-2xl font-extrabold text-gray-950">
            Información sobre PortalEmpleoITBot / PortalTrabajoITBot
          </h1>
          <p className="text-sm text-gray-600">
            Agente técnico de agregación de metadatos de empleo tecnológico · {LEGAL_CONFIG.brandName}
          </p>
        </div>

        <section className="space-y-2 text-sm text-gray-700 leading-relaxed">
          <h2 className="text-base font-bold text-gray-950">1. Finalidad y alcance</h2>
          <p>
            <strong>PortalEmpleoITBot/1.0</strong> recopila exclusivamente metadatos factuales mínimos
            de vacantes tecnológicas (título, empresa, ubicación, rango salarial público y enlace
            directo a la fuente original) respetando estrictamente <code>robots.txt</code> y las
            cabeceras de reserva TDM (<code>TDM-Reservation: 1</code>) conforme al artículo 4.3 de
            la Directiva (UE) 2019/790.
          </p>
        </section>

        <section className="space-y-2 text-sm text-gray-700 leading-relaxed">
          <h2 className="text-base font-bold text-gray-950">2. Cómo excluir un dominio (Opt-out inmediato)</h2>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl text-xs overflow-x-auto">
{`User-agent: PortalEmpleoITBot
Disallow: /

User-agent: PortalTrabajoITBot
Disallow: /`}
          </pre>
          <p>
            También puedes solicitar la retirada inmediata o exclusión permanente escribiendo a{' '}
            <a href={`mailto:${LEGAL_CONFIG.email}`} className="text-indigo-600 underline">
              {LEGAL_CONFIG.email}
            </a>
            .
          </p>
        </section>

        <div className="pt-4 border-t border-gray-100 text-xs text-gray-500 flex gap-4">
          <Link href="/aviso-legal" className="hover:underline">Aviso Legal</Link>
          <Link href="/privacy" className="hover:underline">Política de Privacidad</Link>
        </div>
      </div>
    </main>
  );
}
