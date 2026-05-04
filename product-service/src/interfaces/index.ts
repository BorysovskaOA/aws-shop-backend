export interface Book {
  id: string;
  title: string;
  description: string;
  price: number;
  count: number;
}

export interface BookDB {
  id: string;
  title: string;
  description: string;
  price: number;
}

export interface BookInStockDB {
  product_id: string;
  count: number;
}
