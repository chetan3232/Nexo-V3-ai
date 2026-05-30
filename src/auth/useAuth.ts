import { useEffect } from 'react';
import { useAuthStore } from './authStore';
import * as authService from './authService';

export function useAuth() {
  const {
    user,
    isAuthenticated,
    isAuthLoading,
    authError,
    isMock,
    rememberMe,
    setRememberMe,
    restoreSession,
  } = useAuthStore();

  useEffect(() => {
    // Set up auth state change listener
    const unsubscribe = authService.onAuthStateChanged(() => {
      // States are automatically kept in sync via authStore inside authService
    });
    return unsubscribe;
  }, []);

  return {
    user,
    isAuthenticated,
    isAuthLoading,
    authError,
    isMock,
    rememberMe,
    setRememberMe,
    
    // Auth Actions
    signInWithGoogle: authService.signInWithGoogle,
    logout: authService.logout,
    refreshUser: authService.refreshUser,
    updateProfile: authService.updateProfile,
    deleteAccount: authService.deleteAccount,
    reAuthenticateUser: authService.reAuthenticateUser,
    
    // User Profile Actions
    updateUserProfile: authService.updateUserProfile,
    updateAvatar: authService.updateAvatar,
    
    // Session Actions
    restoreSession,
    clearSession: authService.clearSession,
    
    // Security Checks
    isAuthenticatedCheck: authService.isAuthenticated,
    validateToken: authService.validateToken,
    checkSessionExpiry: authService.checkSessionExpiry,
    
    // Preference Actions
    saveTheme: useAuthStore.getState().saveTheme,
    saveEditorSettings: useAuthStore.getState().saveEditorSettings,
    saveLayout: useAuthStore.getState().saveLayout,
    saveShortcuts: useAuthStore.getState().saveShortcuts,
    
    // Workspace Actions
    saveLastWorkspace: useAuthStore.getState().saveLastWorkspace,
    getLastWorkspace: useAuthStore.getState().getLastWorkspace,
    saveRecentProjects: useAuthStore.getState().saveRecentProjects,
    
    // Cloud Sync Ready Actions
    syncUserSettings: useAuthStore.getState().syncUserSettings,
    syncWorkspaces: useAuthStore.getState().syncWorkspaces,
    syncChats: useAuthStore.getState().syncChats,
  };
}
