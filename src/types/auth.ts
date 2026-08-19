export type SocialProvider = "google" | "naver" | "kakao";

export interface AuthUser {
  userId: string;
  name: string;
  role: string;
  isNewUser: boolean;
}

export interface KakaoLoginResponse extends AuthUser {
  accessToken: string;
}
