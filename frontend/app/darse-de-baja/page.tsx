'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';
  const successParam = searchParams.get('success') === 'true';

  const [confirmed, setConfirmed] = useState(successParam);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
              ℹ️
            </div>

            <h1 className="text-2xl font-black mb-4 tracking-tight">
              Gestión de Suscripción
            </h1>

            <p className="text-gray-300 text-sm leading-relaxed mb-8">
              Para cancelar tu suscripción, haz clic en el enlace personalizado que se encuentra al pie de cualquiera de los correos electrónicos de alertas que has recibido.
            </p>

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
