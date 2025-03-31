export interface Business {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  rating: number;
  reviews: number;
  imageUrl: string;
  type: string;
  openingHours: Record<string, string>;
}

export interface BusinessSelectionState {
  selectedBusiness: Business | null;
  selectionConfirmed: boolean;
  selectionTimestamp: number | null;
}

export interface BusinessWithDetails extends Business {
  staff: StaffMember[];
  services: Service[];
  timeSlots: TimeSlot[];
  bookings: Booking[];
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  imageUrl: string;
  bio: string;
  specialties: string[];
}

export interface Service {
  id: string;
  name: string;
  price: number;
  duration: string;
  description: string;
  staffIds: string[];
}

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  staffId: string;
}

export interface Booking {
  id: string;
  staffId: string;
  serviceId: string;
  date: string;
  timeSlotId: string;
  status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
} 