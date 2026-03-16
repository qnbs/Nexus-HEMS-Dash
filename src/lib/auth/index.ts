/**
 * Auth Module — barrel export
 *
 * Usage:
 *   import { useAuthStore, useAuthUser, hasPermission, SupabaseAuthProvider } from '@/lib/auth';
 */

// ── Types & Interface ───────────────────────────────────────────────
export type {
  AuthProvider,
  AuthProviderType,
  AuthSession,
  AuthUser,
  AuthCredentials,
  OAuthProvider,
  UserRole,
  UserInvitation,
  ShareLink,
  CreateShareLinkOptions,
} from './auth-provider';

export { ROLE_PERMISSIONS, SHARE_TTL_MS, hasPermission, roleLevel } from './auth-provider';

// ── Providers ───────────────────────────────────────────────────────
export { SupabaseAuthProvider } from './supabase-provider';
export type { SupabaseAuthConfig } from './supabase-provider';

export { KeycloakAuthProvider } from './keycloak-provider';
export type { KeycloakAuthConfig } from './keycloak-provider';

// ── Store & Hooks ───────────────────────────────────────────────────
export { useAuthStore, useAuthUser, useIsAuthenticated, useUserRole } from './auth-store';
