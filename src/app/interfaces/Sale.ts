import { PaginationMeta } from "../response-type/Type";
import { Customer } from "./Customer";
import { Product } from "./Product";

export interface Sale{
    id:number;
    customer:Customer;
    discount:number;
    gross_amount:number;
    sale_date:string;
    status:string;
    total_amount:number;
    user_seller:string;
}

export type SaleResponse={
  data:Sale[]
  meta:PaginationMeta
}

// Interface pour les numéros de série d'un article vendu
export interface SaleSerialNumber {
  id: number;
  product_id: number;
  supply_line_item_id: number;
  sale_line_item_id: number;
  serial_number: string;
  is_sold: boolean;
}

// Interface pour les articles d'une vente (sale_line_items)
export interface SaleLineItem {
  id: number;
  sale_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product: Product;
  serial_numbers: SaleSerialNumber[];
}

// Interface pour les détails complets d'une vente
export interface SaleDetails {
  id: number;
  store_id: number;
  seller_id: number;
  sale_number: string;
  gross_amount: number;
  discount: number;
  total_amount: number;
  status: string;
  customer_id: number;
  status_payment: string;
  created_at: string;
  customer: Customer | null;
  sale_line_items: SaleLineItem[];
}

// Type pour la réponse API des détails de vente
export type SaleDetailsResponse = {
  data: SaleDetails;
}

export interface SaleProductModalData {
  product: Product;
  quantity: number;
  unit_price_at_sale: number;
  serial_numbers: string[];  // Numéros de série en string
  isUpdate: boolean;
  selected_unit_of_measure_id?: number;  // ID de l'unité de mesure sélectionnée
  uses_measurements?: boolean;
}

export interface SaleItemWithProduct {
  product: Product;
  quantity: number;
  unit_price_at_sale: number;
  serial_numbers: string[];  // Numéros de série en string
  unit_of_measure_id: number;  // ID de l'unité de mesure utilisée
  base_unit_quantity: number;  // Quantité convertie en unité de base
}
