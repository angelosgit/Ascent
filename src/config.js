/**
 * Tunables. Everything the client still owes us an answer on lives here so it
 * can be changed in one place — see OPEN-QUESTIONS.md.
 */

export const DURATIONS_MIN = [25, 45, 60];

/**
 * Confirmed by the client: 33 degrees, per the brief.
 *
 * Worth remembering that the artwork disagrees — the ridge in the PSD measures
 * 45.4 degrees. This constant drives the elevation maths only, never the
 * visuals, so nothing breaks; the picture is simply steeper than the number.
 */
export const SLOPE_ANGLE_DEG = 33;

const DEG = Math.PI / 180;
export const SLOPE_SIN = Math.sin(SLOPE_ANGLE_DEG * DEG);

/** One heave of the boulder. Scene.js and Sisyphus.js run on this beat. */
export const PUSH_PERIOD_MS = 2400;

/**
 * How far he shifts the boulder with each heave, measured along the slope.
 *
 * The client's brief for the pace was that the number should "seem somewhat
 * attached to the progress he is making", so the rate is not a free-floating
 * constant — it is derived from the animation. Two feet of ground per heave is
 * about what a person leaning into a boulder actually moves it, and at a 33
 * degree slope that is roughly thirteen inches of height each time he strains.
 *
 * Everything else falls out of this: one heave every 2.4 seconds gives 1500
 * heaves an hour, which is 0.31 MI of elevation. A 25 minute session lands on
 * 0.12900 MI — near enough the 0.12450 worked through in the brief, and now for
 * a reason the user can watch rather than a number picked to match.
 */
export const SLOPE_FEET_PER_HEAVE = 2;

const FEET_PER_MILE = 5280;
const HEAVES_PER_HOUR = 3600000 / PUSH_PERIOD_MS;

/** Vertical gain per hour of unbroken focus. Derived, never set by hand. */
export const ELEVATION_MI_PER_HOUR =
  (SLOPE_FEET_PER_HEAVE * SLOPE_SIN * HEAVES_PER_HOUR) / FEET_PER_MILE;

/** "The Toll" grace window — under this, Continue the Climb is still offered. */
export const GRACE_MS = 5000;

/**
 * HUD refresh rate. Deliberately not 60 — five decimals of a mile move far too
 * slowly to read faster than this, and re-rendering text every frame is the
 * single biggest battery cost in an app that runs for an hour.
 */
export const HUD_HZ = 10;

/**
 * Abandoning wipes lifetime elevation, not just the current session. This is
 * what gives "Pay to Exit" its teeth — the brief contrasts paying to "preserve
 * their current lifetime elevation" against forfeiting and starting "over from
 * scratch". Harsh enough to be worth confirming before launch.
 */
export const ABANDON_RESETS_LIFETIME = true;

/**
 * Confirmed by the client: one dollar, "for now".
 *
 * Display only. The real figure comes from the store at runtime once the
 * consumable IAP exists, because Apple and Google localise it — a German user
 * must be shown EUR, and hard-coding a dollar sign there fails review.
 */
export const EXIT_TOLL_PRICE = '$1.00';

/** The app is silent by design — confirmed by the client. No audio, no haptics. */
export const SILENT = true;

/** How many climbers the ranking page shows. */
export const LEADERBOARD_SIZE = 100;

/** Longest username we accept. Kept short so the ranking rows never wrap. */
export const USERNAME_MAX = 16;
export const USERNAME_MIN = 3;

/** Must match the OTP length configured in Supabase (Authentication → Email). */
export const OTP_LENGTH = 6;

/** Miles of *elevation* earned by `ms` of climbing. */
export function elevationForMs(ms) {
  return Math.max(0, ms) / 3600000 * ELEVATION_MI_PER_HOUR;
}

/**
 * The inverse of `elevationForMs`. Only used once, to migrate installs that
 * banked miles before total time became the stored figure — see storage.js.
 */
export function msForElevation(miles) {
  return Math.max(0, miles) / ELEVATION_MI_PER_HOUR * 3600000;
}

/** Miles travelled *along the slope* — elevation / sin(angle). */
export function slopeDistanceForMs(ms) {
  return elevationForMs(ms) / SLOPE_SIN;
}

export function formatMiles(miles) {
  return miles.toFixed(5);
}

/**
 * Total time climbed, for the ranking page. Hours are the unit that matters
 * there — "0h 45m" reads as an achievement in a way that "45:00" does not.
 */
export function formatTotal(ms) {
  const minutes = Math.floor(Math.max(0, ms) / 60000);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function formatClock(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
