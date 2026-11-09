'use client';

export default function CookiePreferencesButton() {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open_cookie_preferences'));
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="hover:text-white transition-colors text-gray-400 text-left cursor-pointer focus:outline-none"
    >
      ⚙️ Configurar Cookies
    </button>
  );
}

