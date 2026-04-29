'use client';

import { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import type { User } from '@/types';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Select from '@/components/ui/Select';

const roleLabels: Record<string, string> = {
  admin: 'Адміністратор',
  teacher: 'Викладач',
  student: 'Слухач',
};

const roleBadgeVariant = (role: string) => {
  switch (role) {
    case 'admin': return 'error' as const;
    case 'teacher': return 'warning' as const;
    default: return 'default' as const;
  }
};

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser?.role !== 'admin') return;
    async function fetch() {
      try {
        const { data } = await api.get('/api/users/');
        setUsers(data.results ?? data);
      } catch {
        // API not available
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [currentUser?.role]);

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await api.patch(`/api/users/${userId}/role/`, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole as User['role'] } : u))
      );
    } catch {
      // error
    }
  };

  if (currentUser?.role !== 'admin') {
    return (
      <Card className="text-center py-12">
        <Shield size={40} className="mx-auto text-neutral-300 mb-3" />
        <p className="text-neutral-500">Доступ обмежений</p>
      </Card>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Управління користувачами</h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-6 w-6 border-2 border-black border-t-transparent rounded-full" />
        </div>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="text-left py-3 px-4 font-medium text-neutral-500">Користувач</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-500">Email</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-500">Роль</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-500">Змінити роль</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-neutral-100 last:border-0">
                  <td className="py-3 px-4">
                    <p className="font-medium">{u.first_name} {u.last_name}</p>
                    <p className="text-xs text-neutral-400">@{u.username}</p>
                  </td>
                  <td className="py-3 px-4 text-neutral-600">{u.email}</td>
                  <td className="py-3 px-4">
                    <Badge variant={roleBadgeVariant(u.role)}>
                      {roleLabels[u.role] || u.role}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      options={[
                        { value: 'student', label: 'Слухач' },
                        { value: 'teacher', label: 'Викладач' },
                        { value: 'admin', label: 'Адміністратор' },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
