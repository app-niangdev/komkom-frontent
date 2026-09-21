// reporting.ts

export interface ReportingResponse {
  data: ReportingData;
}

/* =======================
   GLOBAL DATA
======================= */
export interface ReportingData {
  invoiceStats: InvoiceStats;
  getAllStatistics: GlobalStatistics;
}

/* =======================
   INVOICE STATS (YEARLY / MONTHLY / CUSTOM)
======================= */
export interface InvoiceStats {
  summary_type: 'yearly' | 'monthly' | 'custom' | 'custom_grouped' | 'custom_direct';
  year?: string;
  start_date?: string;
  end_date?: string;
  summary_data: InvoiceSummaryItem | InvoiceSummaryItem[];
}

export interface InvoiceSummaryItem {
  month?: string;
  period?: string; // Pour les périodes personnalisées
  year?: number;
  start_date: string; // ISO date (YYYY-MM-DD)
  end_date: string;   // ISO date (YYYY-MM-DD)

  invoice_count: number;
  active_invoice_count: number;
  cancelled_invoice_count: number;

  total_amount: number;
  total_paid: number;
  total_unpaid: number;
  total_cancel: number;

  payment_rate: number; // percentage (0 - 100)
}

/* =======================
   GLOBAL STATISTICS
======================= */
export interface GlobalStatistics {
  customers: number;
  suppliers: number;
  products: number;

  invoices: InvoiceStatistics;
  sales: SalesStatistics;
  amounts: AmountsStatistics;

  stock_value: number; // valeur cumulée du stock actuel (Fcfa)

  updated_at: string; // datetime string
}

/* =======================
   INVOICE GLOBAL STATS
======================= */
export interface InvoiceStatistics {
  total: number;
  paid: number;
  no_paid: number;
  partial: number;
  cancelled: number;
}

/* =======================
   SALES GLOBAL STATS
======================= */
export interface SalesStatistics {
  confirmed: number;
  pending: number;
  cancelled: number;

  confirmed_amount: number;
  pending_amount: number;

  total_count: number;
}


export interface AmountsStatistics {
  total_amount: number;
  total_paid: number;
  total_unpaid: number;
  payment_rate: number;
}
