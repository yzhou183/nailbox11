/**
 * @file services.ts
 * @description Service catalog and scheduling utilities shared by the API.
 *
 * This file is the single source of truth for:
 *  - Which base (basic) nail services are offered and how long each takes.
 *  - Which add-on services can be appended to a base service.
 *  - The set of bookable time slots during the business day.
 *  - A utility function that converts a time-slot string to minutes-since-midnight,
 *    which is used for overlap/conflict detection when checking availability.
 *
 * IMPORTANT: This file must be kept in sync with the frontend counterpart at
 * src/data/services.ts.  Any service added, removed, or renamed here must be
 * mirrored there (and vice versa) to prevent ID mismatches between the UI and
 * the server-side validation.
 */

// ---------------------------------------------------------------------------
// Type definitions
// ---------------------------------------------------------------------------

/**
 * A base nail service that occupies a defined block of the calendar.
 * The `durationMins` value drives the conflict-detection algorithm: when a
 * new booking is requested, the server checks whether the requested slot plus
 * this duration would overlap with any existing confirmed/pending booking.
 */
export interface BasicService {
  id:           string  // Stable identifier referenced by bookings in the DB (e.g. "basic-1")
  name:         string  // Human-readable display name shown in the UI and emails
  durationMins: number  // How many minutes the appointment occupies on the calendar
}

/**
 * An optional add-on service that a guest can bundle with their base service.
 * Add-ons do not carry a separate duration — they are assumed to fit within
 * the technician's working time for the appointment.
 */
export interface AddonService {
  id:   string  // Stable identifier used to look up the add-on (e.g. "addon-1")
  name: string  // Human-readable display name shown in the UI and emails
}

// ---------------------------------------------------------------------------
// Service catalog
// ---------------------------------------------------------------------------

/**
 * All available base nail services.
 *
 * Duration values are used in two places:
 *  1. Availability check (GET /api/bookings/availability) — to compute which
 *     future slots would be blocked by an existing booking.
 *  2. Booking creation (POST /api/bookings) — stored in `basic_service_duration`
 *     so historical records remain accurate even if prices/durations change later.
 *
 * Duration guide:
 *  basic-1 (本甲单色 + 建构):        75 minutes
 *  basic-2 (延长单色 + 建构):       105 minutes
 *  basic-3 (延长二次利用):            90 minutes
 */
export const BASIC_SERVICES: BasicService[] = [
  { id: 'basic-1', name: '本甲单色（含建构）',  durationMins: 75  },
  { id: 'basic-2', name: '延长单色（包含建构）', durationMins: 105 },
  { id: 'basic-3', name: '延长二次利用',         durationMins: 90  },
]

/**
 * All available add-on services that can be combined with any base service.
 *
 * Add-ons cover removal of previous nail products (from this salon or elsewhere),
 * decorative extras (gradient, gems, accessories), and repair work.
 * The "啃咬甲" (bitten nails) add-on notes that pricing may vary by severity —
 * the admin handles this manually during confirmation.
 */
export const ADDON_SERVICES: AddonService[] = [
  { id: 'addon-1',  name: '本店卸甲油胶本甲'          },  // Remove gel (base nails, this salon)
  { id: 'addon-2',  name: '本店卸甲油胶延长'          },  // Remove gel (extensions, this salon)
  { id: 'addon-3',  name: '非本店卸甲油胶本甲'        },  // Remove gel (base nails, other salon)
  { id: 'addon-4',  name: '非本店卸甲油胶延长'        },  // Remove gel (extensions, other salon)
  { id: 'addon-5',  name: '卸水晶本甲'                },  // Remove acrylic (base nails)
  { id: 'addon-6',  name: '卸水晶延长'                },  // Remove acrylic (extensions)
  { id: 'addon-7',  name: '单色渐变'                  },  // Single-color gradient
  { id: 'addon-8',  name: '修补指甲'                  },  // Nail repair
  { id: 'addon-9',  name: '单钻'                      },  // Single rhinestone
  { id: 'addon-10', name: '钻球'                      },  // Crystal ball decoration
  { id: 'addon-11', name: '饰品'                      },  // Nail accessories/charms
  { id: 'addon-12', name: '啃咬甲（视严重程度加收）'  },  // Bitten nails (surcharge applies)
]

// ---------------------------------------------------------------------------
// Time slots
// ---------------------------------------------------------------------------

/**
 * The ordered list of all bookable appointment start times for any given day.
 *
 * The studio operates roughly from 9:30 AM to 5:30 PM with 30-minute slot
 * granularity.  The last bookable start time (5:30 PM) allows a 75-minute
 * appointment to complete by 6:45 PM.
 *
 * These strings are stored verbatim in the database `time_slot` column and
 * are also parsed by `slotToMinutes` for overlap detection.
 */
export const TIME_SLOTS = [
  '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM',
  '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
  '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
]

// ---------------------------------------------------------------------------
// Scheduling utility
// ---------------------------------------------------------------------------

/**
 * Converts a 12-hour time-slot string into minutes elapsed since midnight.
 *
 * This numeric representation allows simple arithmetic comparison to detect
 * whether two appointments overlap:
 *
 *   Overlap exists when: existingStart < newEnd  AND  newStart < existingEnd
 *
 * Examples:
 *   slotToMinutes('9:30 AM')  -> 570   (9 * 60 + 30)
 *   slotToMinutes('12:00 PM') -> 720   (12 * 60 + 0)
 *   slotToMinutes('1:30 PM')  -> 810   (13 * 60 + 30)
 *   slotToMinutes('12:00 AM') -> 0     (midnight edge case, unlikely in practice)
 *
 * @param slot - A time string in the format "H:MM AM" or "H:MM PM", matching
 *               one of the entries in TIME_SLOTS.
 * @returns The number of minutes since midnight (0–1439).
 */
export function slotToMinutes(slot: string): number {
  // Split "9:30 AM" -> ["9:30", "AM"]
  const [time, period] = slot.split(' ')

  // Split "9:30" -> [9, 30] as numbers
  const [h, m] = time.split(':').map(Number)

  let hours = h

  // Convert PM hours to 24-hour format, except 12 PM which stays as 12.
  if (period === 'PM' && hours !== 12) hours += 12

  // 12 AM (midnight) maps to 0, not 12 — handle the edge case explicitly.
  if (period === 'AM' && hours === 12) hours = 0

  return hours * 60 + m
}
