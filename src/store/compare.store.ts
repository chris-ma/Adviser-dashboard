'use client';
import { create } from 'zustand';

export interface CompareEntity {
  id: string;
  name: string;
  type: 'adviser' | 'licensee';
}

interface CompareState {
  entities: CompareEntity[];
  add: (entity: CompareEntity) => void;
  remove: (id: string) => void;
  clear: () => void;
  isInCompare: (id: string) => boolean;
}

export const useCompareStore = create<CompareState>((set, get) => ({
  entities: [],
  add: (entity) => set((s) => {
    if (s.entities.length >= 5 || s.entities.some(e => e.id === entity.id)) return s;
    return { entities: [...s.entities, entity] };
  }),
  remove: (id) => set((s) => ({ entities: s.entities.filter(e => e.id !== id) })),
  clear: () => set({ entities: [] }),
  isInCompare: (id) => get().entities.some(e => e.id === id),
}));
