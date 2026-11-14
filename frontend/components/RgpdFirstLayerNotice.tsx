import Link from 'next/link';
import { LEGAL_CONFIG } from '@/lib/legalConfig';

interface RgpdFirstLayerNoticeProps {
  purpose: string;
  includeMarketingCheckbox?: boolean;
  marketingName?: string;
  privacyName?: string;
  dark?: boolean;
}

/**
 * Primera Capa Informativa RGPD (Art. 13 RGPD / Art. 11 LOPDGDD).
 * Componente reutilizable con casillas desmarcadas por defecto.
 */
export default function RgpdFirstLayerNotice({
  purpose,
  includeMarketingCheckbox = false,
  marketingName = 'marketing_accepted',
  privacyName = 'privacy_accepted',
  dark = true,
}: RgpdFirstLayerNoticeProps) {
  const textMain = dark ? 'text-gray-300' : 'text-gray-700';
  const textSub = dark ? 'text-gray-400' : 'text-gray-600';
  const boxBg = dark ? 'bg-gray-800/80 border-gray-700/80 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700';

  return (
    <div className="space-y-2 pt-1 text-left">
      <label className={`flex items-start gap-2.5 text-xs ${textMain} cursor-pointer`}>
        <input
          type="checkbox"
          name={privacyName}
          required
          defaultChecked={false}
          className="mt-0.5 h-4 w-4 rounded border-gray-600 bg-gray-800 text-indigo-600 focus:ring-indigo-500 shrink-0 cursor-pointer"
        />
        <span className="leading-tight">
          He leído y acepto la{' '}
          <Link href="/privacy" target="_blank" className="text-indigo-400 underline hover:text-indigo-300">
            Política de Privacidad
          </Link>{' '}
          y consiento el tratamiento para la finalidad indicada. *
        </span>
      </label>

      {includeMarketingCheckbox && (
        <label className={`flex items-start gap-2.5 text-xs ${textSub} cursor-pointer`}>
          <input
            type="checkbox"
            name={marketingName}
            defaultChecked={false}
            className="mt-0.5 h-4 w-4 rounded border-gray-600 bg-gray-800 text-indigo-600 focus:ring-indigo-500 shrink-0 cursor-pointer"
          />
          <span className="leading-tight">
            (Opcional) Consiento recibir novedades, ofertas formativas y comunicaciones comerciales relevantes del sector IT.
          </span>
        </label>
      )}

      <div className={`p-2.5 rounded-lg border text-[10px] leading-relaxed space-y-1 ${boxBg}`}>
        <p className="font-semibold">Información básica sobre protección de datos (Art. 11 LOPDGDD):</p>
        <ul className={`list-disc pl-3.5 space-y-0.5 ${textSub}`}>
          <li><strong>Responsable:</strong> {LEGAL_CONFIG.owner} ({LEGAL_CONFIG.email}).</li>
          <li><strong>Finalidad:</strong> {purpose}</li>
          <li><strong>Legitimación:</strong> Tu consentimiento expreso e inequívoco (Art. 6.1.a RGPD).</li>
          <li><strong>Destinatarios:</strong> No se ceden datos a terceros salvo obligación legal o encargados técnicos.</li>
          <li><strong>Derechos:</strong> Acceso, rectificación, supresión y baja en 1 clic (<Link href="/privacy" className="text-indigo-400 underline">Política de Privacidad</Link>).</li>
        </ul>
      </div>
    </div>
  );
}
