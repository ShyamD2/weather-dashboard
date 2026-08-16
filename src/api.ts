import type {
  CurrentWeather,
  DailyWeather,
  GeoResult,
  HourlyWeather,
  UnitSystem,
  WeatherBundle,
} from "./types.js";

const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

export class WeatherApiError extends Error {}

/** Search for cities/places by free-text name. */
export async function searchLocations(query: string): Promise<GeoResult[]> {
  if (!query.trim()) return [];
  const url = new URL(GEOCODE_URL);
  url.searchParams.set("name", query);
  url.searchParams.set("count", "8");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const res = await fetch(url.toString());
  if (!res.ok) throw new WeatherApiError(`Geocoding request failed (${res.status})`);
  const data = await res.json();
  if (!data.results) return [];

  return data.results.map((r: any) => ({
    id: r.id,
    name: r.name,
    country: r.country,
    admin1: r.admin1,
    latitude: r.latitude,
    longitude: r.longitude,
    timezone: r.timezone,
  }));
}

/** Reverse geocode isn't provided by Open-Meteo's free geocoder, so for
 * geolocation we build a synthetic GeoResult and let the forecast call
 * resolve the timezone automatically. */
export function locationFromCoords(lat: number, lon: number): GeoResult {
  return {
    id: 0,
    name: "My Location",
    country: "",
    latitude: lat,
    longitude: lon,
    timezone: "auto",
  };
}

export async function fetchWeather(
  location: GeoResult,
  units: UnitSystem
): Promise<WeatherBundle> {
  const url = new URL(FORECAST_URL);
  url.searchParams.set("latitude", String(location.latitude));
  url.searchParams.set("longitude", String(location.longitude));
  url.searchParams.set("timezone", location.timezone || "auto");
  url.searchParams.set("temperature_unit", units.temperature);
  url.searchParams.set("wind_speed_unit", units.wind);
  url.searchParams.set(
    "current",
    [
      "temperature_2m",
      "apparent_temperature",
      "relative_humidity_2m",
      "wind_speed_10m",
      "wind_direction_10m",
      "surface_pressure",
      "uv_index",
      "precipitation",
      "weather_code",
      "is_day",
    ].join(",")
  );
  url.searchParams.set(
    "hourly",
    [
      "temperature_2m",
      "precipitation_probability",
      "weather_code",
      "apparent_temperature",
    ].join(",")
  );
  url.searchParams.set(
    "daily",
    [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_sum",
      "precipitation_probability_max",
      "sunrise",
      "sunset",
      "uv_index_max",
      "wind_speed_10m_max",
    ].join(",")
  );
  url.searchParams.set("forecast_days", "7");

  const res = await fetch(url.toString());
  if (!res.ok) throw new WeatherApiError(`Forecast request failed (${res.status})`);
  const data = await res.json();

  const current: CurrentWeather = {
    temperature: data.current.temperature_2m,
    apparentTemperature: data.current.apparent_temperature,
    humidity: data.current.relative_humidity_2m,
    windSpeed: data.current.wind_speed_10m,
    windDirection: data.current.wind_direction_10m,
    pressure: data.current.surface_pressure,
    uvIndex: data.current.uv_index ?? 0,
    precipitation: data.current.precipitation ?? 0,
    weatherCode: data.current.weather_code,
    isDay: data.current.is_day === 1,
    time: data.current.time,
  };

  const hourly: HourlyWeather = {
    time: data.hourly.time,
    temperature: data.hourly.temperature_2m,
    precipitationProbability: data.hourly.precipitation_probability,
    weatherCode: data.hourly.weather_code,
    apparentTemperature: data.hourly.apparent_temperature,
  };

  const daily: DailyWeather = {
    time: data.daily.time,
    weatherCode: data.daily.weather_code,
    tempMax: data.daily.temperature_2m_max,
    tempMin: data.daily.temperature_2m_min,
    precipitationSum: data.daily.precipitation_sum,
    precipitationProbabilityMax: data.daily.precipitation_probability_max,
    sunrise: data.daily.sunrise,
    sunset: data.daily.sunset,
    uvIndexMax: data.daily.uv_index_max,
    windSpeedMax: data.daily.wind_speed_10m_max,
  };

  const resolvedLocation: GeoResult = {
    ...location,
    timezone: data.timezone ?? location.timezone,
  };

  return { location: resolvedLocation, current, hourly, daily, units };
}
