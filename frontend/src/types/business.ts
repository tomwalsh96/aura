export type BusinessType = 'barber' | 'hairstylist';

export interface Business {
  id: string;
  name: string;
  type: BusinessType;
  description: string;
  address: string;
  rating: number;
  reviews: number;
  imageUrl: string;
  services: {
    name: string;
    price: number;
    duration: string;
  }[];
  openingHours: {
    [key: string]: string;
  };
} 