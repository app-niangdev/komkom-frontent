import { PaginationMeta } from "../response-type/Type";
import { Manager } from "./Manager";
import { Role } from "./Role";
import { Seller } from "./Seller";

export interface User{
    id:number;
    full_name:string;
    first_name:string;
    last_name:string;
    email:string;
    image_url:string;
    phone_number_one:string;
    phone_number_two:string;
    status:boolean;
    address:string;
    gender:string;
    date_of_birth:string;
    role_id:number;
    role:Role
    profile_photo_path:string,
    profile_photo_url:string,
    birth_date:string;
    birth_place:string;
    nationality:string;
    type:string;
    seller:Seller;
    manager:Manager;
  }

export interface UserResponse{
  data:User[];
  meta:PaginationMeta
}


