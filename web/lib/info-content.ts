export interface InfoSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  table?: { head: string[]; rows: string[][] };
}

export interface InfoPage {
  title: string;
  eyebrow: string;
  intro: string;
  updated?: string;
  sections: InfoSection[];
  note?: string;
}

export const infoPages: Record<string, InfoPage> = {
  shipping: {
    title: "Shipping & delivery",
    eyebrow: "Help",
    intro:
      "We ship across India with trusted couriers. Most orders are packed within a day and delivered in 2–6 working days.",
    sections: [
      {
        heading: "Charges and timelines",
        paragraphs: [
          "Standard delivery is free on orders over ₹999. Below that, a flat ₹79 applies. Express delivery is available in select metros for ₹149.",
        ],
        table: {
          head: ["Method", "Timeline", "Cost"],
          rows: [
            ["Standard", "3–6 working days", "Free over ₹999, else ₹79"],
            ["Express", "1–2 working days", "₹149"],
            ["Remote PIN codes", "5–8 working days", "Standard rates"],
          ],
        },
      },
      {
        heading: "Where we deliver",
        paragraphs: [
          "We deliver to all serviceable PIN codes in India. Enter your PIN on any product page to see an estimate before you buy.",
          "We do not currently ship internationally. For bulk or corporate orders, write to help@shopsphere.in.",
        ],
      },
      {
        heading: "Tracking your order",
        paragraphs: [
          "Every dispatch triggers an email with the carrier and AWB number. You can also follow progress under Account → Orders, where the timeline updates as the parcel moves.",
        ],
      },
      {
        heading: "If something is delayed",
        paragraphs: [
          "Courier delays happen. If your order is more than 48 hours past its estimate, contact us with the order number and we will chase it with the carrier or arrange a replacement.",
        ],
      },
    ],
    note: "Orders placed before 2 pm on a working day are usually packed the same day.",
  },
  returns: {
    title: "Returns & exchanges",
    eyebrow: "Help",
    intro:
      "Changed your mind? You have 7 days from delivery to request a return or exchange on most items, provided they are unused and in original packaging.",
    sections: [
      {
        heading: "How to start a return",
        bullets: [
          "Open Account → Orders and choose the delivered order.",
          "Write to help@shopsphere.in with your order number and the item you'd like to return.",
          "We'll confirm eligibility and arrange a pickup within 48 hours.",
          "Keep the item packed with tags and any accessories until pickup.",
        ],
      },
      {
        heading: "What we can accept",
        bullets: [
          "Clothing and accessories that are unworn, unwashed and have tags attached.",
          "Homeware in its original packaging, unused and undamaged.",
          "Faulty or incorrect items — always eligible, whatever the timeline.",
        ],
      },
      {
        heading: "What we can't accept",
        bullets: [
          "Innerwear, earrings and pierced jewellery for hygiene reasons.",
          "Personalised or made-to-order pieces.",
          "Items returned without tags, packaging or free gifts.",
        ],
      },
      {
        heading: "Refunds",
        paragraphs: [
          "Once the pickup passes quality checks, refunds are issued to the original payment method within 3–5 working days. Shipping fees are refunded only when the return is due to a fault on our side.",
        ],
      },
    ],
    note: "Exchanges are subject to stock availability. We'll suggest alternatives if your size is gone.",
  },
  "size-guide": {
    title: "Size guide",
    eyebrow: "Help",
    intro:
      "Our clothing is cut for an easy, considered fit. Measure yourself over light clothing and compare with the charts below.",
    sections: [
      {
        heading: "Women's tops",
        table: {
          head: ["Size", "Bust (in)", "Waist (in)", "Hip (in)"],
          rows: [
            ["XS", "32–33", "25–26", "35–36"],
            ["S", "34–35", "27–28", "37–38"],
            ["M", "36–37", "29–30", "39–40"],
            ["L", "38–40", "31–33", "41–43"],
            ["XL", "41–43", "34–36", "44–46"],
          ],
        },
      },
      {
        heading: "Men's tops",
        table: {
          head: ["Size", "Chest (in)", "Waist (in)", "Shoulder (in)"],
          rows: [
            ["S", "36–38", "30–32", "17"],
            ["M", "39–40", "33–34", "18"],
            ["L", "41–42", "35–36", "19"],
            ["XL", "43–45", "37–39", "20"],
            ["XXL", "46–48", "40–42", "21"],
          ],
        },
      },
      {
        heading: "How to measure",
        bullets: [
          "Bust or chest: around the fullest part, keeping the tape level.",
          "Waist: around the narrowest part, usually just above the navel.",
          "Hip: around the fullest part, about 8 inches below the waist.",
          "Shoulder: from the edge of one shoulder to the other, across the back.",
        ],
      },
      {
        heading: "Between sizes?",
        paragraphs: [
          "Size up for a relaxed fit, or stay true to size for a closer cut. Product pages note when a piece runs small or oversized. Still unsure? Write to us with your measurements and we'll help.",
        ],
      },
    ],
  },
  contact: {
    title: "Contact us",
    eyebrow: "Help",
    intro:
      "Real people, ready to help with orders, sizing, returns and everything in between. We reply within one working day.",
    sections: [
      {
        heading: "Before you write",
        paragraphs: [
          "Have your order number handy — it starts with SS and appears in your confirmation email. For sizing questions, include your usual size and measurements.",
        ],
      },
      {
        heading: "Response times",
        bullets: [
          "Email: within 1 working day, Monday to Saturday.",
          "Phone: 10 am–6 pm IST, Monday to Friday.",
          "Returns pickups: confirmed within 48 hours of approval.",
        ],
      },
    ],
    note: "Our support team is closed on national holidays.",
  },
  faq: {
    title: "Frequently asked questions",
    eyebrow: "Help",
    intro: "The quick answers. If yours isn't here, our team is one email away.",
    sections: [
      {
        heading: "How long will my order take?",
        paragraphs: [
          "Standard delivery takes 3–6 working days; express takes 1–2 days in select cities. You'll see an estimate on every product page once you enter your PIN code.",
        ],
      },
      {
        heading: "Can I change my delivery address after ordering?",
        paragraphs: [
          "Yes, if the order hasn't shipped. Email us your order number and the new address. Once dispatched, the courier may be able to redirect the parcel — we'll help where we can.",
        ],
      },
      {
        heading: "Do you offer cash on delivery?",
        paragraphs: [
          "We currently accept UPI, cards, netbanking and wallets through our secure payment partner. COD isn't available at the moment.",
        ],
      },
      {
        heading: "How do I use a wishlist?",
        paragraphs: [
          "Tap the heart on any product. Sign in and your wishlist follows you across devices; without an account, it stays on this browser.",
        ],
      },
      {
        heading: "When can I review a product?",
        paragraphs: [
          "Reviews open once an order is marked delivered. This keeps feedback honest and tied to a real purchase. New reviews are published after a quick moderation check.",
        ],
      },
      {
        heading: "Are my payment details safe?",
        paragraphs: [
          "We never store card numbers. Payments are processed by a PCI-DSS compliant provider, and checkout runs over an encrypted connection.",
        ],
      },
    ],
  },
  about: {
    title: "Our story",
    eyebrow: "Company",
    intro:
      "ShopSphere began with a simple frustration: too much stuff, too little meaning. We wanted a store where every piece earns its place.",
    sections: [
      {
        heading: "Designed to be kept",
        paragraphs: [
          "We work with small workshops and family-run mills across India. Collections are deliberately small, released slowly, and built around fabrics that get better with wear.",
          "That means fewer seasons, fewer markdowns, and pieces you'll still reach for years from now.",
        ],
      },
      {
        heading: "How we choose",
        bullets: [
          "Natural fibres first — cotton, linen, wool and silk.",
          "Makers we've visited, with fair wages and safe conditions.",
          "Natural dyes and low-impact finishing wherever possible.",
          "Packaging that is plastic-free and recyclable.",
        ],
      },
      {
        heading: "The numbers we watch",
        paragraphs: [
          "We publish what we can measure: the number of maker partners, the share of natural fibres in each collection, and how much packaging we've removed. Progress, not perfection.",
        ],
      },
    ],
    note: "Have a maker or material we should know about? Write to hello@shopsphere.in.",
  },
  journal: {
    title: "The Journal",
    eyebrow: "Stories",
    intro:
      "Notes on makers, materials and the small rituals of everyday life. New stories, occasionally — never noise.",
    sections: [
      {
        heading: "Inside the indigo vat",
        paragraphs: [
          "A morning with the dyers in Bagru, where cloth is dipped, aired and dipped again until the blue settles. The process can't be rushed; the colour rewards patience.",
        ],
      },
      {
        heading: "Why we keep linen unblended",
        paragraphs: [
          "Pure linen creases. That's the point. It breathes, softens with every wash, and carries the memory of the day. A short guide to living with it.",
        ],
      },
      {
        heading: "Five things on our desk",
        paragraphs: [
          "A brass ruler, a block-printed swatch book, a very old pair of scissors, a cup that's seen better days, and a notebook of half-finished ideas. The tools behind the next collection.",
        ],
      },
    ],
    note: "Journal stories are published to the newsletter first. Subscribe in the footer.",
  },
  careers: {
    title: "Careers",
    eyebrow: "Company",
    intro:
      "We're a small, deliberate team in Bengaluru. If you care about craft, detail and doing fewer things well, we'd love to meet you.",
    sections: [
      {
        heading: "Open roles",
        bullets: [
          "Senior Product Designer — storefront & design system (full-time, Bengaluru / hybrid).",
          "Operations Associate — inventory and dispatch (full-time, Bengaluru).",
          "Content Lead — journal, campaigns and product stories (contract, remote-friendly).",
        ],
      },
      {
        heading: "How we work",
        paragraphs: [
          "Four days in the studio, one day remote. No growth-at-all-costs targets. We protect focus time, write things down, and ship in small, thoughtful releases.",
        ],
      },
      {
        heading: "How to apply",
        paragraphs: [
          "Send a short note, your portfolio or relevant work, and the role you're interested in to careers@shopsphere.in. We reply to every application.",
        ],
      },
    ],
    note: "We don't use take-home tests longer than two hours, and we pay for them.",
  },
  privacy: {
    title: "Privacy policy",
    eyebrow: "Legal",
    intro:
      "This policy explains what we collect, why we collect it, and the control you have over your information. Last updated 1 October 2026.",
    sections: [
      {
        heading: "What we collect",
        bullets: [
          "Account details you provide: name, email, phone, addresses.",
          "Order information: items, amounts, delivery address and status.",
          "Technical data: device type, browser and pages visited, in aggregate.",
          "Payment confirmations from our provider — never full card numbers.",
        ],
      },
      {
        heading: "How we use it",
        paragraphs: [
          "To fulfil orders, provide support, prevent fraud, and improve the store. With your consent, we send occasional newsletters. You can unsubscribe at any time.",
          "We do not sell personal information. We share only what is necessary with couriers, payment processors and analytics providers under contract.",
        ],
      },
      {
        heading: "Your choices",
        bullets: [
          "Access, correct or delete your account data by writing to privacy@shopsphere.in.",
          "Opt out of marketing from the link in any email.",
          "Disable non-essential cookies in your browser settings.",
        ],
      },
      {
        heading: "Retention and security",
        paragraphs: [
          "Order records are kept for seven years to meet tax requirements. Account data is kept while your account is active. We use encryption in transit, hashed passwords, and least-privilege access internally.",
        ],
      },
    ],
    note: "Questions about privacy? Email privacy@shopsphere.in and we'll respond within 30 days.",
  },
  terms: {
    title: "Terms of service",
    eyebrow: "Legal",
    intro:
      "These terms govern your use of shopsphere.in and any purchase you make. By using the store, you agree to them.",
    sections: [
      {
        heading: "Orders and pricing",
        paragraphs: [
          "All prices are in Indian Rupees and include applicable GST unless stated otherwise. We reserve the right to cancel an order if a product is mispriced or unavailable, and will refund any amount paid.",
        ],
      },
      {
        heading: "Accounts",
        bullets: [
          "Keep your password confidential and let us know about unauthorised use.",
          "Provide accurate delivery information — repeated failed deliveries may incur a fee.",
          "We may suspend accounts used for fraud, abuse or resale without authorisation.",
        ],
      },
      {
        heading: "Returns and liability",
        paragraphs: [
          "Returns are governed by our Returns & exchanges policy. To the extent permitted by law, our liability is limited to the value of the affected order. Nothing in these terms limits rights you have under Indian consumer law.",
        ],
      },
      {
        heading: "Governing law",
        paragraphs: [
          "These terms are governed by the laws of India. Disputes are subject to the exclusive jurisdiction of the courts of Bengaluru, Karnataka.",
        ],
      },
    ],
    note: "Last updated 1 October 2026. We'll email registered customers about material changes.",
  },
};

export const infoSlugs = Object.keys(infoPages);
