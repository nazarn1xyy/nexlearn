'use client';

import { Menu, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/theme';

interface HeaderProps {
  onMenuClick: () => void;
  title?: string;
}

export default function Header({ onMenuClick, title }: HeaderProps) {
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-white border-b border-neutral-200">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <Menu size={20} />
        </button>
        {title && <h1 className="text-lg font-semibold text-black">{title}</h1>}
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
