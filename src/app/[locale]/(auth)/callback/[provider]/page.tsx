import { notFound } from "next/navigation";

import type { SocialProvider } from "@/types/auth";

import { CallbackHandler } from "./CallbackHandler";

const SOCIAL_PROVIDERS = ["google", "naver", "kakao"] as const;

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

  return <CallbackHandler provider={provider} />;
}
