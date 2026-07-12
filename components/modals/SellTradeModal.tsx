"use client";

import { FormEvent, useEffect, useState } from "react";
import { useStore } from "@/components/providers/StoreProvider";
import {
  buildSellTradeMessage,
  buildWhatsAppUrl,
} from "@/lib/whatsapp";
import { trackSellTradeSubmit } from "@/lib/analytics";
import { useUI } from "@/components/providers/UIProvider";
import { useI18n } from "@/components/providers/I18nProvider";

export function SellTradeModal() {
  const { config } = useStore();
  const { activeModal, closeAll } = useUI();
  const { dict } = useI18n();
  const { sellTrade } = dict;
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAll();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeAll]);

  if (activeModal !== "sellTrade") return null;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    if (data.get("website")) return;

    const nextErrors: Record<string, string> = {};
    const required = ["item-type", "item-name", "item-size", "item-condition", "item-price"];
    required.forEach((name) => {
      if (!String(data.get(name) || "").trim()) {
        nextErrors[name] = sellTrade.required;
      }
    });

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    trackSellTradeSubmit();
    const message = buildSellTradeMessage(
      {
        category: String(data.get("item-type")),
        name: String(data.get("item-name")),
        size: String(data.get("item-size")),
        condition: String(data.get("item-condition")),
        price: String(data.get("item-price")),
        notes: String(data.get("item-notes") || ""),
      },
      config,
    );
    window.open(buildWhatsAppUrl(message, config), "_blank", "noopener,noreferrer");
  };

  const steps = [
    {
      step: "1",
      title: sellTrade.step1Title,
      desc: sellTrade.step1Desc,
    },
    {
      step: "2",
      title: sellTrade.step2Title,
      desc: sellTrade.step2Desc,
    },
    {
      step: "3",
      title: sellTrade.step3Title,
      desc: sellTrade.step3Desc,
    },
  ];

  return (
    <div className="modal modal-large open" id="sell-trade-modal" role="dialog" aria-modal="true">
      <div className="modal-backdrop" onClick={closeAll} aria-hidden="true" />
      <div className="modal-content">
        <button type="button" className="close-modal-btn" onClick={closeAll} aria-label={sellTrade.close}>
          ×
        </button>
        <h2>{sellTrade.title}</h2>
        <p className="modal-intro">{sellTrade.intro}</p>

        <div className="sell-trade-grid">
          <div className="sell-trade-steps">
            {steps.map((item) => (
              <div key={item.step} className="step-card">
                <span className="step-number">{item.step}</span>
                <div>
                  <h4>{item.title}</h4>
                  <p>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="valuation-portal">
            <h3>{sellTrade.portalTitle}</h3>
            <form id="valuation-form" onSubmit={handleSubmit} noValidate>
              <div className="form-group-honeypot">
                <label className="visually-hidden" htmlFor="item-website">
                  Leave this field blank
                </label>
                <input
                  type="text"
                  id="item-website"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              <div className="form-group">
                <label htmlFor="item-type">{sellTrade.category}</label>
                <select id="item-type" name="item-type" required>
                  <option value="">{sellTrade.selectCategory}</option>
                  <option value="Sneakers">{sellTrade.sneakers}</option>
                  <option value="Clothing">{sellTrade.clothing}</option>
                  <option value="Accessories">{sellTrade.accessories}</option>
                </select>
                {errors["item-type"] && (
                  <span className="field-error">{sellTrade.required}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="item-name">{sellTrade.brandModel}</label>
                <input type="text" id="item-name" name="item-name" required />
                {errors["item-name"] && (
                  <span className="field-error">{sellTrade.required}</span>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="item-size">{sellTrade.size}</label>
                  <input type="text" id="item-size" name="item-size" required />
                  {errors["item-size"] && (
                    <span className="field-error">{sellTrade.required}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="item-condition">{sellTrade.condition}</label>
                  <input type="text" id="item-condition" name="item-condition" required />
                  {errors["item-condition"] && (
                    <span className="field-error">{sellTrade.required}</span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="item-price">
                  {sellTrade.wantedPrice.replace("₪", config.currency.symbol)}
                </label>
                <input type="number" id="item-price" name="item-price" min="0" required />
                {errors["item-price"] && (
                  <span className="field-error">{sellTrade.required}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="item-notes">{sellTrade.notes}</label>
                <textarea id="item-notes" name="item-notes" rows={3} />
              </div>

              <button type="submit" className="btn-primary btn-full">
                {sellTrade.submit}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
