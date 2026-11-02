export const MIN_AGE = 13;
export const ADULT_AGE = 18;

/**
 * Only the birth year is known, so age is approximate: someone born in `currentYear - 18`
 * may still be 17, so they are asked for guardian consent too (DPDP: under-18s need it).
 */
export const mayBeMinor = (birthYear: number, currentYear: number) => currentYear - birthYear <= ADULT_AGE;
