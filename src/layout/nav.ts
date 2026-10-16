export interface NavItem { to: string; label: string; emoji: string; hint: string }
export interface NavGroup { title: string; emoji: string; items: NavItem[] }

export const NAV: NavGroup[] = [
  {
    title: 'Overview', emoji: '🏠',
    items: [
      { to: '/', label: 'Dashboard', emoji: '📈', hint: 'Plant status at a glance' },
      { to: '/guide', label: 'How to use', emoji: '📖', hint: 'Module by module guide' },
    ],
  },
  {
    title: 'Gate and receiving', emoji: '🚛',
    items: [
      { to: '/gate', label: 'Gate entry', emoji: '🚪', hint: 'Vehicle and visitor register' },
      { to: '/reception', label: 'Milk reception', emoji: '🥛', hint: 'Weigh, test, accept tankers' },
      { to: '/silos', label: 'Silos and stock', emoji: '🛢️', hint: 'Live tank levels' },
      { to: '/dispatch', label: 'Dispatch', emoji: '🚚', hint: 'Milk going out' },

    ],
  },
  {
    title: 'Procurement', emoji: '🐄',
    items: [
      { to: '/collection', label: 'Machine collection', emoji: '📟', hint: 'Farmer-wise litres, fat, SNF' },
      { to: '/farmers', label: 'Farmers', emoji: '👨‍🌾', hint: 'Supplier master' },
      { to: '/rates', label: 'Rate chart', emoji: '💹', hint: 'Fat and SNF price grid' },
      { to: '/quality', label: 'Quality lab', emoji: '🔬', hint: 'Fat, SNF and rejections' },
      { to: '/services', label: 'Farmer services', emoji: '💉', hint: 'Vet, vaccination, AI visits' },
    ],
  },
  {
    title: 'Production and stores', emoji: '🏭',
    items: [
      { to: '/production', label: 'Production', emoji: '🧈', hint: 'Batches and yield' },
      { to: '/inventory', label: 'Inventory', emoji: '📦', hint: 'Feed, packing, chemicals' },
      { to: '/purchases', label: 'Purchases', emoji: '🛒', hint: 'Vendor purchase orders' },
    ],
  },
  {
    title: 'Sales', emoji: '🧾',
    items: [
      { to: '/sales', label: 'Sales', emoji: '🧾', hint: 'Invoices and receivables' },
      { to: '/customers', label: 'Customers', emoji: '🤝', hint: 'Customer master and credit' },
    ],
  },
  {
    title: 'Finance', emoji: '💰',
    items: [
      { to: '/accounting', label: 'Accounting', emoji: '📒', hint: 'Vouchers and balance' },
      { to: '/payments', label: 'Farmer payments', emoji: '💸', hint: '10-day payout cycle' },
      { to: '/expenses', label: 'Expenses', emoji: '🧮', hint: 'Daily expenses and approvals' },
    ],
  },
  {
    title: 'Operations', emoji: '⚙️',
    items: [
      { to: '/fleet', label: 'Fleet', emoji: '🚐', hint: 'Tankers and drivers' },
      { to: '/assets', label: 'Assets and service', emoji: '🔧', hint: 'Machines and maintenance' },
      { to: '/hr', label: 'HR and payroll', emoji: '👥', hint: 'Staff, attendance, salary' },
    ],
  },
  {
    title: 'Insight and admin', emoji: '🧭',
    items: [
      { to: '/reports', label: 'Reports', emoji: '📊', hint: 'Charts, tables, CSV, print' },
      { to: '/users', label: 'Users and roles', emoji: '🔐', hint: 'Who can use the ERP' },
      { to: '/settings', label: 'Settings', emoji: '🎛️', hint: 'Theme and limits' },
      { to: '/support', label: 'Help and contact', emoji: '💬', hint: 'Raise a support request' },
    ],
  },



  {
    title: 'Transaction', emoji: '🚛',
    items: [
      { to: '/morning-weight', label: 'Morning Weight', emoji: '⚖️', hint: 'Morning milk weight entry and farmer-wise records' },
      { to: '/morning-quality', label: 'Morning Quality', emoji: '🧪', hint: 'Morning milk Quality entry and farmer-wise records' },
      { to: '/rmrd', label: 'RMRD', emoji: '🥛', hint: 'RMRD entry and farmer-wise records' },
      { to: '/debit-voucher', label: 'Debit Voucher', emoji: '📋', hint: 'Debit Voucher entry and farmer-wise records' },
      { to: '/bill-process', label: 'Bill Process', emoji: '🧾', hint: 'Debit Voucher entry and farmer-wise records' },
    ],
  },

  {
    title: 'Report', emoji: '📊',
    items: [
      { to: '/farmer-collection', label: 'Farmer Collection', emoji: '📈', hint: 'farmer collection entry and farmer-wise records' },
    ],
  },

    {
    title: 'Sales', emoji: '📊',
    items: [
      { to: '/sales-order', label: 'Sales Order', emoji: '📈', hint: 'sales order entry and farmer-wise records' },
    ],
  },



];

export const ALL_ITEMS: NavItem[] = NAV.flatMap((g) => g.items);
