import { PaginationMeta } from "../response-type/Type";

export interface Category{
    id:number;
    name:string;
    description:string;
    store_id:number;
}

export interface CategoryResponse{
    data:Category[];
    meta:PaginationMeta;
}


