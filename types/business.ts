export enum BusinessType {
  HAIR_SALON = 'HAIR_SALON',
  NAIL_SALON = 'NAIL_SALON',
  SPA = 'SPA',
  MASSAGE = 'MASSAGE',
  BEAUTY_SALON = 'BEAUTY_SALON',
  BARBERSHOP = 'BARBERSHOP',
  WELLNESS_CENTRE = 'WELLNESS_CENTRE',
  AESTHETICS_CLINIC = 'AESTHETICS_CLINIC',
  YOGA_STUDIO = 'YOGA_STUDIO',
  FITNESS_CENTRE = 'FITNESS_CENTRE',
  TATTOO_STUDIO = 'TATTOO_STUDIO',
  BROW_BAR = 'BROW_BAR',
  LASH_STUDIO = 'LASH_STUDIO',
  TANNING_SALON = 'TANNING_SALON',
  OTHER = 'OTHER'
}

export interface Service {
  name: string;
  price: number;
  duration: string;
}

export interface Business {
  id: string;
  name: string;
  imageUrl: string;
  rating: number;
  reviews: number;
  description: string;
  services: Service[];
  openingHours: {
    [key: string]: string;
  };
  address: string;
  type: BusinessType;
} 