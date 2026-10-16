export interface ReportPdfInput {
  filename: string;
  plant: string;
  title: string;
  blurb: string;
  period?: string;
  stats: { label: string; value: string }[];
  chartTitle: string;
  chart: { name: string; value: number }[];
  unit: string;
  headers: string[];
  rows: string[][];
  aligns: ('left' | 'right')[];
  foot?: string[];
}

type RGB = [number, number, number];
const BRAND: RGB = [124, 58, 237];
const ACCENT: RGB = [236, 72, 153];
const DEEP: RGB = [30, 24, 60];
const MUTE: RGB = [106, 100, 140];
const SOFT: RGB = [245, 242, 255];
const LINE: RGB = [226, 220, 247];
const BARS: RGB[] = [BRAND, ACCENT, [86, 104, 184], [22, 163, 108], [234, 140, 20]];

/** jsPDF's built-in fonts have no rupee glyph, so the PDF writes "Rs". */
const plain = (s: string) => s.replace(/₹/g, 'Rs ').replace(/[^\x20-\x7E]/g, '').trim();
const num = (n: number) => n.toLocaleString('en-IN', { maximumFractionDigits: 0 });

export async function downloadReportPdf(d: ReportPdfInput) {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const landscape = d.headers.length > 7;
  const doc = new jsPDF({ orientation: landscape ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 12;
  const inner = W - M * 2;
  const generated = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  // Banner
  doc.setFillColor(...DEEP);
  doc.roundedRect(M, M, inner, 30, 3, 3, 'F');
  doc.setFillColor(...BRAND);
  doc.roundedRect(M + inner * 0.55, M, inner * 0.45, 30, 3, 3, 'F');
  doc.setFillColor(...ACCENT);
  doc.roundedRect(M + inner * 0.82, M, inner * 0.18, 30, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(plain(d.plant).toUpperCase() + '  |  KSHIRA ERP', M + 6, M + 8);
  doc.setFontSize(19);
  doc.text(plain(d.title), M + 6, M + 17.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(plain(d.blurb), M + 6, M + 24);
  doc.setFontSize(8);
  doc.text('Generated ' + generated, W - M - 6, M + 8, { align: 'right' });
  if (d.period) doc.text(plain(d.period), W - M - 6, M + 13, { align: 'right' });

  // Stat boxes
  let y = M + 36;
  const gap = 3;
  const bw = (inner - gap * (d.stats.length - 1)) / d.stats.length;
  d.stats.forEach((s, i) => {
    const x = M + i * (bw + gap);
    doc.setFillColor(...SOFT);
    doc.setDrawColor(...LINE);
    doc.roundedRect(x, y, bw, 17, 2.5, 2.5, 'FD');
    doc.setTextColor(...MUTE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text(plain(s.label).toUpperCase(), x + 4, y + 6);
    doc.setTextColor(...DEEP);
    doc.setFontSize(12);
    const v = plain(s.value);
    doc.text(doc.splitTextToSize(v, bw - 6)[0] ?? v, x + 4, y + 13);
  });
  y += 17 + 7;

  // Bar chart (drawn natively so it stays crisp)
  const bars = d.chart.slice(0, 10);
  if (bars.length) {
    doc.setTextColor(...DEEP);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(plain(d.chartTitle), M, y);
    if (d.unit) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...MUTE);
      doc.text('Values in ' + d.unit, W - M, y, { align: 'right' });
    }
    y += 3;
    const labelW = 34;
    const valW = 26;
    const trackX = M + labelW;
    const trackW = inner - labelW - valW;
    const max = Math.max(...bars.map((b) => Math.abs(b.value)), 1);
    bars.forEach((b, i) => {
      const ry = y + i * 6.2;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...MUTE);
      doc.text(doc.splitTextToSize(plain(b.name), labelW - 3)[0] ?? '', M, ry + 4);
      doc.setFillColor(...SOFT);
      doc.roundedRect(trackX, ry + 0.8, trackW, 3.8, 1.2, 1.2, 'F');
      doc.setFillColor(...BARS[i % BARS.length]);
      doc.roundedRect(trackX, ry + 0.8, Math.max(1.5, (Math.abs(b.value) / max) * trackW), 3.8, 1.2, 1.2, 'F');
      doc.setTextColor(...DEEP);
      doc.setFont('helvetica', 'bold');
      doc.text((b.value < 0 ? '-' : '') + num(Math.abs(b.value)), W - M, ry + 4, { align: 'right' });
    });
    y += bars.length * 6.2 + 6;
  }

  // Table
  doc.setTextColor(...DEEP);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Report data  (' + d.rows.length + ' rows)', M, y);
  y += 2.5;

  const columnStyles: Record<number, { halign: 'left' | 'right' }> = {};
  d.aligns.forEach((a, i) => { columnStyles[i] = { halign: a }; });
  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M, top: M, bottom: 14 },
    head: [d.headers.map(plain)],
    body: d.rows.map((r) => r.map(plain)),
    foot: d.foot ? [d.foot.map(plain)] : undefined,
    showFoot: 'lastPage',
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 8, cellPadding: { top: 2.2, bottom: 2.2, left: 2.6, right: 2.6 }, textColor: DEEP, lineColor: LINE, lineWidth: 0.2, overflow: 'linebreak' },
    headStyles: { fillColor: BRAND, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    footStyles: { fillColor: SOFT, textColor: DEEP, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [250, 248, 255] },
    columnStyles,
    rowPageBreak: 'avoid',
  });

  // Footer on every page
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setDrawColor(...LINE);
    doc.line(M, H - 10, W - M, H - 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTE);
    doc.text(plain(d.plant) + '  |  Kshira ERP  |  ' + plain(d.title), M, H - 6);
    doc.text('Page ' + p + ' of ' + pages, W - M, H - 6, { align: 'right' });
  }
  doc.save(d.filename + '.pdf');
}
