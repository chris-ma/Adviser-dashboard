'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WatchedEntity {
  id: string;
  name: string;
  type: 'adviser' | 'licensee';
}

interface WatchlistState {
  watched: WatchedEntity[];
  add: (entity: WatchedEntity) => void;
  remove: (id: string) => void;
  isWatched: (id: string) => boolean;
  clear: () => void;
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      watched: [],
      add: (entity) => set((s) => ({
        watched: s.watched.some(w => w.id === entity.id) ? s.watched : [...s.watched, entity],
      })),
      remove: (id) => set((s) => ({ watched: s.watched.filter(w => w.id !== id) })),
      isWatched: (id) => get().watched.some(w => w.id === id),
      clear: () => set({ watched: [] }),
    }),
    { name: 'adviser-watchlist-v1' }
  )
);
