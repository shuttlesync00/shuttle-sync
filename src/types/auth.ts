export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string | null;
  profileImage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}
