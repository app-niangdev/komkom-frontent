import { Owner } from "./Owner";
import { Store } from "./Store";
import { PaginationMeta } from "../response-type/Type";

export interface Company{
    id:number;
    name:string;
    short_name:string;
    slogan:string;
    head_office_address:string;
    email:string;
    phone_one:string;
    phone_two:string;
    owner_id:number;
    logo_url:string;
    primary_color?:string;
    secondary_color?:string;
    owner:Owner;
    stores:Store[];
}

export interface CompanyResponse{
    meta:PaginationMeta;
    data:Company[];
}

export interface RequestCompanyOwner {
  first_name: string;
  last_name: string;
  email: string;
  phone_number_one: string;
  phone_number_two: string;
  address: string;
  gender: 'male' | 'female' | string;
  name: string;
  short_name: string;
  slogan: string;
  head_office_address: string;
  email_company: string;
  phone_one: string;
  phone_two: string;
}





