import { create } from 'zustand';

type View = 'dashboard' | 'campaigns' | 'performance' | 'guardrails' | 'settings';

interface NavigationState {
    currentView: View;
    setView: (view: View) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
    currentView: 'dashboard',
    setView: (view) => set({ currentView: view })
}));
