import Link from 'next/link';

export const metadata = {
  title: 'Baja del Newsletter — Portal Trabajo IT',
  description: 'Confirma la cancelación de tu suscripción a nuestras alertas de empleo.',
};

export default function UnsubscribePage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-red-950/20 via-gray-950 to-indigo-950/20" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-red-500/5 rounded-full blur-3xl" />
      
      <div className="relative max-w-md w-full bg-gray-900/60 border border-gray-800 rounded-3xl p-8 md:p-12 text-center shadow-2xl backdrop-blur-md">
        <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
          📭
        </div>
        
        <h1 className="text-2xl md:text-3xl font-black mb-4 tracking-tight">
          Suscripción Cancelada
        </h1>
        
        <p className="text-gray-300 text-sm md:text-base leading-relaxed mb-6">
          Sentimos verte marchar. Hemos eliminado tu dirección de correo electrónico de nuestra lista de envíos y ya no recibirás alertas de empleo.
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
      </div>
    </main>
  );
}
