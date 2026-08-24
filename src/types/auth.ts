export type SocialProvider = "google" | "naver" | "kakao";

export interface AuthUser {
  userId: string;
  name: string;
  role: string;
  isNewUser: boolean;
  provider?: SocialProvider;
}

export interface SocialLoginResponse extends AuthUser {
  accessToken: string;
}
