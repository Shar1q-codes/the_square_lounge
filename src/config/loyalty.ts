/**
 * Points rules. Changing these needs a redeploy and only affects sessions closed afterwards.
 * Points for a session = floor(min(minutes, maxMinutesPerSession) × pointsPerHour ÷ 60).
 */
export const loyalty = {
  pointsPerHour: { PS5: 10, PS4: 10 },
  /** Sessions longer than this (forgotten check-outs) earn no more. 720 = 12 hours. */
  maxMinutesPerSession: 720,
  /** Unused vouchers expire after this many days and the points are refunded. */
  voucherDays: 30,
} as const;
