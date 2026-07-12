"use client";

import { useI18n } from "@/components/providers/I18nProvider";
import { useStore } from "@/components/providers/StoreProvider";

export function AnnouncementBar() {
  const { dict } = useI18n();
  const { config } = useStore();
  const { announcement } = dict;
  const ann = config.announcements;
  const items = [
    ann?.freeShipping ?? announcement.freeShipping,
    ann?.authenticity ?? announcement.authenticity,
    ann?.newDrops ?? announcement.newDrops,
    ann?.freeShipping ?? announcement.freeShipping,
    ann?.authenticity ?? announcement.authenticity,
    ann?.newDrops ?? announcement.newDrops,
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
