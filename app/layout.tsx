import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "@/styles/globals.css";
import { AppProviders } from "@/components/providers/AppProviders";
import { getConfig, getFaqItems, getProducts } from "@/lib/data/store";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://solovyev.store";
const gaId = process.env.NEXT_PUBLIC_GA_ID;

export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "SOLOVYEV STORE | Buy, Sell & Trade Streetwear",
    template: "%s | SOLOVYEV STORE",
  },
  description:
    "Premium streetwear & sneakers consignment store. Buy, sell, and trade 100% authentic items.",
  openGraph: {
    type: "website",
    locale: "en_IL",
    url: siteUrl,
    siteName: "SOLOVYEV STORE",
    title: "SOLOVYEV STORE | Buy, Sell & Trade Streetwear",
    description:
      "Premium streetwear & sneakers consignment store. Buy, sell, and trade 100% authentic items.",
    images: [{ url: "/assets/hiro_photo.jpg", width: 1023, height: 1537 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SOLOVYEV STORE",
    description:
      "Premium streetwear & sneakers consignment store.",
    images: ["/assets/hiro_photo.jpg"],
  },
  alternates: {
    canonical: siteUrl,
  },
  icons: {
    icon: [{ url: "/assets/logo.jpg", type: "image/jpeg" }],
    apple: [{ url: "/assets/logo.jpg", type: "image/jpeg" }],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [products, config, faqItems] = await Promise.all([
    getProducts(),
    getConfig(),
    getFaqItems(),
  ]);

  const heroPhoto = config.images.heroPhoto;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="preload"
          as="image"
          href={heroPhoto}
          fetchPriority="high"
        />
      </head>
      <body suppressHydrationWarning>
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function(){try{var t=localStorage.getItem('solovyev_theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`}
        </Script>
        <AppProviders store={{ products, config, faqItems }}>
          {children}
        </AppProviders>
        {gaId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                window.gtag = gtag;
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        ) : null}
      </body>
    </html>
  );
}
