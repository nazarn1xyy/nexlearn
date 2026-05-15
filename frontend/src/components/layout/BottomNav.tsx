'use client';

import { memo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, BookOpen, ClipboardCheck, Award, UserCircle, Users
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default memo(function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  const navItems = [
    { href: '/dashboard', label: 'Головна', icon: LayoutDashboard },
    { href: '/dashboard/courses', label: 'Курси', icon: BookOpen },
    { href: '/dashboard/tests', label: 'Тести', icon: ClipboardCheck },
    { href: '/dashboard/certificates', label: 'Сертифікати', icon: Award },
    ...(user?.role === 'admin'
      ? [{ href: '/dashboard/users', label: 'Корист.', icon: Users }]
      : []),
    { href: '/dashboard/profile', label: 'Профіль', icon: UserCircle },
  ];

  // For small screens, if we have 6 items, it might be squeezed. 
  // We can show top 5 max or allow scrolling, but usually 5-6 is okay on modern phones.
  // We'll use flex with justify-between

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-neutral-200 lg:hidden flex justify-around items-center h-[68px] pb-safe px-1 z-50">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
              active ? 'text-black' : 'text-neutral-500 hover:text-black'
            }`}
          >
            <Icon size={22} className={active ? 'fill-black/10 stroke-[2.5px]' : 'stroke-2'} />
            <span className="text-[10px] font-medium leading-none truncate max-w-[60px] text-center">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
});
