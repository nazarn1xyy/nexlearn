'use client';

import { memo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, BookOpen, ClipboardCheck, Award,
  Users, UserCircle, LogOut, X, GraduationCap,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default memo(function Sidebar() {
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


      <aside
        className={`
          hidden lg:flex flex-col sticky top-0 left-0 z-50 h-dvh w-64 bg-white dark:bg-[#0a0a0a] border-r border-neutral-200 dark:border-neutral-800
        `}
      >
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
          <Link href="/dashboard" className="flex items-center gap-2">
            <GraduationCap size={24} className="text-black dark:text-white" />
            <span className="font-bold text-lg dark:text-white">NexLearn</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-colors duration-150
                  ${active
                    ? 'bg-black text-white dark:bg-white dark:text-black'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white'
                  }
                `}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
          <div className="mb-3 px-3">
            <p className="text-sm font-medium truncate dark:text-white">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm
              text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white transition-colors"
          >
            <LogOut size={18} />
            Вийти
          </button>
        </div>
      </aside>
  );
})
