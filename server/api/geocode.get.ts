interface NominatimResult {
  lat: string
  lon: string
  display_name: string
}

export default defineEventHandler(async (event) => {
  const { address } = getQuery(event) as { address?: string }

  if (!address || address.trim().length < 3) {
    return { lat: null, lng: null }
  }

  try {
    const results = await $fetch<NominatimResult[]>(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`,
      { headers: { 'User-Agent': 'SAM-Municipal/1.0 (sam.netdw.tech)' } }
    )

    const first = Array.isArray(results) ? results[0] : undefined
    if (!first) {
      return { lat: null, lng: null }
    }

    return {
      lat: parseFloat(first.lat),
      lng: parseFloat(first.lon),
      display_name: first.display_name
    }
  } catch {
    return { lat: null, lng: null }
  }
})
