export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tenantId: string;
  userName: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}
