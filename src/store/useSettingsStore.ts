import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
    llmProvider: 'groq' | 'openai' | 'ollama';
    temperature: number;
    maxCreatives: number;
    notifications: {
        email: boolean;
        push: boolean;
        reports: boolean;
    };
    updateSettings: (settings: Partial<SettingsState>) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            llmProvider: 'groq',
            temperature: 0.7,
            maxCreatives: 5,
            notifications: {
                email: true,
                push: false,
                reports: true
            },
            updateSettings: (newSettings) => set((state) => ({ ...state, ...newSettings })),
        }),
        {
            name: 'abmel-settings-storage', // name of the item in the storage (must be unique)
        }
    )
);
