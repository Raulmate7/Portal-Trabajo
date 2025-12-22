'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { subscribeUser } from '@/app/actions';

export default function SubscribeForm({ location }: { location: string }) {
  const pathname = usePathname();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(formData: FormData) {
    setStatus('loading');
    
    // Añadimos la ruta actual para saber desde dónde se suscriben
    formData.append('pathname', pathname);

    const result = await subscribeUser(formData);

    if (result.success) {
      setStatus('success');
      setMessage(result.message);
      // Limpiamos el formulario visualmente
      (document.getElementById('email-input') as HTMLInputElement).value = '';
    } else {
      setStatus('error');
      setMessage(result.message);
    }
    
    // Quitamos el mensaje a los 5 segundos
    setTimeout(() => {
      setStatus('idle');
      setMessage('');
    }, 5000);
  }

  return (
    <div className="bg-gray-900 p-6 rounded-xl shadow-lg text-white border border-gray-800">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">⚡</span>
        <h3 className="font-bold text-lg text-white">Alertas de Empleo</h3>
      </div>
      
      <p className="text-gray-300 text-sm mb-5 leading-relaxed">
        Recibe las ofertas de <strong>{location}</strong> directamente en tu inbox.
      </p>

      {status === 'success' ? (
        <div className="bg-green-500/20 border border-green-500 text-green-200 p-3 rounded-lg text-sm text-center font-medium animate-pulse">
          {message}
        </div>
      ) : (
        <form action={handleSubmit} className="space-y-3">
          <input 
            id="email-input"
            name="email"
            type="email" 
            required
            placeholder="tu@email.com" 
            className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
          
          <button 
            type="submit" 
            disabled={status === 'loading'}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-white font-bold py-3 px-4 rounded-lg transition-colors text-sm shadow-md flex justify-center"
          >
            {status === 'loading' ? 'Guardando...' : 'Suscribirme Gratis'}
          </button>
          
          {status === 'error' && (
            <p className="text-red-400 text-xs text-center mt-2">{message}</p>
          )}
        </form>
      )}
    </div>
  );
}
