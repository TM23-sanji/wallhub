import { create } from 'zustand';

type InviteBubbleStore = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggleInvite: () => void;
};

export const useInviteBubbleStore = create<InviteBubbleStore>((set) => ({
  isOpen: false,
  setIsOpen: (open) => set({ isOpen: open }),
  toggleInvite: () => set((state) => ({ isOpen: !state.isOpen })),
}));