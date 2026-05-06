import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { AppState } from 'react-native';
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'employee-attendance-session-v1';

export type AttendanceSnapshot = {
  time: string;
  location?: string;
  latitude?: number;
  longitude?: number;
};

export type AttendanceSession = {
  dateKey: string;
  checkedIn: boolean;
  checkedOut: boolean;
  checkInSnapshot: AttendanceSnapshot | null;
  checkOutSnapshot: AttendanceSnapshot | null;
};

const getDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const createEmptySession = (date = new Date()): AttendanceSession => ({
  dateKey: getDateKey(date),
  checkedIn: false,
  checkedOut: false,
  checkInSnapshot: null,
  checkOutSnapshot: null,
});

const normalizeSession = (value: Partial<AttendanceSession> | null | undefined, date = new Date()): AttendanceSession => {
  const todayKey = getDateKey(date);

  if (!value || value.dateKey !== todayKey) {
    return createEmptySession(date);
  }

  return {
    dateKey: todayKey,
    checkedIn: Boolean(value.checkedIn),
    checkedOut: Boolean(value.checkedOut),
    checkInSnapshot: value.checkInSnapshot ?? null,
    checkOutSnapshot: value.checkOutSnapshot ?? null,
  };
};

const readStoredSession = async (date = new Date()) => {
  try {
    const rawValue = await AsyncStorage.getItem(STORAGE_KEY);
    if (!rawValue) {
      return createEmptySession(date);
    }

    return normalizeSession(JSON.parse(rawValue), date);
  } catch {
    return createEmptySession(date);
  }
};

const persistSession = async (session: AttendanceSession) => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session));
};

const loadSession = async (date = new Date()) => {
  const session = await readStoredSession(date);
  await persistSession(session);
  return session;
};

const getDelayUntilNextReset = () => {
  const now = new Date();
  const nextMidnight = new Date(now);
  nextMidnight.setHours(24, 0, 0, 0);
  return Math.max(1000, nextMidnight.getTime() - now.getTime() + 1000);
};

export const useAttendanceSession = () => {
  const [session, setSession] = useState<AttendanceSession>(createEmptySession());
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    const nextSession = await loadSession();
    setSession(nextSession);
    setLoading(false);
    return nextSession;
  }, []);

  useEffect(() => {
    refreshSession();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refreshSession();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [refreshSession]);

  useFocusEffect(
    useCallback(() => {
      refreshSession();
    }, [refreshSession])
  );

  useEffect(() => {
    if (loading) {
      return;
    }

    const timer = setTimeout(() => {
      refreshSession();
    }, getDelayUntilNextReset());

    return () => {
      clearTimeout(timer);
    };
  }, [loading, refreshSession, session.dateKey]);

  const recordCheckIn = useCallback(async (snapshot: AttendanceSnapshot) => {
    const currentSession = await loadSession();

    if (currentSession.checkedIn || currentSession.checkedOut) {
      setSession(currentSession);
      return currentSession;
    }

    const nextSession: AttendanceSession = {
      ...currentSession,
      checkedIn: true,
      checkedOut: false,
      checkInSnapshot: snapshot,
      checkOutSnapshot: null,
    };

    await persistSession(nextSession);
    setSession(nextSession);
    return nextSession;
  }, []);

  const recordCheckOut = useCallback(async (snapshot: AttendanceSnapshot) => {
    const currentSession = await loadSession();

    if (!currentSession.checkedIn || currentSession.checkedOut) {
      setSession(currentSession);
      return currentSession;
    }

    const nextSession: AttendanceSession = {
      ...currentSession,
      checkedIn: true,
      checkedOut: true,
      checkOutSnapshot: snapshot,
    };

    await persistSession(nextSession);
    setSession(nextSession);
    return nextSession;
  }, []);

  const resetSession = useCallback(async () => {
    const emptySession = createEmptySession();
    await persistSession(emptySession);
    setSession(emptySession);
    return emptySession;
  }, []);

  return {
    session,
    loading,
    refreshSession,
    recordCheckIn,
    recordCheckOut,
    resetSession,
    canCheckIn: !session.checkedIn && !session.checkedOut,
    canCheckOut: session.checkedIn && !session.checkedOut,
    isLockedForToday: session.checkedOut,
    nextResetLabel: '12:00 AM',
  };
};
