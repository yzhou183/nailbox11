/**
 * services.ts — Static service menu data for Nail Box
 *
 * This file is the single source of truth for every service the studio offers.
 * It is consumed by two parts of the app:
 *
 *  1. The Services section component — iterates over both arrays to render the
 *     bilingual price menu displayed to customers.
 *
 *  2. The BookingForm component — uses both arrays to populate the service-selection
 *     radio group (basic) and checkbox group (add-ons) in the appointment form.
 *
 * The data is intentionally kept static (plain arrays, no async fetching) because the
 * menu changes infrequently. If the menu needs dynamic management in the future, these
 * arrays can be replaced with an API call while preserving the same `Service` shape.
 *
 * See src/types.ts for the full `Service` interface definition.
 */

import type { Service } from '../types'

/**
 * Basic (core) nail services — the foundation of every appointment.
 *
 * Business rules:
 *   - A customer MUST choose exactly one basic service when booking.
 *   - The `durationMins` of the chosen basic service sets the appointment length used
 *     for conflict detection on the back end (add-on durations are not currently added).
 *   - All three services include the construction/preparation step, so no separate
 *     "prep" add-on is needed.
 *
 * Pricing tier: $70 – $100.
 */
export const basicServices: Service[] = [
  {
    id: 'basic-1',
    // Natural nails (no extensions) with a solid gel color — shortest and most affordable option
    name: '本甲单色（含建构）',
    nameEn: 'Natural Nail Solid Color',
    price: '$70',
    duration: '1 hr 15 min',
    durationMins: 75,   // 75 minutes blocks the calendar slot for conflict detection
    category: 'basic',
  },
  {
    id: 'basic-2',
    // Full nail extensions built from scratch with a solid gel color — longest service
    name: '延长单色（包含建构）',
    nameEn: 'Nail Extension Solid Color',
    price: '$100',
    duration: '1 hr 45 min',
    durationMins: 105,  // 105 minutes — longest basic service, used to block the calendar
    category: 'basic',
  },
  {
    id: 'basic-3',
    // Re-use existing extensions: fills the grown-out gap and refreshes the color;
    // less time than a full set but more than natural nails
    name: '延长二次利用',
    nameEn: 'Extension Refill',
    price: '$80',
    duration: '1 hr 30 min',
    durationMins: 90,   // 90 minutes
    category: 'basic',
  },
]

/**
 * Add-on (supplementary) services — optional enhancements to any basic service.
 *
 * Business rules:
 *   - A customer may select zero or more add-ons alongside their basic service.
 *   - Add-on durations are informational only; they are not currently summed into the
 *     total appointment block for conflict detection (this may change in the future).
 *   - Several add-ons use price ranges (e.g. '$3–10') because the exact cost depends
 *     on factors assessed at the appointment (severity, nail size, design complexity).
 *     These entries omit `durationMins` for the same reason.
 *
 * Categories of add-ons:
 *   Removal      — Gel or acrylic removal, differentiated by product type and whether
 *                  the previous service was done at Nail Box or another salon.
 *                  In-store removal is cheaper because the technician is familiar with
 *                  the product already applied.
 *   Nail art     — Ombre gradients; additional charge on top of a solid-color base.
 *   Repair       — Fix broken or damaged nails; price varies by severity.
 *   Embellishments — Crystals (single flat gems), crystal balls (3D spheres), and nail
 *                    charms; priced by piece complexity.
 *   Condition    — Bitten-nail surcharge: extra work required to build on severely
 *                  bitten nails; severity determines the upcharge.
 */
export const addonServices: Service[] = [
  // --- Removal: Gel (Oil Glue) ---
  // In-store removal is discounted because no guess-work about product compatibility
  { id: 'addon-1',  name: '本店卸甲油胶本甲',        nameEn: 'Gel Removal · Natural (In-Store)',    price: '$5',    duration: '15 min', category: 'addon' },
  { id: 'addon-2',  name: '本店卸甲油胶延长',        nameEn: 'Gel Removal · Extension (In-Store)',  price: '$10',   duration: '30 min', category: 'addon' },
  // Other-salon removal costs more because unknown products may take longer to remove
  { id: 'addon-3',  name: '非本店卸甲油胶本甲',      nameEn: 'Gel Removal · Natural (Other Salon)', price: '$10',   duration: '15 min', category: 'addon' },
  { id: 'addon-4',  name: '非本店卸甲油胶延长',      nameEn: 'Gel Removal · Extension (Other Salon)',price: '$20',  duration: '30 min', category: 'addon' },

  // --- Removal: Acrylic (Crystal / Hard Gel) ---
  // Acrylic removal is more involved than gel, hence higher prices
  { id: 'addon-5',  name: '卸水晶本甲',              nameEn: 'Acrylic Removal · Natural',           price: '$20',   duration: '30 min', category: 'addon' },
  { id: 'addon-6',  name: '卸水晶延长',              nameEn: 'Acrylic Removal · Extension',         price: '$30',   duration: '40 min', category: 'addon' },

  // --- Nail Art ---
  // Ombre / gradient fades one color into another; applied over the base solid color
  { id: 'addon-7',  name: '单色渐变',                nameEn: 'Ombre / Gradient',                    price: '$25',   duration: '15 min', category: 'addon' },

  // --- Repair & Maintenance ---
  // Price varies by how many nails need repair and the extent of the damage
  { id: 'addon-8',  name: '修补指甲',                nameEn: 'Nail Repair',                         price: '$3–10',                     category: 'addon' },

  // --- Embellishments ---
  // Single flat crystal; price scales with stone size and quality
  { id: 'addon-9',  name: '单钻',                    nameEn: 'Single Crystal',                      price: '$1–10',                     category: 'addon' },
  // 3D crystal ball attachment; more complex application than flat stones
  { id: 'addon-10', name: '钻球',                    nameEn: 'Crystal Ball',                        price: '$3–20',                     category: 'addon' },
  // Pre-made metal/resin charms glued to the nail surface
  { id: 'addon-11', name: '饰品',                    nameEn: 'Nail Charms',                         price: '$2–15',                     category: 'addon' },

  // --- Special Condition Surcharge ---
  // Severely bitten nails require extra prep work; the surcharge reflects that effort
  { id: 'addon-12', name: '啃咬甲（视严重程度加收）', nameEn: 'Bitten Nail Surcharge',               price: '$10–20',                    category: 'addon' },
]
