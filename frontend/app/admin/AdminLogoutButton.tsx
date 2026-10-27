'use client';

import { useRouter } from 'next/navigation';

export default function AdminLogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' });
    } finally {
      router.refresh();
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 bg-red-950/40 hover:bg-red-900/60 text-red-200 border border-red-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
    >
      🔒 Cerrar sesión
    </button>
  );
}
