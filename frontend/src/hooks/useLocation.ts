import { useState, useEffect, useCallback, useRef } from "react";

const STORAGE_KEY = "cfh_location";
const CITIES = [
  { name: "Mumbai", state: "Maharashtra", lat: 19.076, lng: 72.8777 },
  { name: "Delhi", state: "Delhi", lat: 28.6139, lng: 77.209 },
  { name: "Bangalore", state: "Karnataka", lat: 12.9716, lng: 77.5946 },
  { name: "Hyderabad", state: "Telangana", lat: 17.385, lng: 78.4867 },
  { name: "Chennai", state: "Tamil Nadu", lat: 13.0827, lng: 80.2707 },
  { name: "Kolkata", state: "West Bengal", lat: 22.5726, lng: 88.3639 },
  { name: "Pune", state: "Maharashtra", lat: 18.5204, lng: 73.8567 },
  { name: "Ahmedabad", state: "Gujarat", lat: 23.0225, lng: 72.5714 },
  { name: "Jaipur", state: "Rajasthan", lat: 26.9124, lng: 75.7873 },
  { name: "Coimbatore", state: "Tamil Nadu", lat: 11.0168, lng: 76.9558 },
  { name: "Kochi", state: "Kerala", lat: 9.9312, lng: 76.2673 },
  { name: "Thiruvananthapuram", state: "Kerala", lat: 8.5241, lng: 76.9366 },
  { name: "Bhopal", state: "Madhya Pradesh", lat: 23.2599, lng: 77.4126 },
  { name: "Patna", state: "Bihar", lat: 25.6093, lng: 85.1376 },
  { name: "Lucknow", state: "Uttar Pradesh", lat: 26.8467, lng: 80.9462 },
  { name: "Chandigarh", state: "Chandigarh", lat: 30.7333, lng: 76.7794 },
  { name: "Bhubaneswar", state: "Odisha", lat: 20.2961, lng: 85.8245 },
  { name: "Nagpur", state: "Maharashtra", lat: 21.1458, lng: 79.0882 },
  { name: "Visakhapatnam", state: "Andhra Pradesh", lat: 17.6868, lng: 83.2185 },
  { name: "Indore", state: "Madhya Pradesh", lat: 22.7196, lng: 75.8577 },
];

export type LocationStatus =
  | "loading"
  | "ready"
  | "permission_denied";

export interface LocationState {
  status: LocationStatus;
  lat: number;
  lng: number;
  city: string;
  state: string;
}

interface StoredLocation {
  lat: number;
  lng: number;
  city: string;
  state: string;
  timestamp: number;
}

function loadStored(): StoredLocation | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (Date.now() - data.timestamp > 7 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function storeLocation(lat: number, lng: number, city: string, state: string) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ lat, lng, city, state, timestamp: Date.now() }));
}

async function reverseGeocode(lat: number, lng: number): Promise<{ city: string; state: string }> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10`,
      { headers: { "User-Agent": "CollegeFestHub/1.0" } }
    );
    const data = await res.json();
    const addr = data.address || {};
    const city = addr.city || addr.town || addr.village || addr.county || "";
    const state = addr.state || "";
    return { city, state };
  } catch {
    return { city: "", state: "" };
  }
}

async function ipGeolocate(): Promise<{ lat: number; lng: number; city: string; state: string } | null> {
  try {
    const res = await fetch("https://ip-api.com/json/?fields=status,country,regionName,city,lat,lon", {
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    if (data.status === "success" && data.country === "India") {
      return { lat: data.lat, lng: data.lon, city: data.city || "", state: data.regionName || "" };
    }
    return null;
  } catch {
    return null;
  }
}

export function useLocation() {
  const [loc, setLoc] = useState<LocationState>({
    status: "loading",
    lat: 22.5,
    lng: 82.0,
    city: "",
    state: "",
  });

  const hasPreciseRef = useRef(false);
  const initializedRef = useRef(false);

  const flyTo = useCallback((lat: number, lng: number, city: string, stateName: string, persist = true) => {
    setLoc({ lat, lng, city, state: stateName, status: "ready" });
    if (persist) storeLocation(lat, lng, city, stateName);
    window.dispatchEvent(
      new CustomEvent("map-fly-sequence", { detail: { lat, lng, city, state: stateName } })
    );
  }, []);

  const tryPreciseLocation = useCallback(() => {
    if (!navigator.geolocation || hasPreciseRef.current) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        if (hasPreciseRef.current) return;
        hasPreciseRef.current = true;
        const { latitude: lat, longitude: lng } = position.coords;
        const { city, state: stateName } = await reverseGeocode(lat, lng);
        flyTo(lat, lng, city || loc.city, stateName || loc.state, true);
      },
      (error) => {
        if (error.code === GeolocationPositionError.PERMISSION_DENIED) {
          setLoc((prev) => ({ ...prev, status: "permission_denied" }));
        }
        // Timeout or unavailable — keep current location
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  }, [flyTo, loc.city, loc.state]);

  const chooseCity = useCallback(
    (city: { name: string; state: string; lat: number; lng: number }) => {
      hasPreciseRef.current = true;
      flyTo(city.lat, city.lng, city.name, city.state);
    },
    [flyTo]
  );

  const requestLocation = useCallback(() => {
    hasPreciseRef.current = false;
    setLoc((prev) => ({ ...prev, status: "loading" }));
    tryPreciseLocation();
  }, [tryPreciseLocation]);

  const locateMe = useCallback(() => {
    if (!navigator.geolocation) return;
    setLoc((prev) => ({ ...prev, status: "loading" }));
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        const { city, state: stateName } = await reverseGeocode(lat, lng);
        flyTo(lat, lng, city || "", stateName || "", true);
      },
      (error) => {
        if (error.code === GeolocationPositionError.PERMISSION_DENIED) {
          setLoc((prev) => ({ ...prev, status: "permission_denied" }));
        } else {
          setLoc((prev) => ({ ...prev, status: "ready" }));
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [flyTo]);

  // Initialize: always ask browser geolocation first, stored only as fallback
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Always try browser geolocation first — this triggers the permission prompt
    if (navigator.geolocation) {
      setLoc((prev) => ({ ...prev, status: "loading" }));
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          hasPreciseRef.current = true;
          const { latitude: lat, longitude: lng } = position.coords;
          const { city, state: stateName } = await reverseGeocode(lat, lng);
          flyTo(lat, lng, city || "", stateName || "", true);
        },
        (error) => {
          if (error.code === GeolocationPositionError.PERMISSION_DENIED) {
            // Previously denied — show permission_denied so UI can prompt user
            setLoc((prev) => ({ ...prev, status: "permission_denied" }));
          } else {
            // Timeout or unavailable — fall back to IP
            ipGeolocate().then((ipLoc) => {
              if (ipLoc) {
                flyTo(ipLoc.lat, ipLoc.lng, ipLoc.city, ipLoc.state, false);
              } else {
                setLoc((prev) => ({ ...prev, status: "ready" }));
              }
            });
          }
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 0 }
      );
    } else {
      // No geolocation support — try stored, then IP
      const stored = loadStored();
      if (stored) {
        flyTo(stored.lat, stored.lng, stored.city, stored.state, true);
      } else {
        ipGeolocate().then((ipLoc) => {
          if (ipLoc) {
            flyTo(ipLoc.lat, ipLoc.lng, ipLoc.city, ipLoc.state, false);
          } else {
            setLoc((prev) => ({ ...prev, status: "ready" }));
          }
        });
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    ...loc,
    flyToCity: flyTo,
    chooseCity,
    selectCityManually: chooseCity,
    continueWithout: () => setLoc((prev) => ({ ...prev, status: "ready" })),
    locateMe,
    requestLocation,
    cities: CITIES,
  };
}
