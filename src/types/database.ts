// Hand-written types matching supabase/migrations/0001_init.sql.
// Regenerate with `supabase gen types typescript` once the project is linked, if preferred.

export type Customer = {
  id: string;
  name: string;
  display_name: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type Product = {
  id: string;
  name: string;
  unit: "adet" | "m2";
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type CustomerProduct = {
  id: string;
  customer_id: string;
  product_id: string;
  unit_price: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type DailyRecord = {
  id: string;
  customer_id: string;
  record_date: string; // YYYY-MM-DD
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type DailyRecordItem = {
  id: string;
  daily_record_id: string;
  product_id: string;
  quantity: number;
  unit_price_snapshot: number;
  line_total: number;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      customers: { Row: Customer; Insert: Partial<Customer>; Update: Partial<Customer> };
      products: { Row: Product; Insert: Partial<Product>; Update: Partial<Product> };
      customer_products: {
        Row: CustomerProduct;
        Insert: Partial<CustomerProduct>;
        Update: Partial<CustomerProduct>;
      };
      daily_records: { Row: DailyRecord; Insert: Partial<DailyRecord>; Update: Partial<DailyRecord> };
      daily_record_items: {
        Row: DailyRecordItem;
        Insert: Partial<DailyRecordItem>;
        Update: Partial<DailyRecordItem>;
      };
    };
  };
};
