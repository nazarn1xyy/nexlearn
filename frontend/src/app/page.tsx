import Link from 'next/link';
import { GraduationCap, BookOpen, ClipboardCheck, Award, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center justify-between px-6 md:px-12 h-16 border-b border-neutral-200">
        <div className="flex items-center gap-2">
          <GraduationCap size={28} className="text-black" />
          <span className="font-bold text-xl">EduPlatform</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-black hover:bg-neutral-100 rounded-lg transition-colors"
          >
            Увійти
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-sm font-medium text-white bg-black hover:bg-neutral-800 rounded-lg transition-colors"
          >
            Реєстрація
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <section className="flex flex-col items-center justify-center flex-1 px-6 py-20 md:py-32 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl">
            Система супроводу навчального процесу
          </h1>
          <p className="mt-6 text-lg md:text-xl text-neutral-600 max-w-2xl">
            Веб-орієнтована платформа для центрів підвищення кваліфікації.
            Курси, тестування, сертифікати — все в одному місці.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-3 bg-black text-white font-medium rounded-lg hover:bg-neutral-800 transition-colors"
            >
              Розпочати
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-3 border border-neutral-300 text-black font-medium rounded-lg hover:bg-neutral-50 transition-colors"
            >
              Увійти в систему
            </Link>
          </div>
        </section>

        <section className="px-6 md:px-12 py-20 border-t border-neutral-200 bg-neutral-50">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
              Можливості платформи
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center p-6">
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-black text-white mb-4">
                  <BookOpen size={24} />
                </div>
                <h3 className="text-lg font-semibold mb-2">Управління курсами</h3>
                <p className="text-neutral-600 text-sm">
                  Створення та редагування курсів, завантаження навчальних матеріалів,
                  формування груп слухачів.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6">
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-black text-white mb-4">
                  <ClipboardCheck size={24} />
                </div>
                <h3 className="text-lg font-semibold mb-2">Тестування знань</h3>
                <p className="text-neutral-600 text-sm">
                  Створення тестів з автоматичним оцінюванням, перегляд результатів
                  та аналітика.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6">
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-black text-white mb-4">
                  <Award size={24} />
                </div>
                <h3 className="text-lg font-semibold mb-2">Сертифікація</h3>
                <p className="text-neutral-600 text-sm">
                  Формування та завантаження сертифікатів після успішного
                  проходження курсу.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="px-6 md:px-12 py-8 border-t border-neutral-200">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-5xl mx-auto">
          <div className="flex items-center gap-2">
            <GraduationCap size={20} className="text-neutral-400" />
            <span className="text-sm text-neutral-500">EduPlatform 2025</span>
          </div>
          <p className="text-xs text-neutral-400">
            Центр підвищення кваліфікації
          </p>
        </div>
      </footer>
    </div>
  );
}
