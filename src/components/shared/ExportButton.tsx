'use client';
import { Download } from 'lucide-react';

interface ExportButtonProps {
  entity: 'advisers' | 'licensees' | 'movements';
  params?: Record<string, string>;
  label?: string;
}

export function ExportButton({ entity, params = {}, label = 'Export CSV' }: ExportButtonProps) {
  const handleExport = () => {
    const query = new URLSearchParams({ entity, format: 'csv', ...params }).toString();
    window.open(`/api/export?${query}`, '_blank');
  };
  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-1.5 text-sm px-3 py-1.5 border rounded-md bg-white hover:bg-muted transition-colors"
    >
      <Download className="w-4 h-4" />
      {label}
    </button>
  );
}
