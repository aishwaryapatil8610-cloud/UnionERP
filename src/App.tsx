import type * as React from "react";
import { lazy, Suspense, useEffect } from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import AppLayout from "./layout/AppLayout";
import { PageLoader } from "./components/PageLoader";
import { useAuth } from "./context/AuthContext";

const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Guide = lazy(() => import("./pages/Guide"));
const Gate = lazy(() => import("./pages/Gate"));
const Reception = lazy(() => import("./pages/Reception"));
const Silos = lazy(() => import("./pages/Silos"));
const Dispatch = lazy(() => import("./pages/Dispatch"));
const Collection = lazy(() => import("./pages/Collection"));
const Farmers = lazy(() => import("./pages/Farmers"));
const Quality = lazy(() => import("./pages/Quality"));
const Accounting = lazy(() => import("./pages/Accounting"));
const Payments = lazy(() => import("./pages/Payments"));
const Sales = lazy(() => import("./pages/Sales"));
const Inventory = lazy(() => import("./pages/Inventory"));
const Fleet = lazy(() => import("./pages/Fleet"));
const HR = lazy(() => import("./pages/HR"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));
const RateChart = lazy(() => import("./pages/RateChart"));
const Production = lazy(() => import("./pages/Production"));
const Customers = lazy(() => import("./pages/Customers"));
const Purchases = lazy(() => import("./pages/Purchases"));
const Services = lazy(() => import("./pages/Services"));
const Expenses = lazy(() => import("./pages/Expenses"));
const Assets = lazy(() => import("./pages/Assets"));
const Users = lazy(() => import("./pages/Users"));
const CreateAccount = lazy(() => import("./pages/CreateAccount"));
const Contact = lazy(() => import("./pages/Contact"));
const NotFound = lazy(() => import("./pages/NotFound"));
const MorningWeight = lazy(() => import("./rmrd-transaction/MorningWeight"));
const MorningQuality = lazy(() => import("./rmrd-transaction/MorningQuality"));
const RMRD = lazy(() => import("./rmrd-transaction/RMRD"));
const DebitVoucher = lazy(() => import("./rmrd-transaction/DebitVoucher"));
const BillProcess = lazy(() => import("./rmrd-transaction/BillProcess"));
const FarmerCollection = lazy(() => import("./rmrd-report/FarmerCollection"));
const SalesOrder = lazy(() => import("./sales-master/SalesOrder"));



const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: "auto" }); }, [pathname]);
  return null;
};

const Protected: React.FC = () => {
  const { user } = useAuth();
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  const { user } = useAuth();
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
          <Route path="/create-account" element={user ? <Navigate to="/" replace /> : <CreateAccount />} />
          <Route path="/contact" element={<Contact />} />
          <Route element={<Protected />}>
            <Route element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="guide" element={<Guide />} />
              <Route path="gate" element={<Gate />} />
              <Route path="reception" element={<Reception />} />
              <Route path="silos" element={<Silos />} />
              <Route path="dispatch" element={<Dispatch />} />
              <Route path="collection" element={<Collection />} />
              <Route path="farmers" element={<Farmers />} />
              <Route path="quality" element={<Quality />} />
              <Route path="accounting" element={<Accounting />} />
              <Route path="payments" element={<Payments />} />
              <Route path="sales" element={<Sales />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="fleet" element={<Fleet />} />
              <Route path="hr" element={<HR />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
              <Route path="rates" element={<RateChart />} />
              <Route path="production" element={<Production />} />
              <Route path="customers" element={<Customers />} />
              <Route path="purchases" element={<Purchases />} />
              <Route path="services" element={<Services />} />
              <Route path="expenses" element={<Expenses />} />
              <Route path="assets" element={<Assets />} />
              <Route path="users" element={<Users />} />
              <Route path="support" element={<Contact embedded />} />
              <Route path="morning-weight" element={<MorningWeight />} />
              <Route path="morning-quality" element={<MorningQuality />} />
              <Route path="rmrd" element={<RMRD />} />
              <Route path="debit-voucher" element={<DebitVoucher />} />
              <Route path="bill-process" element={<BillProcess />} />
              <Route path="farmer-collection" element={<FarmerCollection />} />
              <Route path="sales-order" element={<SalesOrder />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </>
  );
};

export default App;
