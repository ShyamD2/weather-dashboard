import type { HourlyWeather, UnitSystem } from "./types.js";

// Chart.js is loaded globally via a CDN <script> tag in index.html.
declare const Chart: any;

let tempChart: any = null;
let precipChart: any = null;

function nextHours(hourly: HourlyWeather, count: number) {
  const now = new Date();
  let startIdx = hourly.time.findIndex((t) => new Date(t) >= now);
  if (startIdx === -1) startIdx = 0;
  return {
    labels: hourly.time.slice(startIdx, startIdx + count),
    temps: hourly.temperature.slice(startIdx, startIdx + count),
    precipProb: hourly.precipitationProbability.slice(startIdx, startIdx + count),
  };
}

function formatHourLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "numeric" });
}

export function renderHourlyCharts(
  hourly: HourlyWeather,
  units: UnitSystem,
  tempCanvas: HTMLCanvasElement,
  precipCanvas: HTMLCanvasElement
): void {
  const { labels, temps, precipProb } = nextHours(hourly, 24);
  const hourLabels = labels.map(formatHourLabel);
  const tempUnitLabel = units.temperature === "celsius" ? "°C" : "°F";

  const rootStyles = getComputedStyle(document.documentElement);
  const accent = rootStyles.getPropertyValue("--accent").trim() || "#6366f1";
  const gridColor = rootStyles.getPropertyValue("--chart-grid").trim() || "rgba(128,128,128,0.15)";
  const textColor = rootStyles.getPropertyValue("--text-muted").trim() || "#8b8f9a";

  if (tempChart) tempChart.destroy();
  tempChart = new Chart(tempCanvas.getContext("2d"), {
    type: "line",
    data: {
      labels: hourLabels,
      datasets: [
        {
          label: `Temperature (${tempUnitLabel})`,
          data: temps,
          borderColor: accent,
          backgroundColor: accent + "33",
          fill: true,
          tension: 0.35,
          pointRadius: 2,
          pointHoverRadius: 5,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: gridColor }, ticks: { color: textColor, maxTicksLimit: 8 } },
        y: { grid: { color: gridColor }, ticks: { color: textColor } },
      },
    },
  });

  if (precipChart) precipChart.destroy();
  precipChart = new Chart(precipCanvas.getContext("2d"), {
    type: "bar",
    data: {
      labels: hourLabels,
      datasets: [
        {
          label: "Precipitation chance (%)",
          data: precipProb,
          backgroundColor: accent + "88",
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: textColor, maxTicksLimit: 8 } },
        y: {
          min: 0,
          max: 100,
          grid: { color: gridColor },
          ticks: { color: textColor, callback: (v: number) => v + "%" },
        },
      },
    },
  });
}
