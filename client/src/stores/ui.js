import { create } from 'zustand';

export const useUIStore = create((set) => ({
  isSidebarOpen: false,
  activeModal: null,
  modalData: null,

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),

  openModal: (modalId, data = null) =>
    set({
      activeModal: modalId,
      modalData: data,
    }),

  closeModal: () =>
    set({
      activeModal: null,
      modalData: null,
    }),
}));
