import { PaginationMeta } from "../response-type/Type";
import { Product } from "./Product";
import { Supplier } from "./Supplier";

export interface Procurement{
  id: number;
  order_number: string;
  store: string;
  supplier: Supplier;
  status: 'pending' | 'received' | 'cancelled';
  total_amount: number;
  created_at: string;
  user: string;
  line_items: SupplyLineItemResponse[];
}

export interface SupplyLineItemResponse {
  product: Product;
  quantity: string;
  purchase_price: number;
  total: number;
  serial_numbers: string[];
}

export interface ProcurementResponse{
  data:Procurement[];
  meta:PaginationMeta;
}

export interface AddProcurement {
  store_id: number;
  supplier_id: number;
  status: 'pending' | 'completed' | 'cancelled';
  line_items: AddSupplyLineItem[];
}

export interface AddSupplyLineItem {
  product_id: number;
  quantity: number;
  purchase_price: number;
  serial_numbers?: string[];
}

