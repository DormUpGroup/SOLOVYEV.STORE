import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const cspDirectives = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://www.googletagmanager.com https://region1.google-analytics.com",
  "frame-src 'self' https://www.googletagmanager.com",
];

if (isProd) {
  cspDirectives.push("upgrade-insecure-requests");
}

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  {
    key: "Content-Security-Policy",
    value: cspDirectives.join("; "),
  },
];

if (isProd) {
  securityHeaders.push({
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  });
}

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  // pdfkit loads AFM font files from disk — must stay external + traced into the lambda
  serverExternalPackages: ["sharp", "pdfkit", "fontkit"],
  outputFileTracingIncludes: {
    "/api/admin/reports/sales": [
      "./node_modules/pdfkit/js/data/**/*",
      "./node_modules/@swc/helpers/**/*",
    ],
  },
  trailingSlash: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
