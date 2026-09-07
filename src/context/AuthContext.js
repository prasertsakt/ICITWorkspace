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
import { PERSONNEL_STATUS, USER_ROLES } from '@/lib/constants';

const AuthContext = createContext(null);

const SESSION_KEY = 'icit_active_session_user';

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPersonnel, setCurrentPersonnel] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [unauthorizedEmail, setUnauthorizedEmail] = useState('');
  const [pendingUserData, setPendingUserData] = useState(null);

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
    }
    return true;
  };

  // Restore session on mount
  useEffect(() => {
    let unsubscribe = () => {};

    const initAuth = async () => {
      setIsLoading(true);

      if (isFirebaseConfigured) {
        unsubscribe = subscribeToAuth(async (firebaseUser) => {
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
