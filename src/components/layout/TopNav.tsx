'use client';
import { Bell, Download } from 'lucide-react';
import { useWatchlistStore } from '@/store/watchlist.store';

export function TopNav() {
  const watched = useWatchlistStore(s => s.watched);
  return (
    <header className="h-14 border-b bg-white flex items-center px-6 gap-4 flex-shrink-0">
      <div className="flex-1" />
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">B2B Market Intelligence</span>
        <div className="relative">
          <Bell className="w-5 h-5 text-muted-foreground" />
          {watched.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-[10px] rounded-full flex items-center justify-center">
              {watched.length}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
