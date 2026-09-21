import { PaginationMeta } from "../response-type/Type";

export interface Supplier{
    id:number;
    name:string;
    address:string;
    phone_one:string;
    phone_two:string;
    email:string;
    store_id:number;
}

export interface SupplierResponse{
    data:Supplier[];
    meta:PaginationMeta;
}


