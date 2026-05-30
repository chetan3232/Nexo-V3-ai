import { auth, isMockMode } from './firebase';
import { useAuthStore, UserProfile } from './authStore';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile as firebaseUpdateProfile,
  deleteUser,
} from 'firebase/auth';

// Helper to check if Firebase is configured
const getAuthInstance = () => {
  if (isMockMode || !auth) {
    return null;
  }
  return auth;
};

// Simulated mock user database
const MOCK_USER: UserProfile = {
  uid: 'nexo-dev-user-99',
  email: 'developer@nexo.ai',
  displayName: 'Nexo Developer',
  photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
  createdAt: new Date().toISOString(),
};

// 🔐 AUTH FUNCTIONS

export async function signInWithGoogle(): Promise<UserProfile> {
  useAuthStore.getState().setAuthLoading(true);
  useAuthStore.getState().setAuthError(null);

  const authInstance = getAuthInstance();
  if (!authInstance) {
    // Mock Google Login
    return new Promise((resolve) => {
      setTimeout(() => {
        const user = { ...MOCK_USER };
        useAuthStore.getState().setUser(user);
        useAuthStore.getState().setMockMode(true);
        if (useAuthStore.getState().rememberMe) {
          localStorage.setItem('nexo-session-user', JSON.stringify(user));
        }
        useAuthStore.getState().setAuthLoading(false);
        resolve(user);
      }, 800);
    });
  }

  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(authInstance, provider);
    const fbUser = result.user;
    
    const user: UserProfile = {
      uid: fbUser.uid,
      email: fbUser.email,
      displayName: fbUser.displayName,
      photoURL: fbUser.photoURL,
      createdAt: fbUser.metadata.creationTime,
    };

    useAuthStore.getState().setUser(user);
    useAuthStore.getState().setMockMode(false);
    if (useAuthStore.getState().rememberMe) {
      localStorage.setItem('nexo-session-user', JSON.stringify(user));
    }
    useAuthStore.getState().setAuthLoading(false);
    return user;
  } catch (error: any) {
    useAuthStore.getState().setAuthError(error.message);
    useAuthStore.getState().setAuthLoading(false);
    throw error;
  }
}

export async function logout(): Promise<void> {
  const authInstance = getAuthInstance();
  if (authInstance) {
    try {
      await signOut(authInstance);
    } catch (e) {
      console.error('Firebase signOut failed', e);
    }
  }
  useAuthStore.getState().clearSession();
}

export function getCurrentUser(): UserProfile | null {
  return useAuthStore.getState().user;
}

export function onAuthStateChanged(callback: (user: UserProfile | null) => void): () => void {
  const authInstance = getAuthInstance();
  if (!authInstance) {
    // Mock Auth state change subscription
    const unsubscribe = useAuthStore.subscribe((state) => {
      callback(state.user);
    });
    // Initial call
    callback(useAuthStore.getState().user);
    return unsubscribe;
  }

  return authInstance.onAuthStateChanged((fbUser) => {
    if (fbUser) {
      const user: UserProfile = {
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName,
        photoURL: fbUser.photoURL,
        createdAt: fbUser.metadata.creationTime,
      };
      useAuthStore.getState().setUser(user);
      callback(user);
    } else {
      useAuthStore.getState().setUser(null);
      callback(null);
    }
  });
}

export async function refreshUser(): Promise<UserProfile | null> {
  const authInstance = getAuthInstance();
  if (!authInstance) {
    return getCurrentUser();
  }

  const currentUser = authInstance.currentUser;
  if (currentUser) {
    await currentUser.reload();
    const fbUser = authInstance.currentUser!;
    const user: UserProfile = {
      uid: fbUser.uid,
      email: fbUser.email,
      displayName: fbUser.displayName,
      photoURL: fbUser.photoURL,
      createdAt: fbUser.metadata.creationTime,
    };
    useAuthStore.getState().setUser(user);
    return user;
  }
  return null;
}

export async function updateProfile(name: string | null, photoURL: string | null): Promise<void> {
  const authInstance = getAuthInstance();
  if (authInstance && authInstance.currentUser) {
    await firebaseUpdateProfile(authInstance.currentUser, {
      displayName: name,
      photoURL: photoURL,
    });
  }
  useAuthStore.getState().updateLocalProfile(name, photoURL);
}

export async function deleteAccount(): Promise<void> {
  const authInstance = getAuthInstance();
  if (authInstance && authInstance.currentUser) {
    await deleteUser(authInstance.currentUser);
  }
  await logout();
}

export async function reAuthenticateUser(): Promise<boolean> {
  // Simulates sensitive actions trigger reauthentication check
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, 400);
  });
}

// 🧑 USER PROFILE FUNCTIONS

export async function getUserProfile(): Promise<UserProfile | null> {
  return getCurrentUser();
}

export async function updateUserProfile(name: string, avatarURL: string): Promise<void> {
  await updateProfile(name, avatarURL);
}

export async function updateAvatar(url: string): Promise<void> {
  const current = getCurrentUser();
  await updateProfile(current?.displayName ?? '', url);
}

// 💾 SESSION FUNCTIONS

export function saveSession(): void {
  const user = getCurrentUser();
  if (user) {
    localStorage.setItem('nexo-session-user', JSON.stringify(user));
  }
}

export function restoreSession(): void {
  useAuthStore.getState().restoreSession();
}

export function clearSession(): void {
  useAuthStore.getState().clearSession();
}

// 🛡️ SECURITY FUNCTIONS

export function isAuthenticated(): boolean {
  return useAuthStore.getState().isAuthenticated;
}

export function validateToken(): boolean {
  return isAuthenticated();
}

export function checkSessionExpiry(): boolean {
  // Returns true if session is expired (mock check, always valid)
  return false;
}
