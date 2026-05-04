export interface Book {
  id: string;
  title: string;
  description: string;
  price: number;
}

export interface BookInStock {
  productId: string;
  count: number;
}
