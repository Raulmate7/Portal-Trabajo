'use client';

import { useState } from 'react';
import { reportCompanyReview } from '@/app/actions';

interface ReportReviewModalProps {
  reviewId: number;
  companySlug: string;
}

export default function ReportReviewModal({ reviewId, companySlug }: ReportReviewModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('difamacion');
  const [explanation, setExplanation] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [goodFaith, setGoodFaith] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);

  const handleOpen = () => {
    setIsOpen(true);
    setMessage(null);
  };

  const handleClose = () => {
    setIsOpen(false);
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goodFaith) {
      setMessage({ text: 'Debes declarar de buena fe la veracidad de la información comunicada.', success: false });
      return;
    }
    if (explanation.trim().length < 15) {
      setMessage({ text: 'Por favor, aporta una explicación motivada de al menos 15 caracteres.', success: false });
      return;
    }

    setLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('review_id', reviewId.toString());
    formData.append('company_slug', companySlug);
    formData.append('reason', reason);
    formData.append('explanation', explanation.trim());
    formData.append('reporter_email', reporterEmail.trim());
    formData.append('good_faith', 'true');

    try {
      const res = await reportCompanyReview(formData);
      setMessage({ text: res.message, success: res.success });
      if (res.success) {
        setExplanation('');
        setReporterEmail('');
        setGoodFaith(false);
        setTimeout(() => {
          setIsOpen(false);
          setMessage(null);
        }, 3500);
      }
    } catch {
      setMessage({ text: 'Error de red al enviar la notificación. Inténtalo de nuevo.', success: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="text-[11px] text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1 cursor-pointer focus:outline-none"
        title="Notificar contenido ilícito o difamatorio conforme al Art. 16 de la Ley de Servicios Digitales (DSA)"
      >
        <span>🚩</span> Reportar
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 text-left">
            <button
              type="button"
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-650 dark:hover:text-white text-lg font-bold"
              aria-label="Cerrar modal"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">⚖️</span>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Notificar contenido ilícito (Art. 16 DSA)
              </h3>
            </div>

            <p className="text-xs text-gray-500 dark:text-slate-400 mb-4 leading-relaxed">
              Mecanismo oficial de Notificación y Retirada conforme al Reglamento (UE) 2022/2065 (Ley de Servicios Digitales). Analizaremos tu solicitud con prontitud y te notificaremos la resolución.
            </p>

            {message && (
              <div
                className={`p-3 rounded-xl text-xs mb-4 ${
                  message.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                    : 'bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
                }`}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Motivo de la infracción *
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="difamacion">Injurias graves o calumnias / Difamación</option>
                  <option value="secretos_empresariales">Revelación de secretos comerciales (Ley 1/2019)</option>
                  <option value="datos_personales">Inclusión no consentida de nombres o datos personales (RGPD)</option>
                  <option value="contenido_falso">Contenido manifiestamente falso / Reseña fraudulenta</option>
                  <option value="otro">Otras infracciones legales</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Explicación motivada del carácter ilícito *
                </label>
                <textarea
                  rows={3}
                  required
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Explica detalladamente por qué consideras que esta opinión infringe la legalidad..."
                  className="w-full text-xs px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Tu correo electrónico de contacto *
                </label>
                <input
                  type="email"
                  required
                  value={reporterEmail}
                  onChange={(e) => setReporterEmail(e.target.value)}
                  placeholder="empresa@dominio.com o solicitante@email.com"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <span className="text-[10px] text-gray-400 dark:text-slate-500 block mt-0.5">
                  Requerido para remitirte el acuse de recibo exigido por el Art. 16.5 de la DSA.
                </span>
              </div>

              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id={`good-faith-${reviewId}`}
                  checked={goodFaith}
                  onChange={(e) => setGoodFaith(e.target.checked)}
                  className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor={`good-faith-${reviewId}`} className="text-[11px] text-gray-600 dark:text-slate-400 leading-tight cursor-pointer">
                  Declaro de buena fe que las alegaciones e informaciones facilitadas en esta notificación son exactas y completas (Art. 16.2.d DSA).
                </label>
              </div>

              <p className="text-[10px] text-gray-400 dark:text-slate-500 leading-normal">
                Tus datos se tratarán únicamente para tramitar la notificación conforme al Reglamento (UE) 2022/2065 (DSA).
              </p>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-3 py-1.5 text-xs text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-all shadow-sm cursor-pointer"
                >
                  {loading ? 'Enviando...' : 'Enviar notificación legal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

