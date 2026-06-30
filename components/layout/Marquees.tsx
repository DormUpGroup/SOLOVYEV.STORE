"use client";

import { useI18n } from "@/components/providers/I18nProvider";

export function AnnouncementBar() {
  const { dict } = useI18n();
  const { announcement } = dict;
  const items = [
    announcement.freeShipping,
    announcement.authenticity,
    announcement.newDrops,
    announcement.freeShipping,
    announcement.authenticity,
    announcement.newDrops,
  ];

  return (
    <div className="announcement-bar">
      <div className="announcement-track">
        {items.map((text, i) => (
          <span key={`${text}-${i}`}>{text}</span>
        ))}
      </div>
    </div>
  );
}

export function BrandMarquee() {
  const brands = [
    "CHROME HEARTS",
    "JORDAN",
    "YEEZY",
    "SUPREME",
    "ESSENTIALS",
    "STUSSY",
    "NIKE",
    "NEW BALANCE",
  ];
  const items = [...brands, ...brands];

  return (
    <div className="marquee-container">
      <div className="marquee-track">
        {items.map((brand, i) => (
          <span key={`${brand}-${i}`}>{brand}</span>
        ))}
      </div>
    </div>
  );
}
