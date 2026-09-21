import { PaginationMeta } from '../response-type/Type';
import { Manager } from './Manager';

export interface Store {
  id: number;
  company_id: number;
  name: string;
  slogan?: string | null;
  address: string;
  phone_one: string;
  phone_two?: string | null;
  phone_three?: string | null;
  email?: string | null;
  active: boolean;
  uses_measurements?: boolean;
  use_company_logo?: boolean;
  use_company_colors?: boolean;
  primary_color?: string | null;
  secondary_color?: string | null;
  logo_url?: string | null;
  effective_primary_color?: string | null;
  effective_secondary_color?: string | null;
  nb_sales: number;
  nb_products: number;
  nb_managers: number;
  nb_suppliers: number;
  managers: Manager[];
}

export type StoreResponse = {
  data: Store[];
  meta: PaginationMeta;
};
