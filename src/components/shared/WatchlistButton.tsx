'use client';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useWatchlistStore } from '@/store/watchlist.store';
import { cn } from '@/lib/utils';

interface WatchlistButtonProps {
  id: string;
  name: string;
  type: 'adviser' | 'licensee';
  className?: string;
}

export function WatchlistButton({ id, name, type, className }: WatchlistButtonProps) {
  const { isWatched, add, remove } = useWatchlistStore();
  const watching = isWatched(id);

  return (
    <button
      onClick={() => watching ? remove(id) : add({ id, name, type })}
      title={watching ? 'Remove from watchlist' : 'Add to watchlist'}
      className={cn(
        'p-1.5 rounded-md transition-colors',
        watching
          ? 'text-blue-600 hover:bg-blue-50'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        className
      )}
    >
      {watching ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
    </button>
  );
}
