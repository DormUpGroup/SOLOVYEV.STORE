"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import {
  FixedBottomBar,
  MinimalFooter,
  ToastNotification,
} from "@/components/layout/FooterBars";
import { SellTradeModal } from "@/components/modals/SellTradeModal";
import { FaqModal } from "@/components/modals/FaqModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { QuickViewModal } from "@/components/modals/QuickViewModal";
import { useI18n } from "@/components/providers/I18nProvider";
import { useStore } from "@/components/providers/StoreProvider";
import { formatDisplayPhone } from "@/lib/contacts";
import { getLegalBundle } from "@/lib/legal";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

type LegalDoc = "privacy" | "terms";

function renderParagraph(
  text: string,
  whatsappDisplay: string,
  whatsappUrl: string,
  instagramUrl: string,
): ReactNode[] {
  const parts = text.split(/(\{whatsapp\}|\{instagram\})/g);
  return parts.map((part, index) => {
    if (part === "{whatsapp}") {
      return (
        <a
          key={`wa-${index}`}
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {whatsappDisplay}
        </a>
      );
    }
    if (part === "{instagram}") {
      return (
        <a
          key={`ig-${index}`}
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          @solovyev.store
        </a>
      );
    }
    return <span key={`t-${index}`}>{part}</span>;
  });
}

export function LegalDocPageClient({ doc }: { doc: LegalDoc }) {
  const { locale, dict } = useI18n();
  const { config } = useStore();
  const bundle = getLegalBundle(locale);
  const document = doc === "privacy" ? bundle.privacy : bundle.terms;
  const phoneDisplay = formatDisplayPhone(config.contacts.whatsappPhone);
  const whatsappUrl = buildWhatsAppUrl(
    dict.common.hiGreeting.replace("{name}", config.contacts.managerName),
    config,
  );
  const instagramUrl = config.contacts.instagramUrl;

  return (
    <>
      <Header />
      <main className="subpage-main">
        <div className="subpage-container privacy-content">
          <Link href="/" className="back-link">
            {bundle.backToStore}
          </Link>
          <h1>{document.title}</h1>
          <p>{document.lastUpdated}</p>

          {document.sections.map((section) => (
            <section key={section.id}>
              <h2>{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={`${section.id}-${paragraph.slice(0, 48)}`}>
                  {renderParagraph(
                    paragraph,
                    phoneDisplay,
                    whatsappUrl,
                    instagramUrl,
                  )}
                </p>
              ))}
            </section>
          ))}
        </div>
      </main>
      <MinimalFooter />
      <FixedBottomBar />
      <ToastNotification />
      <SellTradeModal />
      <FaqModal />
      <QuickViewModal />
      <CartDrawer />
    </>
  );
}
