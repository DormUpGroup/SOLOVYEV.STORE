import type { LegalBundle } from "./types";

export const en: LegalBundle = {
  backToStore: "← BACK TO STORE",
  privacy: {
    title: "Privacy Policy",
    lastUpdated: "Last updated: July 29, 2026",
    sections: [
      {
        id: "who",
        title: "Who we are",
        paragraphs: [
          "SOLOVYEV STORE (“we”, “us”) operates solovyev.store (the “Site”). We are a premium streetwear and sneakers consignment shop based in Haifa, Israel.",
          "For privacy questions, contact us on WhatsApp at {whatsapp} or Instagram {instagram}.",
        ],
      },
      {
        id: "data",
        title: "What data we collect",
        paragraphs: [
          "Account data: email address, password (hashed by our auth provider — we never store plaintext passwords), display name, and phone number if you provide one.",
          "Marketing preferences: whether you opted in to marketing emails, when that preference last changed, and an audit record of consent changes (granted or withdrawn, privacy-policy version, source, and language).",
          "Orders: cart contents, sizes, quantities, order amounts, order status, and the WhatsApp checkout link associated with your order.",
          "Favorites and cart: product identifiers, sizes, and quantities synced to your account when you are signed in.",
          "Technical data: authentication session cookies; for store administrators, a separate secure admin session cookie.",
          "Browser local storage: guest cart items, theme preference (dark/light), language preference, and whether you dismissed our storage notice.",
          "Analytics: if Google Analytics 4 is enabled on the Site, we collect usage data such as pages viewed, product views, add-to-cart, and checkout clicks. We also record limited first-party analytics events (event type and optional product id) on our servers; these events are not tied to your user id in our analytics table.",
          "Sell / Trade submissions: category, brand/model, size, condition, wanted price, and notes are sent via WhatsApp only and are not stored as a separate application record in our database.",
          "Messages you send us on WhatsApp or Instagram (including photos or delivery details) are processed on those platforms.",
          "We do not collect payment card details on the Site. Online card payments are not processed on this website.",
        ],
      },
      {
        id: "purposes",
        title: "Why we use your data",
        paragraphs: [
          "To provide the Site, your account, cart, favorites, and order history.",
          "To create and fulfil orders and to communicate about purchases, Sell / Trade, and support.",
          "To keep the Site secure and prevent abuse.",
          "To understand how the Site is used and to improve it.",
          "To operate the store: authorized administrators may access customer accounts and order records in the admin panel to provide support, fulfil orders, and review internal order analytics (order counts, status breakdowns, and order values).",
          "With your separate opt-in consent, to send marketing emails about news, drops, and offers, and to personalize those messages with your display name.",
          "To comply with applicable law.",
        ],
      },
      {
        id: "marketing",
        title: "Marketing emails",
        paragraphs: [
          "Marketing emails are optional. We send them only if you actively opt in (for example during registration or in your account settings). The checkbox is never pre-selected.",
          "If you opt in, we may use your email address and display name to send and personalize news, drops, and promotional offers.",
          "You can withdraw consent at any time in your account email preferences. Unsubscribing from marketing does not affect service messages such as password resets or communications needed to fulfil an order.",
          "We keep a record of when consent was given or withdrawn, which privacy-policy version applied, and where the choice was made, so we can demonstrate compliance.",
          "We do not currently use a third-party email marketing provider. If we add one later, we will update this Privacy Policy and name that processor before using it for marketing sends.",
        ],
      },
      {
        id: "processors",
        title: "Who we share data with",
        paragraphs: [
          "Supabase — database, authentication, file storage, and password-reset emails.",
          "Vercel — website hosting and content delivery.",
          "Google Analytics 4 — website analytics when configured.",
          "WhatsApp (Meta) — order and Sell / Trade conversations after you leave the Site.",
          "Instagram (Meta) — social media communication.",
          "OpenStreetMap / Google Maps — map display or location links on the About page.",
          "Courier or locker services (such as Boxit or Cheetah) — only when we share delivery details needed to ship your order.",
          "Authorized store administrators — access customer profiles and orders solely to operate the store as described above.",
          "We do not sell your personal data.",
        ],
      },
      {
        id: "cookies",
        title: "Cookies and local storage",
        paragraphs: [
          "Essential: Supabase authentication session cookies needed to keep you signed in. Administrators also use a secure admin session cookie.",
          "Functional (local storage): shopping cart for guests, theme, language, and storage-notice preference.",
          "Analytics: Google Analytics may set cookies or similar identifiers when GA is enabled. Our storage notice does not currently block analytics from loading; by continuing to use the Site you acknowledge this practice as described here.",
        ],
      },
      {
        id: "retention",
        title: "How long we keep data",
        paragraphs: [
          "Account and profile data: while your account remains active, and for a reasonable period after a deletion request so we can complete the request and meet legal duties.",
          "Orders: for as long as needed for fulfilment, accounting, disputes, and legal requirements.",
          "Marketing consent records: for as long as needed to demonstrate when consent was given or withdrawn and to honour opt-out preferences.",
          "Analytics: according to Google Analytics settings and our internal event retention practices.",
          "Messenger conversations: according to the platform rules and our ordinary business practice.",
        ],
      },
      {
        id: "security",
        title: "Security",
        paragraphs: [
          "Passwords are hashed by Supabase Auth. Admin access is separated from customer accounts. No method of transmission or storage on the internet is 100% secure; we take reasonable measures but cannot guarantee absolute security.",
        ],
      },
      {
        id: "rights",
        title: "Your rights",
        paragraphs: [
          "Depending on applicable law, you may request access to, correction of, or deletion of your personal data, and in some cases restriction of processing, objection, or data portability.",
          "You may withdraw marketing consent at any time in your account without affecting the lawfulness of processing before withdrawal.",
          "To make a request, message us on WhatsApp or Instagram and include the email address of your account. We will respond within a reasonable time.",
          "Deleting your account may remove access to order history in your account area; we may retain certain order records where required by law or for legitimate business purposes.",
        ],
      },
      {
        id: "children",
        title: "Children",
        paragraphs: [
          "The Site is not directed at children under 18. If you are under 18, use the Site only with the involvement of a parent or guardian.",
        ],
      },
      {
        id: "transfers",
        title: "International transfers",
        paragraphs: [
          "Service providers such as Supabase, Vercel, Google, and Meta may process data on servers outside Israel. By using the Site you understand that your information may be transferred internationally as needed to operate the service.",
        ],
      },
      {
        id: "changes",
        title: "Changes",
        paragraphs: [
          "We may update this Privacy Policy by posting a new version on this page with an updated date. Continued use of the Site after changes means you accept the revised policy to the extent permitted by law.",
        ],
      },
      {
        id: "contact",
        title: "Contact",
        paragraphs: [
          "Questions about this policy? WhatsApp {whatsapp} or Instagram {instagram}. Website: https://solovyev.store",
        ],
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    lastUpdated: "Last updated: July 29, 2026",
    sections: [
      {
        id: "general",
        title: "General",
        paragraphs: [
          "These Terms of Service (“Terms”) govern your use of solovyev.store (the “Site”) and purchases from SOLOVYEV STORE (“Store”, “we”, “us”), a premium streetwear and sneakers consignment shop in Haifa, Israel.",
          "Contact: WhatsApp {whatsapp}, Instagram {instagram}.",
          "By using the Site, creating an account, or placing an order, you confirm that you are at least 18 years old (or acting with a parent/guardian’s consent) and that you agree to these Terms and our Privacy Policy.",
        ],
      },
      {
        id: "products",
        title: "Products and authenticity",
        paragraphs: [
          "We sell sneakers, clothing, and accessories, including drops, brand-new / deadstock items, and made-to-order listings, and we offer Sell / Trade valuation.",
          "Prices are shown in Israeli shekels (ILS, ₪). Descriptions, photos, sizes, and availability statuses are informational; final availability is confirmed when we accept your order on WhatsApp.",
          "Authenticity: every item is checked (labels, stitching, materials, UV where applicable, and comparison with known authentic references). If we cannot verify an item at 100%, we do not list it. If an item is proven counterfeit, we will make it right (refund or equivalent remedy as agreed).",
        ],
      },
      {
        id: "account",
        title: "Accounts",
        paragraphs: [
          "You must register with an email and password to place an order through the Site. Authentication is provided by Supabase Auth.",
          "You must provide accurate information, keep your password confidential, and not share your account. We may suspend or delete accounts used for fraud, abuse, or breach of these Terms.",
          "Authorized store staff may access account and order information in the admin panel to operate the store, fulfil orders, and provide support.",
          "Optional marketing emails are sent only if you opt in. You may unsubscribe at any time in your account. Service emails (such as password resets) and order-related messages are not marketing.",
        ],
      },
      {
        id: "orders",
        title: "Cart and orders",
        paragraphs: [
          "Adding items to your cart does not reserve stock and does not create a purchase contract.",
          "Checkout creates an order record and opens WhatsApp with your order details. You must be signed in to check out.",
          "No card payments are processed on the Site. Payment method, reservation, and handover are agreed in WhatsApp or in person.",
          "A binding sale is formed only when we expressly confirm the order (for example, confirming status or clear acceptance in chat) and you agree payment and delivery terms.",
          "Items marked sold or reserved may no longer be available. In that case we may cancel the order. If you already paid, we will refund that payment.",
        ],
      },
      {
        id: "payment",
        title: "Payment",
        paragraphs: [
          "Payment options are communicated when we confirm your order (for example cash on meetup, bank transfer, or other methods we offer at that time).",
          "We do not store payment card details on the Site.",
        ],
      },
      {
        id: "shipping",
        title: "Shipping and pickup",
        paragraphs: [
          "We ship across Israel. Typical options: locker delivery (Boxit / Cheetah) about 2–4 business days for ₪25; door-to-door courier for ₪50; free shipping on orders of ₪1000 or more; free hand-to-hand pickup in Tel Aviv and Haifa by arrangement.",
          "Times are estimates. Risk of loss after handover to a courier or locker follows the carrier’s rules and our agreement with you.",
        ],
      },
      {
        id: "returns",
        title: "Returns and exchanges",
        paragraphs: [
          "As is standard in aftermarket streetwear consignment, all sales are final — no returns or exchanges — except where Israeli consumer law requires otherwise or where our authenticity guarantee applies.",
          "Please confirm sizing before you buy. Message us on WhatsApp if you need help with size.",
        ],
      },
      {
        id: "sell-trade",
        title: "Sell / Trade",
        paragraphs: [
          "Valuation requests submitted on the Site are sent to us via WhatsApp and are not stored as a separate application in our database.",
          "Quotes are estimates; final offers may change after we inspect the item. Options may include cash buyout or trade-in store credit (often higher).",
          "We aim to reply within about 2 hours during business hours (Sun–Thu 10:00–20:00, Fri until 14:00).",
          "We may decline any submission without giving a reason.",
        ],
      },
      {
        id: "ip",
        title: "Intellectual property",
        paragraphs: [
          "Site design, text, and the SOLOVYEV STORE brand materials are protected. Brand names and logos of third-party labels (Nike, Adidas, and others) belong to their owners; listing goods does not imply affiliation with those brands.",
          "You may not copy Site content without our permission.",
        ],
      },
      {
        id: "liability",
        title: "Limitation of liability",
        paragraphs: [
          "The Site is provided “as is”. We do not guarantee uninterrupted or error-free operation.",
          "To the fullest extent allowed by Israeli law, our liability related to any order is limited to the amount you paid for that order.",
          "We are not responsible for WhatsApp, Instagram, couriers, or internet outages beyond our reasonable control.",
        ],
      },
      {
        id: "prohibited",
        title: "Prohibited use",
        paragraphs: [
          "You may not hack the Site, scrape the catalog for commercial use without consent, place fraudulent orders, upload malware, or infringe others’ rights.",
        ],
      },
      {
        id: "changes-terms",
        title: "Changes to these Terms",
        paragraphs: [
          "We may update these Terms by posting a new version on the Site with a new date. Continued use after publication constitutes acceptance to the extent permitted by law.",
        ],
      },
      {
        id: "law",
        title: "Governing law",
        paragraphs: [
          "These Terms are governed by the laws of the State of Israel. Disputes shall be brought before competent courts in Israel, unless mandatory consumer-protection rules require otherwise.",
        ],
      },
      {
        id: "contact-terms",
        title: "Contact",
        paragraphs: [
          "WhatsApp {whatsapp} · Instagram {instagram} · https://solovyev.store",
        ],
      },
    ],
  },
};
