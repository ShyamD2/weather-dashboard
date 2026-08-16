import type { FavoriteCity, GeoResult, UnitSystem, WeatherBundle } from "./types.js";
import { fetchWeather, locationFromCoords, searchLocations, WeatherApiError } from "./api.js";
import {
  isFavorite,
  loadFavorites,
  loadLastLocation,
  loadTheme,
  loadUnits,
  saveFavorites,
  saveLastLocation,
  saveTheme,
  saveUnits,
  toggleFavorite,
} from "./storage.js";
import {
  clearSearchResults,
  hideError,
  renderCurrent,
  renderDaily,
  renderDailyDetails,
  renderFavorites,
  renderSearchResults,
  setLoading,
  setStarState,
  showError,
} from "./ui.js";
import { renderHourlyCharts } from "./charts.js";

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let units: UnitSystem = loadUnits();
let favorites: FavoriteCity[] = loadFavorites();
let currentBundle: WeatherBundle | null = null;
let searchDebounce: number | undefined;

// ---------------------------------------------------------------------------
// DOM references
// ---------------------------------------------------------------------------

const app = document.getElementById("app") as HTMLElement;
const searchInput = document.getElementById("search-input") as HTMLInputElement;
const searchResults = document.getElementById("search-results") as HTMLElement;
const geoBtn = document.getElementById("geo-btn") as HTMLButtonElement;
const starBtn = document.getElementById("star-btn") as HTMLButtonElement;
const themeBtn = document.getElementById("theme-btn") as HTMLButtonElement;
const unitTempBtn = document.getElementById("unit-temp-btn") as HTMLButtonElement;
const unitWindBtn = document.getElementById("unit-wind-btn") as HTMLButtonElement;
const errorBanner = document.getElementById("error-banner") as HTMLElement;
const favoritesBar = document.getElementById("favorites-bar") as HTMLElement;
const currentCard = document.getElementById("current-card") as HTMLElement;
const dailyStrip = document.getElementById("daily-strip") as HTMLElement;
const dailyDetails = document.getElementById("daily-details") as HTMLElement;
const tempCanvas = document.getElementById("temp-chart") as HTMLCanvasElement;
const precipCanvas = document.getElementById("precip-chart") as HTMLCanvasElement;

// ---------------------------------------------------------------------------
// Core load flow
// ---------------------------------------------------------------------------

async function loadLocation(location: GeoResult): Promise<void> {
  hideError(errorBanner);
  setLoading(true, app);
  try {
    const bundle = await fetchWeather(location, units);
    currentBundle = bundle;
    saveLastLocation(bundle.location);

    renderCurrent(bundle, currentCard);
    renderDaily(bundle, dailyStrip);
    renderDailyDetails(bundle, dailyDetails);
    renderHourlyCharts(bundle.hourly, units, tempCanvas, precipCanvas);
    setStarState(starBtn, isFavorite(favorites, bundle.location));
    renderFavorites(favorites, bundle.location, favoritesBar, onFavoriteSelect, onFavoriteRemove);
  } catch (err) {
    const message =
      err instanceof WeatherApiError
        ? err.message
        : "Something went wrong fetching the weather. Check your connection and try again.";
    showError(errorBanner, message);
  } finally {
    setLoading(false, app);
  }
}

function onFavoriteSelect(fav: FavoriteCity): void {
  searchInput.value = "";
  clearSearchResults(searchResults);
  loadLocation(fav);
}

function onFavoriteRemove(fav: FavoriteCity): void {
  favorites = favorites.filter(
    (f) => !(Math.abs(f.latitude - fav.latitude) < 0.001 && Math.abs(f.longitude - fav.longitude) < 0.001)
  );
  saveFavorites(favorites);
  renderFavorites(
    favorites,
    currentBundle?.location ?? null,
    favoritesBar,
    onFavoriteSelect,
    onFavoriteRemove
  );
  if (currentBundle) setStarState(starBtn, isFavorite(favorites, currentBundle.location));
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

searchInput.addEventListener("input", () => {
  const q = searchInput.value.trim();
  window.clearTimeout(searchDebounce);
  if (!q) {
    clearSearchResults(searchResults);
    return;
  }
  searchDebounce = window.setTimeout(async () => {
    try {
      const results = await searchLocations(q);
      renderSearchResults(results, searchResults, (loc) => {
        searchInput.value = "";
        clearSearchResults(searchResults);
        loadLocation(loc);
      });
    } catch {
      renderSearchResults([], searchResults, () => {});
    }
  }, 350);
});

document.addEventListener("click", (e) => {
  if (!(e.target instanceof Node)) return;
  if (!searchResults.contains(e.target) && e.target !== searchInput) {
    clearSearchResults(searchResults);
  }
});

// ---------------------------------------------------------------------------
// Geolocation
// ---------------------------------------------------------------------------

geoBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    showError(errorBanner, "Geolocation isn't supported by this browser.");
    return;
  }
  geoBtn.disabled = true;
  geoBtn.textContent = "Locating…";
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      geoBtn.disabled = false;
      geoBtn.textContent = "📍 My location";
      loadLocation(locationFromCoords(pos.coords.latitude, pos.coords.longitude));
    },
    () => {
      geoBtn.disabled = false;
      geoBtn.textContent = "📍 My location";
      showError(errorBanner, "Couldn't get your location. Check browser permissions.");
    },
    { timeout: 10000 }
  );
});

// ---------------------------------------------------------------------------
// Favorite star toggle
// ---------------------------------------------------------------------------

starBtn.addEventListener("click", () => {
  if (!currentBundle) return;
  favorites = toggleFavorite(favorites, currentBundle.location);
  saveFavorites(favorites);
  setStarState(starBtn, isFavorite(favorites, currentBundle.location));
  renderFavorites(favorites, currentBundle.location, favoritesBar, onFavoriteSelect, onFavoriteRemove);
});

// ---------------------------------------------------------------------------
// Unit toggles
// ---------------------------------------------------------------------------

unitTempBtn.addEventListener("click", () => {
  units = { ...units, temperature: units.temperature === "celsius" ? "fahrenheit" : "celsius" };
  saveUnits(units);
  updateUnitButtons();
  if (currentBundle) loadLocation(currentBundle.location);
});

unitWindBtn.addEventListener("click", () => {
  units = { ...units, wind: units.wind === "kmh" ? "mph" : "kmh" };
  saveUnits(units);
  updateUnitButtons();
  if (currentBundle) loadLocation(currentBundle.location);
});

function updateUnitButtons(): void {
  unitTempBtn.textContent = units.temperature === "celsius" ? "°C" : "°F";
  unitWindBtn.textContent = units.wind === "kmh" ? "km/h" : "mph";
}

// ---------------------------------------------------------------------------
// Theme toggle
// ---------------------------------------------------------------------------

function applyTheme(theme: "dark" | "light"): void {
  document.documentElement.setAttribute("data-theme", theme);
  themeBtn.textContent = theme === "dark" ? "🌙" : "☀️";
}

themeBtn.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next);
  saveTheme(next);
});

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

function boot(): void {
  applyTheme(loadTheme() ?? "dark");
  updateUnitButtons();
  renderFavorites(favorites, null, favoritesBar, onFavoriteSelect, onFavoriteRemove);

  const last = loadLastLocation();
  if (last) {
    loadLocation(last);
    return;
  }
  if (favorites.length > 0) {
    loadLocation(favorites[0]);
    return;
  }
  // Default to a sensible starting city (Chennai — closest major city to Madurai/Coimbatore)
  loadLocation({
    id: 1264527,
    name: "Chennai",
    country: "India",
    admin1: "Tamil Nadu",
    latitude: 13.08268,
    longitude: 80.27072,
    timezone: "Asia/Kolkata",
  });
}

boot();
