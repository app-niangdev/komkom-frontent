import { Invoice } from "./Invoice";

export interface Payment{
    id:number | undefined;
    date:string;
    amount:number;
    invoice_id:number;
    payment_type:string; //(wave, OM, cash)
    phone_number:number;
    user_id:number;
    invoice:Invoice
}

export interface PaymentReceipt {
    id: number;
    date: string;
    amount: number;
    invoice_id: number;
    payment_type: string;
    user_id: number;
}

export interface SaleLineItem {
    id: number;
    product_id: number;
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    serial_numbers?: string[];
}

export interface Sale {
    id: number;
    sale_date: string;
    discount: number;
    total_amount: number;
    status: string;
    line_items?: SaleLineItem[];
}

export interface Customer {
    id: number;
    name: string;
    phone: string;
    email: string | null;
}

export interface DetailPayment {
    success: boolean;
    data: {
        invoice: Invoice;
        sale: Sale;
        customer: Customer;
        payments: Payment[];
    };
}
