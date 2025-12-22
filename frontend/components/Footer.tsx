import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-20">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <span className="text-xl font-bold text-gray-900">🚀 Portal Trabajo IT</span>
            <p className="text-gray-500 text-sm mt-2">
              © {new Date().getFullYear()} - Tu portal de empleo tecnológico.
            </p>
          </div>
          
          <div className="flex gap-6 text-sm text-gray-600 font-medium">
            <Link href="/privacidad" className="hover:text-indigo-600 transition-colors">
              Privacidad
            </Link>
            <Link href="/aviso-legal" className="hover:text-indigo-600 transition-colors">
              Aviso Legal
            </Link>
            <Link href="/cookies" className="hover:text-indigo-600 transition-colors">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
