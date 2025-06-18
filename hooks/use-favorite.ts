import { create } from 'zustand';

type favorite = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggleInvite: () => void;
};

export const favorite = create<favorite>((set) => ({
  isOpen: false,
  setIsOpen: (open) => set({ isOpen: open }),
  toggleInvite: () => set((state) => ({ isOpen: !state.isOpen })),
}));