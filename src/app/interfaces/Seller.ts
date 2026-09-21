import { User } from "./User";

export interface Seller{
    id:number|null;
    user_id:number;
    user:User;
    store_id:number;
    // stores:Store[]
}
