/**
 * types.ts — Shared TypeScript type definitions for Nail Box
 *
 * This file centralizes domain types that are used across multiple parts of the app
 * (components, data files, API utilities). Keeping them here:
 *   - Avoids circular imports (no logic lives here, only type contracts).
 *   - Makes it easy to find and update the data model in one place.
 *   - Lets TypeScript enforce consistency between the service data, the booking form,
 *     and any API payloads that carry the same shapes.
 *
 * Types defined:
 *   ServiceCategory   — discriminator for which price list a service belongs to
 *   Service           — a single menu item with pricing and duration metadata
 *   BookingFormData   — the complete set of fields collected by the booking form
 *   FormErrors        — a partial map of field names -> validation error message strings
 */

/**
 * Discriminates between the two tiers of the service menu:
 *
 *  'basic' — Core nail services (e.g. gel manicure, extensions). Exactly one must be
 *            chosen when booking. These drive the appointment's base duration.
 *
 *  'addon' — Optional enhancements layered on top of a basic service (e.g. nail art,
 *            removal of previous product). Multiple may be selected or none at all.
 */
export type ServiceCategory = 'basic' | 'addon'

/**
 * Represents a single service offering on the Nail Box menu.
 *
 * Both a Chinese name (`name`) and an English name (`nameEn`) are stored so that the
 * Services component can render bilingual price cards regardless of the active language —
 * service names are always shown in both languages for clarity.
 *
 * @property id           - Stable unique identifier (e.g. 'basic-1', 'addon-7'). Used as
 *                          React list keys and as the value stored in BookingFormData to
 *                          identify which service the customer chose.
 * @property name         - Chinese display name for the service.
 * @property nameEn       - English display name for the service.
 * @property price        - Human-readable price string (e.g. '$70', '$3–10'). Range strings
 *                          are used for add-ons whose cost depends on complexity.
 * @property duration     - Optional human-readable duration string (e.g. '1 hr 15 min').
 *                          Displayed on the service card for customer reference.
 *                          Omitted for add-ons that do not have a fixed duration.
 * @property durationMins - Optional numeric duration in minutes. Used by the booking system
 *                          for conflict detection: an appointment occupies
 *                          [startTime, startTime + durationMins) and new bookings that
 *                          overlap this window are rejected. Omitted for variable-time add-ons.
 * @property category     - Whether this is a 'basic' or 'addon' service; controls which
 *                          section of the menu and booking form the service appears in.
 */
export interface Service {
  id: string
  name: string
  nameEn: string
  price: string
  duration?: string      // Display string, e.g. "1 hr 15 min" — shown on the price card
  durationMins?: number  // Numeric minutes — used for overlap/conflict detection in the API
  category: ServiceCategory
}

/**
 * All fields collected by the customer-facing booking form.
 *
 * This object is constructed progressively as the customer fills in each field,
 * and is submitted as the request body to the booking API endpoint.
 *
 * @property name          - Customer's full name.
 * @property email         - Customer's email address; used to send a confirmation email.
 * @property wechat        - Customer's WeChat ID (optional in practice but collected for
 *                           direct follow-up and appointment confirmation via WeChat).
 * @property date          - Chosen appointment date in 'YYYY-MM-DD' format (ISO 8601),
 *                           as returned by an <input type="date"> element.
 * @property time          - Chosen appointment start time in 'HH:MM' 24-hour format,
 *                           as returned by a time-slot picker.
 * @property basicService  - The `id` of the chosen basic service (exactly one required).
 *                           Stored as a string ID so the API can look up duration for
 *                           conflict detection without sending the full Service object.
 * @property addonServices - Array of `id` strings for any selected add-on services.
 *                           Empty array when no add-ons are chosen.
 * @property notes         - Free-text notes from the customer: design inspiration,
 *                           special requests, allergies, etc. Optional.
 */
export interface BookingFormData {
  name: string
  email: string
  wechat: string
  date: string
  time: string
  basicService: string
  addonServices: string[]
  notes: string
}

/**
 * A partial map of booking form field names to their current validation error messages.
 *
 * Only fields that have failed validation carry an entry; fields that are valid (or not
 * yet validated) are absent from this object. The `?` (optional) modifier on every
 * property makes this natural to build incrementally during form validation.
 *
 * Why a separate interface instead of inline in the form component?
 *   - It keeps the form component focused on rendering and event handling.
 *   - It makes the error shape reusable if a second booking form is ever added.
 *   - TypeScript can enforce that error keys only reference real form fields.
 *
 * @property name         - Error for the name field (e.g. 'Please enter your name').
 * @property email        - Error for the email field (empty or invalid format).
 * @property date         - Error for the date field (missing or in the past).
 * @property time         - Error for the time field (missing selection).
 * @property basicService - Error when no basic service has been selected.
 *
 * Note: `wechat` and `notes` are intentionally absent — they are optional fields and
 * never produce validation errors.
 */
export interface FormErrors {
  name?: string
  email?: string
  date?: string
  time?: string
  basicService?: string
}
