import React, { createContext, useState, useContext, useEffect } from 'react';
// This gives us access to all of Supabase's authentication functions.
import { supabase } from '../utils/supabaseClient';

// 1. Create the context (This part is unchanged)
const AuthContext = createContext(null);

// 2. Create the AuthProvider component. This is where all the logic will live.
export const AuthProvider = ({ children }) => {
  // --- FIX: Store the entire session object, not just the user. ---
  // The session contains the user, the access token, and other useful info.
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // It now takes email and password, and calls Supabase to sign the user in.
  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  // This calls Supabase to securely sign the user out.
  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };
  
  // Implements REAL Session Management
  useEffect(() => {
    setLoading(true);

    // This handles the case where the user is already logged in on page load.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Supabase's `onAuthStateChange` method listens for any changes in the user's
    // login state (e.g., login, logout, token refresh).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // When the listener fires, we update our local state with the latest session.
      setSession(session);
      setUser(session?.user ?? null);
    });

    // This is a cleanup function to prevent memory leaks.
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const value = {
    session, // The complete session object, including the access token
    user,    // The user object for convenience
    loading,
    login,
    logout,
  };

  // We only render the rest of the app once the initial session check is complete.
  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

// 3. The custom hook is unchanged.
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

