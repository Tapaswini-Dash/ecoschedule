const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]
const ROUTER_URL = 'https://router.project-osrm.org/route/v1/driving'
const GEOCODER_URL = 'https://photon.komoot.io/api/'

async function fetchWithTimeout(url, options = {}, timeoutMs = 20000) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function findNearbyWasteSites({ latitude, longitude, radius = 5000 }) {
  const query = `
    [out:json][timeout:18];
    (
      nwr(around:${radius},${latitude},${longitude})["amenity"~"^(waste_disposal|recycling|waste_basket)$"];
      nwr(around:${radius},${latitude},${longitude})["amenity"="waste_transfer_station"];
      nwr(around:${radius},${latitude},${longitude})["recycling_type"="container"];
      nwr(around:${radius},${latitude},${longitude})["landuse"="landfill"];
    );
    out center tags;
  `
  let lastError
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: new URLSearchParams({ data: query }),
      })
      if (!response.ok) throw new Error(`OpenStreetMap search failed (${response.status}).`)
      const result = await response.json()
      return (result.elements || []).flatMap((element) => {
        const lat = element.lat ?? element.center?.lat
        const lon = element.lon ?? element.center?.lon
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return []
        const tags = element.tags || {}
        const category = tags.amenity || tags.landuse || 'waste_disposal'
        const fallbackName = {
          waste_basket: 'Waste bin',
          waste_disposal: 'Waste disposal point',
          recycling: 'Recycling point',
          waste_transfer_station: 'Waste transfer station',
          container: 'Recycling container',
          landfill: 'Landfill site',
        }[category] || 'Waste site'
        const address = [
          tags['addr:street'],
          tags['addr:suburb'],
          tags['addr:city'],
        ].filter(Boolean).join(', ')
        return [{
          id: `${element.type}-${element.id}`,
          name: tags.name || fallbackName,
          category: tags.recycling_type || category,
          latitude: lat,
          longitude: lon,
          address: address || 'Address not listed in OpenStreetMap',
          details: tags.opening_hours || tags.description || '',
          mapUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
        }]
      })
    } catch (error) {
      lastError = error
    }
  }
  if (lastError?.name === 'AbortError') {
    throw new Error('OpenStreetMap search timed out. Please try again in a moment.')
  }
  throw new Error(lastError?.message || 'Could not reach OpenStreetMap. Please try again.')
}

export function createIllustrativeWasteSites({ latitude, longitude }) {
  const locations = [
    { north: 0.006, east: 0.004, type: 'Public waste bin' },
    { north: -0.004, east: 0.009, type: 'Recycling point' },
    { north: 0.012, east: -0.008, type: 'Public waste bin' },
    { north: -0.01, east: -0.006, type: 'Community disposal point' },
    { north: 0.002, east: -0.016, type: 'Recycling point' },
  ]
  const longitudeScale = Math.max(Math.cos(latitude * Math.PI / 180), 0.2)

  return locations.map((offset, index) => ({
    id: `illustrative-${latitude.toFixed(4)}-${longitude.toFixed(4)}-${index + 1}`,
    name: `${offset.type} ${index + 1}`,
    category: offset.type.toLowerCase(),
    latitude: latitude + offset.north,
    longitude: longitude + offset.east / longitudeScale,
    address: 'Approximate location',
    details: '',
    mapUrl: null,
    isIllustrative: true,
  }))
}

export async function searchAddresses(query, bias) {
  const params = new URLSearchParams({ q: query, limit: '6', lang: 'en' })
  if (bias) {
    params.set('lat', String(bias.latitude))
    params.set('lon', String(bias.longitude))
  }
  let response
  try {
    response = await fetchWithTimeout(`${GEOCODER_URL}?${params}`, {}, 10000)
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('Address search timed out. Please try again.', { cause: error })
    throw new Error('Could not reach the address search service. Please try again.', { cause: error })
  }
  if (!response.ok) throw new Error(`Address search failed (${response.status}).`)
  const result = await response.json()
  return (result.features || []).flatMap((feature) => {
    const [longitude, latitude] = feature.geometry?.coordinates || []
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return []
    const properties = feature.properties || {}
    const label = [
      properties.name,
      properties.street,
      properties.housenumber,
      properties.district,
      properties.city,
      properties.state,
    ].filter(Boolean).join(', ')
    return [{ label: label || 'Unnamed location', latitude, longitude }]
  })
}

export async function getDrivingRoute(from, to) {
  const coordinates = `${from.longitude},${from.latitude};${to.longitude},${to.latitude}`
  let response
  try {
    response = await fetchWithTimeout(
      `${ROUTER_URL}/${coordinates}?overview=full&geometries=geojson&steps=true`,
      {},
      15000,
    )
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('Route calculation timed out. Please try again.', { cause: error })
    throw new Error('Could not reach the route service. Please try again.', { cause: error })
  }
  if (!response.ok) throw new Error(`Route service failed (${response.status}).`)
  const result = await response.json()
  const route = result.routes?.[0]
  if (!route) throw new Error('No driving route was found for this location.')
  return {
    path: route.geometry.coordinates.map(([lon, lat]) => [lat, lon]),
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    steps: route.legs.flatMap((leg) => leg.steps.map((step) => ({
      instruction: describeManeuver(step.maneuver, step.name),
      distanceMeters: step.distance,
      durationSeconds: step.duration,
    }))).filter((step) => step.distanceMeters > 0),
  }
}

function describeManeuver(maneuver, roadName) {
  const type = maneuver.type.replaceAll('_', ' ')
  const modifier = maneuver.modifier?.replaceAll('_', ' ')
  const action = {
    depart: 'Start',
    arrive: 'Arrive at your destination',
    turn: `Turn ${modifier || ''}`,
    'new name': 'Continue',
    continue: `Continue ${modifier || 'ahead'}`,
    merge: `Merge ${modifier || ''}`,
    ramp: `Take the ramp ${modifier || ''}`,
    fork: `At the fork, go ${modifier || ''}`,
    roundabout: 'Enter the roundabout',
    rotary: 'Enter the rotary',
    'exit roundabout': `Exit the roundabout${maneuver.exit ? ` at exit ${maneuver.exit}` : ''}`,
    'exit rotary': 'Exit the rotary',
    'end of road': `At the end of the road, turn ${modifier || ''}`,
    'uturn': 'Make a U-turn',
  }[type] || `Continue ${modifier || 'ahead'}`
  return roadName ? `${action} onto ${roadName}` : action
}
