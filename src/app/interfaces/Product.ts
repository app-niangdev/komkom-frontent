import { PaginationMeta } from "../response-type/Type";
import { Category } from "./Category";
import { Store } from "./Store";

export interface SerialNumber {
    id: number;
    serial_number: string;
}

export interface Product{
    id:number;
    name:string;
    image:string;
    image_url?:string;  // URL complète de l'image (retournée par le backend)
    description:string;
    store_id?:number;
    store?:Store;
    category_id?:number;
    category:Category;
    require_serial_number:boolean;
    alert_threshold:number;
    base_unit:string;
    base_unit_quantity:number;
    stock_quantity?:number;  // Alias pour base_unit_quantity pour compatibilité
    unit_price?:number;  // Prix de base du produit
    serial_numbers?:SerialNumber[];  // Numéros de série disponibles
    unit_of_measures:UnitOfMeasures[]
}

export interface ProductResponse{
    data:Product[];
    meta:PaginationMeta;
}


export interface UnitOfMeasures{
    id:number;
    name:string;
    price:number;
    conversion_factor:number;
    is_base_unit:boolean;
}

