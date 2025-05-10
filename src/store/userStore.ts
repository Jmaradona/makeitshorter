import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@supabase/supabase-js';

interface UserState {
  user: User | null;
  isDarkMode: boolean;
  isOfflineMode: boolean;
  assistantId: string;
  isPaid: boolean;
  remainingMessages: number;
  preferences: {
    style: string;
    formality: string;
    traits: string[];
    context: string;
    tone: string;
    length: string;
    name?: string;
    position?: string;
    company?: string;
    contact?: string;
    favoriteGoodbye?: string;
  };
  setUser: (user: User | null) => void;
  setPreferences: (preferences: Partial<UserState['preferences']>) => void;
  setAssistantId: (id: string) => void;
  setIsPaid: (isPaid: boolean) => void;
  setRemainingMessages: (count: number) => void;
  toggleDarkMode: () => void;
  toggleOfflineMode: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      isDarkMode: false,
      isOfflineMode: false,
      assistantId: '',
      isPaid: false,
      remainingMessages: 5, // Default starting value
      preferences: {
        style: 'gen-z',
        formality: 'balanced',
        traits: ['Tech-savvy', 'Concise', 'Emoji-friendly 😊'],
        context: 'Tech Company',
        tone: 'professional',
        length: 'balanced',
        name: '',
        position: '',
        company: '',
        contact: '',
        favoriteGoodbye: 'best'
      },
      setUser: (user) => set({ user }),
      setPreferences: (preferences) => {
        console.log("Setting preferences in store:", JSON.stringify(preferences, null, 2));
        
        // Make sure traits is an array
        if (preferences.traits && !Array.isArray(preferences.traits)) {
          console.warn("Traits is not an array, converting:", preferences.traits);
          preferences.traits = [preferences.traits.toString()];
        }
        
        set((state) => ({
          preferences: { ...state.preferences, ...preferences }
        }));
        console.log("Updated store preferences:", JSON.stringify(get().preferences, null, 2));
      },
      setAssistantId: (id) => set({ assistantId: id }),
      setIsPaid: (isPaid) => set({ isPaid }),
      setRemainingMessages: (count) => set({ remainingMessages: count }),
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      toggleOfflineMode: () => set((state) => ({ isOfflineMode: !state.isOfflineMode }))
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        isDarkMode: state.isDarkMode,
        isOfflineMode: state.isOfflineMode,
        preferences: state.preferences,
        // Don't store user in local storage as we'll get it from Supabase
        // Don't store assistantId in local storage as we'll get it from Supabase
      }),
    }
  )
);