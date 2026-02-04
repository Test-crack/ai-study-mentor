export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
  // ... you can add the other optional fields from useAuth.ts if needed
}