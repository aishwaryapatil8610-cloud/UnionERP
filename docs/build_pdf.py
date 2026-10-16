import json
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, KeepTogether

g = json.load(open("src/lib/guide.json"))
INK = colors.HexColor("#1C1834"); BRAND = colors.HexColor("#D66C14"); MUTE = colors.HexColor("#6E6880"); SOFT = colors.HexColor("#F4EFE3")
H1 = ParagraphStyle("h1", fontName="Helvetica-Bold", fontSize=26, leading=30, textColor=INK, spaceAfter=8)
H2 = ParagraphStyle("h2", fontName="Helvetica-Bold", fontSize=16, leading=20, textColor=INK, spaceBefore=6, spaceAfter=4)
H3 = ParagraphStyle("h3", fontName="Helvetica-Bold", fontSize=10, leading=13, textColor=BRAND, spaceBefore=6, spaceAfter=2)
B = ParagraphStyle("b", fontName="Helvetica", fontSize=10, leading=14.5, textColor=INK, spaceAfter=4)
M = ParagraphStyle("m", parent=B, textColor=MUTE, fontSize=9)
ST = ParagraphStyle("st", parent=B, leftIndent=14, firstLineIndent=-14, spaceAfter=2)

def footer(c, d):
    c.saveState(); c.setFont("Helvetica", 8); c.setFillColor(MUTE)
    c.drawString(18*mm, 10*mm, "Kshira ERP - User guide"); c.drawRightString(A4[0]-18*mm, 10*mm, "Page %d" % d.page); c.restoreState()

doc = SimpleDocTemplate("docs/Kshira_ERP_User_Guide.pdf", pagesize=A4, leftMargin=18*mm, rightMargin=18*mm, topMargin=18*mm, bottomMargin=18*mm, title="Kshira ERP - User guide", author="Kshira ERP")
s = []
s += [Spacer(1, 40*mm), Paragraph("Kshira ERP", H1), Paragraph("Dairy plant operating system", ParagraphStyle("sub", parent=B, fontSize=14, textColor=BRAND)), Spacer(1, 6*mm),
      Paragraph("A complete guide to every tab: what it is for, who uses it, and the exact steps to follow. Kshira ERP follows the journey of milk from the farmer, through the plant gate, lab and silo, to dispatch, sales and accounts.", B), Spacer(1, 8*mm)]
rows = [["Group", "Tab", "Open at"]] + [[m["group"], m["title"], m["route"]] for m in g["modules"]]
t = Table(rows, colWidths=[55*mm, 70*mm, 40*mm], repeatRows=1)
t.setStyle(TableStyle([("BACKGROUND", (0,0), (-1,0), INK), ("TEXTCOLOR", (0,0), (-1,0), colors.white), ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"), ("FONTSIZE", (0,0), (-1,-1), 9), ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, SOFT]), ("GRID", (0,0), (-1,-1), 0.25, colors.HexColor("#E7DFCD")), ("TOPPADDING", (0,0), (-1,-1), 4), ("BOTTOMPADDING", (0,0), (-1,-1), 4)]))
s += [Paragraph("Contents", H2), t, PageBreak()]

s += [Paragraph("1. Getting started", H2),
      Paragraph("New users open Create account, fill name, email, plant name, role and a strong password. Existing users sign in with email and password (tick Keep me signed in to stay logged in; use Forgot password for a reset link). The demo login is admin@kshira.in / kshira123 and can be filled with one tap. To sign out, press the red button at the bottom of the sidebar. On a phone or tablet, tap the menu (hamburger) button at the top left to open the sidebar drawer; on a computer the sidebar is always visible. Use the moon/sun button to switch between light and dark theme. The Contact page is open to everyone from the login screen, and Help and contact inside the app raises a support ticket.", B),
      Paragraph("Every table has search, a filter, sortable columns, page controls and an Export CSV button. Every Add button opens a short form; saved entries appear at the top and update dashboard numbers immediately.", B),
      Paragraph("2. The milk journey", H2)]
for i, f in enumerate(g["flow"], 1):
    s.append(Paragraph("<b>%d. %s</b> - %s" % (i, f["label"], f["text"]), ST))
s += [Spacer(1, 4*mm), Paragraph("3. Module by module", H2)]
for m in g["modules"]:
    block = [Paragraph(m["title"] + "  <font size=9 color=\"#6E6880\">(" + m["group"] + ", " + m["route"] + ")</font>", H2), Paragraph(m["summary"], M), Paragraph("STEPS", H3)]
    for i, st in enumerate(m["steps"], 1):
        block.append(Paragraph("%d. %s" % (i, st), ST))
    block.append(Spacer(1, 2*mm))
    tip = Table([[Paragraph("<b>Tip:</b> " + m["tip"], B)]], colWidths=[174*mm])
    tip.setStyle(TableStyle([("BACKGROUND", (0,0), (-1,-1), SOFT), ("LEFTPADDING", (0,0), (-1,-1), 8), ("TOPPADDING", (0,0), (-1,-1), 5), ("BOTTOMPADDING", (0,0), (-1,-1), 3)]))
    block += [tip, Spacer(1, 5*mm)]
    s.append(KeepTogether(block))

s += [PageBreak(), Paragraph("4. A day in the plant", H2)]
day = ["Morning: open Dashboard, check silo levels and what is still inside the gate.", "Tanker arrives: Gate entry, then Milk reception (weigh, test, accept, choose silo).", "Machine collection fills up through the shift; Quality lab shows low fat or SNF alerts.", "Midday: Dispatch loads tankers; mark each trip as it moves.", "Afternoon: Production for batches, Sales and Customers for invoices and credit, Inventory and Purchases for stock, Expenses for approvals, HR for attendance.", "Every 10 days: Farmer payments, press Pay on each row; a payment voucher is created in Accounting.", "Month end: Reports, pick a report, check the chart and table, then download CSV or print it for the auditor."]
for d in day: s.append(Paragraph("- " + d, ST))
doc.build(s, onFirstPage=footer, onLaterPages=footer)
