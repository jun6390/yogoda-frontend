import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  distDir: process.env.YOGODA_E2E === "1" ? ".next-e2e" : ".next",
  typescript: {
    tsconfigPath:
      process.env.NODE_ENV === "production"
        ? "tsconfig.build.json"
        : "tsconfig.json",
  },
  devIndicators: false,
  poweredByHeader: false,
  async redirects() {
    return [
      { source: "/favicon.ico", destination: "/icon.svg", permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(self), geolocation=(self)",
          },
          {
            key: "Content-Security-Policy",
            value: "base-uri 'self'; object-src 'none'; frame-ancestors 'none'",
          },
          ...(process.env.NODE_ENV === "production"
            ? [{ key: "Strict-Transport-Security", value: "max-age=31536000" }]
            : []),
        ],
      },
    ];
  },
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
