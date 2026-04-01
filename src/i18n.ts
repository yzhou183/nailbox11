/**
 * i18n.ts — Internationalization (i18n) module for Nail Box
 *
 * This file centralizes ALL user-facing text for the application.
 * It supports four languages: Chinese (zh), English (en), Spanish (es), and Vietnamese (vi).
 *
 * Architecture:
 *  - `Lang` is the union type of valid language codes.
 *  - `LANG_LABELS` maps each code to its display label shown in the language switcher UI.
 *  - Each language object (`zh`, `en`, `es`, `vi`) holds a flat key->string map covering
 *    every piece of UI copy: navigation, hero section, store info, services, booking form,
 *    validation errors, success messages, and footer.
 *  - The `zh` object is defined first and acts as the authoritative shape. All other
 *    language objects are typed as `typeof zh`, which means TypeScript enforces that every
 *    key present in Chinese must also be present in every other language — no missing keys.
 *  - `translations` is the lookup table used at runtime: translations[lang][key].
 *  - `TKey` is derived from `typeof zh` so that any call to `t(key)` is fully type-safe.
 */

/**
 * The set of supported language codes.
 *  - 'zh' -> Simplified Chinese (default)
 *  - 'en' -> English
 *  - 'es' -> Spanish
 *  - 'vi' -> Vietnamese
 */
export type Lang = 'zh' | 'en' | 'es' | 'vi'

/**
 * Human-readable labels for each language, shown in the language-switcher UI.
 * The `Record<Lang, string>` type guarantees every Lang code has a corresponding label.
 *
 * Note: Chinese uses its native script ('中文'), while the others use short abbreviations
 * familiar to their speakers (EN, ES, VN).
 */
export const LANG_LABELS: Record<Lang, string> = {
  zh: '中文', en: 'EN', es: 'ES', vi: 'VN',
}

/**
 * Chinese (Simplified) translation strings.
 *
 * This is the canonical/master language object. Its type (`typeof zh`) is inferred and
 * reused to type-check all other language objects. If a new key is added here, TypeScript
 * will immediately flag any other language object that is missing the same key.
 *
 * Keys are organized by feature area (prefixes explain which section they belong to):
 *  nav_*       -> Top navigation bar links
 *  hero_*      -> Hero / landing section
 *  store_*     -> "How to find us" / store info section
 *  addr_*      -> Address field labels
 *  wechat_*    -> WeChat contact info
 *  p1_/p2_/p3_ -> Step-by-step parking instructions (3 steps)
 *  svc_*       -> Services section headings and notes
 *  book_*      -> Booking form section headings
 *  f_*         -> Individual form field labels and placeholders
 *  basic_*, addon_* -> Service selection field labels
 *  notes_*     -> Notes/textarea placeholder
 *  submit*     -> Submit button text and status text
 *  checking/booked -> Time-slot availability states
 *  success_*   -> Post-submission success screen
 *  err_*       -> Validation and network error messages
 *  ft_*        -> Footer content
 */
const zh = {
  // --- Navigation Bar ---
  nav_services: '服务项目', nav_visit: '到店指南', nav_book: '立即预约',

  // --- Hero Section ---
  hero_tagline: 'Los Angeles · 精品美甲',
  hero_sub: '精品美甲 · 专业定制', hero_en: 'Premium Nail Art Studio',
  hero_wechat_label: '微信 / WeChat', hero_wechat_note: '预约咨询请添加微信',
  // CTA = Call-to-Action buttons; both Chinese and English text appear side-by-side in zh mode
  hero_cta_book: '立即预约 · Book Now', hero_cta_services: '查看服务 · Services',

  // --- Store / Visit Section ---
  store_eyebrow: 'How to Find Us', store_title: '到店指南',
  store_sub: 'Store Info & Parking', store_info: '店铺信息', store_parking: '停车说明',
  addr_label: '地址', wechat_label: '微信', wechat_note: '预约咨询请添加微信',

  // --- Parking Step 1: Stop at entrance ---
  p1_title: '停在正门口，打开双闪',
  p1_desc: '公寓正门在小巷子里面。请先将车停在正门口，打开双闪灯等候。',

  // --- Parking Step 2: Get a visitor pass ---
  p2_title: '进入大楼，向前台取停车证',
  p2_desc: '进门后找到前台，索取 Visitor Parking Pass（访客停车许可）。',

  // --- Parking Step 3: Park in the correct garage ---
  p3_title: '停入指定车库',
  p3_desc: '拿到停车证后开进巷子，停靠近巷子尽头的那个车库。',
  // Warning highlights the wrong garage to avoid; displayed in a highlighted style
  p3_warn: '请注意：不是靠近巷子口 Petco 旁边的车库。',

  // --- Services Section ---
  svc_eyebrow: 'Our Services', svc_title: '服务项目', svc_sub: 'Services & Pricing',
  // Each category gets a primary label (Chinese) and a secondary English sub-label
  svc_basic: '基础服务', svc_basic_en: '/ Basic Services',
  svc_addon: '增值服务', svc_addon_en: '/ Add-on Services',
  // Footnote explaining add-on pricing policy
  svc_note: '* 增值服务可与基础服务叠加，部分价格视实际情况而定',

  // --- Booking Form Section Headings ---
  book_eyebrow: 'Book Appointment', book_title: '立即预约',
  book_contact: '个人信息', book_contact_en: 'Contact Info',
  book_svc: '服务选择', book_svc_en: 'Service Selection',
  book_time: '预约时间', book_time_en: 'Appointment Time',
  book_notes: '备注', book_notes_en: 'Notes',

  // --- Booking Form Field Labels ---
  f_name: '姓名', f_email: '邮箱', f_email_en: 'Email',
  f_wechat: '微信号', f_wechat_en: 'WeChat',
  // Placeholder text appears inside the WeChat input when empty
  f_wechat_ph: '您的微信号（方便我们确认预约）',
  f_date: '日期', f_date_en: 'Date', f_time: '时间', f_time_en: 'Time',

  // --- Service Selection Labels within the Booking Form ---
  basic_req: '基础服务', basic_note: '（选择一项）',   // radio group — exactly one must be chosen
  addon_label: '增值服务', addon_note: '（可多选，选填）', // checkbox group — zero or more

  // --- Notes Textarea Placeholder ---
  notes_ph: '款式参考、特殊要求、或其他说明（选填）',

  // --- Submit Button States ---
  submit: '提交预约 · Book Now',  // default idle state
  submitting: '提交中…',          // while the API request is in-flight
  // Helper text below the submit button
  submit_note: '提交后确认邮件将发送至您的邮箱',

  // --- Time-Slot Availability Indicators ---
  checking: '查询中…', // shown while checking if a slot is already taken
  booked: '已预约',    // shown on time slots that are already booked

  // --- Success Screen (shown after a successful submission) ---
  success_title: '预约申请已提交', success_en: 'Booking Request Received',
  success_note: '确认邮件已发送至您的邮箱，我们会尽快为您确认预约',
  success_wechat: '如有急事请添加微信：', // prompt to contact via WeChat for urgent matters
  rebook: '重新预约', // button to reset the form and start a new booking

  // --- Validation Error Messages ---
  // These are shown inline next to the relevant form field when validation fails
  err_name: '请填写您的姓名',
  err_email: '请填写邮箱地址',
  err_email_inv: '请输入有效的邮箱地址', // triggered by regex check, not just empty
  err_date: '请选择预约日期',
  err_date_past: '请选择今天或之后的日期', // prevents selecting historical dates
  err_time: '请选择预约时间',
  err_service: '请选择一项基础服务',

  // --- API / Network Error Messages ---
  // Shown in a top-of-form error banner, not inline
  err_network: '网络错误，请检查连接后重试，或直接添加微信 nailbox11 预约',
  err_conflict: '该时间段已被预约，请重新选择时间', // HTTP 409 from the booking API
  err_fail: '提交失败，请稍后重试',               // catch-all for unexpected server errors

  // --- Footer ---
  // Multi-line tagline; the \n creates line breaks in the rendered output
  ft_desc: '专业美甲 · 精心服务\nPremium Nail Art Studio\nLos Angeles, California',
  ft_contact: '联系我们 / Contact', ft_wechat: '微信 WeChat：',
  ft_nav: '快速导航 / Navigation',
  ft_services: '服务项目', ft_visit: '到店指南', ft_book: '立即预约',
  ft_copy: '© 2025 Nail Box. All rights reserved.',
}

/**
 * English translation strings.
 *
 * Typed as `typeof zh` to ensure structural parity with the Chinese master object.
 * When the Chinese object adds or renames a key, TypeScript will surface a compile error
 * here until the English object is updated to match.
 *
 * Design note: For English, secondary "English sub-label" fields (e.g. `svc_basic_en`,
 * `book_contact_en`) are intentionally left as empty strings because the primary label
 * already renders in English — there is no need to repeat it.
 */
const en: typeof zh = {
  nav_services: 'Services', nav_visit: 'Visit', nav_book: 'Book Now',
  hero_tagline: 'Los Angeles · Premium Nail Studio',
  hero_sub: 'Premium Nail Art · Custom Design', hero_en: 'Premium Nail Art Studio',
  hero_wechat_label: 'WeChat', hero_wechat_note: 'Add WeChat to book an appointment',
  hero_cta_book: 'Book Now', hero_cta_services: 'View Services',
  store_eyebrow: 'How to Find Us', store_title: 'Visit Guide',
  store_sub: 'Store Info & Parking', store_info: 'Store Info', store_parking: 'Parking Guide',
  addr_label: 'Address', wechat_label: 'WeChat', wechat_note: 'Add WeChat to book',
  p1_title: 'Stop at the front entrance with hazard lights on',
  p1_desc: 'The apartment entrance is inside the alley. Park at the front entrance and turn on your hazard lights.',
  p2_title: 'Go inside and get a Visitor Parking Pass',
  p2_desc: 'Find the front desk and request a Visitor Parking Pass.',
  p3_title: 'Park in the designated garage',
  p3_desc: 'After getting the pass, drive into the alley and park in the garage near the end.',
  p3_warn: 'Note: Do NOT use the garage near Petco at the alley entrance.',
  svc_eyebrow: 'Our Services', svc_title: 'Services', svc_sub: 'Services & Pricing',
  svc_basic: 'Basic Services', svc_basic_en: '',   // empty — primary label is already English
  svc_addon: 'Add-on Services', svc_addon_en: '',
  svc_note: '* Add-ons can be combined with any basic service. Some prices may vary.',
  book_eyebrow: 'Book Appointment', book_title: 'Book Now',
  book_contact: 'Contact Info', book_contact_en: '',
  book_svc: 'Service Selection', book_svc_en: '',
  book_time: 'Appointment Time', book_time_en: '',
  book_notes: 'Notes', book_notes_en: '',
  f_name: 'Name', f_email: 'Email', f_email_en: '',
  f_wechat: 'WeChat', f_wechat_en: '',
  f_wechat_ph: 'Your WeChat ID (for booking confirmation)',
  f_date: 'Date', f_date_en: '', f_time: 'Time', f_time_en: '',
  basic_req: 'Basic Service', basic_note: '(choose one)',
  addon_label: 'Add-on Services', addon_note: '(optional, multiple)',
  notes_ph: 'Design references, special requests, or other notes (optional)',
  submit: 'Book Now', submitting: 'Submitting…',
  submit_note: 'A confirmation email will be sent after submission',
  checking: 'Checking…', booked: 'Booked',
  success_title: 'Booking Submitted', success_en: 'Booking Request Received',
  success_note: 'A confirmation email has been sent. We will confirm your booking shortly.',
  success_wechat: 'For urgent inquiries, add WeChat: ', rebook: 'Book Again',
  err_name: 'Please enter your name', err_email: 'Please enter your email',
  err_email_inv: 'Please enter a valid email', err_date: 'Please select a date',
  err_date_past: 'Please select today or a future date', err_time: 'Please select a time',
  err_service: 'Please select a service',
  err_network: 'Network error. Please try again or add WeChat nailbox11 to book.',
  err_conflict: 'This time slot is no longer available. Please choose another.',
  err_fail: 'Submission failed. Please try again.',
  ft_desc: 'Premium Nail Art · Personalized Service\nLos Angeles, California',
  ft_contact: 'Contact', ft_wechat: 'WeChat: ',
  ft_nav: 'Navigation',
  ft_services: 'Services', ft_visit: 'Visit', ft_book: 'Book Now',
  ft_copy: '© 2025 Nail Box. All rights reserved.',
}

/**
 * Spanish translation strings.
 *
 * Typed as `typeof zh` for the same structural-parity reason as `en`.
 * Targets Spanish-speaking clients in the Los Angeles area.
 */
const es: typeof zh = {
  nav_services: 'Servicios', nav_visit: 'Visitar', nav_book: 'Reservar',
  hero_tagline: 'Los Angeles · Estudio de Uñas',
  hero_sub: 'Arte en Uñas · Diseño Personalizado', hero_en: 'Premium Nail Art Studio',
  hero_wechat_label: 'WeChat', hero_wechat_note: 'Agréganos en WeChat para reservar',
  hero_cta_book: 'Reservar Ahora', hero_cta_services: 'Ver Servicios',
  store_eyebrow: 'Cómo Encontrarnos', store_title: 'Guía de Visita',
  store_sub: 'Información y Estacionamiento', store_info: 'Info de la Tienda', store_parking: 'Estacionamiento',
  addr_label: 'Dirección', wechat_label: 'WeChat', wechat_note: 'Agréganos en WeChat para reservar',
  p1_title: 'Detente en la entrada con luces de emergencia',
  p1_desc: 'La entrada del apartamento está en el callejón. Estaciona en la entrada y enciende las luces de emergencia.',
  p2_title: 'Entra y pide un pase de estacionamiento',
  p2_desc: 'Encuentra la recepción y solicita un Visitor Parking Pass.',
  p3_title: 'Estaciona en el garaje designado',
  p3_desc: 'Con el pase, entra al callejón y estaciona en el garaje al fondo.',
  p3_warn: 'Nota: NO uses el garaje cerca de Petco en la entrada del callejón.',
  svc_eyebrow: 'Nuestros Servicios', svc_title: 'Servicios', svc_sub: 'Servicios y Precios',
  svc_basic: 'Servicios Básicos', svc_basic_en: '',
  svc_addon: 'Servicios Adicionales', svc_addon_en: '',
  svc_note: '* Los servicios adicionales se pueden combinar. Algunos precios pueden variar.',
  book_eyebrow: 'Reservar Cita', book_title: 'Reservar',
  book_contact: 'Información de Contacto', book_contact_en: '',
  book_svc: 'Selección de Servicio', book_svc_en: '',
  book_time: 'Hora de la Cita', book_time_en: '',
  book_notes: 'Notas', book_notes_en: '',
  f_name: 'Nombre', f_email: 'Correo', f_email_en: '',
  f_wechat: 'WeChat', f_wechat_en: '',
  f_wechat_ph: 'Tu ID de WeChat (para confirmar la cita)',
  f_date: 'Fecha', f_date_en: '', f_time: 'Hora', f_time_en: '',
  basic_req: 'Servicio Básico', basic_note: '(elige uno)',
  addon_label: 'Servicios Adicionales', addon_note: '(opcional, múltiple)',
  notes_ph: 'Referencias de diseño, solicitudes especiales u otras notas (opcional)',
  submit: 'Reservar Ahora', submitting: 'Enviando…',
  submit_note: 'Se enviará un correo de confirmación después de enviar',
  checking: 'Verificando…', booked: 'Reservado',
  success_title: 'Reserva Enviada', success_en: 'Booking Request Received',
  success_note: 'Se ha enviado un correo de confirmación. Confirmaremos tu cita pronto.',
  success_wechat: 'Para consultas urgentes, agrega WeChat: ', rebook: 'Reservar de Nuevo',
  err_name: 'Por favor ingresa tu nombre', err_email: 'Por favor ingresa tu correo',
  err_email_inv: 'Por favor ingresa un correo válido', err_date: 'Por favor selecciona una fecha',
  err_date_past: 'Por favor selecciona hoy o una fecha futura', err_time: 'Por favor selecciona una hora',
  err_service: 'Por favor selecciona un servicio',
  err_network: 'Error de red. Intenta de nuevo o agrega WeChat nailbox11.',
  err_conflict: 'Este horario ya no está disponible. Por favor elige otro.',
  err_fail: 'Error al enviar. Por favor intenta de nuevo.',
  ft_desc: 'Arte en Uñas · Servicio Personalizado\nLos Angeles, California',
  ft_contact: 'Contacto', ft_wechat: 'WeChat: ',
  ft_nav: 'Navegación',
  ft_services: 'Servicios', ft_visit: 'Visitar', ft_book: 'Reservar',
  ft_copy: '© 2025 Nail Box. Todos los derechos reservados.',
}

/**
 * Vietnamese translation strings.
 *
 * Typed as `typeof zh` for structural-parity enforcement.
 * Targets Vietnamese-speaking clients — a significant community in the LA nail industry.
 */
const vi: typeof zh = {
  nav_services: 'Dịch Vụ', nav_visit: 'Ghé Thăm', nav_book: 'Đặt Lịch',
  hero_tagline: 'Los Angeles · Tiệm Nail Cao Cấp',
  hero_sub: 'Nghệ Thuật Nail · Thiết Kế Riêng', hero_en: 'Premium Nail Art Studio',
  hero_wechat_label: 'WeChat', hero_wechat_note: 'Thêm WeChat để đặt lịch hẹn',
  hero_cta_book: 'Đặt Lịch Ngay', hero_cta_services: 'Xem Dịch Vụ',
  store_eyebrow: 'Cách Tìm Chúng Tôi', store_title: 'Hướng Dẫn Ghé Thăm',
  store_sub: 'Thông Tin & Bãi Đỗ Xe', store_info: 'Thông Tin Cửa Hàng', store_parking: 'Hướng Dẫn Đỗ Xe',
  addr_label: 'Địa Chỉ', wechat_label: 'WeChat', wechat_note: 'Thêm WeChat để đặt lịch',
  p1_title: 'Dừng trước cửa chính, bật đèn khẩn cấp',
  p1_desc: 'Lối vào chung cư nằm trong hẻm. Hãy dừng xe trước cửa chính và bật đèn khẩn cấp.',
  p2_title: 'Vào tòa nhà, lấy thẻ đỗ xe khách',
  p2_desc: 'Tìm lễ tân và yêu cầu Visitor Parking Pass.',
  p3_title: 'Đỗ xe vào garage được chỉ định',
  p3_desc: 'Sau khi có thẻ, lái xe vào hẻm và đỗ vào garage gần cuối hẻm.',
  p3_warn: 'Lưu ý: KHÔNG dùng garage gần Petco ở đầu hẻm.',
  svc_eyebrow: 'Dịch Vụ Của Chúng Tôi', svc_title: 'Dịch Vụ', svc_sub: 'Dịch Vụ & Bảng Giá',
  svc_basic: 'Dịch Vụ Cơ Bản', svc_basic_en: '',
  svc_addon: 'Dịch Vụ Thêm', svc_addon_en: '',
  svc_note: '* Dịch vụ thêm có thể kết hợp với dịch vụ cơ bản. Một số giá có thể thay đổi.',
  book_eyebrow: 'Đặt Lịch Hẹn', book_title: 'Đặt Lịch',
  book_contact: 'Thông Tin Liên Hệ', book_contact_en: '',
  book_svc: 'Chọn Dịch Vụ', book_svc_en: '',
  book_time: 'Thời Gian Hẹn', book_time_en: '',
  book_notes: 'Ghi Chú', book_notes_en: '',
  f_name: 'Họ Tên', f_email: 'Email', f_email_en: '',
  f_wechat: 'WeChat', f_wechat_en: '',
  f_wechat_ph: 'ID WeChat của bạn (để xác nhận lịch hẹn)',
  f_date: 'Ngày', f_date_en: '', f_time: 'Giờ', f_time_en: '',
  basic_req: 'Dịch Vụ Cơ Bản', basic_note: '(chọn một)',
  addon_label: 'Dịch Vụ Thêm', addon_note: '(tùy chọn, nhiều lựa chọn)',
  notes_ph: 'Tham khảo mẫu, yêu cầu đặc biệt hoặc ghi chú khác (tùy chọn)',
  submit: 'Đặt Lịch Ngay', submitting: 'Đang gửi…',
  submit_note: 'Email xác nhận sẽ được gửi sau khi đặt',
  checking: 'Đang kiểm tra…', booked: 'Đã đặt',
  success_title: 'Đã Gửi Yêu Cầu Đặt Lịch', success_en: 'Booking Request Received',
  success_note: 'Email xác nhận đã được gửi. Chúng tôi sẽ xác nhận lịch hẹn sớm nhất.',
  success_wechat: 'Khẩn cấp vui lòng thêm WeChat: ', rebook: 'Đặt Lại',
  err_name: 'Vui lòng nhập họ tên', err_email: 'Vui lòng nhập email',
  err_email_inv: 'Email không hợp lệ', err_date: 'Vui lòng chọn ngày',
  err_date_past: 'Vui lòng chọn hôm nay hoặc ngày sau', err_time: 'Vui lòng chọn giờ',
  err_service: 'Vui lòng chọn dịch vụ',
  err_network: 'Lỗi mạng. Vui lòng thử lại hoặc thêm WeChat nailbox11.',
  err_conflict: 'Khung giờ này đã được đặt. Vui lòng chọn giờ khác.',
  err_fail: 'Gửi thất bại. Vui lòng thử lại.',
  ft_desc: 'Nghệ Thuật Nail · Dịch Vụ Tận Tâm\nLos Angeles, California',
  ft_contact: 'Liên Hệ', ft_wechat: 'WeChat: ',
  ft_nav: 'Điều Hướng',
  ft_services: 'Dịch Vụ', ft_visit: 'Ghé Thăm', ft_book: 'Đặt Lịch',
  ft_copy: '© 2025 Nail Box. Bảo lưu mọi quyền.',
}

/**
 * The master lookup table that maps a `Lang` code to its full translations object.
 *
 * Usage at runtime (via the `t()` helper in LangContext):
 *   translations[lang][key]   ->  the translated string for the current language
 *
 * The fallback logic in LangContext falls back to `translations.zh` if a key is somehow
 * missing in the current language (defensive; should never happen due to `typeof zh` typing).
 */
export const translations = { zh, en, es, vi }

/**
 * Union type of every valid translation key, derived directly from the shape of `zh`.
 *
 * Using `keyof typeof zh` means:
 *  - Adding a key to `zh` automatically expands `TKey`.
 *  - The `t(key: TKey)` function in LangContext is fully type-safe — callers cannot
 *    pass an arbitrary string, only a known key.
 */
export type TKey = keyof typeof zh
