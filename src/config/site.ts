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
  /** Max players this station supports at once */
  maxPlayers: number;
};

export type PricingTier = {
  id: string;
  name: string;
  /** Displayed price, e.g. "₹150" */
  price: string;
  /** Unit shown after the price, e.g. "/ hour" */
  unit: string;
  description: string;
  features: string[];
  highlighted?: boolean;
};

export type GameCategory = "Sports" | "Racing" | "Action" | "Fighting" | "Co-op";

export type Game = {
  title: string;
  category: GameCategory;
  consoles: ConsoleType[];
  players: string;
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
  url: "https://thesquarelounge.vercel.app", // TODO: replace with real domain
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
    phone: "TODO: +91 XXXXX XXXXX",
    /** tel: format, digits with country code */
    phoneHref: "TODO: +91XXXXXXXXXX",
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
      days: "Mon – Fri",
      open: "11:00",
      close: "23:00",
      schemaDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    },
    {
      days: "Sat – Sun",
      open: "10:00",
      close: "00:00",
      schemaDays: ["Saturday", "Sunday"],
    },
  ] satisfies OpeningHours[], // TODO: confirm real opening hours

  stations: [
    {
      id: 1,
      name: "Station 01",
      console: "PS5",
      screen: 'TODO: 55" 4K HDR',
      features: ["DualSense controllers", "Recliner seating", "Surround headset"],
      maxPlayers: 4,
    },
    {
      id: 2,
      name: "Station 02",
      console: "PS5",
      screen: 'TODO: 55" 4K HDR',
      features: ["DualSense controllers", "Recliner seating", "Surround headset"],
      maxPlayers: 4,
    },
    {
      id: 3,
      name: "Station 03",
      console: "PS5",
      screen: 'TODO: 65" 4K HDR',
      features: ["DualSense controllers", "Couch for 4", "Racing-ready setup"],
      maxPlayers: 4,
    },
    {
      id: 4,
      name: "Station 04",
      console: "PS4",
      screen: 'TODO: 50" Full HD',
      features: ["DualShock controllers", "Premium seating", "Huge back catalogue"],
      maxPlayers: 4,
    },
    {
      id: 5,
      name: "Station 05",
      console: "PS4",
      screen: 'TODO: 50" Full HD',
      features: ["DualShock controllers", "Premium seating", "Great for co-op"],
      maxPlayers: 4,
    },
  ] satisfies Station[],

  pricing: [
    {
      id: "ps4-hourly",
      name: "PS4 Hour",
      price: "TODO: ₹100",
      unit: "/ hour",
      description: "Classic titles, comfy seats, zero fuss.",
      features: ["Stations 04 – 05", "Up to 4 players", "Full game library"],
    },
    {
      id: "ps5-hourly",
      name: "PS5 Hour",
      price: "TODO: ₹150",
      unit: "/ hour",
      description: "Next-gen visuals on our biggest screens.",
      features: ["Stations 01 – 03", "Up to 4 players", "Latest releases", "4K HDR"],
      highlighted: true,
    },
    {
      id: "squad-pack",
      name: "Squad Pack",
      price: "TODO: ₹499",
      unit: "/ 3 hours",
      description: "Lock in a PS5 station for the whole squad.",
      features: ["Any PS5 station", "Up to 4 players", "Complimentary drinks"],
    },
    {
      id: "party",
      name: "Lounge Party",
      price: "TODO: On request",
      unit: "",
      description: "Take over the entire lounge — all 5 stations.",
      features: ["Birthdays & corporate", "Tournament setup", "Custom packages"],
    },
  ] satisfies PricingTier[],

  pricingNote:
    "Group, tournament and party bookings available — message us on WhatsApp for custom packages.",

  gameCategories: ["Sports", "Racing", "Action", "Fighting", "Co-op"] satisfies GameCategory[],

  games: [
    // TODO: replace placeholder titles with your actual library
    { title: "TODO: Football Title", category: "Sports", consoles: ["PS5", "PS4"], players: "1–4" },
    { title: "TODO: Basketball Title", category: "Sports", consoles: ["PS5"], players: "1–4" },
    { title: "TODO: Cricket Title", category: "Sports", consoles: ["PS5", "PS4"], players: "1–2" },
    { title: "TODO: Racing Sim", category: "Racing", consoles: ["PS5"], players: "1–2" },
    { title: "TODO: Arcade Racer", category: "Racing", consoles: ["PS5", "PS4"], players: "1–4" },
    { title: "TODO: Open-World Action", category: "Action", consoles: ["PS5"], players: "1" },
    { title: "TODO: Superhero Adventure", category: "Action", consoles: ["PS5", "PS4"], players: "1" },
    { title: "TODO: Shooter", category: "Action", consoles: ["PS5", "PS4"], players: "1–2" },
    { title: "TODO: Arena Fighter", category: "Fighting", consoles: ["PS5", "PS4"], players: "1–2" },
    { title: "TODO: Classic Brawler", category: "Fighting", consoles: ["PS4"], players: "1–2" },
    { title: "TODO: Couch Co-op Party", category: "Co-op", consoles: ["PS5", "PS4"], players: "2–4" },
    { title: "TODO: Co-op Puzzle Adventure", category: "Co-op", consoles: ["PS5", "PS4"], players: "2" },
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
    { label: "Stations", href: "#stations" },
    { label: "Experience", href: "#experience" },
    { label: "Games", href: "#games" },
    { label: "Pricing", href: "#pricing" },
    { label: "Gallery", href: "#gallery" },
    { label: "Location", href: "#location" },
  ],
} as const;

export type Site = typeof site;
