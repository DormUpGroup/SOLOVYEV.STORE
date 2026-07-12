"use client";

import { useEffect, useMemo, useState } from "react";
import { trackFaqExpand } from "@/lib/analytics";
import { useUI } from "@/components/providers/UIProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import { useStore } from "@/components/providers/StoreProvider";
import type { FaqItem } from "@/lib/types";

function useFaqItems(): FaqItem[] {
  const { dict } = useI18n();
  const { faqItems } = useStore();
  return useMemo(
    () => (faqItems.length > 0 ? faqItems : dict.faq.items),
    [dict.faq.items, faqItems],
  );
}

export function FaqModal() {
  const { activeModal, closeAll } = useUI();
  const { dict } = useI18n();
  const items = useFaqItems();
  const { faq } = dict;
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAll();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeAll]);

  if (activeModal !== "faq") return null;

  return (
    <div className="modal open" id="faq-modal" role="dialog" aria-modal="true">
      <div className="modal-backdrop" onClick={closeAll} aria-hidden="true" />
      <div className="modal-content faq-modal-content">
        <button type="button" className="close-modal-btn" onClick={closeAll} aria-label={faq.close}>
          ×
        </button>
        <h2>{faq.title}</h2>
        <div className="faq-list">
          {items.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={item.question}
                className={`faq-item ${isOpen ? "open" : ""}`}
              >
                <button
                  type="button"
                  className="faq-trigger"
                  aria-expanded={isOpen}
                  onClick={() => {
                    setOpenIndex(isOpen ? null : index);
                    if (!isOpen) trackFaqExpand(item.question);
                  }}
                >
                  {item.question}
                </button>
                <div
                  className="faq-content"
                  style={{ maxHeight: isOpen ? "500px" : undefined }}
                >
                  <p>{item.answer}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function FaqAccordion({ className = "" }: { className?: string }) {
  const items = useFaqItems();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className={`faq-list ${className}`}>
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={item.question} className={`faq-item ${isOpen ? "open" : ""}`}>
            <button
              type="button"
              className="faq-trigger"
              aria-expanded={isOpen}
              onClick={() => {
                setOpenIndex(isOpen ? null : index);
                if (!isOpen) trackFaqExpand(item.question);
              }}
            >
              {item.question}
            </button>
            <div
              className="faq-content"
              style={{ maxHeight: isOpen ? "500px" : undefined }}
            >
              <p>{item.answer}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
