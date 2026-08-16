import type { FavoriteCity, GeoResult, UnitSystem, WeatherBundle } from "./types.js";
import { getWeatherInfo, uvRiskLabel, windDirectionToCompass } from "./weatherCodes.js";

function tempUnitSuffix(units: UnitSystem): string {
  return units.temperature === "celsius" ? "°C" : "°F";
}

function windUnitSuffix(units: UnitSystem): string {
  return units.wind === "kmh" ? "km/h" : "mph";
}

function fmtTemp(value: number, units: UnitSystem): string {
  return `${Math.round(value)}${tempUnitSuffix(units)}`;
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function fmtDay(iso: string, index: number): string {
  if (index === 0) return "Today";
  const d = new Date(iso);
  return d.toLocaleDateString([], { weekday: "short" });
}

export function setBackgroundMood(gradient: string, isDay: boolean): void {
  document.body.dataset.mood = gradient;
  document.body.dataset.timeOfDay = isDay ? "day" : "night";
}

export function renderCurrent(bundle: WeatherBundle, el: HTMLElement): void {
  const { current, location, units } = bundle;
  const info = getWeatherInfo(current.weatherCode, current.isDay);
  setBackgroundMood(info.gradient, current.isDay);

  const placeLine = [location.name, location.admin1, location.country]
    .filter(Boolean)
    .join(", ");

  el.innerHTML = `
    <div class="current-top">
      <div>
        <h2 class="current-place">${placeLine}</h2>
        <p class="current-time">As of ${fmtTime(current.time)}</p>
      </div>
      <div class="current-icon">${info.icon}</div>
    </div>
    <div class="current-main">
      <span class="current-temp">${fmtTemp(current.temperature, units)}</span>
      <div class="current-desc">
        <span>${info.label}</span>
        <span class="feels-like">Feels like ${fmtTemp(current.apparentTemperature, units)}</span>
      </div>
    </div>
    <div class="current-stats">
      <div class="stat">
        <span class="stat-label">Humidity</span>
        <span class="stat-value">${Math.round(current.humidity)}%</span>
      </div>
      <div class="stat">
        <span class="stat-label">Wind</span>
        <span class="stat-value">${Math.round(current.windSpeed)} ${windUnitSuffix(units)} ${windDirectionToCompass(current.windDirection)}</span>
      </div>
      <div class="stat">
        <span class="stat-label">Pressure</span>
        <span class="stat-value">${Math.round(current.pressure)} hPa</span>
      </div>
      <div class="stat">
        <span class="stat-label">UV Index</span>
        <span class="stat-value">${current.uvIndex.toFixed(1)} · ${uvRiskLabel(current.uvIndex)}</span>
      </div>
      <div class="stat">
        <span class="stat-label">Precipitation</span>
        <span class="stat-value">${current.precipitation.toFixed(1)} mm</span>
      </div>
    </div>
  `;
}

export function renderDaily(bundle: WeatherBundle, el: HTMLElement): void {
  const { daily, units } = bundle;
  el.innerHTML = daily.time
    .map((t, i) => {
      const info = getWeatherInfo(daily.weatherCode[i], true);
      return `
        <div class="day-card">
          <span class="day-name">${fmtDay(t, i)}</span>
          <span class="day-icon">${info.icon}</span>
          <span class="day-precip">${daily.precipitationProbabilityMax[i]}%</span>
          <div class="day-temps">
            <span class="day-max">${fmtTemp(daily.tempMax[i], units)}</span>
            <span class="day-min">${fmtTemp(daily.tempMin[i], units)}</span>
          </div>
        </div>
      `;
    })
    .join("");
}

export function renderDailyDetails(bundle: WeatherBundle, el: HTMLElement): void {
  const { daily, units } = bundle;
  el.innerHTML = daily.time
    .map((t, i) => {
      const info = getWeatherInfo(daily.weatherCode[i], true);
      return `
        <details class="day-detail">
          <summary>
            <span>${fmtDay(t, i)}</span>
            <span>${info.icon} ${info.label}</span>
            <span>${fmtTemp(daily.tempMax[i], units)} / ${fmtTemp(daily.tempMin[i], units)}</span>
          </summary>
          <div class="day-detail-grid">
            <div><span class="stat-label">Sunrise</span><span class="stat-value">${fmtTime(daily.sunrise[i])}</span></div>
            <div><span class="stat-label">Sunset</span><span class="stat-value">${fmtTime(daily.sunset[i])}</span></div>
            <div><span class="stat-label">Max wind</span><span class="stat-value">${Math.round(daily.windSpeedMax[i])} ${windUnitSuffix(units)}</span></div>
            <div><span class="stat-label">UV max</span><span class="stat-value">${daily.uvIndexMax[i].toFixed(1)}</span></div>
            <div><span class="stat-label">Rain total</span><span class="stat-value">${daily.precipitationSum[i].toFixed(1)} mm</span></div>
            <div><span class="stat-label">Rain chance</span><span class="stat-value">${daily.precipitationProbabilityMax[i]}%</span></div>
          </div>
        </details>
      `;
    })
    .join("");
}

export function renderSearchResults(
  results: GeoResult[],
  el: HTMLElement,
  onSelect: (loc: GeoResult) => void
): void {
  if (results.length === 0) {
    el.innerHTML = `<div class="search-empty">No matches</div>`;
    el.classList.add("open");
    return;
  }
  el.innerHTML = "";
  results.forEach((r) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "search-result";
    const sub = [r.admin1, r.country].filter(Boolean).join(", ");
    item.innerHTML = `<span class="sr-name">${r.name}</span><span class="sr-sub">${sub}</span>`;
    item.addEventListener("click", () => onSelect(r));
    el.appendChild(item);
  });
  el.classList.add("open");
}

export function clearSearchResults(el: HTMLElement): void {
  el.innerHTML = "";
  el.classList.remove("open");
}

export function renderFavorites(
  favorites: FavoriteCity[],
  activeLocation: GeoResult | null,
  el: HTMLElement,
  onSelect: (fav: FavoriteCity) => void,
  onRemove: (fav: FavoriteCity) => void
): void {
  if (favorites.length === 0) {
    el.innerHTML = `<span class="no-favorites">No saved cities yet — use the ★ button to pin one.</span>`;
    return;
  }
  el.innerHTML = "";
  favorites.forEach((fav) => {
    const chip = document.createElement("div");
    const isActive =
      !!activeLocation &&
      Math.abs(activeLocation.latitude - fav.latitude) < 0.001 &&
      Math.abs(activeLocation.longitude - fav.longitude) < 0.001;
    chip.className = "favorite-chip" + (isActive ? " active" : "");

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "favorite-select";
    btn.textContent = fav.name;
    btn.addEventListener("click", () => onSelect(fav));

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "favorite-remove";
    removeBtn.textContent = "×";
    removeBtn.title = "Remove";
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      onRemove(fav);
    });

    chip.appendChild(btn);
    chip.appendChild(removeBtn);
    el.appendChild(chip);
  });
}

export function setStarState(starBtn: HTMLElement, active: boolean): void {
  starBtn.classList.toggle("active", active);
  starBtn.textContent = active ? "★" : "☆";
}

export function showError(el: HTMLElement, message: string): void {
  el.textContent = message;
  el.classList.add("visible");
}

export function hideError(el: HTMLElement): void {
  el.classList.remove("visible");
  el.textContent = "";
}

export function setLoading(loading: boolean, root: HTMLElement): void {
  root.classList.toggle("loading", loading);
}
