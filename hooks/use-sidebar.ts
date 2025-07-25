import { create } from "zustand";

interface SidebarState {
  isOpen: boolean;
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
}

export const useSidebar = create<SidebarState>((set) => ({
  isOpen: false,
  toggleSidebar: () => set((state) => ({ isOpen: !state.isOpen })),
  openSidebar: () => set({ isOpen: true }),
  closeSidebar: () => set({ isOpen: false }),
}));