import { authStorage, request } from "./client";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  expiresInMinutes: number;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
}

// Authentication API
export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await request<LoginResponse>(
      "/Auth/login",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      false
    );

    authStorage.saveToken(response.token);
    return response;
  },

  logout: (): void => {
    authStorage.clearToken();
  },
};
