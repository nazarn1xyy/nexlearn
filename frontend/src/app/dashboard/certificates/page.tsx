'use client';

import { Award, Download } from 'lucide-react';
import useSWR from 'swr';
import api from '@/lib/api';
import type { Certificate } from '@/types';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';

const handleDownload = (cert: Certificate) => {
  import('@/lib/generatePDF').then(({ generatePDF }) => generatePDF(cert));
};

export default function CertificatesPage() {
  const fetcher = async () => {
    const { data } = await api.get('/api/certificates/');
    return data.results ?? data;
  };

  const { data, isLoading } = useSWR<Certificate[]>('/api/certificates/', fetcher, {
    keepPreviousData: true,
  });

  const certificates = data ?? [];
  const loading = isLoading && !data;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Сертифікати</h1>

      {loading ? (
        <div className="flex flex-col gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="w-full sm:w-1/2">
                <div className="h-6 bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded-md w-3/4 mb-2"></div>
                <div className="h-4 bg-neutral-100 dark:bg-neutral-800 animate-pulse rounded-md w-1/2 mb-3"></div>
                <div className="flex gap-2">
                  <div className="h-5 bg-neutral-100 dark:bg-neutral-800 animate-pulse rounded-md w-16"></div>
                  <div className="h-4 bg-neutral-100 dark:bg-neutral-800 animate-pulse rounded-md w-24"></div>
                </div>
              </div>
              <div className="h-9 bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded-md w-32"></div>
            </Card>
          ))}
        </div>
      ) : certificates.length === 0 ? (
        <EmptyState
          icon={<Award size={32} />}
          title="Сертифікатів поки немає"
          description="Пройдіть курс та тестування, щоб отримати сертифікат"
        />
      ) : (
        <div className="flex flex-col gap-4">
          {certificates.map((cert) => (
            <Card key={cert.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="font-semibold">{cert.course_title}</h3>
                <p className="text-sm text-neutral-500 mt-1">
                  Викладач: {cert.teacher_name}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <Badge variant="success">Виданий</Badge>
                  <span className="text-xs text-neutral-400">
                    {new Date(cert.issued_at).toLocaleDateString('uk-UA')}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-1">
                  № {cert.certificate_number}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(cert)}
              >
                <Download size={16} />
                Завантажити PDF
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
