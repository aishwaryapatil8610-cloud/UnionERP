/** Excel-friendly CSV: UTF-8 BOM so names and symbols open correctly, CRLF line ends, safe quoting. */
export function downloadCsv(name: string, rows: object[]) {
  if (!rows.length) return;
  const recs = rows as Record<string, unknown>[];
  const keys = Object.keys(recs[0]);
  const esc = (v: unknown) => {
    const s = String(v ?? "");
    return /[",\r\n]/.test(s) ? "\"" + s.replace(/"/g, "\"\"") + "\"" : s;
  };
  const body = [keys.join(","), ...recs.map((r) => keys.map((k) => esc(r[k])).join(","))].join("\r\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF" + body], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name + ".csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
