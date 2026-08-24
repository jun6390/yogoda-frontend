import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  devIndicators: false,
  /*
   * redirect_uri는 provider 콘솔에 고정 경로로 등록해야 해서 /auth/:provider/callback으로 노출하고,
   * 실제로는 NEXT_LOCALE 쿠키 기준으로 [locale]/(auth)/callback/[provider]로 내부 rewrite함
   */
  async rewrites() {
    return [
      {
        source: "/auth/:provider/callback",
        has: [{ type: "cookie", key: "NEXT_LOCALE", value: "en" }],
        destination: "/en/callback/:provider",
      },
      {
        source: "/auth/:provider/callback",
        destination: "/ko/callback/:provider",
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
