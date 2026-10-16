# Kshira ERP

Dairy plant ERP: gate entry, milk reception, silos, dispatch, machine collection, farmers, quality lab, accounting, farmer payments, sales, inventory, fleet, HR and reports.

React 18 + TypeScript + Vite + Tailwind v3 + Framer Motion + Recharts. All routes are lazy loaded.

    npm install
    npm run dev
    npm run build   # tsc --noEmit && vite build

Demo login: admin@kshira.in / kshira123 (one-tap fill on the login page). You can also create your own account. Data is generated demo data held in React state.
Guide content lives in src/lib/guide.json and is shared by the Guide page and docs/build_pdf.py.

Reports: Print (A4 sheet with every row), Download PDF (jsPDF, loaded on demand) and CSV. PDF test: src/lib/reportPdf.ts.


## Colour theme

Classic Blue is the only available colour theme, with both light and dark modes. The mode can be changed from the header or in Settings > Appearance.
