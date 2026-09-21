import { PaginationMeta } from '../response-type/Type';
import { Product } from './Product';
import { SaleLineItem } from './Sale';

export interface SerialNumber {
  id: number;
  product_id: number;
  product: Product;
  supply_line_item_id: number;
  sale_line_item_id: number;
  sale_line_item: SaleLineItem;
  serial_number: string;
  is_sold: boolean;
}

export interface SerialNumberResponse {
  data: FormatSerialNumber[];
  meta: PaginationMeta;
}

export interface FormatSerialNumber {
  id: number;
  product_name: string;
  product_description: string;
  // supply_line_item_id: number;
  created_at: string;
  serial_number: string;
  is_sold: boolean;
}

export interface PayloadUpdateSerialNumber {
  id: number;
  store_id: number;
  serial_number: string;
}
