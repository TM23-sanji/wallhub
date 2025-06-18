import { create } from 'zustand';

type ProfileBubbleStore = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggleInvite: () => void;
};

export const useProfileBubbleStore = create<ProfileBubbleStore>((set) => ({
  isOpen: false,
  setIsOpen: (open) => set({ isOpen: open }),
  toggleInvite: () => set((state) => ({ isOpen: !state.isOpen })),
}));