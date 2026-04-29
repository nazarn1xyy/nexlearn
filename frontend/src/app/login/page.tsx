'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
    } catch {
      setError('Невірний логін або пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-white">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <GraduationCap size={40} className="text-black mb-3" />
          <h1 className="text-2xl font-bold">Вхід в систему</h1>
          <p className="text-sm text-neutral-500 mt-1">EduPlatform</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Логін"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Введіть логін"
            required
          />
          <Input
            label="Пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Введіть пароль"
            required
          />

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <Button type="submit" loading={loading} className="w-full mt-2">
            Увійти
          </Button>
        </form>

        <p className="mt-6 text-sm text-center text-neutral-500">
          Немає акаунту?{' '}
          <Link href="/register" className="text-black font-medium hover:underline">
            Зареєструватися
          </Link>
        </p>
      </div>
    </div>
  );
}
