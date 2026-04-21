// Reads the current theme's colors from the live CSS custom properties on
// <html>. Call at chart creation and again on every theme change (passing
// the theme string as a dep so React re-runs the effect).

export type ChartPalette = {
  text: string;
  grid: string;
  border: string;
  crosshair: string;
  accent: string;
  accentFillTop: string;
  accentFillBottom: string;
};

export function readChartPalette(): ChartPalette {
  if (typeof document === "undefined") {
    // SSR fallback — these only matter for initial paint, then the client
    // effect re-reads the real values.
    return {
      text: "#8a8a93",
      grid: "#26262c",
      border: "#3a3a42",
      crosshair: "#3a3a42",
      accent: "#7dd3fc",
      accentFillTop: "rgba(125, 211, 252, 0.25)",
      accentFillBottom: "rgba(125, 211, 252, 0.02)",
    };
  }
  const s = getComputedStyle(document.documentElement);
  const read = (name: string) => s.getPropertyValue(name).trim();
  return {
    text: read("--foreground-muted"),
    grid: read("--border"),
    border: read("--border-strong"),
    crosshair: read("--border-strong"),
    accent: read("--accent"),
    accentFillTop: read("--accent-fill-top"),
    accentFillBottom: read("--accent-fill-bottom"),
  };
}
