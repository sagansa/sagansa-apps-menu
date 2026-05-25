// Authentication service for web-order-next
import apiService from '@/lib/api';
import { clearToken, loadToken, saveToken } from '@/lib/storage';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  tenant_name: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  email_verified_at?: string | null;
  created_at: string;
  updated_at: string;
  tenant_id?: string | null;
  manager_id?: string | null;
  invitation_token?: string | null;
  roles?: { id: string; name: string }[];
  tenant?: {
    id: string;
    name: string;
    owner_id?: string | null;
    users_count?: number;
    owner?: { id: string; name: string; email: string } | null;
    stores?: { id: string; tenant_id: string; name: string; nickname?: string | null; no_telp?: string | null; email?: string | null; status?: string | null; radius?: number | null; latitude?: number | null; longitude?: number | null }[];
    shift_stores?: { id: string; tenant_id: string; name: string; shift_start_time: string; shift_end_time: string; duration: number }[];
  } | null;
  tenants?: {
    id: string;
    name: string;
    owner_id?: string | null;
    users_count?: number;
    pivot?: { role: string; assigned_by: string | null };
    owner?: { id: string; name: string; email: string } | null;
    stores?: { id: string; tenant_id: string; name: string; nickname?: string | null; no_telp?: string | null; email?: string | null; status?: string | null; radius?: number | null; latitude?: number | null; longitude?: number | null }[];
    shift_stores?: { id: string; tenant_id: string; name: string; shift_start_time: string; shift_end_time: string; duration: number }[];
  }[];
}

export interface AuthResponse {
  token: string;
  user: User;
}

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  return apiService.login(credentials);
}

export async function register(data: RegisterData): Promise<AuthResponse> {
  return apiService.register(data);
}

export async function logout(): Promise<void> {
  return apiService.logout();
}

export async function fetchProfile(): Promise<{ user: User }> {
  return apiService.fetchProfile();
}

export async function getInvitation(token: string) {
  return apiService.getInvitation(token);
}

export async function completeInvitation(token: string, payload: { name: string; password: string; password_confirmation: string }) {
  return apiService.completeInvitation(token, payload);
}