export type PaletteId = 'emerald' | 'onyx' | 'crimson' | 'mocha' | 'rose' | 'graphite' | 'teal' | 'lime' | 'saffron' | 'milk' | 'ghee' | 'blue';
export type Mode = 'light' | 'dark';
type RGB = [number, number, number];

export interface ChartColors {
  grid: string; tick: string; panel: string; ink: string; brand: string; accent: string; line: string;
  /** Second line colour (used for SNF line) */
  second: string;
  /** Series colours for multi-colour bar charts */
  series: string[];
}
export interface PdfColors { brand: RGB; coral: RGB; gold: RGB; ink: RGB; mute: RGB; cream: RGB; sand: RGB; line: RGB }
export interface PaletteMeta {
  id: PaletteId;
  name: string;
  tagline: string;
  /** Three hex colours for the swatch preview (dark → mid → light) */
  swatch: [string, string, string];
  themeColor: Record<Mode, string>;
  /** Hex colours for the dynamic favicon */
  favicon: { tile: string; drop: string; wave: string; spark: string };
  charts: Record<Mode, ChartColors>;
  pdf: PdfColors;
}

export const DEFAULT_PALETTE: PaletteId = 'blue';

export const PALETTES: Record<PaletteId, PaletteMeta> = {
  emerald: {
    id: 'emerald',
    name: 'Emerald Grove',
    tagline: 'Deep forest green with champagne gold',
    swatch: ['#053A2A', '#0E7854', '#D4A843'],
    themeColor: { light: '#053A2A', dark: '#08130F' },
    favicon: { tile: '#063E2D', drop: '#F4FBF6', wave: '#0E7854', spark: '#D4A843' },
    charts: {
      light: { grid: '#D5E3D9', tick: '#577064', panel: '#FDFFFD', ink: '#0E241C', brand: '#0E7854', accent: '#24A572', line: '#D5E3D9', second: '#C99A2E', series: ['#0E7854', '#24A572', '#C99A2E', '#7A9A3C', '#5B4A36'] },
      dark: { grid: '#253F34', tick: '#92AFA1', panel: '#0E1E18', ink: '#E8F5EE', brand: '#34C98C', accent: '#6EE0AA', line: '#253F34', second: '#E2B656', series: ['#34C98C', '#6EE0AA', '#E2B656', '#A6C85A', '#C9A27A'] },
    },
    pdf: { brand: [14, 120, 84], coral: [36, 165, 114], gold: [212, 168, 67], ink: [14, 36, 28], mute: [87, 112, 100], cream: [244, 248, 244], sand: [232, 241, 234], line: [213, 227, 217] },
  },
  onyx: {
    id: 'onyx',
    name: 'Onyx & Gold',
    tagline: 'Charcoal black with antique gold',
    swatch: ['#16161A', '#7A560C', '#DEB250'],
    themeColor: { light: '#16161A', dark: '#101012' },
    favicon: { tile: '#18181B', drop: '#FFFAEE', wave: '#7A560C', spark: '#DEB250' },
    charts: {
      light: { grid: '#DFDCD2', tick: '#6C6A63', panel: '#FFFFFD', ink: '#1A1A1C', brand: '#9A6A0C', accent: '#C99934', line: '#DFDCD2', second: '#3A3A3F', series: ['#9A6A0C', '#D4A843', '#3A3A3F', '#7C8B5E', '#A0472F'] },
      dark: { grid: '#37363A', tick: '#A6A298', panel: '#19191C', ink: '#F5F2EA', brand: '#E2B246', accent: '#F1D07D', line: '#37363A', second: '#D8D4CA', series: ['#E2B246', '#F1D07D', '#D8D4CA', '#9DB07A', '#D9795A'] },
    },
    pdf: { brand: [154, 106, 12], coral: [201, 153, 52], gold: [222, 178, 80], ink: [26, 26, 28], mute: [108, 106, 99], cream: [247, 246, 242], sand: [238, 236, 229], line: [223, 220, 210] },
  },
  crimson: {
    id: 'crimson',
    name: 'Crimson Velvet',
    tagline: 'Rich burgundy red with rose gold',
    swatch: ['#4A0A1C', '#A81C38', '#E0A078'],
    themeColor: { light: '#4A0A1C', dark: '#140A0C' },
    favicon: { tile: '#4A0C1E', drop: '#FFF7F4', wave: '#A81C38', spark: '#E0A078' },
    charts: {
      light: { grid: '#E9D7D9', tick: '#785C62', panel: '#FFFDFD', ink: '#2A1218', brand: '#A81C38', accent: '#D64862', line: '#E9D7D9', second: '#C08A5A', series: ['#A81C38', '#D64862', '#C08A5A', '#7A8B5E', '#5A4A44'] },
      dark: { grid: '#47292F', tick: '#BEA0A6', panel: '#201115', ink: '#FAEEEE', brand: '#F0627A', accent: '#F89AA5', line: '#47292F', second: '#E0A878', series: ['#F0627A', '#F89AA5', '#E0A878', '#A6C080', '#C9AFA8'] },
    },
    pdf: { brand: [168, 28, 56], coral: [214, 72, 98], gold: [224, 160, 120], ink: [42, 18, 24], mute: [120, 92, 98], cream: [251, 245, 245], sand: [245, 232, 233], line: [233, 215, 217] },
  },
  mocha: {
    id: 'mocha',
    name: 'Mocha Latte',
    tagline: 'Espresso brown with warm cream',
    swatch: ['#2A1C14', '#6F4E37', '#CDA578'],
    themeColor: { light: '#2A1C14', dark: '#140F0C' },
    favicon: { tile: '#2E1E16', drop: '#FFFAF1', wave: '#6F4E37', spark: '#CDA578' },
    charts: {
      light: { grid: '#E3D6C8', tick: '#705F52', panel: '#FFFDFA', ink: '#261B14', brand: '#6F4E37', accent: '#B08968', line: '#E3D6C8', second: '#B8862B', series: ['#6F4E37', '#B08968', '#B8862B', '#7C8B5E', '#A0472F'] },
      dark: { grid: '#42362C', tick: '#B7A694', panel: '#1F1813', ink: '#F7F0E6', brand: '#D6AA7D', accent: '#E8C8A0', line: '#42362C', second: '#E2B656', series: ['#D6AA7D', '#E8C8A0', '#E2B656', '#9DB07A', '#D9795A'] },
    },
    pdf: { brand: [111, 78, 55], coral: [176, 137, 104], gold: [205, 165, 120], ink: [38, 27, 20], mute: [112, 95, 82], cream: [250, 246, 241], sand: [241, 233, 223], line: [227, 214, 200] },
  },
  rose: {
    id: 'rose',
    name: 'Rose Quartz',
    tagline: 'Soft berry pink with peach gold',
    swatch: ['#6E143C', '#C03670', '#F0A096'],
    themeColor: { light: '#6E143C', dark: '#160B10' },
    favicon: { tile: '#6E143C', drop: '#FFF8FA', wave: '#C03670', spark: '#F0A096' },
    charts: {
      light: { grid: '#F0D6E1', tick: '#7E5E6C', panel: '#FFFDFE', ink: '#301422', brand: '#C03670', accent: '#E06496', line: '#F0D6E1', second: '#E09A7A', series: ['#C03670', '#E06496', '#E09A7A', '#7A8B5E', '#5A4651'] },
      dark: { grid: '#4C2E3C', tick: '#C3A4B2', panel: '#221219', ink: '#FCF0F5', brand: '#F472A0', accent: '#FAA8C6', line: '#4C2E3C', second: '#F0A890', series: ['#F472A0', '#FAA8C6', '#F0A890', '#A6C080', '#CDB0BC'] },
    },
    pdf: { brand: [192, 54, 112], coral: [224, 100, 150], gold: [240, 160, 150], ink: [48, 20, 34], mute: [126, 94, 108], cream: [253, 245, 248], sand: [250, 232, 239], line: [240, 214, 225] },
  },
  graphite: {
    id: 'graphite',
    name: 'Graphite & Silver',
    tagline: 'Charcoal steel with platinum shine',
    swatch: ['#121214', '#48484F', '#B0B0BA'],
    themeColor: { light: '#121214', dark: '#0E0E0F' },
    favicon: { tile: '#1C1C20', drop: '#FAFAFB', wave: '#48484F', spark: '#B0B0BA' },
    charts: {
      light: { grid: '#DADADE', tick: '#686870', panel: '#FFFFFF', ink: '#18181B', brand: '#34343C', accent: '#8C8C96', line: '#DADADE', second: '#B08A3E', series: ['#34343C', '#8C8C96', '#B08A3E', '#7C8B5E', '#A0472F'] },
      dark: { grid: '#343438', tick: '#A4A4AC', panel: '#171719', ink: '#F4F4F6', brand: '#D6D6DE', accent: '#A8A8B2', line: '#343438', second: '#E2B656', series: ['#D6D6DE', '#A8A8B2', '#E2B656', '#9DB07A', '#D9795A'] },
    },
    pdf: { brand: [52, 52, 60], coral: [140, 140, 150], gold: [176, 176, 186], ink: [24, 24, 27], mute: [104, 104, 112], cream: [245, 245, 246], sand: [234, 234, 236], line: [218, 218, 222] },
  },
  teal: {
    id: 'teal',
    name: 'Deep Teal & Sand',
    tagline: 'Deep teal with warm sand gold',
    swatch: ['#05363A', '#0D7674', '#E0B878'],
    themeColor: { light: '#05363A', dark: '#081415' },
    favicon: { tile: '#063A3C', drop: '#F7FCFB', wave: '#0D7674', spark: '#E0B878' },
    charts: {
      light: { grid: '#DADED6', tick: '#526C6C', panel: '#FFFEFC', ink: '#0C2628', brand: '#0D7674', accent: '#28A8A0', line: '#DADED6', second: '#C99A2E', series: ['#0D7674', '#28A8A0', '#C99A2E', '#7A9A3C', '#8A5A3C'] },
      dark: { grid: '#244244', tick: '#94B2B2', panel: '#0E1F21', ink: '#E8F6F5', brand: '#2DC8BE', accent: '#78E0D6', line: '#244244', second: '#E2B656', series: ['#2DC8BE', '#78E0D6', '#E2B656', '#A6C85A', '#C9A27A'] },
    },
    pdf: { brand: [13, 118, 116], coral: [40, 168, 160], gold: [224, 184, 120], ink: [12, 38, 40], mute: [82, 108, 108], cream: [248, 246, 241], sand: [236, 238, 232], line: [218, 222, 214] },
  },
  lime: {
    id: 'lime',
    name: 'Citrus Lime',
    tagline: 'Fresh olive lime with deep forest charcoal',
    swatch: ['#1E3008', '#548210', '#BEE046'],
    themeColor: { light: '#1E3008', dark: '#0E1208' },
    favicon: { tile: '#223808', drop: '#FAFDF4', wave: '#548210', spark: '#BEE046' },
    charts: {
      light: { grid: '#DAE2C8', tick: '#62704E', panel: '#FEFFFC', ink: '#18200C', brand: '#548210', accent: '#84BE24', line: '#DAE2C8', second: '#C99A2E', series: ['#548210', '#84BE24', '#C99A2E', '#2E7D5B', '#8A5A3C'] },
      dark: { grid: '#344220', tick: '#AAB88C', panel: '#161D0C', ink: '#F4F9E8', brand: '#AAE03C', accent: '#CDF078', line: '#344220', second: '#E2B656', series: ['#AAE03C', '#CDF078', '#E2B656', '#5FC49A', '#C9A27A'] },
    },
    pdf: { brand: [84, 130, 16], coral: [132, 190, 36], gold: [190, 224, 70], ink: [24, 32, 12], mute: [98, 112, 78], cream: [247, 249, 241], sand: [236, 241, 224], line: [218, 226, 200] },
  },
  saffron: {
    id: 'saffron',
    name: 'Saffron Sunrise',
    tagline: 'Bright saffron amber with golden cream',
    swatch: ['#6E3200', '#B65C00', '#FABE32'],
    themeColor: { light: '#6E3200', dark: '#140E06' },
    favicon: { tile: '#6E3200', drop: '#FFFAEE', wave: '#B65C00', spark: '#FABE32' },
    charts: {
      light: { grid: '#F0DEB8', tick: '#7C643E', panel: '#FFFDF8', ink: '#281A08', brand: '#B65C00', accent: '#F09614', line: '#F0DEB8', second: '#6B7F3A', series: ['#B65C00', '#F09614', '#6B7F3A', '#A0472F', '#5A4A36'] },
      dark: { grid: '#48361C', tick: '#C4AC82', panel: '#20170A', ink: '#FFF5E4', brand: '#FCAA28', accent: '#FFCD6E', line: '#48361C', second: '#A6C080', series: ['#FCAA28', '#FFCD6E', '#A6C080', '#E07A5A', '#CDB89A'] },
    },
    pdf: { brand: [182, 92, 0], coral: [240, 150, 20], gold: [250, 190, 50], ink: [40, 26, 8], mute: [124, 100, 62], cream: [255, 250, 240], sand: [252, 240, 214], line: [240, 222, 184] },
  },
  milk: {
    id: 'milk',
    name: 'Fresh Milk',
    tagline: 'Milk white with meadow green and butter',
    swatch: ['#284E36', '#487854', '#F2D678'],
    themeColor: { light: '#284E36', dark: '#12160F' },
    favicon: { tile: '#2C523A', drop: '#FEFDFA', wave: '#487854', spark: '#F2D678' },
    charts: {
      light: { grid: '#E4E2D6', tick: '#697060', panel: '#FFFFFE', ink: '#22281E', brand: '#487854', accent: '#7FB08A', line: '#E4E2D6', second: '#D9A93A', series: ['#487854', '#7FB08A', '#D9A93A', '#A8764A', '#5A6B55'] },
      dark: { grid: '#394438', tick: '#B0BAA6', panel: '#1A201A', ink: '#F7F6EE', brand: '#96CD96', accent: '#BFE3B8', line: '#394438', second: '#F4D678', series: ['#96CD96', '#BFE3B8', '#F4D678', '#D8A878', '#B8C4AC'] },
    },
    pdf: { brand: [72, 120, 84], coral: [127, 176, 138], gold: [242, 214, 120], ink: [34, 40, 30], mute: [105, 112, 96], cream: [252, 251, 247], sand: [244, 242, 233], line: [228, 226, 214] },
  },
  ghee: {
    id: 'ghee',
    name: 'Butter & Ghee',
    tagline: 'Creamy butter yellow with golden ghee',
    swatch: ['#684000', '#9C6800', '#FCD650'],
    themeColor: { light: '#684000', dark: '#160F04' },
    favicon: { tile: '#684000', drop: '#FFFBE8', wave: '#9C6800', spark: '#FCD650' },
    charts: {
      light: { grid: '#EEDEA0', tick: '#806828', panel: '#FFFEF5', ink: '#342404', brand: '#9C6800', accent: '#E8AA14', line: '#EEDEA0', second: '#6B7F3A', series: ['#9C6800', '#E8AA14', '#6B7F3A', '#A0472F', '#5A4A30'] },
      dark: { grid: '#4A3E1A', tick: '#C8B882', panel: '#221C0A', ink: '#FFF9E1', brand: '#F6C83C', accent: '#FCE078', line: '#4A3E1A', second: '#A6C080', series: ['#F6C83C', '#FCE078', '#A6C080', '#E07A5A', '#CDB892'] },
    },
    pdf: { brand: [156, 104, 0], coral: [232, 170, 20], gold: [252, 214, 80], ink: [52, 36, 4], mute: [128, 104, 40], cream: [255, 250, 226], sand: [250, 239, 196], line: [238, 222, 160] },
  },
  blue: {
    id: 'blue',
    name: 'Classic Blue',
    tagline: 'Clean corporate blue with sky highlights',
    swatch: ['#0A2864', '#1E64DC', '#6EB4FA'],
    themeColor: { light: '#0A2864', dark: '#080E1C' },
    favicon: { tile: '#0C2C6C', drop: '#F5F9FF', wave: '#1E64DC', spark: '#6EB4FA' },
    charts: {
      light: { grid: '#D2DFF2', tick: '#546686', panel: '#FDFEFF', ink: '#0E1C38', brand: '#1E64DC', accent: '#4696F5', line: '#D2DFF2', second: '#E0A030', series: ['#1E64DC', '#4696F5', '#E0A030', '#2E9E78', '#C0503A'] },
      dark: { grid: '#26385C', tick: '#96AACD', panel: '#0E172C', ink: '#EAF2FF', brand: '#60A5FA', accent: '#93C5FD', line: '#26385C', second: '#F0C060', series: ['#60A5FA', '#93C5FD', '#F0C060', '#5FD0A0', '#E08A70'] },
    },
    pdf: { brand: [30, 100, 220], coral: [70, 150, 245], gold: [110, 180, 250], ink: [14, 28, 56], mute: [84, 102, 134], cream: [243, 247, 253], sand: [230, 238, 250], line: [210, 223, 242] },
  },
};

/** Palettes available in the theme picker. */
export const PALETTE_IDS: PaletteId[] = ['blue'];

export function isPalette(v: unknown): v is PaletteId {
  return typeof v === 'string' && (PALETTE_IDS as string[]).includes(v);
}

/** Palette currently applied to the document (used by non-React code such as the PDF export). */
export function currentPalette(): PaletteMeta {
  const id = typeof document !== 'undefined' ? document.documentElement.dataset.palette : undefined;
  return PALETTES[isPalette(id) ? id : DEFAULT_PALETTE];
}

export function faviconDataUrl(p: PaletteMeta): string {
  const f = p.favicon;
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
    `<rect width="64" height="64" rx="19" fill="${f.tile}"/>` +
    `<path d="M32 11c8.5 10.5 15 17.5 15 26a15 15 0 0 1-30 0c0-8.5 6.5-15.5 15-26z" fill="${f.drop}"/>` +
    `<path d="M17 38c5.5-3.5 10 3.5 15 0s9.5 3.5 15 0v.5a15 15 0 0 1-30 0z" fill="${f.wave}"/>` +
    `<circle cx="46" cy="15" r="3.5" fill="${f.spark}"/></svg>`;
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}
