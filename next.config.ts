import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// A custom image domain/CDN in front of the storage bucket, if configured.
const extraImageHost = (() => {
  try {
    return process.env.ARVAN_PUBLIC_URL_BASE
      ? new URL(process.env.ARVAN_PUBLIC_URL_BASE).hostname
      : null;
  } catch {
    return null;
  }
})();

const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  // HSTS only matters over HTTPS (which is how Vercel serves the site) —
  // harmless locally since browsers ignore it on plain http://localhost.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // 'unsafe-inline' is only for the JSON-LD <script> tags on product
      // pages; tighten this to a nonce-based policy if that script is
      // ever removed.
      // Next's dev server needs eval for React's debugging features.
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  images: {
    remotePatterns: [
      // ArvanCloud Object Storage — see README → "اتصال Object Storage
      // آروان‌کلاد". Covers both regional endpoints and any custom
      // ARVAN_PUBLIC_URL_BASE domain you configure.
      { protocol: "https", hostname: "*.arvanstorage.ir" },
      { protocol: "https", hostname: "*.arvanstorage.com" },
      ...(extraImageHost ? [{ protocol: "https" as const, hostname: extraImageHost }] : []),
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
