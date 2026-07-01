interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * Color utilities MCP.
 *
 * Keyless, offline: convert colors between HEX / RGB / HSL, compute the WCAG
 * contrast ratio between two colors (with AA/AAA pass/fail), and find the
 * nearest CSS named color. Pure math — no API, no key.
 */


const NAMED: Record<string, string> = {
  black: '000000', white: 'ffffff', red: 'ff0000', lime: '00ff00', blue: '0000ff', yellow: 'ffff00',
  cyan: '00ffff', magenta: 'ff00ff', silver: 'c0c0c0', gray: '808080', maroon: '800000', olive: '808000',
  green: '008000', purple: '800080', teal: '008080', navy: '000080', orange: 'ffa500', pink: 'ffc0cb',
  brown: 'a52a2a', gold: 'ffd700', indigo: '4b0082', violet: 'ee82ee', crimson: 'dc143c', coral: 'ff7f50',
  salmon: 'fa8072', khaki: 'f0e68c', turquoise: '40e0d0', tomato: 'ff6347', tan: 'd2b48c', beige: 'f5f5dc',
  lavender: 'e6e6fa', plum: 'dda0dd', orchid: 'da70d6', chocolate: 'd2691e', firebrick: 'b22222',
  forestgreen: '228b22', seagreen: '2e8b57', skyblue: '87ceeb', steelblue: '4682b4', royalblue: '4169e1',
  slategray: '708090', dimgray: '696969', lightgray: 'd3d3d3', darkgray: 'a9a9a9', whitesmoke: 'f5f5f5',
  ivory: 'fffff0', mint: 'f5fffa', azure: 'f0ffff', aqua: '00ffff', fuchsia: 'ff00ff', lightblue: 'add8e6',
  lightgreen: '90ee90', darkred: '8b0000', darkgreen: '006400', darkblue: '00008b', darkorange: 'ff8c00',
  goldenrod: 'daa520', hotpink: 'ff69b4', deeppink: 'ff1493', dodgerblue: '1e90ff', midnightblue: '191970',
};

function parse(input: string): { r: number; g: number; b: number } | null {
  let s = input.trim().toLowerCase();
  if (NAMED[s]) s = '#' + NAMED[s];
  let m = s.match(/^#?([0-9a-f]{3})$/);
  if (m) { const h = m[1]; return { r: parseInt(h[0] + h[0], 16), g: parseInt(h[1] + h[1], 16), b: parseInt(h[2] + h[2], 16) }; }
  m = s.match(/^#?([0-9a-f]{6})$/);
  if (m) { const h = m[1]; return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) }; }
  m = s.match(/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
  if (m) return { r: +m[1], g: +m[2], b: +m[3] };
  m = s.match(/^hsla?\(\s*(\d+(?:\.\d+)?)[,\s]+(\d+(?:\.\d+)?)%?[,\s]+(\d+(?:\.\d+)?)%?/);
  if (m) return hslToRgb(+m[1], +m[2] / 100, +m[3] / 100);
  return null;
}
function hslToRgb(h: number, s: number, l: number) {
  h = ((h % 360) + 360) % 360 / 360;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const hue = (t: number) => { t = (t + 1) % 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; };
  return { r: Math.round(hue(h + 1 / 3) * 255), g: Math.round(hue(h) * 255), b: Math.round(hue(h - 1 / 3) * 255) };
}
function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b); let h = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) { const d = max - min; s = l > 0.5 ? d / (2 - max - min) : d / (max + min); h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}
const toHex = (r: number, g: number, b: number) => '#' + [r, g, b].map((x) => Math.max(0, Math.min(255, x)).toString(16).padStart(2, '0')).join('');
function luminance(r: number, g: number, b: number) {
  const a = [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

const tools: McpToolExport['tools'] = [
  {
    name: 'color_convert',
    description: 'Convert a color (HEX, rgb(), hsl(), or a CSS name) to all formats: HEX, RGB and HSL. Keyless, offline.',
    inputSchema: { type: 'object', properties: { color: { type: 'string', description: 'e.g. "#3498db", "rgb(52,152,219)", "hsl(204,70%,53%)", or "tomato".' } }, required: ['color'] },
  },
  {
    name: 'color_contrast',
    description: 'Compute the WCAG 2.1 contrast ratio between two colors and whether it passes AA/AAA for normal and large text. Keyless, offline.',
    inputSchema: { type: 'object', properties: { foreground: { type: 'string', description: 'Foreground/text color.' }, background: { type: 'string', description: 'Background color.' } }, required: ['foreground', 'background'] },
  },
  {
    name: 'nearest_color',
    description: 'Find the nearest CSS named color to a given color (Euclidean RGB distance). Keyless, offline.',
    inputSchema: { type: 'object', properties: { color: { type: 'string', description: 'Any color in HEX/rgb/hsl/name.' } }, required: ['color'] },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'color_convert': {
      const c = parse(reqStr(args, 'color', '"#3498db"'));
      if (!c) return { input: args.color, valid: false, reason: 'Could not parse the color. Use HEX, rgb(), hsl() or a CSS name.' };
      const hsl = rgbToHsl(c.r, c.g, c.b);
      return { input: args.color, hex: toHex(c.r, c.g, c.b), rgb: c, rgb_string: `rgb(${c.r}, ${c.g}, ${c.b})`, hsl, hsl_string: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` };
    }
    case 'color_contrast': {
      const f = parse(reqStr(args, 'foreground', '"#000"')), b = parse(reqStr(args, 'background', '"#fff"'));
      if (!f || !b) return { valid: false, reason: 'Could not parse one of the colors.' };
      const l1 = luminance(f.r, f.g, f.b), l2 = luminance(b.r, b.g, b.b);
      const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      const r = Math.round(ratio * 100) / 100;
      return { foreground: toHex(f.r, f.g, f.b), background: toHex(b.r, b.g, b.b), contrast_ratio: r, wcag: { AA_normal: r >= 4.5, AA_large: r >= 3, AAA_normal: r >= 7, AAA_large: r >= 4.5 } };
    }
    case 'nearest_color': {
      const c = parse(reqStr(args, 'color', '"#3a3"'));
      if (!c) return { input: args.color, valid: false, reason: 'Could not parse the color.' };
      let best = '', bestD = Infinity;
      for (const [nm, hex] of Object.entries(NAMED)) {
        const r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6), 16);
        const d = (c.r - r) ** 2 + (c.g - g) ** 2 + (c.b - b) ** 2;
        if (d < bestD) { bestD = d; best = nm; }
      }
      return { input: args.color, hex: toHex(c.r, c.g, c.b), nearest_name: best, nearest_hex: '#' + NAMED[best], exact: bestD === 0, distance: Math.round(Math.sqrt(bestD)) };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function reqStr(args: Record<string, unknown>, key: string, ex: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim()) throw new Error(`Required argument "${key}" is missing. Pass a string like ${ex}.`);
  return v;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
