'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  BarChart3, Users, MapPin, Building2, Brain, Shield, GitCompare, TrendingUp
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

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-64 flex-shrink-0 bg-navy-950 text-white flex flex-col">
      <div className="px-5 py-5 border-b border-navy-800">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-400" />
          <div>
            <div className="font-semibold text-sm leading-tight">Adviser Market</div>
            <div className="text-xs text-navy-300 leading-tight">Intelligence Dashboard</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
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
    </aside>
  );
}
