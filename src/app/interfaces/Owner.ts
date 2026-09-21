import { Company } from "./Company";
import { User } from "./User";

export interface Owner{
    id:number|null;
    user_id:number;
    user:User;
    company:Company;
}

export type OwnerResponse={
    data:Owner[]
}
