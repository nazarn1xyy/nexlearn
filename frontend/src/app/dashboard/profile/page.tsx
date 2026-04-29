'use client';

import { useState, useRef, type FormEvent, type ChangeEvent } from 'react';
import { Camera } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

const roleLabels: Record<string, string> = {
  admin: 'Адміністратор',
  teacher: 'Викладач',
  student: 'Слухач',
};

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      await updateUser(formData);
    } catch {
      // error
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateUser(form);
      setSaved(true);
    } catch {
      // error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Профіль</h1>

      <Card className="mb-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative group">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt="Avatar"
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-black text-white flex items-center justify-center text-xl font-bold">
                {(user?.first_name?.[0] || '') + (user?.last_name?.[0] || '')}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              className="absolute inset-0 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100
                flex items-center justify-center transition-opacity"
            >
              <Camera size={18} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div>
            <h2 className="text-lg font-semibold">
              {user?.first_name} {user?.last_name}
            </h2>
            <p className="text-sm text-neutral-500">@{user?.username}</p>
            <Badge variant={user?.role === 'admin' ? 'error' : user?.role === 'teacher' ? 'warning' : 'default'}>
              {roleLabels[user?.role || ''] || user?.role}
            </Badge>
          </div>
        </div>
      </Card>

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Ім'я"
              value={form.first_name}
              onChange={(e) => update('first_name', e.target.value)}
            />
            <Input
              label="Прізвище"
              value={form.last_name}
              onChange={(e) => update('last_name', e.target.value)}
            />
          </div>
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
          />
          <Input
            label="Телефон"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
          />
          <Textarea
            label="Про себе"
            value={form.bio}
            onChange={(e) => update('bio', e.target.value)}
          />

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" loading={loading}>Зберегти</Button>
            {saved && (
              <span className="text-sm text-green-600">Збережено!</span>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
