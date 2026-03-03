/**
 * Current Discover filter context for initiation cap (per filter view).
 * Set by Discover screen; read when creating conversation.
 */
import { create } from 'zustand';

interface DiscoverFiltersState {
  filterContext: Record<string, unknown>;
  setFilterContext: (ctx: Record<string, unknown>) => void;
}

export const useDiscoverFiltersStore = create<DiscoverFiltersState>((set) => ({
  filterContext: {},
  setFilterContext: (ctx) => set({ filterContext: ctx }),
}));
