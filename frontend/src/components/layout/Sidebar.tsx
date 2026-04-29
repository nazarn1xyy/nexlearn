'use client';

import { memo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, BookOpen, ClipboardCheck, Award,
  Users, UserCircle, LogOut, X, GraduationCap,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default memo(function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    { href: '/dashboard', label: 'Головна', icon: LayoutDashboard },
    { href: '/dashboard/courses', label: 'Курси', icon: BookOpen },
    { href: '/dashboard/tests', label: 'Тестування', icon: ClipboardCheck },
    { href: '/dashboard/certificates', label: 'Сертифікати', icon: Award },
    ...(user?.role === 'admin'
      ? [{ href: '/dashboard/users', label: 'Користувачі', icon: Users }]
      : []),
    { href: '/dashboard/profile', label: 'Профіль', icon: UserCircle },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-neutral-200
          flex flex-col transition-transform duration-200
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <Link href="/dashboard" className="flex items-center gap-2" onClick={onClose}>
            <GraduationCap size={24} className="text-black" />
            <span className="font-bold text-lg">NexLearn</span>
          </Link>
          <button onClick={onClose} className="lg:hidden p-1 hover:bg-neutral-100 rounded">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-colors duration-150
                  ${active
                    ? 'bg-black text-white'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-black'
                  }
                `}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-neutral-200">
          <div className="mb-3 px-3">
            <p className="text-sm font-medium truncate">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm
              text-neutral-600 hover:bg-neutral-100 hover:text-black transition-colors"
          >
            <LogOut size={18} />
            Вийти
          </button>
        </div>
      </aside>
    </>
  );
})
