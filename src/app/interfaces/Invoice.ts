import { PaginationMeta } from '../response-type/Type';
import { Customer } from './Customer';
import { PaymentReceipt } from './Payment';

export interface Invoice {
  id: number;
  invoice_number: string;
  customer_name: string;
  customer: Customer;
  date: string;
  balance: number;
  amount_paid: number;
  invoice_status: string;
  sale_id: string;
  amount_total: number;
  payment_receipts: PaymentReceipt[];
}

export type ResponseInvoice = {
  data: Invoice[];
  meta: PaginationMeta;
};
