import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null, // will hold user info if logged in
      token: null,
      isAuthenticated: false,
      
      login: (userData, token) => set({
        user: userData,
        token: token,
        isAuthenticated: true
      }),
      
      logout: () => set({
        user: null,
        token: null,
        isAuthenticated: false
      })
    }),
    {
      name: 'auth-storage', // unique name for localStorage
    }
  )
);

export default useAuthStore;
