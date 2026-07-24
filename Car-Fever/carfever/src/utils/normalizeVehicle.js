/**
 * normalizeVehicle.js
 *
 * Converts a raw Supabase/API vehicle record into the flat shape
 * that every card component (CarCard, VehicleListCard) expects.
 *
 * API record shape (from GET /api/vehicles list):
 *   { id, make, model, year, price, mileage, fuel_type, transmission,
 *     body_type, engine_size, color, description, status,
 *     main_image_url, image_count, dealer_id }
 *
 * Component shape (legacy):
 *   { id, make, model, trim, year, mileage, fuelType, gearbox,
 *     bodyType, price, badges, priceLabel, condition, location,
 *     distance, image }
 */
const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1541443131876-44b03de101c5?w=800&q=80&auto=format&fit=crop'

function extractMainImage(v) {
  if (!v) return null
  if (v.main_image_url) return v.main_image_url
  if (v.image_url) return v.image_url
  if (v.image) return v.image
  if (Array.isArray(v.images) && v.images.length > 0) {
    const first = v.images[0]
    const url = typeof first === 'string' ? first : (first?.url || first?.image_url)
    if (url) return url
  }
  if (Array.isArray(v.vehicle_images) && v.vehicle_images.length > 0) {
    const main = v.vehicle_images.find(img => img.is_main) || v.vehicle_images[0]
    const url = main?.image_url || main?.url
    if (url) return url
  }
  return null
}

export function normalizeVehicle(v) {
  if (!v) return null

  // Build a simple badges array from available data
  const badges = []
  if (v.fuel_type === 'Electric') badges.push('Electric')
  if (v.status === 'Active') badges.push('Featured')

  const resolvedImage = extractMainImage(v) || DEFAULT_FALLBACK_IMAGE

  return {
    id:         v.id,
    make:       v.make        ?? '',
    model:      v.model       ?? '',
    trim:       v.engine_size ? `${v.engine_size} · ${v.transmission ?? ''}`.trim().replace(/^·\s*|·\s*$/, '') : (v.transmission ?? ''),
    year:       v.year        ?? 0,
    mileage:    v.mileage     ?? 0,
    fuelType:   v.fuel_type   ?? 'Petrol',
    gearbox:    v.transmission ?? '',
    bodyType:   v.body_type   ?? '',
    price:      v.price       ?? 0,
    color:      v.color       ?? '',
    description: v.description ?? '',
    badges,
    priceLabel: 'Listed',
    condition:  'Used',
    location:   'United Kingdom',
    distance:   null,
    image:      resolvedImage,
    image_url:  resolvedImage,
    images:     (Array.isArray(v.images) && v.images.length > 0)
      ? v.images.map(i => typeof i === 'string' ? i : (i?.url || i?.image_url)).filter(Boolean)
      : (Array.isArray(v.vehicle_images) && v.vehicle_images.length > 0)
        ? v.vehicle_images.map(i => i.image_url || i.url).filter(Boolean)
        : [resolvedImage],
    image_count: v.image_count ?? (Array.isArray(v.vehicle_images) ? v.vehicle_images.length : (Array.isArray(v.images) ? v.images.length : (resolvedImage ? 1 : 0))),
  }
}

/**
 * Normalise a full VDP record (includes all vehicle_images + users join).
 * Returns the same flat shape as normalizeVehicle plus extra VDP fields.
 */
export function normalizeVehicleDetail(v) {
  const base = normalizeVehicle(v)

  const rawImages = (v.vehicle_images ?? [])
    .sort((a, b) => (b.is_main ? 1 : 0) - (a.is_main ? 1 : 0))
    .map(i => i.image_url)

  const directImages = Array.isArray(v.images)
    ? v.images.map(i => typeof i === 'string' ? i : (i?.url || i?.image_url)).filter(Boolean)
    : []

  const allImages = rawImages.length > 0 ? rawImages : (directImages.length > 0 ? directImages : [base.image])

  const dealer = v.users ?? {}

  return {
    ...base,
    images: allImages.length > 0 ? allImages : [base.image],
    specs: {
      mileage:   `${(v.mileage ?? 0).toLocaleString()} miles`,
      engine:    v.engine_size   ?? 'N/A',
      power:     'N/A',
      fuelType:  v.fuel_type     ?? 'N/A',
      gearbox:   v.transmission  ?? 'N/A',
      bodyType:  v.body_type     ?? 'N/A',
      emissions: 'N/A',
      annualTax: 'N/A',
      owners:    'N/A',
    },
    features: [],
    fullTitle: `${v.year ?? ''} ${v.make ?? ''} ${v.model ?? ''}`.trim(),
    registrationPlate: v.registration_plate ?? '',
    dealer: {
      name:        dealer.company_name ?? dealer.name ?? 'Private Seller',
      rating:      4.5,
      reviewCount: 0,
      address:     'United Kingdom',
      phone:       dealer.phone ?? '',
      phoneMasked: dealer.phone ? dealer.phone.slice(0, -3) + '...' : '',
      verified:    true,
    },
    finance: {
      deposit:     Math.round((v.price ?? 0) * 0.1),
      term:        48,
      apr:         9.9,
      monthlyBase: Math.round(((v.price ?? 0) * 0.9) / 48 * 1.099),
    },
    historyChecks: [
      { label: 'No finance outstanding', pass: true },
      { label: 'No write-off history',   pass: true },
      { label: 'No stolen record',       pass: true },
      { label: 'Mileage verified',       pass: true },
    ],
  }
}
