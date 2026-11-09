'use client';

import { useState } from 'react';
import Link from 'next/link';
import { submitCompanyReview } from '@/app/actions';

type Props = {
  companySlug: string;
};

export default function CompanyReviewForm({ companySlug }: Props) {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState('');
  const [role, setRole] = useState('');
  const [guidelinesAccepted, setGuidelinesAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setMessage({ text: 'Por favor, selecciona una puntuación de 1 a 5 estrellas.', success: false });
      return;
    }
    if (!reviewText.trim()) {
      setMessage({ text: 'Por favor, escribe un comentario descriptivo.', success: false });
      return;
    }
    if (!guidelinesAccepted) {
      setMessage({ text: 'Debes confirmar que tu opinión cumple las normas de la comunidad y no vulnera secretos empresariales ni derechos de terceros.', success: false });
      return;
    }

    setLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('company_slug', companySlug);
    formData.append('rating', rating.toString());
    formData.append('review_text', reviewText);
    formData.append('role', role);
    formData.append('guidelines_accepted', 'true');
    formData.append('privacy_accepted', 'true');

    try {
      const res = await submitCompanyReview(formData);
      setMessage({ text: res.message, success: res.success });
      if (res.success) {
        setRating(0);
        setReviewText('');
        setRole('');
        setGuidelinesAccepted(false);
      }
    } catch (err) {
      setMessage({ text: 'Error de red. Inténtalo de nuevo más tarde.', success: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm space-y-4">
      <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
        <span>⭐</span> Deja tu Opinión / Experiencia
      </h3>
      <p className="text-xs text-gray-500 mb-4">
        Comparte de forma anónima tu experiencia trabajando en esta empresa o tu proceso de selección para ayudar a otros programadores.
      </p>

      {/* Selector de estrellas */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
          Puntuación *
        </label>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="text-3xl transition-transform hover:scale-110 focus:outline-none"
            >
              <span
                className={
                  star <= (hoveredRating || rating) ? 'text-amber-500' : 'text-gray-200'
                }
              >
                ★
              </span>
            </button>
          ))}
          {rating > 0 && (
            <span className="text-sm font-semibold text-gray-600 ml-2">
              {rating === 1 && 'Muy mala 😠'}
              {rating === 2 && 'Mala 🙁'}
              {rating === 3 && 'Aceptable 😐'}
              {rating === 4 && 'Buena 🙂'}
              {rating === 5 && '¡Excelente! 😄'}
            </span>
          )}
        </div>
      </div>

      {/* Comentario */}
      <div>
        <label htmlFor="review-text-input" className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
          Tu Opinión *
        </label>
        <textarea
          id="review-text-input"
          rows={4}
          required
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="¿Cómo es el ambiente laboral, los salarios, el teletrabajo o la entrevista? Sé constructivo..."
          className="w-full text-sm p-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50/50"
        />
      </div>

      {/* Rol / Puesto */}
      <div>
        <label htmlFor="role-input" className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
          Tu Puesto (opcional)
        </label>
        <input
          id="role-input"
          type="text"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="Ej: Desarrollador Backend Node.js, Frontend..."
          className="w-full text-sm p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50/50"
        />
      </div>

      {/* Normas de la comunidad, DSA y RGPD */}
      <div className="p-3.5 bg-amber-50/70 border border-amber-200/70 rounded-xl space-y-2.5">
        <p className="text-[11px] text-amber-900 leading-tight">
          ⚖️ <strong>Normas de publicación, responsabilidad y DSA:</strong> El usuario es el único responsable civil y penal de la veracidad y legalidad de las opiniones que emita (Arts. 205 y 208 Código Penal). Se prohíben insultos personales, calumnias, imputaciones delictivas sin sentencia firme, secretos empresariales (Ley 1/2019) y la inclusión de datos personales de terceros (RGPD). Las empresas afectadas cuentan con un canal de notificación y retirada inmediata (*Notice & Action* conforme al Art. 16 DSA).
        </p>
        <div className="flex items-start gap-2 pt-0.5">
          <input
            type="checkbox"
            id="guidelines-accepted-checkbox"
            required
            checked={guidelinesAccepted}
            onChange={(e) => setGuidelinesAccepted(e.target.checked)}
            className="mt-0.5 h-3.5 w-3.5 rounded border-amber-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
          />
          <label htmlFor="guidelines-accepted-checkbox" className="text-[11px] text-amber-950 font-medium cursor-pointer leading-tight">
            Confirmo que esta valoración refleja mi experiencia laboral real, cumple las normas de la comunidad y acepto la{' '}
            <Link href="/privacy" target="_blank" className="text-indigo-600 underline hover:text-indigo-800">
              Política de Privacidad
            </Link>. *
          </label>
        </div>
        {/* Primera capa informativa AEPD */}
        <div className="pt-2 border-t border-amber-200/60 text-[10px] text-amber-900/80 leading-normal space-y-0.5">
          <p><strong>Información básica de protección de datos:</strong></p>
          <p><em>Responsable:</em> Portal Trabajo IT · <em>Finalidad:</em> Publicación de opiniones y experiencias laborales · <em>Legitimación:</em> Consentimiento (Art. 6.1.a RGPD) · <em>Destinatarios:</em> No se ceden datos a terceros · <em>Derechos:</em> Acceso y supresión de la reseña en <a href="mailto:contacto@portalempleoit.com" className="text-indigo-600 underline">contacto@portalempleoit.com</a> (+ info en <Link href="/privacy" className="text-indigo-600 underline">Política de Privacidad</Link>).</p>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-sm border font-medium ${
            message.success
              ? 'bg-emerald-50 border-emerald-100 text-emerald-900'
              : 'bg-rose-50 border-rose-100 text-rose-900'
          }`}
        >
          {message.text}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex justify-center items-center"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            Enviando...
          </span>
        ) : (
          'Enviar Reseña'
        )}
      </button>
    </form>
  );
}
