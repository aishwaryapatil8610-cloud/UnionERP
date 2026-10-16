import type { DB, Collection, GateType } from "../types";
import { between, gauss, mulberry32, pick } from "./rng";
import { addDays, todayISO } from "./format";

export const rateOf = (fat: number, snf: number) => Math.round((fat * 6.2 + snf * 3.1) * 100) / 100;
const pad = (n: number) => String(n).padStart(2, "0");
const r2 = (n: number) => Math.round(n * 100) / 100;

const FIRST = ["Ramesh", "Suresh", "Mahesh", "Ganesh", "Dattatray", "Sachin", "Vijay", "Anil", "Prakash", "Santosh", "Sunita", "Meena", "Lata", "Sarika", "Kavita", "Rohit", "Amit", "Nitin", "Pandurang", "Balu"];
const LAST = ["Patil", "Jadhav", "Shinde", "Kamble", "More", "Pawar", "Mane", "Kulkarni", "Desai", "Bhosale"];
const VILLAGES = ["Ashta", "Walwa", "Islampur", "Peth", "Kasegaon", "Takari", "Bhilwadi", "Tasgaon"];
export const CENTRES = ["Ashta MCC", "Walwa BMC", "Peth VLC"];
export const SILO_NAMES = ["Silo 1", "Silo 2", "Silo 3", "Silo 4"];

export function buildDB(): DB {
  const r = mulberry32(2026);
  const today = todayISO();
  const farmers = Array.from({ length: 48 }, (_, i) => ({
    id: "F" + pad(i + 1) + "0",
    name: FIRST[i % FIRST.length] + " " + LAST[Math.floor(i / 5) % LAST.length],
    village: VILLAGES[i % VILLAGES.length],
    centre: CENTRES[i % CENTRES.length],
    milk: (i % 5 === 0 ? "Mixed" : i % 2 ? "Buffalo" : "Cow") as "Cow" | "Buffalo" | "Mixed",
    phone: "98" + String(Math.floor(between(r, 10000000, 99999999))),
    advance: Math.round(between(r, 0, 12) ) * 500,
  }));

  const collections: Collection[] = [];
  for (let d = 13; d >= 0; d--) {
    const date = addDays(today, -d);
    for (const shift of ["Morning", "Evening"] as const) {
      for (const f of farmers) {
        if (r() > 0.92) continue;
        const buf = f.milk === "Buffalo";
        const qty = r2(Math.min(32, Math.max(2, gauss(r, buf ? 9 : 7, 2.6))));
        const fat = r2(Math.max(3, gauss(r, buf ? 6.8 : 4.2, 0.4)));
        const snf = r2(Math.max(7.6, gauss(r, 8.7, 0.25)));
        const rate = rateOf(fat, snf);
        const hh = shift === "Morning" ? 5 + Math.floor(r() * 3) : 16 + Math.floor(r() * 3);
        collections.push({ id: "C" + collections.length, date, shift, time: pad(hh) + ":" + pad(Math.floor(r() * 60)), farmerId: f.id, centre: f.centre, qty, fat, snf, rate, amount: r2(qty * rate) });
      }
    }
  }

  const route = ["Ashta - Walwa", "Peth - Islampur", "Takari - Tasgaon", "Kasegaon - Bhilwadi"];
  const reception = Array.from({ length: 16 }, (_, i) => {
    const qty = Math.round(between(r, 3500, 9500) / 10) * 10;
    const status = i === 0 ? "Pending" : r() > 0.9 ? "Rejected" : "Accepted";
    return {
      id: "R" + i, date: addDays(today, -Math.floor(i / 3)), tanker: "MH 10 " + pick(r, ["AB", "CD", "EF", "GH"]) + " " + Math.floor(between(r, 1000, 9999)),
      route: pick(r, route), qty, fat: r2(gauss(r, 4.6, 0.3)), snf: r2(gauss(r, 8.6, 0.15)), temp: r2(gauss(r, 4.8, 0.8)), acidity: r2(gauss(r, 0.14, 0.012)),
      silo: status === "Rejected" ? "-" : pick(r, SILO_NAMES), status: status as "Accepted" | "Rejected" | "Pending",
    };
  });

  const silos = SILO_NAMES.map((name, i) => ({ id: "S" + i, name, kind: i === 3 ? "Skimmed milk" : i === 2 ? "Standardised" : "Raw milk", capacity: 20000, level: Math.round(between(r, 5000, 18000) / 10) * 10, temp: r2(gauss(r, 4, 0.5)) }));

  const gt: GateType[] = ["Milk tanker in", "Milk tanker out", "Cattle feed / goods", "Staff vehicle", "Visitor"];
  const gate = Array.from({ length: 14 }, (_, i) => {
    const inside = i < 3;
    const type = i < 2 ? gt[0] : pick(r, gt);
    return {
      id: "G" + i, date: addDays(today, -Math.floor(i / 7)), timeIn: pad(5 + (i % 12)) + ":" + pad(Math.floor(r() * 60)), timeOut: inside ? "-" : pad(7 + (i % 12)) + ":" + pad(Math.floor(r() * 60)),
      vehicle: "MH 10 " + pick(r, ["AB", "CD", "EF", "XY"]) + " " + Math.floor(between(r, 1000, 9999)), driver: pick(r, FIRST) + " " + pick(r, LAST), type,
      party: type === "Visitor" ? "Visitor" : pick(r, ["Ashta MCC", "Walwa BMC", "Sahyadri Feeds", "Pack-Well Pouches", "Metro Dairy Plant"]),
      purpose: type === "Milk tanker in" ? "Milk unloading" : type === "Milk tanker out" ? "Dispatch" : type === "Visitor" ? "Meeting" : "Delivery",
      status: (inside ? "Inside" : "Exited") as "Inside" | "Exited",
    };
  });

  const dispatch = Array.from({ length: 10 }, (_, i) => ({
    id: "D" + i, date: addDays(today, -Math.floor(i / 2)), tanker: "MH 12 " + pick(r, ["PQ", "RS", "TU"]) + " " + Math.floor(between(r, 1000, 9999)),
    to: pick(r, ["Metro Dairy Plant", "Gokul Sweets", "City Milk Booth", "Cheese Factory"]), qty: Math.round(between(r, 3000, 9000) / 10) * 10,
    fat: r2(gauss(r, 4.5, 0.1)), snf: r2(gauss(r, 8.5, 0.1)), status: (i === 0 ? "Loading" : i === 1 ? "On route" : "Delivered") as "Loading" | "On route" | "Delivered",
  }));

  const accounts = ["Farmer payments", "Milk sales", "Cattle feed purchase", "Diesel & fuel", "Salary", "Electricity", "Packing material", "Bank interest"];
  const vouchers = Array.from({ length: 24 }, (_, i) => {
    const type = pick(r, ["Receipt", "Payment", "Journal"] as const);
    const amt = Math.round(between(r, 2000, 180000) / 100) * 100;
    return { id: "V" + (1001 + i), date: addDays(today, -Math.floor(i / 2)), type, account: pick(r, accounts), narration: type === "Receipt" ? "Amount received" : type === "Payment" ? "Amount paid" : "Adjustment entry", debit: type === "Payment" ? amt : 0, credit: type === "Receipt" ? amt : type === "Journal" ? amt : 0 };
  });

  const items = [
    ["Cattle feed (bags)", "Feed", 420, "bag", 150, 1450], ["Mineral mixture", "Feed", 90, "kg", 40, 160], ["Ghee", "Product", 380, "kg", 100, 640], ["Paneer", "Product", 120, "kg", 60, 320],
    ["Butter", "Product", 210, "kg", 80, 520], ["Dahi cups 200g", "Product", 1900, "pcs", 600, 22], ["Pouch film roll", "Packing", 14, "roll", 10, 5200], ["CIP caustic soda", "Chemical", 55, "kg", 30, 62],
    ["Nitric acid", "Chemical", 22, "L", 20, 95], ["Diesel", "Fuel", 780, "L", 300, 92], ["Milk cans 40L", "Equipment", 64, "pcs", 20, 1450], ["Lab reagent kit", "Lab", 6, "kit", 8, 3200],
  ].map((x, i) => ({ id: "I" + i, name: x[0] as string, category: x[1] as string, stock: x[2] as number, unit: x[3] as string, reorder: x[4] as number, rate: x[5] as number }));

  const sales = Array.from({ length: 18 }, (_, i) => {
    const it = pick(r, items.filter((x) => x.category === "Product"));
    const qty = Math.round(between(r, 10, 300));
    return { id: "SL" + (501 + i), date: addDays(today, -Math.floor(i / 3)), customer: pick(r, ["Gokul Sweets", "Metro Mart", "City Milk Booth", "Hotel Rajdhani", "Anand Dairy Shop", "Sahyadri Canteen"]), product: it.name, qty, unit: it.unit, rate: it.rate, amount: qty * it.rate, paid: r() > 0.3 };
  });

  const employees = [["Rajesh Kulkarni", "Management", "Plant manager", 62000], ["Neha Desai", "Accounts", "Accountant", 34000], ["Vikas More", "Quality", "Lab chemist", 32000], ["Sagar Patil", "Gate", "Security in-charge", 20000], ["Mohan Shinde", "Reception", "Weighbridge operator", 22000], ["Anita Jadhav", "Processing", "Pasteuriser operator", 26000], ["Pravin Mane", "Processing", "Silo operator", 24000], ["Kiran Pawar", "Stores", "Store keeper", 23000], ["Sanjay Kamble", "Transport", "Fleet supervisor", 28000], ["Dipali Bhosale", "Sales", "Sales executive", 30000]]
    .map((x, i) => ({ id: "E" + i, name: x[0] as string, dept: x[1] as string, role: x[2] as string, salary: x[3] as number, present: r() > 0.15 }));

  const vehicles = Array.from({ length: 8 }, (_, i) => ({ id: "VH" + i, no: "MH 10 " + pick(r, ["AB", "CD", "EF"]) + " " + Math.floor(between(r, 1000, 9999)), type: i % 3 === 0 ? "Insulated tanker 10KL" : i % 3 === 1 ? "Tanker 6KL" : "Pickup van", driver: pick(r, FIRST) + " " + pick(r, LAST), route: route[i % 4], status: (i === 5 ? "Maintenance" : i % 4 === 3 ? "Idle" : "Running") as "Running" | "Idle" | "Maintenance" }));

  const products = [["Pasteurised milk", "L", 0.97], ["Curd (dahi)", "kg", 0.92], ["Paneer", "kg", 0.17], ["Ghee", "kg", 0.045], ["Butter", "kg", 0.05], ["Buttermilk", "L", 0.9]] as const;
  const production = Array.from({ length: 12 }, (_, i) => {
    const p = products[i % products.length];
    const milkIn = Math.round(between(r, 1500, 6000) / 10) * 10;
    return { id: "P" + i, date: addDays(today, -Math.floor(i / 2)), batch: "B" + (2610 - i), product: p[0], milkIn, output: Math.round(milkIn * p[2] * between(r, 0.96, 1.04)), unit: p[1], status: (i === 0 ? "In progress" : i === 1 ? "Planned" : "Completed") as "Planned" | "In progress" | "Completed" };
  });
  const custNames = ["Gokul Sweets", "Metro Mart", "City Milk Booth", "Hotel Rajdhani", "Anand Dairy Shop", "Sahyadri Canteen", "Shree Dairy Distributors", "Sunrise Hospital"];
  const customers = custNames.map((n, i) => ({ id: "CU" + (101 + i), name: n, kind: (["Retail", "Hotel", "Distributor", "Institution"] as const)[i % 4], city: pick(r, ["Sangli", "Kolhapur", "Islampur", "Satara"]), phone: "97" + String(Math.floor(between(r, 10000000, 99999999))), creditLimit: Math.round(between(r, 20, 200)) * 1000, outstanding: Math.round(between(r, 0, 90)) * 1000 }));
  const purchases = Array.from({ length: 10 }, (_, i) => {
    const it = pick(r, items.filter((x) => x.category !== "Product"));
    const qty = Math.round(between(r, 10, 200));
    return { id: "PO" + (301 + i), date: addDays(today, -i), vendor: pick(r, ["Sahyadri Feeds", "Pack-Well Pouches", "CleanChem Supplies", "Bharat Petroleum", "Steel Craft Cans"]), item: it.name, qty, unit: it.unit, rate: it.rate, amount: qty * it.rate, status: (i < 2 ? "Ordered" : i < 6 ? "Received" : "Paid") as "Ordered" | "Received" | "Paid" };
  });
  const services = Array.from({ length: 12 }, (_, i) => ({ id: "SV" + i, date: addDays(today, i < 3 ? i : -i), farmer: farmers[(i * 5) % farmers.length].name, kind: (["Vaccination", "Artificial insemination", "Health check", "Deworming"] as const)[i % 4], animal: "Tag " + (200 + i * 7), vet: pick(r, ["Dr. Kadam", "Dr. Joshi", "Dr. Gaikwad"]), charge: Math.round(between(r, 1, 8)) * 50, status: (i < 3 ? "Scheduled" : "Done") as "Scheduled" | "Done" }));
  const expenses = Array.from({ length: 12 }, (_, i) => ({ id: "EX" + (701 + i), date: addDays(today, -i), head: pick(r, ["Electricity", "Diesel", "Repairs", "Tea and canteen", "Lab consumables", "Transport", "Stationery"]), note: pick(r, ["Monthly bill", "Tanker refuel", "Chiller service", "Staff canteen", "Reagents", "Route allowance"]), amount: Math.round(between(r, 3, 120)) * 100, mode: pick(r, ["Cash", "Bank", "UPI"] as const), status: (i < 3 ? "Pending" : "Approved") as "Pending" | "Approved" }));
  const assets = [["Milk chiller 5KL", "Cooling"], ["Pasteuriser", "Processing"], ["Homogeniser", "Processing"], ["Weighbridge 40T", "Reception"], ["Boiler", "Utilities"], ["DG set 125 kVA", "Utilities"], ["Milk analyser", "Lab"], ["Pouch filling machine", "Packing"]].map((a, i) => ({ id: "AS" + i, name: a[0], category: a[1], location: "Plant block " + (1 + (i % 3)), nextService: addDays(today, Math.round(between(r, -5, 60))), status: (i === 4 ? "Due service" : i === 7 ? "Down" : "Working") as "Working" | "Due service" | "Down" }));
  const users = [["Admin", "admin@kshira.in", "Plant administrator"], ["Neha Desai", "neha@kshira.in", "Accountant"], ["Vikas More", "vikas@kshira.in", "Lab chemist"], ["Sagar Patil", "sagar@kshira.in", "Gate officer"], ["Mohan Shinde", "mohan@kshira.in", "Weighbridge operator"], ["Dipali Bhosale", "dipali@kshira.in", "Sales executive"]].map((u, i) => ({ id: "U" + i, name: u[0], email: u[1], role: u[2], status: (i === 5 ? "Disabled" : "Active") as "Active" | "Disabled", lastLogin: addDays(today, -i) }));

  return { production, customers, purchases, services, expenses, assets, users, farmers, collections, gate, reception, silos, dispatch, vouchers, items, sales, employees, vehicles,morningWeight: []  };
}
