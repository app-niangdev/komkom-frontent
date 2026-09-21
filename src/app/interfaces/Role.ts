export interface Role{
    id:number|null;
    name:string;
}

export type RoleResponse={
    data:Role[]
}