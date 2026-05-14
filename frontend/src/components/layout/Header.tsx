'use client';

import { Menu, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { motion } from 'framer-motion';

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
        <div className="relative w-5 h-5 flex items-center justify-center">
          <motion.div
            initial={false}
            animate={{ rotate: theme === 'light' ? 0 : -90, opacity: theme === 'light' ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="absolute"
          >
            <Moon size={18} />
          </motion.div>
          <motion.div
            initial={false}
            animate={{ rotate: theme === 'dark' ? 0 : 90, opacity: theme === 'dark' ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="absolute"
          >
            <Sun size={18} />
          </motion.div>
        </div>
      </button>
    </header>
  );
}
