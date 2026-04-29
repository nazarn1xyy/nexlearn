'use client';

import { useEffect } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center py-20">
      <Card className="max-w-md text-center">
        <h2 className="text-xl font-bold mb-2">Щось пішло не так</h2>
        <p className="text-sm text-neutral-500 mb-6">
          Виникла помилка при завантаженні сторінки. Спробуйте ще раз.
        </p>
        <Button onClick={reset}>Спробувати знову</Button>
      </Card>
    </div>
  );
}
