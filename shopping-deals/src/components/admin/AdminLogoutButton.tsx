'use client';

import { useRouter } from 'next/navigation';

export default function AdminLogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="block w-full px-4 py-3 text-left text-red-400 hover:bg-gray-800 hover:text-red-300"
    >
      Đăng xuất
    </button>
  );
}
