import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import BookingScreen from '../../../app/booking/[id]';
import { doc, onSnapshot, collection } from 'firebase/firestore';
import { db, auth } from '../../../firebase-config';

// Add type declarations for jest
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeTruthy(): R;
    }
  }
}

// Mock the expo-router hooks
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  useRouter: jest.fn(),
  useNavigation: jest.fn(),
  Stack: {
    Screen: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  },
}));

// Mock Firebase
jest.mock('../../../firebase-config', () => ({
  db: {},
  auth: {
    currentUser: {
      uid: 'test-user-id',
      email: 'test@example.com',
    },
  },
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  onSnapshot: jest.fn(),
  collection: jest.fn(),
  writeBatch: jest.fn(() => ({
    set: jest.fn(),
    commit: jest.fn(),
  })),
}));

// Define types for mock data
interface MockBooking {
  id: string;
  date: string;
  startTime: string;
  staffId: string;
  status: string;
}

// Mock data
const mockBusiness = {
  id: 'test-business-id',
  name: 'Test Business',
  address: '123 Test St',
};

const mockStaff = [
  {
    id: 'staff-1',
    name: 'John Doe',
    role: 'Stylist',
    imageUrl: 'https://example.com/image.jpg',
    bio: 'Experienced stylist',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  },
];

const mockServices = [
  {
    id: 'service-1',
    name: 'Haircut',
    price: 30,
    duration: 30,
    description: 'Basic haircut service',
    staffIds: ['staff-1'],
  },
];

const mockBookings: MockBooking[] = [];

describe('BookingScreen', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: 'test-business-id' });
    (useRouter as jest.Mock).mockReturnValue({});
    (useNavigation as jest.Mock).mockReturnValue({
      goBack: jest.fn(),
    });

    // Mock Firebase onSnapshot to return mock data
    (onSnapshot as jest.Mock).mockImplementation((ref, callback) => {
      if (ref.path.includes('businesses/test-business-id')) {
        callback({
          exists: () => true,
          data: () => mockBusiness,
        });
      } else if (ref.path.includes('staff')) {
        callback({
          docs: mockStaff.map(staff => ({
            id: staff.id,
            data: () => staff,
          })),
        });
      } else if (ref.path.includes('services')) {
        callback({
          docs: mockServices.map(service => ({
            id: service.id,
            data: () => service,
          })),
        });
      } else if (ref.path.includes('bookings')) {
        callback({
          docs: mockBookings.map(booking => ({
            id: booking.id,
            data: () => booking,
          })),
        });
      }
      return () => {};
    });
  });

  it('renders loading state initially', () => {
    const { getByText } = render(<BookingScreen />);
    expect(getByText('Loading booking details...')).toBeTruthy();
  });

  it('renders business details after loading', async () => {
    const { getByText } = render(<BookingScreen />);
    
    await waitFor(() => {
      expect(getByText('Test Business')).toBeTruthy();
      expect(getByText('123 Test St')).toBeTruthy();
    });
  });

  it('renders service selection after loading', async () => {
    const { getByText } = render(<BookingScreen />);
    
    await waitFor(() => {
      expect(getByText('Select Service')).toBeTruthy();
      expect(getByText('Haircut')).toBeTruthy();
      expect(getByText('€30')).toBeTruthy();
    });
  });

  it('allows service selection', async () => {
    const { getByText } = render(<BookingScreen />);
    
    await waitFor(() => {
      const serviceButton = getByText('Haircut');
      fireEvent.press(serviceButton);
    });

    await waitFor(() => {
      expect(getByText('Select Staff Member')).toBeTruthy();
      expect(getByText('John Doe')).toBeTruthy();
    });
  });

  it('allows staff selection after service selection', async () => {
    const { getByText } = render(<BookingScreen />);
    
    await waitFor(() => {
      const serviceButton = getByText('Haircut');
      fireEvent.press(serviceButton);
    });

    await waitFor(() => {
      const staffButton = getByText('John Doe');
      fireEvent.press(staffButton);
    });

    await waitFor(() => {
      expect(getByText('Select Date & Time')).toBeTruthy();
    });
  });

  it('shows payment modal when confirming booking', async () => {
    const { getByText } = render(<BookingScreen />);
    
    // Select service
    await waitFor(() => {
      const serviceButton = getByText('Haircut');
      fireEvent.press(serviceButton);
    });

    // Select staff
    await waitFor(() => {
      const staffButton = getByText('John Doe');
      fireEvent.press(staffButton);
    });

    // Select first available time slot
    await waitFor(() => {
      const timeSlot = getByText('09:00');
      fireEvent.press(timeSlot);
    });

    // Click confirm booking
    const confirmButton = getByText('Confirm Booking');
    fireEvent.press(confirmButton);

    await waitFor(() => {
      expect(getByText('Payment Details')).toBeTruthy();
    });
  });

  it('validates card number input', async () => {
    const { getByText, getByPlaceholderText } = render(<BookingScreen />);
    
    // Navigate to payment modal
    await waitFor(() => {
      const serviceButton = getByText('Haircut');
      fireEvent.press(serviceButton);
    });

    await waitFor(() => {
      const staffButton = getByText('John Doe');
      fireEvent.press(staffButton);
    });

    await waitFor(() => {
      const timeSlot = getByText('09:00');
      fireEvent.press(timeSlot);
    });

    const confirmButton = getByText('Confirm Booking');
    fireEvent.press(confirmButton);

    // Enter invalid card number
    await waitFor(() => {
      const cardInput = getByPlaceholderText('1234567890123456');
      fireEvent.changeText(cardInput, '1234');
    });

    // Try to submit
    const payButton = getByText('Pay €30');
    fireEvent.press(payButton);

    await waitFor(() => {
      expect(getByText('Please enter a valid 16-digit card number')).toBeTruthy();
    });
  });

  it('processes payment successfully', async () => {
    const { getByText, getByPlaceholderText } = render(<BookingScreen />);
    
    // Navigate to payment modal
    await waitFor(() => {
      const serviceButton = getByText('Haircut');
      fireEvent.press(serviceButton);
    });

    await waitFor(() => {
      const staffButton = getByText('John Doe');
      fireEvent.press(staffButton);
    });

    await waitFor(() => {
      const timeSlot = getByText('09:00');
      fireEvent.press(timeSlot);
    });

    const confirmButton = getByText('Confirm Booking');
    fireEvent.press(confirmButton);

    // Enter valid payment details
    await waitFor(() => {
      const cardInput = getByPlaceholderText('1234567890123456');
      fireEvent.changeText(cardInput, '1234567890123456');
      
      const expiryInput = getByPlaceholderText('MM/YY');
      fireEvent.changeText(expiryInput, '12/25');
      
      const cvvInput = getByPlaceholderText('123');
      fireEvent.changeText(cvvInput, '123');
      
      const nameInput = getByPlaceholderText('John Doe');
      fireEvent.changeText(nameInput, 'John Doe');
    });

    // Submit payment
    const payButton = getByText('Pay €30');
    fireEvent.press(payButton);

    await waitFor(() => {
      expect(getByText('Booking Confirmed!')).toBeTruthy();
    });
  });
}); 