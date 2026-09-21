import { PaginationMeta } from "../response-type/Type";

export interface Expense{
  id:number;
  title:string;
  description:string;
  amount:number;
  store_id:number;
  expense_date:string;
}


export type ResponseExpense = {
  data:Expense[];
  status: boolean,
	todayTotal: number,
	today: string,
	meta:PaginationMeta
}


