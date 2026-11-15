import Link from 'next/link';

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
  includeMarketingCheckbox = false,
  marketingName = 'marketing_accepted',
  privacyName = 'privacy_accepted',
  dark = true,
}: RgpdFirstLayerNoticeProps) {
  const textMain = dark ? 'text-[var(--text-secondary)]' : 'text-gray-700';
  const textSub = dark ? 'text-[var(--text-muted)]' : 'text-gray-600';

  return (
    <div className="space-y-1.5 pt-1 text-left">
      <label className={`flex items-start gap-2 text-[11px] ${textMain} cursor-pointer`}>
        <input
          type="checkbox"
          name={privacyName}
          required
          defaultChecked={false}
          className="mt-0.5 h-3.5 w-3.5 rounded border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--accent-primary)] focus:ring-indigo-500 shrink-0 cursor-pointer"
        />
        <span className="leading-snug">
          He leído y acepto la{' '}
          <Link href="/privacy" target="_blank" className="text-[var(--accent-primary)] underline hover:opacity-80">
            Política de Privacidad
          </Link>
          . *
        </span>
      </label>

      {includeMarketingCheckbox && (
        <label className={`flex items-start gap-2 text-[11px] ${textSub} cursor-pointer`}>
          <input
            type="checkbox"
            name={marketingName}
            defaultChecked={false}
            className="mt-0.5 h-3.5 w-3.5 rounded border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--accent-primary)] focus:ring-indigo-500 shrink-0 cursor-pointer"
          />
          <span className="leading-snug">
            (Opcional) Recibir novedades y ofertas formativas del sector IT.
          </span>
        </label>
      )}
    </div>
  );
}
