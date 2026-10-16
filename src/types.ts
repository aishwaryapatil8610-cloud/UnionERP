export type MilkKind = "Cow" | "Buffalo" | "Mixed";
export interface Farmer { id: string; name: string; village: string; centre: string; milk: MilkKind; phone: string; advance: number }
export interface Collection { id: string; date: string; shift: "Morning" | "Evening"; time: string; farmerId: string; centre: string; qty: number; fat: number; snf: number; rate: number; amount: number }
export type GateType = "Milk tanker in" | "Milk tanker out" | "Cattle feed / goods" | "Staff vehicle" | "Visitor";
export interface Gate { id: string; date: string; timeIn: string; timeOut: string; vehicle: string; driver: string; type: GateType; party: string; purpose: string; status: "Inside" | "Exited" }
export interface Reception { id: string; date: string; tanker: string; route: string; qty: number; fat: number; snf: number; temp: number; acidity: number; silo: string; status: "Accepted" | "Rejected" | "Pending" }
export interface Silo { id: string; name: string; kind: string; capacity: number; level: number; temp: number }
export interface Dispatch { id: string; date: string; tanker: string; to: string; qty: number; fat: number; snf: number; status: "Loading" | "On route" | "Delivered" }
export interface Voucher { id: string; date: string; type: "Receipt" | "Payment" | "Journal"; account: string; narration: string; debit: number; credit: number }
export interface Item { id: string; name: string; category: string; stock: number; unit: string; reorder: number; rate: number }
export interface Sale { id: string; date: string; customer: string; product: string; qty: number; unit: string; rate: number; amount: number; paid: boolean }
export interface Employee { id: string; name: string; dept: string; role: string; salary: number; present: boolean }
export interface Vehicle { id: string; no: string; type: string; driver: string; route: string; status: "Running" | "Idle" | "Maintenance" }
export interface Production { id: string; date: string; batch: string; product: string; milkIn: number; output: number; unit: string; status: "Planned" | "In progress" | "Completed" }
export interface Customer { id: string; name: string; kind: "Retail" | "Hotel" | "Distributor" | "Institution"; city: string; phone: string; creditLimit: number; outstanding: number }
export interface Purchase { id: string; date: string; vendor: string; item: string; qty: number; unit: string; rate: number; amount: number; status: "Ordered" | "Received" | "Paid" }
export interface Service { id: string; date: string; farmer: string; kind: "Vaccination" | "Artificial insemination" | "Health check" | "Deworming"; animal: string; vet: string; charge: number; status: "Scheduled" | "Done" }
export interface Expense { id: string; date: string; head: string; note: string; amount: number; mode: "Cash" | "Bank" | "UPI"; status: "Pending" | "Approved" }
export interface Asset { id: string; name: string; category: string; location: string; nextService: string; status: "Working" | "Due service" | "Down" }
export interface AppUser { id: string; name: string; email: string; role: string; status: "Active" | "Disabled"; lastLogin: string }
export interface DB {
  production: Production[]; customers: Customer[]; purchases: Purchase[]; services: Service[]; expenses: Expense[]; assets: Asset[]; users: AppUser[];
  farmers: Farmer[]; collections: Collection[]; gate: Gate[]; reception: Reception[]; silos: Silo[]; dispatch: Dispatch[];
  vouchers: Voucher[]; items: Item[]; sales: Sale[]; employees: Employee[]; vehicles: Vehicle[];   morningWeight: MorningWeight[];
}

export interface MorningWeight {
  id: string;
  CodeNo: number;
  Date: string;
  MCCId: string;
  RouteId: string;
  FarmerId: string;
  AcName: string;
  Shift: string;
  MilkType: string;
  Arrival: string;
  ViaTank: string;
  CanIn: number;
  AcceptedCan: number;
  SourMilkKilo: number;
  SourMilkLiter: number;
  WeightKilo: number;
  WeightLiter: number;
}
export type DBKey = keyof DB;
