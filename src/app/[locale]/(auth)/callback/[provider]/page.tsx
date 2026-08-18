import { notFound } from "next/navigation";

const SOCIAL_PROVIDERS = ["google", "naver", "kakao"] as const;

type SocialProvider = (typeof SOCIAL_PROVIDERS)[number];

function isSocialProvider(value: string): value is SocialProvider {
  return SOCIAL_PROVIDERS.includes(value as SocialProvider);
}

interface CallbackPageProps {
  params: Promise<{
    provider: string;
  }>;
}

export default async function CallbackPage({ params }: CallbackPageProps) {
  const { provider } = await params;

  if (!isSocialProvider(provider)) {
    notFound();
  }

  return <div>{provider} 로그인 처리 중...</div>;
}
