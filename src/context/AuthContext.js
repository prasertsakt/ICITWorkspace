'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithGoogle,
  logOut,
  subscribeToAuth,
  isFirebaseConfigured,
} from '@/lib/firebase';
import {
  findPersonnelByEmail,
  getPersonnelList,
  savePersonnelRecord,
  hasAnyAdmin,
} from '@/lib/storageService';
import { PERSONNEL_STATUS, USER_ROLES, SESSION_TIMEOUT_MS, SESSION_TIMEOUT_HOURS } from '@/lib/constants';

const AuthContext = createContext(null);

const SESSION_KEY = 'icit_active_session_user';
const SESSION_LAST_ACTIVE_KEY = 'icit_session_last_active';

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPersonnel, setCurrentPersonnel] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [unauthorizedEmail, setUnauthorizedEmail] = useState('');
  const [pendingUserData, setPendingUserData] = useState(null);

  // Check if session has exceeded 3 hours
  const checkIsSessionExpired = () => {
    if (typeof window === 'undefined') return false;
    const lastActiveStr = localStorage.getItem(SESSION_LAST_ACTIVE_KEY);
    if (!lastActiveStr) return false;
    const lastActive = parseInt(lastActiveStr, 10);
    if (isNaN(lastActive)) return false;
    return Date.now() - lastActive > SESSION_TIMEOUT_MS;
  };

  // Trigger graceful session timeout
  const expireSession = async () => {
    if (isFirebaseConfigured) {
      try {
        await logOut();
      } catch {}
    }
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(SESSION_LAST_ACTIVE_KEY);
    }
    setCurrentUser(null);
    setCurrentPersonnel(null);
    setAuthError('SESSION_TIMEOUT');
    setIsLoading(false);
  };

  // Helper to validate and bind personnel record
  const authenticatePersonnelRecord = async (userEmail, userObj) => {
    if (!userEmail) {
      setAuthError('INVALID_EMAIL');
      return false;
    }

    const cleanEmail = userEmail.trim().toLowerCase();
    const personnel = await findPersonnelByEmail(cleanEmail);

    if (!personnel) {
      // Email is not in admin pre-defined list
      setAuthError('EMAIL_NOT_WHITELISTED');
      setUnauthorizedEmail(cleanEmail);
      setPendingUserData({
        email: cleanEmail,
        displayName: userObj?.displayName || '',
        photoURL: userObj?.photoURL || '',
      });
      if (isFirebaseConfigured) {
        await logOut();
      }
      setCurrentUser(null);
      setCurrentPersonnel(null);
      return false;
    }

    if (personnel.status === PERSONNEL_STATUS.RESIGNED) {
      // Personnel has resigned
      setAuthError('STATUS_RESIGNED');
      setUnauthorizedEmail(cleanEmail);
      setPendingUserData(null);
      if (isFirebaseConfigured) {
        await logOut();
      }
      setCurrentUser(null);
      setCurrentPersonnel(null);
      return false;
    }

    // Success: Whitelisted and Active
    setCurrentUser(userObj || { email: cleanEmail, displayName: personnel.name, photoURL: personnel.avatarUrl });
    setCurrentPersonnel(personnel);
    setAuthError(null);
    setUnauthorizedEmail('');
    setPendingUserData(null);

    if (typeof window !== 'undefined') {
      sessionStorage.setItem(SESSION_KEY, cleanEmail);
      localStorage.setItem(SESSION_LAST_ACTIVE_KEY, Date.now().toString());
    }
    return true;
  };

  // Restore session on mount & enforce 3-hr timeout
  useEffect(() => {
    let unsubscribe = () => {};

    const initAuth = async () => {
      setIsLoading(true);

      // Check if past session has already expired (> 3 hours)
      if (checkIsSessionExpired()) {
        await expireSession();
        return;
      }

      // Allow ?user= query param for seamless developer/testing session
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const queryEmail = urlParams.get('user');
        if (queryEmail) {
          const success = await authenticatePersonnelRecord(queryEmail, {
            email: queryEmail,
            displayName: queryEmail.split('@')[0],
          });
          if (success) {
            setIsLoading(false);
            return;
          }
        }
      }

      if (isFirebaseConfigured) {
        unsubscribe = subscribeToAuth(async (firebaseUser) => {
          if (checkIsSessionExpired()) {
            await expireSession();
            return;
          }
          if (firebaseUser?.email) {
            await authenticatePersonnelRecord(firebaseUser.email, firebaseUser);
          } else {
            setCurrentUser(null);
            setCurrentPersonnel(null);
          }
          setIsLoading(false);
        });
      } else {
        // Fallback mode: check if a previous session was saved
        if (typeof window !== 'undefined') {
          const savedEmail = sessionStorage.getItem(SESSION_KEY);
          if (savedEmail) {
            await authenticatePersonnelRecord(savedEmail, {
              email: savedEmail,
              displayName: savedEmail.split('@')[0],
            });
          }
        }
        setIsLoading(false);
      }
    };

    initAuth();
    return () => unsubscribe();
  }, []);

  // Periodic Heartbeat Check (every 30s) and Visibility / Focus listener for 3-hr timeout
  useEffect(() => {
    if (!currentPersonnel) return;

    const checkExpiry = () => {
      if (checkIsSessionExpired()) {
        expireSession();
      }
    };

    const interval = setInterval(checkExpiry, 30 * 1000);
    window.addEventListener('visibilitychange', checkExpiry);
    window.addEventListener('focus', checkExpiry);

    return () => {
      clearInterval(interval);
      window.removeEventListener('visibilitychange', checkExpiry);
      window.removeEventListener('focus', checkExpiry);
    };
  }, [currentPersonnel]);

  // User Activity Tracker: update last active timestamp on interaction (throttled to 60s)
  useEffect(() => {
    if (typeof window === 'undefined' || !currentPersonnel) return;

    const updateActivity = () => {
      const now = Date.now();
      const lastActiveStr = localStorage.getItem(SESSION_LAST_ACTIVE_KEY);
      const lastActive = lastActiveStr ? parseInt(lastActiveStr, 10) : 0;

      // Check if session has already expired before refreshing
      if (lastActive > 0 && now - lastActive > SESSION_TIMEOUT_MS) {
        expireSession();
        return;
      }

      // Write at most once every 60 seconds
      if (now - lastActive > 60 * 1000) {
        localStorage.setItem(SESSION_LAST_ACTIVE_KEY, now.toString());
      }
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((ev) => window.addEventListener(ev, updateActivity, { passive: true }));

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, updateActivity));
    };
  }, [currentPersonnel]);

  // Action: Sign In With Google
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      if (!isFirebaseConfigured) {
        setAuthError('FIREBASE_CONFIG_MISSING');
        setIsLoading(false);
        return;
      }

      const result = await signInWithGoogle();
      if (result?.user?.email) {
        const ok = await authenticatePersonnelRecord(result.user.email, result.user);
        if (!ok) {
          setIsLoading(false);
          return;
        }
      }
    } catch (err) {
      console.error('Google Sign In Error:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setAuthError(err.message || 'LOGIN_FAILED');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Action: Bootstrap / Claim First Admin (Solve the chicken-and-egg bootstrap problem)
  // Security guard: STRICTLY allowed only if NO active Admin exists in the system
  const bootstrapFirstAdmin = async (customName) => {
    setIsLoading(true);
    const emailToUse = unauthorizedEmail;
    if (!emailToUse) {
      setIsLoading(false);
      return false;
    }

    // Security Check: Prevent privilege escalation if an admin already exists
    const adminAlreadyExists = await hasAnyAdmin();
    if (adminAlreadyExists) {
      alert('⚠️ ปฏิเสธคำขอ: มีผู้ดูแลระบบ (Admin) อยู่ในระบบแล้ว ไม่สามารถแต่งตั้งเพิ่มด้วยวิธีนี้ได้');
      setIsLoading(false);
      return false;
    }

    const cleanEmail = emailToUse.trim().toLowerCase();
    const newAdmin = {
      id: `pers-${Date.now()}`,
      name: customName || pendingUserData?.displayName || cleanEmail.split('@')[0],
      email: cleanEmail,
      personnelType: 'พนักงานมหาวิทยาลัย',
      department: 'สำนักงานผู้อำนวยการ',
      position: 'ผู้บริหาร',
      level: 'ชำนาญการพิเศษ',
      appointmentDate: '01-10-2565',
      retirementDate: '30-09-2595',
      status: PERSONNEL_STATUS.ACTIVE,
      role: USER_ROLES.ADMIN,
      note: 'ผู้ดูแลระบบคนแรก (Super Admin)',
      avatarUrl: pendingUserData?.photoURL || '',
    };

    await savePersonnelRecord(newAdmin);
    setAuthError(null);
    setUnauthorizedEmail('');
    setPendingUserData(null);
    setCurrentUser({
      email: cleanEmail,
      displayName: newAdmin.name,
      photoURL: newAdmin.avatarUrl,
    });
    setCurrentPersonnel(newAdmin);

    if (typeof window !== 'undefined') {
      sessionStorage.setItem(SESSION_KEY, cleanEmail);
      localStorage.setItem(SESSION_LAST_ACTIVE_KEY, Date.now().toString());
    }
    setIsLoading(false);
    return true;
  };

  // Action: Quick switch demo user (useful for testing Whitelist, User, and Admin views)
  const switchDemoUser = async (email) => {
    setIsLoading(true);
    setAuthError(null);
    const ok = await authenticatePersonnelRecord(email, {
      email,
      displayName: email,
    });
    setIsLoading(false);
    return ok;
  };

  // Action: Sign Out
  const handleSignOut = async () => {
    setIsLoading(true);
    if (isFirebaseConfigured) {
      await logOut();
    }
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(SESSION_LAST_ACTIVE_KEY);
    }
    setCurrentUser(null);
    setCurrentPersonnel(null);
    setAuthError(null);
    setUnauthorizedEmail('');
    setPendingUserData(null);
    setIsLoading(false);
  };

  const clearAuthError = () => {
    setAuthError(null);
    setUnauthorizedEmail('');
    setPendingUserData(null);
  };

  const isAdmin = currentPersonnel?.role === USER_ROLES.ADMIN;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentPersonnel,
        isAdmin,
        role: currentPersonnel?.role || null,
        isLoading,
        authError,
        unauthorizedEmail,
        pendingUserData,
        handleGoogleSignIn,
        handleSignOut,
        switchDemoUser,
        bootstrapFirstAdmin,
        clearAuthError,
        isFirebaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
