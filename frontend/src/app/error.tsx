'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold mb-2">Помилка</h2>
        <p className="text-neutral-500 mb-6">
          Виникла непередбачена помилка. Спробуйте оновити сторінку.
        </p>
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors"
        >
          Спробувати знову
        </button>
      </div>
    </div>
  );
}
