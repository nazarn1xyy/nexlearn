import { type ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-neutral-300 rounded-2xl bg-neutral-50/50">
      <div className="w-16 h-16 mb-4 rounded-full bg-white flex items-center justify-center shadow-sm border border-neutral-100 text-neutral-400">
        {icon}
      </div>
      <h3 className="text-lg font-bold mb-1">{title}</h3>
      <p className="text-sm text-neutral-500 mb-6 max-w-sm">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
