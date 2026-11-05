/**
 * ─────────────────────────────────────────────────────────────
 *  THE SQUARE LOUNGE — single source of truth for business data
 * ─────────────────────────────────────────────────────────────
 *  Edit anything here; components read from this file only.
 *  Values starting with "TODO:" are placeholders — replace them.
 *  (Placeholders are automatically left out of SEO structured data.)
 */

export type ConsoleType = "PS5" | "PS4";

export type Station = {
  id: number;
  name: string;
  console: ConsoleType;
  /** e.g. '55" 4K HDR' */
  screen: string;
  features: string[];
  /** Max players this station supports at once (shown on the website) */
  maxPlayers: number;
  /**
   * How many members staff can check in at once (counter app, not shown on the website).
   * Party games like WWE 2K can take 6–8 players; lower it if a station has fewer controllers.
   * Re-run `npm run db:seed` after changing.
   */
  maxCheckIns: number;
};

export type PricingTier = {
  id: string;
  name: string;
  /** Displayed price, e.g. "₹150" */
  price: string;
  /** Unit shown after the price, e.g. "/ hour" */
  unit: string;
  description: string;
  /** Per-hour price by number of players, shown instead of the single price when set. */
  rates?: { players: string; price: string }[];
  features: string[];
  highlighted?: boolean;
};

export type GameCategory = "Sports" | "Racing" | "Action" | "Fighting" | "Co-op";

export type Game = {
  /** Stable id: stored on play sessions and used for the clip file name. */
  id: string;
  title: string;
  category: GameCategory;
  consoles: ConsoleType[];
  players: string;
  /**
   * 10–20 second gameplay clip shown on a booked station's TV in the 3D lounge (muted, looping).
   * Record it on the lounge's own PS5 (Create button → save recent gameplay), trim it, and save it as
   * public/videos/games/<id>.mp4 (720p or smaller, under ~4 MB). Without a clip the TV shows the title.
   */
  clip?: string;
};

export type OpeningHours = {
  /** Display label, e.g. "Mon – Fri" */
  days: string;
  open: string; // "11:00" (24h, used for JSON-LD)
  close: string; // "23:00"
  /** schema.org day names this row covers */
  schemaDays: (
    | "Monday"
    | "Tuesday"
    | "Wednesday"
    | "Thursday"
    | "Friday"
    | "Saturday"
    | "Sunday"
  )[];
};

export type ExperienceIcon = "seat" | "screen" | "library" | "ambience";

export type ExperienceFeature = {
  title: string;
  description: string;
  icon: ExperienceIcon;
};

export type GalleryImage = {
  /** Path under /public, e.g. "/images/gallery/lounge-01.jpg" */
  src: string;
  alt: string;
  /** Intrinsic size in px, used for layout (keeps the masonry from jumping) */
  width: number;
  height: number;
  caption?: string;
};

export const isPlaceholder = (value: string | undefined | null): boolean =>
  !value || value.trim().toUpperCase().startsWith("TODO");

/**
 * Text for display on the page: strips a leading "TODO:" so placeholder copy reads
 * naturally while you review the design. In `npm run dev`, a corner badge lists
 * how many placeholders are left.
 */
export const display = (value: string): string => value.replace(/^\s*TODO:\s*/i, "");

export const site = {
  name: "The Square Lounge",
  shortName: "Square Lounge",
  tagline: "Malakpet's premium PlayStation lounge",
  description:
    "A premium PlayStation gaming lounge in Malakpet, Hyderabad. Five private stations — PS5 and PS4 — big screens, premium seating and a chill, after-dark ambience.",
  /** Production URL — used for canonical links, OG images and JSON-LD */
  url: "https://thesquarelounge.vercel.app", // TODO: replace with the real Netlify or custom domain
  locale: "en_IN",

  address: {
    street: "TODO: street address",
    locality: "Malakpet",
    city: "Hyderabad",
    region: "Telangana",
    postalCode: "TODO: postal code",
    country: "IN",
  },
  /** Google Maps → Share → Embed a map → copy the src="" URL */
  mapEmbedUrl:
    "https://www.google.com/maps?q=Malakpet,+Hyderabad,+Telangana&output=embed", // TODO: replace with exact venue embed URL
  /** Link for "Get directions" */
  mapLink: "https://maps.google.com/?q=Malakpet,+Hyderabad", // TODO: replace with exact venue link
  geo: {
    latitude: 17.3713, // TODO: exact venue latitude
    longitude: 78.5009, // TODO: exact venue longitude
  },

  contact: {
    /** Display format */
    phone: "+91 80082 65433",
    /** tel: format, digits with country code */
    phoneHref: "+918008265433",
    /** WhatsApp number — digits only, with country code, no + or spaces (e.g. 919876543210) */
    whatsapp: "TODO: 91XXXXXXXXXX",
    email: "TODO: hello@thesquarelounge.in",
  },

  socials: {
    instagram: "TODO: https://instagram.com/thesquarelounge",
    instagramHandle: "TODO: @thesquarelounge",
  },

  hours: [
    {
      days: "Every day",
      open: "11:00",
      close: "04:00", // closes after midnight, at 4 am the next morning
      schemaDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    },
  ] satisfies OpeningHours[], // Confirmed by the owner, 3 Nov 2026

  stations: [
    {
      id: 1,
      name: "Station 01",
      console: "PS5",
      screen: '55" screen',
      features: ["DualSense controllers", "Recliner seating", "Surround headset"],
      maxPlayers: 4,
      maxCheckIns: 8,
    },
    {
      id: 2,
      name: "Station 02",
      console: "PS5",
      screen: '65" screen',
      features: ["DualSense controllers", "Recliner seating", "Surround headset"],
      maxPlayers: 4,
      maxCheckIns: 8,
    },
    {
      id: 3,
      name: "Station 03",
      console: "PS5",
      screen: '55" screen',
      features: ["DualSense controllers", "Couch for 4", "Racing-ready setup"],
      maxPlayers: 4,
      maxCheckIns: 8,
    },
    {
      id: 4,
      name: "Station 04",
      console: "PS4",
      screen: "Standard screen",
      features: ["DualShock controllers", "Premium seating", "Huge back catalogue"],
      maxPlayers: 4,
      maxCheckIns: 8,
    },
    {
      id: 5,
      name: "Station 05",
      console: "PS4",
      screen: "Standard screen",
      features: ["DualShock controllers", "Premium seating", "Great for co-op"],
      maxPlayers: 4,
      maxCheckIns: 8,
    },
  ] satisfies Station[],

  // From the lounge's price list (Nov 2026). Prices are per hour.
  pricing: [
    {
      id: "ps4",
      name: "PS4",
      price: "₹60",
      unit: "/ hour",
      description: "Standard screen. Classic titles, comfy seats, zero fuss.",
      rates: [
        { players: "1 player", price: "₹60" },
        { players: "2 players", price: "₹80" },
      ],
      features: ["Stations 04 – 05", "Full game library"],
    },
    {
      id: "ps5-55",
      name: "PS5 · 55\" screen",
      price: "₹70",
      unit: "/ hour",
      description: "Next-gen visuals and the latest releases.",
      rates: [
        { players: "1 player", price: "₹70" },
        { players: "2 players", price: "₹120" },
      ],
      features: ["Stations 01 and 03", "Latest releases"],
    },
    {
      id: "ps5-65",
      name: "PS5 · 65\" screen",
      price: "₹80",
      unit: "/ hour",
      description: "Our biggest screen, for the full big-match feel.",
      rates: [
        { players: "1 player", price: "₹80" },
        { players: "2 players", price: "₹140" },
      ],
      features: ["Station 02", "Latest releases"],
      highlighted: true,
    },
    {
      id: "party",
      name: "Lounge Party",
      price: "On request",
      unit: "",
      description: "Take over the entire lounge — all 5 stations.",
      features: ["Birthdays & corporate", "Tournament setup", "Custom packages"],
    },
  ] satisfies PricingTier[],

  pricingNote:
    "Prices are per hour unless specified. Group, tournament and party bookings available — message us on WhatsApp for custom packages.",

  gameCategories: ["Sports", "Racing", "Action", "Fighting"] satisfies GameCategory[],

  // The lounge's library (Nov 2026). Check the consoles and player counts.
  games: [
    { id: "ea-fc-27", title: "EA SPORTS FC 27", category: "Sports", consoles: ["PS5"], players: "1–4" },
    { id: "ea-fc-26", title: "EA SPORTS FC 26", category: "Sports", consoles: ["PS5", "PS4"], players: "1–4" },
    { id: "ufc-5", title: "UFC 5", category: "Fighting", consoles: ["PS5"], players: "1–2" },
    { id: "mortal-kombat-1", title: "Mortal Kombat 1", category: "Fighting", consoles: ["PS5"], players: "1–2" },
    { id: "wwe-2k26", title: "WWE 2K26", category: "Fighting", consoles: ["PS5"], players: "1–4" },
    { id: "wwe-2k25", title: "WWE 2K25", category: "Fighting", consoles: ["PS5", "PS4"], players: "1–4" },
    { id: "gta-v", title: "Grand Theft Auto V", category: "Action", consoles: ["PS5", "PS4"], players: "1" },
    { id: "cod-black-ops-3", title: "Call of Duty: Black Ops III", category: "Action", consoles: ["PS5", "PS4"], players: "1–2" },
    { id: "asphalt-legends", title: "Asphalt Legends", category: "Racing", consoles: ["PS5", "PS4"], players: "1" },
  ] satisfies Game[],

  experience: [
    {
      title: "Premium seating",
      description: "Deep recliners and lounge couches built for marathon sessions, not quick rounds.",
      icon: "seat",
    },
    {
      title: "Big, sharp screens",
      description: "Every station has its own large display, with 4K HDR on the PS5 setups.",
      icon: "screen",
    },
    {
      title: "Latest titles",
      description: "A library that keeps up with the big releases, plus the couch classics everyone loves.",
      icon: "library",
    },
    {
      title: "After-dark ambience",
      description: "Low light, warm gold accents and a sound system that sets the mood. Stay as long as you like.",
      icon: "ambience",
    },
  ] satisfies ExperienceFeature[],

  /**
   * Gallery photos. Drop your images into /public/images/gallery and update this list
   * (any aspect ratio works; give the real pixel width and height).
   */
  gallery: [
    // TODO: replace placeholder artwork with real photos of the lounge
    { src: "/images/gallery/placeholder-01.svg", alt: "TODO: The lounge at night", width: 1200, height: 1500, caption: "The lounge" },
    { src: "/images/gallery/placeholder-02.svg", alt: "TODO: PS5 station with recliners", width: 1500, height: 1000, caption: "PS5 stations" },
    { src: "/images/gallery/placeholder-03.svg", alt: "TODO: Close-up of a controller on a table", width: 1200, height: 1200, caption: "Ready player" },
    { src: "/images/gallery/placeholder-04.svg", alt: "TODO: Friends playing a co-op game", width: 1500, height: 1125, caption: "Squad night" },
    { src: "/images/gallery/placeholder-05.svg", alt: "TODO: Gold square neon sign", width: 1200, height: 1600, caption: "The Square" },
    { src: "/images/gallery/placeholder-06.svg", alt: "TODO: PS4 station", width: 1500, height: 1000, caption: "PS4 stations" },
    { src: "/images/gallery/placeholder-07.svg", alt: "TODO: Tournament setup", width: 1200, height: 1500, caption: "Tournament setup" },
    { src: "/images/gallery/placeholder-08.svg", alt: "TODO: Lounge seating area", width: 1500, height: 1125, caption: "Chill zone" },
  ] satisfies GalleryImage[],

  booking: {
    /** Selectable session lengths in hours */
    durations: [1, 2, 3, 4],
    /** Time zone used for "today" and opening hours */
    timeZone: "Asia/Kolkata",
  },

  nav: [
    { label: "The Lounge", href: "/lounge" },
    { label: "Stations", href: "#stations" },
    { label: "Experience", href: "#experience" },
    { label: "Games", href: "#games" },
    { label: "Pricing", href: "#pricing" },
    { label: "Café", href: "#cafe" },
    { label: "Gallery", href: "#gallery" },
    { label: "Location", href: "#location" },
  ],
} as const;

export type Site = typeof site;
