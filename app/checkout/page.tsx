import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutPageClient } from "@/components/checkout/CheckoutPageClient";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutPageClient />
    </Suspense>
  );
}
