// ---------------------------------------------------------------------------
// Shared types for the Weather Dashboard
// ---------------------------------------------------------------------------

export interface GeoResult {
  id: number;
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface CurrentWeather {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  uvIndex: number;
  precipitation: number;
  weatherCode: number;
  isDay: boolean;
  time: string;
}

export interface HourlyWeather {
  time: string[];
  temperature: number[];
  precipitationProbability: number[];
  weatherCode: number[];
  apparentTemperature: number[];
}

export interface DailyWeather {
  time: string[];
  weatherCode: number[];
  tempMax: number[];
  tempMin: number[];
  precipitationSum: number[];
  precipitationProbabilityMax: number[];
  sunrise: string[];
  sunset: string[];
  uvIndexMax: number[];
  windSpeedMax: number[];
}

export interface WeatherBundle {
  location: GeoResult;
  current: CurrentWeather;
  hourly: HourlyWeather;
  daily: DailyWeather;
  units: UnitSystem;
}

export type TemperatureUnit = "celsius" | "fahrenheit";
export type WindUnit = "kmh" | "mph";

export interface UnitSystem {
  temperature: TemperatureUnit;
  wind: WindUnit;
}

export interface FavoriteCity {
  id: number;
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone: string;
}
