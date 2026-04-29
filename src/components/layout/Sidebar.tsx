'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  BarChart3, Users, MapPin, Building2, Brain, Shield, GitCompare, TrendingUp, X
} from 'lucide-react';

const nav = [
  { href: '/market-size', label: 'Market Size', icon: TrendingUp },
  { href: '/adviser-intelligence', label: 'Adviser Intelligence', icon: Users },
  { href: '/geographic', label: 'Geographic', icon: MapPin },
  { href: '/competitor', label: 'Competitor Intel', icon: Building2 },
  { href: '/psychographics', label: 'Psychographics', icon: Brain },
  { href: '/regulatory', label: 'Regulatory Radar', icon: Shield },
  { href: '/compare', label: 'Compare', icon: GitCompare },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  return (
    <>
      <div className="px-5 py-5 border-b border-navy-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-400 flex-shrink-0" />
          <div>
            <div className="font-semibold text-sm leading-tight">Adviser Market</div>
            <div className="text-xs text-navy-300 leading-tight">Intelligence Dashboard</div>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="md:hidden p-1 text-navy-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={onClose}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
              pathname.startsWith(href)
                ? 'bg-blue-600 text-white'
                : 'text-navy-300 hover:bg-navy-800 hover:text-white'
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-navy-800">
        <p className="text-xs text-navy-400">Data as at 31 Mar 2024</p>
        <p className="text-xs text-navy-500 mt-0.5">ASIC Register + IBISWorld</p>
      </div>
    </>
  );
}

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar — always visible md+ */}
      <aside className="hidden md:flex w-64 flex-shrink-0 bg-navy-950 text-white flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile drawer overlay */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-navy-950 text-white flex flex-col z-50">
            <SidebarContent onClose={onClose} />
          </aside>
        </div>
      )}
    </>
  );
}
