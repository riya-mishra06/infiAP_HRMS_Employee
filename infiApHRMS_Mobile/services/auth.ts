import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants/api';

const AUTH_SESSION_META_KEY = 'auth-session-meta-v1';
const AUTH_TOKEN_KEY = 'auth-token-v1';
const PENDING_2FA_KEY = 'pending-2fa-v1';
const REQUEST_TIMEOUT_MS = 15000;

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

export type PunchPayload = {
  PunchType: number;
  Latitude: number;
  Longitude: number;
  IsAway?: boolean;
  WorkMode?: number;
};

export type AuthApiUser = {
  _id: string;
  name: string;
  email: string;
  role: 'employee' | 'manager' | 'hr' | 'admin' | 'main_admin';
  designation?: string;
  department?: string;
  joiningDate?: string;
  phone?: string;
  address?: string;
  employeeId?: string;
  profileImage?: string;
};

export type SignUpResponse = {
  user: AuthApiUser;
  message: string;
};

export type LoginResponse = {
  message: string;
  require2FA: boolean;
  userId?: string;
  token?: string;
  role?: AuthApiUser['role'];
  user?: AuthApiUser;
};

export type VerifyTwoFactorResponse = {
  message: string;
  token: string;
  role: AuthApiUser['role'];
  user: AuthApiUser;
};

export type ResendTwoFactorResponse = {
  message: string;
  userId: string;
};

export type PendingTwoFactorChallenge = {
  email: string;
  userId: string;
};

type StoredAuthSession = {
  token: string;
  role: AuthApiUser['role'];
  user: AuthApiUser;
};

type StoredAuthSessionMeta = Omit<StoredAuthSession, 'token'>;

export type EmployeeProfileResponse = {
  status: string;
  data: {
    id: string;
    name: string;
    email: string;
    role: string;
    systemRole: AuthApiUser['role'];
    employeeId: string;
    department: string;
    joiningDate: string;
    phone?: string;
    address?: string;
    avatar?: string;
  };
  message?: string;
};

class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const buildUrl = (path: string) => `${API_BASE_URL}${path}`;

const parseJsonSafely = (rawValue: string) => {
  if (!rawValue) {
    return {};
  }

  try {
    return JSON.parse(rawValue) as Record<string, unknown>;
  } catch {
    return {};
  }
};

const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(buildUrl(path), {
      method: options.method || 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    const rawText = await response.text();
    const data = parseJsonSafely(rawText);

    if (!response.ok) {
      const message =
        (typeof data.message === 'string' ? data.message : '') ||
        (typeof data.error === 'string' ? data.error : '') ||
        `Request failed with status ${response.status}`;
      throw new ApiError(message, response.status);
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('Request timeout. Please check your network and try again.');
    }

    throw new ApiError(
      'Unable to reach the server. Check that the backend is running and your device can access it.'
    );
  } finally {
    clearTimeout(timeoutId);
  }
};

export const signUpUser = (payload: {
  name: string;
  email: string;
  password: string;
  role?: AuthApiUser['role'];
}) =>
  request<SignUpResponse>('/auth/signup', {
    method: 'POST',
    body: payload,
  });

export const signInUser = (payload: {
  email: string;
  password: string;
}) =>
  request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: payload,
  });

export const verifyTwoFactorCode = (payload: {
  userId: string;
  otp: string;
}) =>
  request<VerifyTwoFactorResponse>('/auth/verify-2fa', {
    method: 'POST',
    body: payload,
  });

export const resendTwoFactorCode = (payload: {
  userId?: string;
  email?: string;
}) =>
  request<ResendTwoFactorResponse>('/auth/resend-2fa', {
    method: 'POST',
    body: payload,
  });

export const storePendingTwoFactorChallenge = async (
  challenge: PendingTwoFactorChallenge
) => {
  await AsyncStorage.setItem(PENDING_2FA_KEY, JSON.stringify(challenge));
};

export const getPendingTwoFactorChallenge = async () => {
  const value = await AsyncStorage.getItem(PENDING_2FA_KEY);
  return value ? (JSON.parse(value) as PendingTwoFactorChallenge) : null;
};

export const clearPendingTwoFactorChallenge = async () => {
  await AsyncStorage.removeItem(PENDING_2FA_KEY);
};

export const storeAuthSession = async (session: StoredAuthSession) => {
  const meta: StoredAuthSessionMeta = {
    role: session.role,
    user: session.user,
  };

  await Promise.all([
    SecureStore.setItemAsync(AUTH_TOKEN_KEY, session.token),
    AsyncStorage.setItem(AUTH_SESSION_META_KEY, JSON.stringify(meta)),
  ]);
};

export const getStoredAuthSession = async () => {
  const [token, metaValue] = await Promise.all([
    SecureStore.getItemAsync(AUTH_TOKEN_KEY),
    AsyncStorage.getItem(AUTH_SESSION_META_KEY),
  ]);

  if (!token || !metaValue) {
    return null;
  }

  try {
    const meta = JSON.parse(metaValue) as StoredAuthSessionMeta;
    return {
      token,
      role: meta.role,
      user: meta.user,
    };
  } catch {
    await clearStoredAuthSession();
    return null;
  }
};

export const clearStoredAuthSession = async () => {
  await Promise.all([
    SecureStore.deleteItemAsync(AUTH_TOKEN_KEY),
    AsyncStorage.removeItem(AUTH_SESSION_META_KEY),
  ]);
};

export const signOutUser = async () => {
  await Promise.all([clearStoredAuthSession(), clearPendingTwoFactorChallenge()]);
};

const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const session = await getStoredAuthSession();
  if (!session?.token) {
    throw new ApiError('You are not signed in.');
  }

  return {
    Authorization: `Bearer ${session.token}`,
  };
};

const getOptionalAuthHeaders = async (): Promise<Record<string, string>> => {
  const session = await getStoredAuthSession();
  return session?.token ? { Authorization: `Bearer ${session.token}` } : {};
};

export const fetchEmployeeProfile = async () => {
  const headers = await getAuthHeaders();
  return request<EmployeeProfileResponse>('/profile/me', {
    method: 'GET',
    headers,
  });
};

export const updateEmployeeProfile = async (payload: {
  name?: string;
  phone?: string;
  address?: string;
  department?: string;
  designation?: string;
  profileImage?: string;
}) => {
  const headers = await getAuthHeaders();
  const response = await request<EmployeeProfileResponse>('/profile/me', {
    method: 'PATCH',
    headers,
    body: payload,
  });

  const currentSession = await getStoredAuthSession();
  if (currentSession?.token) {
    await storeAuthSession({
      ...currentSession,
      user: {
        ...currentSession.user,
        name: response.data.name,
        email: response.data.email,
        role: response.data.systemRole,
        designation: response.data.role,
        department: response.data.department,
        joiningDate: response.data.joiningDate,
        phone: response.data.phone,
        address: response.data.address,
        employeeId: response.data.employeeId,
        profileImage: response.data.avatar,
      },
    });
  }

  return response;
};

export type DashboardHomeResponse = {
  status: string;
  data: {
    greeting: {
      message: string;
      subMessage: string;
      today?: string;
    };
    leaveBalance: {
      privilegeLeave: number;
      casualLeave: number;
      sickLeave: number;
      totalBalance: number;
      earlyOutRecord: number;
      lateIn: string;
      earlyOut: string;
      halfDay: number;
    };
    attendanceSummary: {
      present: number;
      leaves: number;
      holiday: number;
    };
  };
};

export const fetchDashboardHome = async () => {
  const headers = await getAuthHeaders();
  return request<DashboardHomeResponse>('/dashboard/home', {
    method: 'GET',
    headers,
  });
};

export const fetchAttendanceSummary = async () => {
  const headers = await getAuthHeaders();
  return request<{
    status: string;
    statusCode: number;
    data: {
      present: number;
      leaves: number;
      holiday: number;
    };
  }>('/attendance-summary', {
    method: 'GET',
    headers,
  });
};

export const submitEmployeePunch = async (payload: PunchPayload) => {
  const headers = await getOptionalAuthHeaders();
  return request<{
    status: string;
    message: string;
    PunchTime?: string;
    data?: {
      latitude?: number;
      longitude?: number;
      locationLabel?: string;
    };
  }>('/emp-punch', {
    method: 'POST',
    headers,
    body: {
      ...payload,
      IsAway: payload.IsAway ?? false,
      WorkMode: payload.WorkMode ?? 1,
    },
  });
};

export type AttendanceRecord = {
  id: string;
  date: string;
  month: string;
  day: number;
  checkInTime: string;
  checkOutTime: string;
  status: 'Present' | 'Late' | 'Absent' | 'Pending';
  duration: string;
  latitude?: number;
  longitude?: number;
  workMode?: number;
};

export const fetchAttendanceHistory = async (month?: string, year?: string) => {
  const headers = await getOptionalAuthHeaders();
  let path = '/attendance-history';
  if (month && year) {
    path += `?month=${month}&year=${year}`;
  }
  return request<{
    status: string;
    statusCode: number;
    data: {
      records: AttendanceRecord[];
      summary: {
        presentDays: number;
        lateDays: number;
        absentDays: number;
        totalHours: number;
      };
    };
  }>(path, {
    method: 'GET',
    headers,
  });
};

export type EmployeeLeaveApiRecord = {
  LeaveApplicationMasterID: string;
  EmployeeID: string;
  LeaveType: string;
  ApprovalStatusID?: number;
  ApprovalStatus: string;
  ApprovalUsername?: string;
  Reason: string;
  StartDate: string;
  EndDate: string;
  IsHalfDay?: boolean;
  IsFirstHalf?: boolean;
  CreatedDate?: string;
  UpdatedDate?: string;
};

export const applyEmployeeLeave = async (payload: {
  LeaveType: string;
  Reason: string;
  StartDate: string;
  EndDate: string;
  IsHalfDay?: boolean;
  IsFirstHalf?: boolean;
}) => {
  const headers = await getAuthHeaders();
  return request<{
    status: string;
    message: string;
  }>('/leaveapplications', {
    method: 'POST',
    headers,
    body: payload,
  });
};

export const fetchEmployeeLeaves = async () => {
  const headers = await getAuthHeaders();
  return request<{
    status: string;
    statusCode?: number;
    data: EmployeeLeaveApiRecord[] | EmployeeLeaveApiRecord;
  }>('/leaveapplications', {
    method: 'GET',
    headers,
  });
};

export type DirectoryEmployee = {
  id: string;
  name: string;
  profile: string;
  roal: string;
  'work roal': string;
  contact: {
    email: string;
    phone: string;
  };
};

export const fetchAllEmployees = async () => {
  const headers = await getOptionalAuthHeaders();
  return request<{
    status: string;
    statusCode: number;
    data: DirectoryEmployee[];
  }>('/directors', {
    method: 'GET',
    headers,
  });
};
