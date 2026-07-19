export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'BUSINESS_OWNER' | 'EMPLOYEE';
  emailVerified: boolean;
}

export interface JwtAuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
}

export interface ApiResponse {
  success: boolean;
  message: string;
}
