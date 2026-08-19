"use client";

import Image from "next/image";
import { useEffect } from "react";

import { useRouter } from "@/i18n/navigation";

const SPLASH_DURATION = 1500;

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      router.replace("/onboarding");
    }, SPLASH_DURATION);

    return () => window.clearTimeout(timer);
  }, [router]);

  return (
    <section className="flex h-full items-center justify-center bg-surface">
      <Image
        src="/yogoda-logo.svg"
        alt="요고다"
        width={175}
        height={36}
        priority
      />
    </section>
  );
}
