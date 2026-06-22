import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useFileSystemStore } from '@/store/useFileSystemStore';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt?: string;
  onboardingComplete?: boolean;
  aiProfile?: {
    preferredStack: string;
    experienceLevel: string;
    interests: string[];
  } | null;
}

export interface UserPreferences {
  theme: string;
  fontSize: number;
  wordWrap: 'on' | 'off';
  autoSave: boolean;
  sidebarWidth: number;
  terminalHeight: number;
  shortcuts: Record<string, string>;
}

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  authError: string | null;
  isMock: boolean;
  rememberMe: boolean;
  lastWorkspacePath: string | null;
  
  // Actions
  setUser: (user: UserProfile | null) => void;
  setAuthLoading: (loading: boolean) => void;
  setAuthError: (error: string | null) => void;
  setRememberMe: (remember: boolean) => void;
  setMockMode: (isMock: boolean) => void;
  
  // User Profile
  updateLocalProfile: (name: string | null, photoURL: string | null) => void;

  // Preferences Actions
  saveTheme: (theme: string) => void;
  saveEditorSettings: (settings: Partial<UserPreferences>) => void;
  saveLayout: (sidebarWidth: number, terminalHeight: number) => void;
  saveShortcuts: (shortcuts: Record<string, string>) => void;
  
  // Workspace Actions
  saveLastWorkspace: (path: string) => void;
  getLastWorkspace: () => string | null;
  saveRecentProjects: (projects: string[]) => void;
  
  // Cloud Sync Actions
  syncUserSettings: () => Promise<void>;
  syncWorkspaces: () => Promise<void>;
  syncChats: () => Promise<void>;
  
  // Session Restore
  restoreSession: () => void;
  clearSession: () => void;
  
  // Onboarding action
  completeOnboarding: (workspaceName: string, aiProfile: { preferredStack: string; experienceLevel: string; interests: string[] }) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isAuthLoading: true,
      authError: null,
      isMock: false,
      rememberMe: true,
      lastWorkspacePath: null,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setAuthLoading: (loading) => set({ isAuthLoading: loading }),
      setAuthError: (error) => set({ authError: error }),
      setRememberMe: (remember) => set({ rememberMe: remember }),
      setMockMode: (isMock) => set({ isMock }),

      completeOnboarding: (workspaceName, aiProfile) => {
        set((state) => {
          if (!state.user) return state;

          const updatedUser = {
            ...state.user,
            onboardingComplete: true,
            aiProfile: aiProfile
          };

          // Update session cache
          if (state.rememberMe) {
            localStorage.setItem('nexo-session-user', JSON.stringify(updatedUser));
          }

          // Build a default workspace path name
          const sanitizedName = workspaceName.trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'MyWorkspace';
          const defaultPath = `c:/NexoWorkspaces/${sanitizedName}`;

          // Save workspace path locally in state and sync fileSystemStore
          localStorage.setItem('nexo-last-workspace', defaultPath);
          const recent = [defaultPath];
          localStorage.setItem('nexo_recent_projects', JSON.stringify(recent));

          setTimeout(() => {
            // Trigger filesystem update path
            useFileSystemStore.getState().openFolder(defaultPath).catch(() => {});
          }, 100);

          return {
            user: updatedUser,
            lastWorkspacePath: defaultPath
          };
        });
      },

      updateLocalProfile: (name, photoURL) => set((state) => {
        if (!state.user) return state;
        
        // Update user object in state and localStorage session cache
        const updatedUser = {
          ...state.user,
          displayName: name,
          photoURL: photoURL
        };

        if (state.rememberMe) {
          localStorage.setItem('nexo-session-user', JSON.stringify(updatedUser));
        }

        return {
          user: updatedUser
        };
      }),

      saveTheme: (theme) => {
        localStorage.setItem('nexo-theme', theme);
        // Force document body attribute or stylesheet updating if desired
        if (theme === 'light') {
          document.body.style.filter = 'invert(0.9) hue-rotate(180deg)'; // Soft inverted light mode simulation if styled dark, or standard light class
        } else {
          document.body.style.filter = '';
        }
      },

      saveEditorSettings: (settings) => {
        const settingsStore = useSettingsStore.getState();
        if (settings.fontSize !== undefined) settingsStore.setFontSize(settings.fontSize);
        if (settings.wordWrap !== undefined) settingsStore.setWordWrap(settings.wordWrap);
        if (settings.autoSave !== undefined) settingsStore.setAutoSave(settings.autoSave);
      },

      saveLayout: (sidebarWidth, terminalHeight) => {
        localStorage.setItem('nexo-sidebar-width', sidebarWidth.toString());
        localStorage.setItem('nexo-terminal-height', terminalHeight.toString());
      },

      saveShortcuts: (shortcuts) => {
        localStorage.setItem('nexo-shortcuts', JSON.stringify(shortcuts));
      },

      saveLastWorkspace: (path) => {
        set({ lastWorkspacePath: path });
        localStorage.setItem('nexo-last-workspace', path);
      },

      getLastWorkspace: () => {
        return get().lastWorkspacePath || localStorage.getItem('nexo-last-workspace');
      },

      saveRecentProjects: (projects) => {
        localStorage.setItem('nexo_recent_projects', JSON.stringify(projects));
      },

      syncUserSettings: async () => {
        const user = get().user;
        if (!user) throw new Error('User not logged in');
        
        console.log('[AuthStore] Syncing user settings to cloud for:', user.email);
        const prefs = {
          fontSize: useSettingsStore.getState().fontSize,
          wordWrap: useSettingsStore.getState().wordWrap,
          autoSave: useSettingsStore.getState().autoSave,
          theme: localStorage.getItem('nexo-theme') || 'dark',
          sidebarWidth: parseInt(localStorage.getItem('nexo-sidebar-width') || '220'),
          terminalHeight: parseInt(localStorage.getItem('nexo-terminal-height') || '220'),
        };
        // Simulated remote sync payload
        localStorage.setItem(`nexo-cloud-pref-${user.uid}`, JSON.stringify(prefs));
      },

      syncWorkspaces: async () => {
        const user = get().user;
        if (!user) throw new Error('User not logged in');
        
        console.log('[AuthStore] Syncing workspace folders with cloud database');
        const recent = useFileSystemStore.getState().recentProjects;
        localStorage.setItem(`nexo-cloud-workspaces-${user.uid}`, JSON.stringify(recent));
      },

      syncChats: async () => {
        const user = get().user;
        if (!user) throw new Error('User not logged in');
        
        console.log('[AuthStore] Syncing chat histories with cloud database');
        const savedChats = localStorage.getItem('nexo-chat-history');
        if (savedChats) {
          localStorage.setItem(`nexo-cloud-chats-${user.uid}`, savedChats);
        }
      },

      restoreSession: () => {
        const storedUser = localStorage.getItem('nexo-session-user');
        const remember = get().rememberMe;
        if (storedUser && remember) {
          const parsed = JSON.parse(storedUser);
          set({ user: parsed, isAuthenticated: true, isAuthLoading: false });
        } else {
          set({ isAuthLoading: false });
        }
      },

      clearSession: () => {
        localStorage.removeItem('nexo-session-user');
        set({ user: null, isAuthenticated: false });
      }
    }),
    {
      name: 'nexo-auth-state-v3',
      partialize: (state) => ({
        rememberMe: state.rememberMe,
        lastWorkspacePath: state.lastWorkspacePath,
        isMock: state.isMock
      })
    }
  )
);
