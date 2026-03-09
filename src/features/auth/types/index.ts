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
  username: string | null;
  name: string | null;
  role: 'STUDENT' | 'INSTRUCTOR' | 'SUPERADMIN' | 'INSTITUTE_OWNER' | 'INSTITUTE_ADMIN';
  instituteIsActive?: boolean;
}