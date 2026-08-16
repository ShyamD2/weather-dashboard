import type { FavoriteCity, GeoResult, UnitSystem } from "./types.js";

const FAVORITES_KEY = "weather-dashboard:favorites";
const UNITS_KEY = "weather-dashboard:units";
const LAST_LOCATION_KEY = "weather-dashboard:last-location";
const THEME_KEY = "weather-dashboard:theme";

export function loadFavorites(): FavoriteCity[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveFavorites(favorites: FavoriteCity[]): void {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

export function isFavorite(favorites: FavoriteCity[], location: GeoResult): boolean {
  return favorites.some(
    (f) =>
      Math.abs(f.latitude - location.latitude) < 0.001 &&
      Math.abs(f.longitude - location.longitude) < 0.001
  );
}

export function toggleFavorite(favorites: FavoriteCity[], location: GeoResult): FavoriteCity[] {
  if (isFavorite(favorites, location)) {
    return favorites.filter(
      (f) =>
        !(
          Math.abs(f.latitude - location.latitude) < 0.001 &&
          Math.abs(f.longitude - location.longitude) < 0.001
        )
    );
  }
  const next = [...favorites, { ...location }];
  return next;
}

export function loadUnits(): UnitSystem {
  try {
    const raw = localStorage.getItem(UNITS_KEY);
    return raw ? JSON.parse(raw) : { temperature: "celsius", wind: "kmh" };
  } catch {
    return { temperature: "celsius", wind: "kmh" };
  }
}

export function saveUnits(units: UnitSystem): void {
  localStorage.setItem(UNITS_KEY, JSON.stringify(units));
}

export function loadLastLocation(): GeoResult | null {
  try {
    const raw = localStorage.getItem(LAST_LOCATION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveLastLocation(location: GeoResult): void {
  localStorage.setItem(LAST_LOCATION_KEY, JSON.stringify(location));
}

export function loadTheme(): "dark" | "light" | null {
  const v = localStorage.getItem(THEME_KEY);
  return v === "dark" || v === "light" ? v : null;
}

export function saveTheme(theme: "dark" | "light"): void {
  localStorage.setItem(THEME_KEY, theme);
}
