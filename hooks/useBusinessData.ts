import React from 'react';
import { doc, onSnapshot, collection } from 'firebase/firestore';
import { db } from '../firebase-config';

// Define interfaces
export interface Business {
  id: string;
  name: string;
  description: string;
  address: string;
  imageUrl: string;
  rating: number;
  reviews: number;
  openingHours: Record<string, string>;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  imageUrl: string;
  bio: string;
  workingDays: string[];
}

export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  description: string;
  staffIds: string[];
}

/**
 * Custom hook for fetching business data including staff and services
 * @param businessId - The ID of the business to fetch data for
 * @returns An object containing business, staff, services, loading state, and error
 */
export const useBusinessData = (businessId: string) => {
  const [business, setBusiness] = React.useState<Business | null>(null);
  const [staff, setStaff] = React.useState<StaffMember[]>([]);
  const [services, setServices] = React.useState<Service[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setLoading(true);
    setError(null);

    // Set up real-time listener for business document
    const unsubscribeBusiness = onSnapshot(
      doc(db, 'businesses', businessId),
      (doc) => {
        if (doc.exists()) {
          setBusiness({ id: doc.id, ...doc.data() } as Business);
        } else {
          setError('Business not found');
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error listening to business:', err);
        setError('Failed to load business details');
        setLoading(false);
      }
    );

    // Set up real-time listener for staff subcollection
    const unsubscribeStaff = onSnapshot(
      collection(db, 'businesses', businessId, 'staff'),
      (snapshot) => {
        if (snapshot && snapshot.docs) {
          const staffData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as StaffMember[];
          setStaff(staffData);
        } else {
          setStaff([]);
        }
      },
      (err) => {
        console.error('Error listening to staff:', err);
        setStaff([]);
      }
    );

    // Set up real-time listener for services subcollection
    const unsubscribeServices = onSnapshot(
      collection(db, 'businesses', businessId, 'services'),
      (snapshot) => {
        if (snapshot && snapshot.docs) {
          const servicesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Service[];
          setServices(servicesData);
        } else {
          setServices([]);
        }
      },
      (err) => {
        console.error('Error listening to services:', err);
      }
    );

    // Cleanup subscriptions on unmount
    return () => {
      unsubscribeBusiness();
      unsubscribeStaff();
      unsubscribeServices();
    };
  }, [businessId]);

  return { business, staff, services, loading, error };
}; 