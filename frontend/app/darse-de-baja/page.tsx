'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const rawEmail = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';
  // SEC-056: Solo aceptar email pre-rellenado cuando viene acompañado de token firmado
  const email = token ? rawEmail : '';
  const successParam = searchParams.get('success') === 'true';

  const [confirmed, setConfirmed] = useState(successParam);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualLoading, setManualLoading] = useState(false);
  const [manualMessage, setManualMessage] = useState('');
  const autoTriggeredRef = useRef(false);

  // LEG-013: Baja efectiva en un solo paso cuando el enlace contiene email + token HMAC válido (Art. 7.3 RGPD)
  useEffect(() => {
    if (!email || !token || confirmed || autoTriggeredRef.current) return;
    autoTriggeredRef.current = true;
    setLoading(true);
    fetch('/api/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, token }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success) {
          setConfirmed(true);
        } else {
          setError(data.error || 'No se pudo verificar el enlace de cancelación.');
        }
      })
      .catch(() => {
        setError('Error de conexión al procesar la baja.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [email, token, confirmed]);

  const handleRequestLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEmail.trim()) return;

    setManualLoading(true);
    setManualMessage('');

    try {
      const res = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: manualEmail.trim(), action: 'request_link' }),
      });
      const data = await res.json();
      setManualMessage(data.message || data.error || 'Petición enviada.');
    } catch {
      setManualMessage('Error de conexión al solicitar el enlace.');
    } finally {
      setManualLoading(false);
    }
  };

  const handleConfirmUnsubscribe = async () => {
    if (!email || !token) {
      setError('Faltan parámetros necesarios para confirmar la cancelación.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setConfirmed(true);
      } else {
        setError(data.error || 'No se pudo verificar el enlace de cancelación.');
      }
    } catch {
      setError('Error de conexión al procesar la baja.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-red-950/20 via-gray-950 to-indigo-950/20 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-md w-full bg-gray-900/60 border border-gray-800 rounded-3xl p-8 md:p-12 text-center shadow-2xl backdrop-blur-md">
        {confirmed ? (
          <>
            <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
              📭
            </div>

            <h1 className="text-2xl md:text-3xl font-black mb-4 tracking-tight">
              Suscripción Cancelada
            </h1>

            <p className="text-gray-300 text-sm md:text-base leading-relaxed mb-6">
              Sentimos verte marchar{email ? ` (${email})` : ''}. Hemos eliminado tu dirección de correo electrónico de nuestra lista de envíos y ya no recibirás alertas de empleo.
            </p>

            <p className="text-gray-500 text-xs mb-8 leading-relaxed">
              Si te has dado de baja por error, puedes volver a suscribirte en cualquier momento desde la página de inicio.
            </p>

            <div className="flex flex-col gap-3">
              <Link
                href="/"
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-3 px-6 rounded-xl hover:from-indigo-400 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 text-sm"
              >
                Ir al Buscador General
              </Link>
            </div>
          </>
        ) : email && token ? (
          <>
            <div className="w-16 h-16 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
              ⚠️
            </div>

            <h1 className="text-2xl md:text-3xl font-black mb-4 tracking-tight">
              Confirmar Cancelación
            </h1>

            <p className="text-gray-300 text-sm md:text-base leading-relaxed mb-2">
              ¿Estás seguro de que deseas cancelar la recepción de ofertas de empleo para:
            </p>
            <p className="text-indigo-300 font-mono text-sm bg-gray-800/80 px-3 py-1.5 rounded-lg inline-block mb-6 break-all">
              {email}
            </p>

            {error && (
              <div className="bg-red-950/60 border border-red-800 text-red-300 text-xs p-3 rounded-xl mb-6">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={handleConfirmUnsubscribe}
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-red-600/30 text-sm cursor-pointer"
              >
                {loading ? 'Cancelando suscripción...' : 'Sí, confirmar baja definitiva'}
              </button>

              <Link
                href="/"
                className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-3 px-6 rounded-xl transition-all text-xs"
              >
                No, mantener mi suscripción
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
              ✉️
            </div>

            <h1 className="text-2xl font-black mb-3 tracking-tight">
              Gestión de Baja de Alertas
            </h1>

            <p className="text-gray-300 text-sm leading-relaxed mb-6">
              Para cancelar tu suscripción con 1 clic, pulsa el enlace <strong className="text-white">&quot;Darme de baja en 1 clic&quot;</strong> situado al pie de cualquiera de los correos recibidos.
            </p>

            <div className="p-4 bg-gray-950/70 border border-gray-800 rounded-2xl text-left space-y-3 mb-6">
              <p className="text-xs font-semibold text-gray-300">
                ¿No tienes el enlace directo o quieres recibir un enlace de cancelación inmediata?
              </p>
              <form onSubmit={handleRequestLink} className="space-y-2.5">
                <input
                  type="email"
                  required
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={manualLoading}
                  className="w-full text-center bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl transition-all text-xs cursor-pointer shadow-sm"
                >
                  {manualLoading ? 'Enviando enlace...' : 'Enviar enlace de baja a mi email ✉️'}
                </button>
              </form>

              {manualMessage && (
                <p className="text-xs text-indigo-300 bg-indigo-950/40 border border-indigo-800/60 p-2.5 rounded-lg leading-relaxed">
                  {manualMessage}
                </p>
              )}

              <div className="pt-2 border-t border-gray-800/80">
                <a
                  href={`mailto:contacto@portalempleoit.com?subject=${encodeURIComponent('Solicitud de baja de alertas de empleo')}&body=${encodeURIComponent(`Hola equipo de Portal Trabajo IT,\n\nSolicito la baja de mi suscripción de alertas de empleo para el correo: ${manualEmail || '[indica tu email aquí]'}.\n\nGracias.`)}`}
                  className="text-[11px] text-gray-400 hover:text-indigo-300 underline block text-center"
                >
                  O solicitar baja manual escribiendo a soporte (contacto@portalempleoit.com)
                </a>
              </div>
              <p className="text-[10px] text-gray-500 leading-tight">
                Conforme al Art. 21.2 LSSI y Art. 17 RGPD, la baja es inmediata, gratuita y no requiere justificación.
              </p>
            </div>

            <Link
              href="/"
              className="w-full inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-xl transition-all text-sm"
            >
              Volver al Inicio
            </Link>
          </>
        )}
      </div>
    </main>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </main>
    }>
      <UnsubscribeContent />
    </Suspense>
  );
}
