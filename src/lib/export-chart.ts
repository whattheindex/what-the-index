// Compose a branded export image (PNG) and PDF from the raw chart screenshot
// plus metadata (title, value, change, range, modifiers). No runtime deps.

export type ExportMeta = {
  title: string;
  subtitle?: string; // e.g. symbol
  value: string; // formatted latest value
  change?: string; // formatted percent, e.g. "+22.53%"
  changePositive?: boolean;
  range: string; // "Apr 17, 2025 – Apr 17, 2026"
  badges: string[]; // ["1Y", "Linear", "Nominal"]
  footerLeft?: string; // e.g. "Source: Shiller / datahub.io"
  footerRight?: string; // e.g. "whattheindex.com"
};

type Theme = "light" | "dark";

const PALETTE: Record<Theme, {
  bg: string;
  card: string;
  border: string;
  fg: string;
  muted: string;
  dim: string;
  up: string;
  down: string;
}> = {
  dark: {
    bg: "#0a0a0d",
    card: "#121216",
    border: "#26262c",
    fg: "#e8e8ea",
    muted: "#a0a0a8",
    dim: "#6a6a72",
    up: "#4ade80",
    down: "#f87171",
  },
  light: {
    bg: "#ffffff",
    card: "#f7f7f8",
    border: "#e4e4e7",
    fg: "#0a0a0d",
    muted: "#52525b",
    dim: "#a1a1aa",
    up: "#16a34a",
    down: "#dc2626",
  },
};

const HEADER_H = 120;
const FOOTER_H = 52;
const PADDING = 40;

// Compose chart screenshot + metadata into a single canvas ready for export.
export function renderExportCanvas(
  chartCanvas: HTMLCanvasElement,
  meta: ExportMeta,
  theme: Theme,
): HTMLCanvasElement {
  const p = PALETTE[theme];
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

  // Logical (CSS) dimensions; the canvas backing store is dpr-scaled.
  const chartW = chartCanvas.width;
  const chartH = chartCanvas.height;

  const W = chartW + PADDING * 2;
  const H = HEADER_H + chartH + FOOTER_H + PADDING * 2;

  const out = document.createElement("canvas");
  out.width = Math.round(W * dpr);
  out.height = Math.round(H * dpr);
  const ctx = out.getContext("2d")!;
  ctx.scale(dpr, dpr);

  // Background
  ctx.fillStyle = p.bg;
  ctx.fillRect(0, 0, W, H);

  const x = PADDING;
  let y = PADDING;

  // Header row: title (left) + footerRight top corner (right)
  ctx.textBaseline = "top";
  ctx.fillStyle = p.fg;
  ctx.font = "600 26px ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto";
  ctx.fillText(meta.title, x, y);

  if (meta.subtitle) {
    ctx.fillStyle = p.dim;
    ctx.font = "500 13px ui-monospace, 'SF Mono', Menlo, monospace";
    const tw = ctx.measureText(meta.title).width;
    ctx.fillText(` · ${meta.subtitle}`, x + tw, y + 8);
  }

  // Brand top-right
  if (meta.footerRight) {
    ctx.fillStyle = p.dim;
    ctx.font = "500 12px ui-monospace, 'SF Mono', Menlo, monospace";
    ctx.textAlign = "right";
    ctx.fillText(meta.footerRight, W - PADDING, y + 6);
    ctx.textAlign = "left";
  }

  y += 38;

  // Value + change
  ctx.fillStyle = p.fg;
  ctx.font = "600 38px ui-sans-serif, system-ui, -apple-system";
  ctx.fillText(meta.value, x, y);
  const valueW = ctx.measureText(meta.value).width;

  if (meta.change) {
    ctx.fillStyle = meta.changePositive ? p.up : p.down;
    ctx.font = "500 18px ui-sans-serif, system-ui, -apple-system";
    ctx.fillText(meta.change, x + valueW + 14, y + 14);
  }

  y += 50;

  // Range + badges
  ctx.fillStyle = p.muted;
  ctx.font = "400 13px ui-sans-serif, system-ui, -apple-system";
  let metaLine = meta.range;
  if (meta.badges.length) metaLine += "  ·  " + meta.badges.join("  ·  ");
  ctx.fillText(metaLine, x, y);

  // Chart image
  const chartY = PADDING + HEADER_H;
  // Subtle card frame around the chart
  ctx.fillStyle = p.card;
  ctx.fillRect(x - 6, chartY - 6, chartW + 12, chartH + 12);
  ctx.strokeStyle = p.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(x - 6 + 0.5, chartY - 6 + 0.5, chartW + 12 - 1, chartH + 12 - 1);

  ctx.drawImage(chartCanvas, x, chartY, chartW, chartH);

  // Footer
  const footerY = chartY + chartH + 28;
  ctx.fillStyle = p.dim;
  ctx.font = "400 11px ui-monospace, 'SF Mono', Menlo, monospace";
  if (meta.footerLeft) ctx.fillText(meta.footerLeft, x, footerY);

  return out;
}

export function downloadPng(canvas: HTMLCanvasElement, filename: string): void {
  canvas.toBlob((blob) => {
    if (!blob) return;
    triggerDownload(blob, filename.endsWith(".png") ? filename : `${filename}.png`);
  }, "image/png");
}

export async function downloadPdf(
  canvas: HTMLCanvasElement,
  filename: string,
): Promise<void> {
  const blob = await canvasToPdfBlob(canvas);
  triggerDownload(blob, filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Minimal PDF (1.4) with a single embedded JPEG image, fit to page size.
// Hand-rolled to avoid a 300 KB jsPDF dep for what amounts to ~50 lines of
// text + an image object.
async function canvasToPdfBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  const jpegBlob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("jpeg encode failed"))),
      "image/jpeg",
      0.92,
    );
  });
  const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());

  // PDF user-space units are points (1 pt = 1/72 inch). We treat each canvas
  // pixel as one point, so the page matches the canvas' pixel dimensions.
  const W = canvas.width;
  const H = canvas.height;

  const enc = new TextEncoder();
  const parts: Uint8Array[] = [];
  const offsets: number[] = []; // offsets[objNum] = byte offset of obj
  let pos = 0;
  const push = (data: Uint8Array | string) => {
    const b = typeof data === "string" ? enc.encode(data) : data;
    parts.push(b);
    pos += b.byteLength;
  };
  const startObj = (n: number) => {
    offsets[n] = pos;
    push(`${n} 0 obj\n`);
  };
  const endObj = () => push("endobj\n");

  // Header — include a binary marker so strict PDF readers recognise it as
  // containing non-ASCII data.
  push("%PDF-1.4\n");
  push(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));

  // 1: Catalog
  startObj(1);
  push("<< /Type /Catalog /Pages 2 0 R >>\n");
  endObj();

  // 2: Pages
  startObj(2);
  push("<< /Type /Pages /Kids [3 0 R] /Count 1 >>\n");
  endObj();

  // 3: Page
  startObj(3);
  push(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] ` +
      `/Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\n`,
  );
  endObj();

  // 4: Image XObject (JPEG via DCTDecode)
  startObj(4);
  push(
    `<< /Type /XObject /Subtype /Image /Width ${W} /Height ${H} ` +
      `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode ` +
      `/Length ${jpegBytes.byteLength} >>\nstream\n`,
  );
  push(jpegBytes);
  push("\nendstream\n");
  endObj();

  // 5: Content stream — draws Im0 scaled to full page.
  const contentStream = `q\n${W} 0 0 ${H} 0 0 cm\n/Im0 Do\nQ\n`;
  const contentBytes = enc.encode(contentStream);
  startObj(5);
  push(`<< /Length ${contentBytes.byteLength} >>\nstream\n`);
  push(contentBytes);
  push("endstream\n");
  endObj();

  // xref
  const xrefOffset = pos;
  push("xref\n");
  push(`0 6\n`);
  push("0000000000 65535 f \n");
  for (let i = 1; i <= 5; i++) {
    push(`${String(offsets[i]).padStart(10, "0")} 00000 n \n`);
  }

  // trailer
  push("trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n");
  push(`${xrefOffset}\n%%EOF\n`);

  const total = parts.reduce((n, p) => n + p.byteLength, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.byteLength;
  }
  return new Blob([out], { type: "application/pdf" });
}
