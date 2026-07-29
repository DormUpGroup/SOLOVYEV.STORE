"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useStore } from "@/components/providers/StoreProvider";
import { useUI } from "@/components/providers/UIProvider";
import { useI18n } from "@/components/providers/I18nProvider";

export function HeroSection() {
  const { config } = useStore();
  const { openSellTrade } = useUI();
  const { dict } = useI18n();
  const { hero } = dict;
  const heroVideo = config.images.heroVideo?.trim();
  const sectionRef = useRef<HTMLElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const media = mediaRef.current;
    if (!section || !media) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    let ticking = false;
    const PARALLAX_FACTOR = 0.42;

    const updateParallax = () => {
      const scrolled = Math.max(0, -section.getBoundingClientRect().top);
      const maxOffset = section.offsetHeight * 0.45;
      const offset = Math.min(scrolled * PARALLAX_FACTOR, maxOffset);
      media.style.transform = `translate3d(0, ${offset}px, 0)`;
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateParallax);
    };

    updateParallax();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section className="hero-video-section" ref={sectionRef}>
      <div className="hero-video-media" ref={mediaRef}>
        {heroVideo ? (
          <video
            className="hero-video"
            autoPlay
            muted
            loop
            playsInline
            poster={config.images.heroPhoto}
          >
            <source src={heroVideo} type="video/mp4" />
          </video>
        ) : (
          <div
            className="hero-video-poster"
            style={{ backgroundImage: `url(${config.images.heroPhoto})` }}
            role="img"
            aria-label={hero.photoAlt}
          />
        )}
      </div>
      <div className="hero-video-overlay" aria-hidden="true" />
      <div className="hero-video-inner">
        <div className="hero-video-content">
          <p className="hero-subtitle">{hero.subtitle}</p>
          <h1 className="hero-title">
            <span>{hero.titleLine1}</span>
            <span>{hero.titleLine2}</span>
          </h1>
          <p className="hero-desc">{hero.description}</p>
          <div className="hero-actions">
            <Link href="/drops" className="btn-primary">
              {hero.shopAll}
            </Link>
            <button type="button" className="btn-secondary" onClick={openSellTrade}>
              {hero.sellTrade}
            </button>
            <Link href="/sell-trade" className="visually-hidden">
              {hero.sellTrade}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function TrustSection() {
  const { dict } = useI18n();
  const { stats } = dict;

  const items = [
    {
      title: stats.fastShippingTitle,
      desc: stats.fastShippingDesc,
    },
    {
      title: stats.competitivePricesTitle,
      desc: stats.competitivePricesDesc,
    },
    {
      title: stats.authenticityTitle,
      desc: stats.authenticityDesc,
    },
  ];

  return (
    <section className="stats-section">
      <div className="stats-container">
        {items.map((stat) => (
          <div key={stat.title} className="stat-card">
            <h3>{stat.title}</h3>
            <p>{stat.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function InstagramStrip() {
  const { config } = useStore();
  const { dict } = useI18n();
  return (
    <section className="horizontal-section">
      <div className="horizontal-header">
        <h2>@SOLOVYEV.STORE</h2>
      </div>
      <div className="horizontal-scroll-container">
        <div className="horizontal-track ig-track" id="js-ig-track">
          {config.images.instagramPosts.map((post, index) => (
            <a
              key={post}
              href={config.contacts.instagramUrl}
              className="ig-post"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src={post}
                alt={dict.common.instagramPost.replace("{n}", String(index + 1))}
                width={300}
                height={300}
                loading="lazy"
              />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
