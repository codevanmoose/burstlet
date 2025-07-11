export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  role?: 'USER' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  user: User;
  expires: string;
}

export interface AuthError {
  message: string;
  code?: string;
}