
export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

export interface Product {
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  status?: 'New' | 'Sale';
}
