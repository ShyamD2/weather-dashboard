// ---------------------------------------------------------------------------
// WMO Weather interpretation codes (used by Open-Meteo)
// https://open-meteo.com/en/docs
// ---------------------------------------------------------------------------

export interface WeatherCodeInfo {
  label: string;
  icon: string; // emoji, kept dependency-free
  gradient: string; // CSS gradient class name for the background
}

const DAY_CODES: Record<number, WeatherCodeInfo> = {
  0: { label: "Clear sky", icon: "☀️", gradient: "clear" },
  1: { label: "Mainly clear", icon: "🌤️", gradient: "clear" },
  2: { label: "Partly cloudy", icon: "⛅", gradient: "cloudy" },
  3: { label: "Overcast", icon: "☁️", gradient: "overcast" },
  45: { label: "Fog", icon: "🌫️", gradient: "fog" },
  48: { label: "Depositing rime fog", icon: "🌫️", gradient: "fog" },
  51: { label: "Light drizzle", icon: "🌦️", gradient: "rain" },
  53: { label: "Moderate drizzle", icon: "🌦️", gradient: "rain" },
  55: { label: "Dense drizzle", icon: "🌧️", gradient: "rain" },
  56: { label: "Light freezing drizzle", icon: "🌧️", gradient: "rain" },
  57: { label: "Dense freezing drizzle", icon: "🌧️", gradient: "rain" },
  61: { label: "Slight rain", icon: "🌦️", gradient: "rain" },
  63: { label: "Moderate rain", icon: "🌧️", gradient: "rain" },
  65: { label: "Heavy rain", icon: "🌧️", gradient: "storm" },
  66: { label: "Light freezing rain", icon: "🌧️", gradient: "rain" },
  67: { label: "Heavy freezing rain", icon: "🌨️", gradient: "storm" },
  71: { label: "Slight snow fall", icon: "🌨️", gradient: "snow" },
  73: { label: "Moderate snow fall", icon: "❄️", gradient: "snow" },
  75: { label: "Heavy snow fall", icon: "❄️", gradient: "snow" },
  77: { label: "Snow grains", icon: "❄️", gradient: "snow" },
  80: { label: "Slight rain showers", icon: "🌦️", gradient: "rain" },
  81: { label: "Moderate rain showers", icon: "🌧️", gradient: "rain" },
  82: { label: "Violent rain showers", icon: "⛈️", gradient: "storm" },
  85: { label: "Slight snow showers", icon: "🌨️", gradient: "snow" },
  86: { label: "Heavy snow showers", icon: "❄️", gradient: "snow" },
  95: { label: "Thunderstorm", icon: "⛈️", gradient: "storm" },
  96: { label: "Thunderstorm, slight hail", icon: "⛈️", gradient: "storm" },
  99: { label: "Thunderstorm, heavy hail", icon: "⛈️", gradient: "storm" },
};

const NIGHT_ICON_OVERRIDES: Record<number, string> = {
  0: "🌙",
  1: "🌙",
  2: "☁️",
};

export function getWeatherInfo(code: number, isDay: boolean): WeatherCodeInfo {
  const info = DAY_CODES[code] ?? { label: "Unknown", icon: "❓", gradient: "cloudy" };
  if (!isDay && NIGHT_ICON_OVERRIDES[code]) {
    return { ...info, icon: NIGHT_ICON_OVERRIDES[code] };
  }
  return info;
}

export function windDirectionToCompass(deg: number): string {
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
}

export function uvRiskLabel(uv: number): string {
  if (uv < 3) return "Low";
  if (uv < 6) return "Moderate";
  if (uv < 8) return "High";
  if (uv < 11) return "Very High";
  return "Extreme";
}
