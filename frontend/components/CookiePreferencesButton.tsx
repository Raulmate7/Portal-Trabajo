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
      aria-label="Configurar preferencias de cookies y privacidad"
      className="inline-flex items-center min-h-[44px] font-mono text-[13px] text-[var(--p-inv-muted)] hover:text-[var(--p-inv-ink)] transition-colors text-left cursor-pointer"
    >
      Configurar cookies
    </button>
  );
}
