import type { GENDERS, REFERRAL_SOURCES } from "@/lib/validation/identity";

export const genderOptions: { value: (typeof GENDERS)[number]; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not", label: "Prefer not to say" },
];

export const referralOptions: { value: (typeof REFERRAL_SOURCES)[number]; label: string }[] = [
  { value: "instagram", label: "Instagram" },
  { value: "google", label: "Google / Maps" },
  { value: "friend", label: "A friend" },
  { value: "walk_in", label: "Walked past" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "other", label: "Other" },
];
