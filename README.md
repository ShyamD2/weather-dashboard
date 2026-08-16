# Advanced Weather Dashboard

A dependency-light, fully client-side weather dashboard built with **TypeScript**, using the free **[Open-Meteo](https://open-meteo.com/)** API (no API key required) and **Chart.js** for charts.

## Features

- **City search** with debounced autocomplete (Open-Meteo geocoding API)
- **"My location"** button using browser geolocation
- **Current conditions**: temperature, feels-like, humidity, wind speed + compass direction, pressure, UV index (with risk label), precipitation
- **24-hour forecast charts** — temperature line chart and precipitation-probability bar chart (Chart.js)
- **7-day forecast strip** plus an expandable accordion with sunrise/sunset, max wind, UV max, and rainfall totals per day
- **Favorites** — star any city to pin it; favorites persist in `localStorage` and appear as quick-switch chips
- **Unit toggles** — °C/°F and km/h/mph, applied instantly and remembered
- **Dark/light theme**, remembered across sessions
- **Weather-mood backgrounds** — a subtle background glow changes with conditions (clear, cloudy, rain, storm, snow, fog)
- Remembers your last-viewed city and reloads it automatically next time
- Written in strict-mode TypeScript, compiled to native ES modules (no bundler needed)

## Setup

Requires **Node.js** (for the TypeScript compiler) and any way to serve static files.

```bash
npm install
npm run build      # compiles src/*.ts -> dist/*.js
npm run serve       # serves the folder at http://localhost:8080
```

Or do both at once:

```bash
npm start
```

Then open **http://localhost:8080** in your browser.

> `npm run serve` uses Python's built-in HTTP server. If you don't have Python, use any static file server, e.g. `npx serve .`

While developing, run `npm run watch` in a separate terminal to recompile TypeScript automatically on save.

## Project structure

```
weather_dashboard/
├── index.html            # Page shell — search bar, cards, canvases
├── style.css               # Theming, layout, weather-mood backgrounds
├── package.json
├── tsconfig.json
├── src/
│   ├── types.ts             # Shared TypeScript interfaces
│   ├── weatherCodes.ts       # WMO weather-code -> icon/label/gradient mapping
│   ├── api.ts                  # Open-Meteo geocoding + forecast API client
│   ├── storage.ts              # localStorage: favorites, units, theme, last city
│   ├── charts.ts                # Chart.js hourly temperature/precipitation charts
│   ├── ui.ts                     # DOM rendering (cards, forecast strip, favorites)
│   └── main.ts                    # App entry point — wires everything together
└── dist/                    # Compiled JS output (generated, gitignored)
```

## How it works

- **No backend, no API key.** Every request goes straight from the browser to Open-Meteo's free public API, which supports CORS.
- **Geocoding**: `https://geocoding-api.open-meteo.com/v1/search?name=<query>` returns matching places with lat/lon and timezone.
- **Forecast**: `https://api.open-meteo.com/v1/forecast` is called with `current`, `hourly`, and `daily` parameter sets, plus your chosen units.
- Weather codes follow the **WMO code table** used by Open-Meteo; `src/weatherCodes.ts` maps each code to an emoji icon, label, and a background "mood" gradient.
- All state (favorites, last city, units, theme) lives in `localStorage` — nothing is sent to any server besides the two Open-Meteo endpoints above.

## Customizing

- **Default city**: edit the fallback location at the bottom of `src/main.ts` (`boot()` function) — currently set to Chennai.
- **Forecast length**: change `forecast_days` in `src/api.ts` (`fetchWeather`), max 16 days on the free tier.
- **Add more variables**: Open-Meteo exposes many more fields (e.g. `visibility`, `cloud_cover`, `soil_temperature`) — add them to the `current`/`hourly`/`daily` param lists in `api.ts` and surface them in `ui.ts`.

## Notes

- Compiled with TypeScript **strict mode** — no `any` leaks outside the two spots where `Chart` (global, from the CDN script) and raw JSON parsing require it.
- `dist/` is gitignored since it's a build artifact — run `npm run build` after cloning.
