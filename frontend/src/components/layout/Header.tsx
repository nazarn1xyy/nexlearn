'use client';

import { Menu, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/theme';

interface HeaderProps {
  title?: string;
}

export default function Header({ title }: HeaderProps) {
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 sm:h-16 px-4 sm:px-6 bg-white/90 backdrop-blur-md border-b border-neutral-200">
      <div className="flex items-center gap-4">
        {title ? (
          <h1 className="text-lg font-semibold text-black">{title}</h1>
        ) : (
          <div className="lg:hidden font-bold text-lg text-black flex items-center gap-2">
            NexLearn
          </div>
        )}
      </div>
      <button
        onClick={toggle}
        className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
        title={theme === 'light' ? 'Темна тема' : 'Світла тема'}
      >
        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      </button>
    </header>
  );
}
