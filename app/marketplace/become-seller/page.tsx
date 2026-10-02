"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/providers/I18nProvider";
import { SellerConfetti } from "@/components/marketplace/SellerConfetti";
import { MARKETPLACE_CITIES } from "@/lib/marketplace/types";
import {
  MOCK_OTP,
  canPublishListings,
  emptySellerAccount,
  readSellerAccount,
  writeSellerAccount,
  type MarketplaceSellerAccount,
} from "@/lib/marketplace/seller";

type Step = 0 | 1 | 2 | 3;

export default function BecomeSellerPage() {
  const { dict } = useI18n();
  const bs = dict.marketplace.becomeSeller;
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [draft, setDraft] = useState<MarketplaceSellerAccount>(emptySellerAccount);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const existing = readSellerAccount();
    if (canPublishListings(existing)) {
      router.replace("/marketplace/sell");
      return;
    }
    if (existing.username) setDraft(existing);
    setHydrated(true);
  }, [router]);

  const stepLabels = [
    bs.stepProfile,
    bs.stepPhone,
    bs.stepEmail,
    bs.stepAgreement,
  ];

  const validate = (): boolean => {
    setError("");
    if (step === 0) {
      if (!draft.username.trim() || !draft.displayName.trim() || !draft.city) {
        setError(bs.required);
        return false;
      }
    }
    if (step === 1) {
      if (!draft.phoneVerified) {
        setError(bs.required);
        return false;
      }
    }
    if (step === 2) {
      if (!draft.emailVerified) {
        setError(bs.required);
        return false;
      }
    }
    if (step === 3) {
      if (!draft.agreementAccepted) {
        setError(bs.required);
        return false;
      }
    }
    return true;
  };

  const onNext = () => {
    if (!validate()) return;
    if (step < 3) {
      setStep((s) => (s + 1) as Step);
      return;
    }
    const account: MarketplaceSellerAccount = {
      ...draft,
      isSeller: true,
      verifiedSeller: false,
      createdAt: draft.createdAt || new Date().toISOString(),
    };
    writeSellerAccount(account);
    setDone(true);
  };

  const verifyPhone = () => {
    if (!draft.phone.trim()) {
      setError(bs.required);
      return;
    }
    if (!otpSent) {
      setOtpSent(true);
      setError("");
      return;
    }
    if (otp.trim() !== MOCK_OTP) {
      setError(bs.invalidOtp);
      return;
    }
    setDraft((d) => ({ ...d, phoneVerified: true }));
    setError("");
  };

  const verifyEmail = () => {
    if (!draft.email.trim() || !draft.email.includes("@")) {
      setError(bs.required);
      return;
    }
    setDraft((d) => ({ ...d, emailVerified: true }));
    setError("");
  };

  if (!hydrated) {
    return <div className="mp-container mp-empty">…</div>;
  }

  if (done) {
    return (
      <div className="mp-container mp-success-screen">
        <SellerConfetti active />
        <div className="mp-success mp-success-center">
          <h1>{bs.successTitle}</h1>
          <p>{bs.successBody}</p>
          <div className="mp-success-actions">
            <Link href="/marketplace/sell" className="mp-btn mp-btn-primary">
              {bs.sellCta}
            </Link>
            <Link href="/marketplace/me" className="mp-btn mp-btn-secondary">
              {bs.profileCta}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mp-container">
      <div className="mp-wizard">
        <div className="mp-wizard-progress" aria-hidden>
          {stepLabels.map((_, i) => (
            <span key={i} className={i <= step ? "done" : ""} />
          ))}
        </div>

        <div className="mp-wizard-step">
          <h1>
            {bs.title} · {step + 1}/4
          </h1>
          <p>{step === 0 ? bs.subtitle : stepLabels[step]}</p>

          {step === 0 && (
            <div className="mp-seller-form">
              <label className="mp-field">
                <span>{bs.username}</span>
                <input
                  className="mp-input"
                  value={draft.username}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      username: e.target.value.replace(/\s+/g, ".").toLowerCase(),
                    }))
                  }
                  placeholder={bs.usernamePlaceholder}
                />
              </label>
              <label className="mp-field">
                <span>{bs.displayName}</span>
                <input
                  className="mp-input"
                  value={draft.displayName}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, displayName: e.target.value }))
                  }
                  placeholder={bs.displayNamePlaceholder}
                />
              </label>
              <label className="mp-field">
                <span>{bs.city}</span>
                <select
                  className="mp-select"
                  value={draft.city}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, city: e.target.value }))
                  }
                >
                  <option value="">—</option>
                  {MARKETPLACE_CITIES.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </label>
              <label className="mp-field">
                <span>{bs.bio}</span>
                <textarea
                  className="mp-input"
                  rows={3}
                  value={draft.bio}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, bio: e.target.value }))
                  }
                  placeholder={bs.bioPlaceholder}
                />
              </label>
            </div>
          )}

          {step === 1 && (
            <div className="mp-seller-form">
              {draft.phoneVerified ? (
                <p className="mp-verified-line">{bs.phoneVerified}</p>
              ) : (
                <>
                  <label className="mp-field">
                    <span>{bs.phone}</span>
                    <input
                      className="mp-input"
                      value={draft.phone}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, phone: e.target.value }))
                      }
                      placeholder={bs.phonePlaceholder}
                      inputMode="tel"
                    />
                  </label>
                  {otpSent ? (
                    <label className="mp-field">
                      <span>{bs.otp}</span>
                      <input
                        className="mp-input"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="1234"
                        inputMode="numeric"
                      />
                      <span className="mp-field-hint">{bs.otpHint}</span>
                    </label>
                  ) : null}
                  <button
                    type="button"
                    className="mp-btn mp-btn-secondary"
                    onClick={verifyPhone}
                  >
                    {otpSent ? bs.verifyPhone : bs.sendOtp}
                  </button>
                </>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="mp-seller-form">
              {draft.emailVerified ? (
                <p className="mp-verified-line">{bs.emailVerified}</p>
              ) : (
                <>
                  <label className="mp-field">
                    <span>{bs.email}</span>
                    <input
                      className="mp-input"
                      type="email"
                      value={draft.email}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, email: e.target.value }))
                      }
                      placeholder={bs.emailPlaceholder}
                    />
                  </label>
                  <button
                    type="button"
                    className="mp-btn mp-btn-secondary"
                    onClick={verifyEmail}
                  >
                    {bs.verifyEmail}
                  </button>
                </>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="mp-seller-form">
              <div className="mp-agreement">
                <strong>{bs.agreementTitle}</strong>
                <p>{bs.agreementBody}</p>
              </div>
              <label className="mp-check">
                <input
                  type="checkbox"
                  checked={draft.agreementAccepted}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      agreementAccepted: e.target.checked,
                    }))
                  }
                />
                <span>{bs.agreementCheck}</span>
              </label>
            </div>
          )}

          {error ? (
            <p style={{ color: "var(--mp-danger)", marginTop: "1rem" }}>
              {error}
            </p>
          ) : null}

          <div className="mp-wizard-nav">
            <button
              type="button"
              className="mp-btn mp-btn-secondary"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1) as Step)}
            >
              {bs.back}
            </button>
            <button
              type="button"
              className="mp-btn mp-btn-primary"
              style={{ flex: 1 }}
              onClick={onNext}
            >
              {step >= 3 ? bs.submit : bs.next}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
