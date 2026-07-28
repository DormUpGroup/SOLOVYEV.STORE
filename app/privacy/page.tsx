import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { MinimalFooter } from "@/components/layout/FooterBars";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://solovyev.store";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for SOLOVYEV STORE website.",
  alternates: { canonical: `${siteUrl}/privacy` },
};

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="subpage-main">
        <div className="subpage-container privacy-content">
          <Link href="/" className="back-link">
            ← BACK TO STORE
          </Link>
          <h1>Privacy Policy</h1>
          <p>Last updated: July 27, 2026</p>

          <h2>Overview</h2>
          <p>
            SOLOVYEV STORE (&quot;we&quot;, &quot;us&quot;) operates solovyev.store. This
            policy explains how we handle information when you use our website.
          </p>

          <h2>Local Storage</h2>
          <p>
            We use your browser&apos;s local storage to save your shopping cart
            items and theme preference (dark/light mode). When you sign in, cart
            items are synchronized with your account on our servers.
          </p>

          <h2>Customer Accounts</h2>
          <p>
            Account authentication is provided by Supabase. Passwords are
            processed and securely hashed by Supabase; SOLOVYEV STORE cannot
            access your plaintext password. We store your email, optional display
            name, favorites, cart, and WhatsApp order history so that you can
            access them across devices. We do not store payment card details.
          </p>

          <h2>Analytics</h2>
          <p>
            We may use Google Analytics 4 to understand how visitors use the
            site (pages viewed, cart actions, WhatsApp checkout clicks). Analytics
            data is aggregated and does not include payment information — we do
            not process online payments on this website.
          </p>

          <h2>WhatsApp &amp; Instagram</h2>
          <p>
            When you click to order or submit a valuation via WhatsApp or
            Instagram, you leave our website and communicate directly with us
            through those platforms. Their privacy policies apply to those
            conversations.
          </p>

          <h2>Contact</h2>
          <p>
            Questions about this policy? Message us on{" "}
            <a
              href="https://www.instagram.com/solovyev.store"
              target="_blank"
              rel="noopener noreferrer"
            >
              Instagram @solovyev.store
            </a>
            .
          </p>
        </div>
      </main>
      <MinimalFooter />
    </>
  );
}
