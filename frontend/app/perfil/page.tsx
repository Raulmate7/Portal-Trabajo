'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function PerfilPage() {
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [techKeywords, setTechKeywords] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      setSavedJobs(JSON.parse(localStorage.getItem('saved_jobs') || '[]'));
      setTechKeywords(localStorage.getItem('subscriber_tech_keywords') || '');
      setEmail(localStorage.getItem('saved_jobs_email') || '');
    } catch (e) {}
  }, []);

  const removeJob = (id: string) => {
    const updated = savedJobs.filter((j: any) => String(j.id) !== String(id));
    setSavedJobs(updated);
    localStorage.setItem('saved_jobs', JSON.stringify(updated));
  };

  const handleClearAllData = () => {
    if (window.confirm('¿Seguro que deseas borrar todas tus ofertas guardadas y preferencias de este navegador? Esta acción no se puede deshacer.')) {
      try {
        localStorage.removeItem('saved_jobs');
        localStorage.removeItem('subscriber_tech_keywords');
        localStorage.removeItem('saved_jobs_email');
        localStorage.removeItem('portal_streak_data');
        localStorage.removeItem('newsletter_subscribed');
        localStorage.removeItem('exit_popup_already_shown');
        sessionStorage.removeItem('exit_popup_session_shown');
        setSavedJobs([]);
        setTechKeywords('');
        setEmail('');
        alert('Tus datos locales han sido eliminados de este dispositivo.');
      } catch (e) {
        console.error('Error al borrar datos locales:', e);
      }
    }
  };

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <header className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Mi Perfil 🧑‍💻
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Gestiona tus ofertas guardadas y alertas. Todo se guarda localmente en tu navegador por privacidad.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Panel Izquierdo: Resumen y Preferencias */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 p-6">
              <h2 className="font-bold text-gray-900 dark:text-white mb-4">Mis Alertas 🔔</h2>
              {techKeywords ? (
                <div>
                  <p className="text-sm text-gray-500 dark:text-slate-400 mb-2">Tecnologías seguidas:</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {techKeywords.split(',').map(kw => (
                      <span key={kw} className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 text-xs px-2.5 py-1 rounded-md font-medium">
                        {kw.trim()}
                      </span>
                    ))}
                  </div>
                  <Link href="/" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                    Modificar alertas
                  </Link>
                </div>
              ) : (
                <div className="text-sm text-gray-500 dark:text-slate-400">
                  No tienes alertas configuradas.<br/>
                  <Link href="/" className="text-indigo-600 dark:text-indigo-400 hover:underline mt-2 inline-block">
                    Crear alerta
                  </Link>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 p-6">
              <h2 className="font-bold text-gray-900 dark:text-white mb-4">Email de contacto 📧</h2>
              {email ? (
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white break-all">{email}</p>
                  <p className="text-xs text-gray-500 mt-1">Usado para recordatorios de ofertas guardadas.</p>
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  No has configurado ningún correo electrónico.
                </p>
              )}
            </div>

            {/* Privacidad y Derecho de Supresión Local (RGPD Art. 17) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 p-6 space-y-3">
              <h2 className="font-bold text-gray-900 dark:text-white text-sm">Privacidad y Control de Datos 🛡️</h2>
              <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                Tus ofertas favoritas y ajustes de búsqueda se almacenan <strong>exclusivamente en tu navegador</strong> (LocalStorage) siguiendo el principio de minimización de datos (Art. 5.1.c RGPD). No creamos perfiles opacos de navegación en nuestros servidores.
              </p>
              <button
                onClick={handleClearAllData}
                className="w-full text-xs font-semibold py-2 px-3 rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                🗑️ Borrar mis datos de este dispositivo
              </button>
              <p className="text-[11px] text-gray-400 dark:text-slate-500">
                Para ejercer tus derechos de acceso, rectificación o supresión de suscripciones en servidor, consulta nuestra{' '}
                <Link href="/privacy" className="text-indigo-600 dark:text-indigo-400 underline">
                  Política de Privacidad
                </Link>.
              </p>
            </div>
          </div>

          {/* Panel Derecho: Ofertas Guardadas */}
          <div className="md:col-span-2">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-gray-900 dark:text-white text-xl">Ofertas Guardadas ⭐</h2>
                <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-3 py-1 rounded-full">
                  {savedJobs.length} ofertas
                </span>
              </div>

              {savedJobs.length > 0 ? (
                <div className="space-y-4">
                  {savedJobs.map((job, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-gray-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900 transition-colors bg-gray-50/50 dark:bg-slate-900/50">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 dark:text-white">
                          <Link href={`/empleo/${job.id}`} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                            {job.title}
                          </Link>
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                          {job.company} • {job.location}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">
                          Guardada el {new Date(job.saved_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 sm:self-start">
                        <Link
                          href={`/empleo/${job.id}`}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors"
                        >
                          Ver
                        </Link>
                        <button
                          onClick={() => removeJob(job.id)}
                          className="px-3 py-2 border border-gray-200 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 hover:text-red-600 rounded-lg transition-colors"
                          title="Eliminar oferta guardada"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 px-4">
                  <span className="text-4xl block mb-4 opacity-50">📂</span>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No tienes ofertas guardadas</h3>
                  <p className="text-gray-500 dark:text-slate-400 text-sm mb-6 max-w-md mx-auto">
                    Cuando veas una oferta que te interese, usa el icono de guardar (⭐) para tenerla siempre a mano.
                  </p>
                  <Link
                    href="/trabajos/informatica-tecnologia"
                    className="inline-flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-2.5 rounded-xl font-bold text-sm transition-transform hover:scale-105"
                  >
                    Explorar Ofertas
                  </Link>
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </main>
  );
}
