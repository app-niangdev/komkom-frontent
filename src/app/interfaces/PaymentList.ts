import { PaginationMeta } from '../response-type/Type';

export interface PaymentInvoice {
  id: number;
  invoice_number: string;
  invoice_status: string;
  amount_total: number;
  amount_paid: number;
  balance: number;
}

export interface PaymentUser {
  id: number;
  name: string;
}

export interface PaymentListItem {
  id: number;
  date: string;
  amount: number;
  payment_type: string;
  created_at: string;
  invoice: PaymentInvoice | null;
  customer: string;
  user: PaymentUser | null;
}

export interface PaymentListFilters {
  search?: string;
  date?: string;
  start_date?: string;
  end_date?: string;
  payment_type?: string;
}

export type ResponsePaymentList = {
  status: boolean;
  data: PaymentListItem[];
  totalAmount: number;
  meta: PaginationMeta;
};
