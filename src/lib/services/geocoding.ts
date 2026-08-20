/**
 * Geocoding & Reverse Geocoding Service
 * Integrates with OpenStreetMap Nominatim API for hyper-local address resolution.
 */

export interface ReverseGeocodeResult {
  displayName: string;
  address: {
    road?: string;
    suburb?: string;
    city?: string;
    town?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=16&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "LocalLoop-CommunityApp/1.0",
      },
    });

    if (!res.ok) throw new Error("Geocoding failed");
    const data: ReverseGeocodeResult = await res.json();

    const addr = data.address;
    const parts = [
      addr.road,
      addr.suburb || addr.town || addr.city,
      addr.county || addr.state,
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(", ") : data.displayName || `Near ${lat.toFixed(3)}, ${lon.toFixed(3)}`;
  } catch (err) {
    console.warn("[Geocoding] Fallback to coordinate string:", err);
    return `Near ${lat.toFixed(3)}°N, ${lon.toFixed(3)}°E`;
  }
}

export async function searchLocations(query: string): Promise<
  { displayName: string; lat: number; lon: number }[]
> {
  if (!query || query.trim().length < 2) return [];

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query
    )}&limit=5`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "LocalLoop-CommunityApp/1.0",
      },
    });

    if (!res.ok) return [];
    const data = await res.json();

    return data.map((item: any) => ({
      displayName: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
    }));
  } catch {
    return [];
  }
}
