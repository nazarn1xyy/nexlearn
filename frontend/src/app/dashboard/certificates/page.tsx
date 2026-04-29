'use client';

import { useEffect, useState } from 'react';
import { Award, Download } from 'lucide-react';
import api from '@/lib/api';
import type { Certificate } from '@/types';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

function generatePDF(cert: Certificate) {
  const W = 1400;
  const H = 1000;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Pure white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  // Top accent bar — gradient
  const topGrad = ctx.createLinearGradient(0, 0, W, 0);
  topGrad.addColorStop(0, '#0f0f0f');
  topGrad.addColorStop(0.5, '#333');
  topGrad.addColorStop(1, '#0f0f0f');
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, W, 8);

  // Bottom accent bar
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, H - 8, W, 8);

  // Left side geometric accent
  const sideGrad = ctx.createLinearGradient(0, 0, 0, H);
  sideGrad.addColorStop(0, '#0f0f0f');
  sideGrad.addColorStop(0.5, '#444');
  sideGrad.addColorStop(1, '#0f0f0f');
  ctx.fillStyle = sideGrad;
  ctx.fillRect(0, 0, 4, H);

  // Right accent
  ctx.fillStyle = sideGrad;
  ctx.fillRect(W - 4, 0, 4, H);

  // Subtle corner dots
  ctx.fillStyle = '#e0e0e0';
  [[60, 50], [W - 60, 50], [60, H - 50], [W - 60, H - 50]].forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  // "CERTIFICATE OF COMPLETION" — small label
  ctx.textAlign = 'center';
  ctx.fillStyle = '#999';
  ctx.font = '500 13px system-ui, -apple-system, sans-serif';
  ctx.letterSpacing = '8px';
  ctx.fillText('C E R T I F I C A T E   O F   C O M P L E T I O N', W / 2, 100);

  // Main title
  ctx.fillStyle = '#0f0f0f';
  ctx.font = '700 56px system-ui, -apple-system, sans-serif';
  ctx.fillText('С Е Р Т И Ф І К А Т', W / 2, 175);

  // Thin line under title
  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 200, 200);
  ctx.lineTo(W / 2 + 200, 200);
  ctx.stroke();

  // "Цим підтверджується, що"
  ctx.fillStyle = '#888';
  ctx.font = '300 18px system-ui, -apple-system, sans-serif';
  ctx.fillText('Цим підтверджується, що', W / 2, 270);

  // Student name — large, bold
  const name = `${cert.student.first_name} ${cert.student.last_name}`;
  ctx.fillStyle = '#0f0f0f';
  ctx.font = '700 48px system-ui, -apple-system, sans-serif';
  ctx.fillText(name, W / 2, 340);

  // "успішно пройшов(ла) курс"
  ctx.fillStyle = '#888';
  ctx.font = '300 18px system-ui, -apple-system, sans-serif';
  ctx.fillText('успішно пройшов(ла) курс', W / 2, 410);

  // Course name
  ctx.fillStyle = '#0f0f0f';
  ctx.font = '600 38px system-ui, -apple-system, sans-serif';
  ctx.fillText(cert.course_title, W / 2, 475);

  // Accent line under course
  const courseWidth = ctx.measureText(cert.course_title).width;
  const accentGrad = ctx.createLinearGradient(
    W / 2 - courseWidth / 2, 0, W / 2 + courseWidth / 2, 0
  );
  accentGrad.addColorStop(0, 'transparent');
  accentGrad.addColorStop(0.2, '#0f0f0f');
  accentGrad.addColorStop(0.8, '#0f0f0f');
  accentGrad.addColorStop(1, 'transparent');
  ctx.strokeStyle = accentGrad;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W / 2 - courseWidth / 2 - 40, 490);
  ctx.lineTo(W / 2 + courseWidth / 2 + 40, 490);
  ctx.stroke();

  // Platform tag
  ctx.fillStyle = '#bbb';
  ctx.font = '300 14px system-ui, -apple-system, sans-serif';
  ctx.fillText('EduPlatform  ·  Система супроводу навчального процесу', W / 2, 540);

  // ─── Bottom Section ───
  // Horizontal separator
  ctx.strokeStyle = '#eee';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(80, 640);
  ctx.lineTo(W - 80, 640);
  ctx.stroke();

  const date = new Date(cert.issued_at).toLocaleDateString('uk-UA', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  // Date column
  ctx.textAlign = 'center';
  ctx.fillStyle = '#0f0f0f';
  ctx.font = '600 17px system-ui, -apple-system, sans-serif';
  ctx.fillText(date, 260, 710);
  ctx.strokeStyle = '#ccc';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(150, 722);
  ctx.lineTo(370, 722);
  ctx.stroke();
  ctx.fillStyle = '#aaa';
  ctx.font = '300 12px system-ui, -apple-system, sans-serif';
  ctx.fillText('Д А Т А   В И Д А Ч І', 260, 745);

  // Center — modern hexagon badge
  ctx.save();
  ctx.translate(W / 2, 705);
  ctx.strokeStyle = '#0f0f0f';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const x = 32 * Math.cos(angle);
    const y = 32 * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = '#0f0f0f';
  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EDU', 0, -3);
  ctx.font = '600 9px system-ui, -apple-system, sans-serif';
  ctx.fillText('PLATFORM', 0, 10);
  ctx.restore();

  // Teacher column
  ctx.textAlign = 'center';
  ctx.fillStyle = '#0f0f0f';
  ctx.font = '600 17px system-ui, -apple-system, sans-serif';
  ctx.fillText(cert.teacher_name || 'Викладач', W - 260, 710);
  ctx.strokeStyle = '#ccc';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(W - 370, 722);
  ctx.lineTo(W - 150, 722);
  ctx.stroke();
  ctx.fillStyle = '#aaa';
  ctx.font = '300 12px system-ui, -apple-system, sans-serif';
  ctx.fillText('В И К Л А Д А Ч', W - 260, 745);

  // Certificate ID
  ctx.fillStyle = '#d0d0d0';
  ctx.font = '300 11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`ID: ${cert.certificate_number}`, W / 2, 830);

  // Subtle geometric pattern — top right
  ctx.globalAlpha = 0.04;
  ctx.fillStyle = '#000';
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(W - 100 + i * 8, 85, 60 - i * 10, 0, Math.PI * 2);
    ctx.fill();
  }
  // Bottom left
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(100 - i * 8, H - 85, 60 - i * 10, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Convert to PDF
  const imgData = canvas.toDataURL('image/png');
  import('jspdf').then(({ jsPDF }) => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'px', format: [W, H] });
    doc.addImage(imgData, 'PNG', 0, 0, W, H);
    doc.save(`certificate-${cert.certificate_number}.pdf`);
  });
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const { data } = await api.get('/api/certificates/');
        setCertificates(data.results ?? data);
      } catch {
        // API not available
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Сертифікати</h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-6 w-6 border-2 border-black border-t-transparent rounded-full" />
        </div>
      ) : certificates.length === 0 ? (
        <Card className="text-center py-12">
          <Award size={40} className="mx-auto text-neutral-300 mb-3" />
          <p className="text-neutral-500">Сертифікатів поки немає</p>
          <p className="text-sm text-neutral-400 mt-1">
            Пройдіть курс та тестування, щоб отримати сертифікат
          </p>
        </Card>
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
                onClick={() => generatePDF(cert)}
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
