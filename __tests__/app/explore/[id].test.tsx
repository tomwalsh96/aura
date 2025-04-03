import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { useLocalSearchParams, router } from 'expo-router';
import BusinessDetailScreen from '../../../app/explore/[id]';
import { useBusinessData } from '../../../hooks/useBusinessData';

// Mock expo-router
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  router: {
    push: jest.fn(),
  },
}));

// Mock useBusinessData hook
jest.mock('../../../hooks/useBusinessData');

describe('BusinessDetailScreen', () => {
  const mockBusinessId = 'test-business-id';
  const mockBusiness = {
    id: mockBusinessId,
    name: 'Test Business',
    description: 'Test Description',
    address: 'Test Address',
    imageUrl: 'test-image.jpg',
    rating: 4.5,
    reviews: 100,
    openingHours: {
      Monday: '9:00-17:00',
      Tuesday: '9:00-17:00',
    },
  };

  const mockStaff = [
    {
      id: 'staff-1',
      name: 'John Doe',
      role: 'Stylist',
      imageUrl: 'staff-1.jpg',
      bio: 'Experienced stylist',
      workingDays: ['Monday', 'Tuesday'],
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

  beforeEach(() => {
    jest.clearAllMocks();
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: mockBusinessId });
  });

  it('should render loading state initially', () => {
    (useBusinessData as jest.Mock).mockReturnValue({
      business: null,
      staff: [],
      services: [],
      loading: true,
      error: null,
    });

    const { getByText } = render(<BusinessDetailScreen />);
    expect(getByText('Loading...')).toBeTruthy();
  });

  it('should render error state when business is not found', () => {
    (useBusinessData as jest.Mock).mockReturnValue({
      business: null,
      staff: [],
      services: [],
      loading: false,
      error: 'Business not found',
    });

    const { getByText } = render(<BusinessDetailScreen />);
    expect(getByText('Business not found')).toBeTruthy();
  });

  it('should render business details when data is loaded', async () => {
    (useBusinessData as jest.Mock).mockReturnValue({
      business: mockBusiness,
      staff: mockStaff,
      services: mockServices,
      loading: false,
      error: null,
    });

    const { getByText } = render(<BusinessDetailScreen />);

    await waitFor(() => {
      expect(getByText('Test Business')).toBeTruthy();
      expect(getByText('Test Description')).toBeTruthy();
      expect(getByText('Test Address')).toBeTruthy();
      expect(getByText('★ 4.5')).toBeTruthy();
      expect(getByText('(100 reviews)')).toBeTruthy();
      expect(getByText('Opening Hours')).toBeTruthy();
      expect(getByText('Monday')).toBeTruthy();
      expect(getByText('9:00-17:00')).toBeTruthy();
    });
  });

  it('should render staff section correctly', async () => {
    (useBusinessData as jest.Mock).mockReturnValue({
      business: mockBusiness,
      staff: mockStaff,
      services: mockServices,
      loading: false,
      error: null,
    });

    const { getByText } = render(<BusinessDetailScreen />);

    await waitFor(() => {
      expect(getByText('Our Team')).toBeTruthy();
      expect(getByText('John Doe')).toBeTruthy();
      expect(getByText('Stylist')).toBeTruthy();
    });
  });

  it('should render services section correctly', async () => {
    (useBusinessData as jest.Mock).mockReturnValue({
      business: mockBusiness,
      staff: mockStaff,
      services: mockServices,
      loading: false,
      error: null,
    });

    const { getByText } = render(<BusinessDetailScreen />);

    await waitFor(() => {
      expect(getByText('Services')).toBeTruthy();
      expect(getByText('Haircut')).toBeTruthy();
      expect(getByText('€30')).toBeTruthy();
      expect(getByText('30 minutes')).toBeTruthy();
      expect(getByText('Basic haircut service')).toBeTruthy();
    });
  });

  it('should navigate to booking screen when book button is pressed', async () => {
    (useBusinessData as jest.Mock).mockReturnValue({
      business: mockBusiness,
      staff: mockStaff,
      services: mockServices,
      loading: false,
      error: null,
    });

    const { getByText } = render(<BusinessDetailScreen />);

    await waitFor(() => {
      const bookButton = getByText('Book Now');
      fireEvent.press(bookButton);
      expect(router.push).toHaveBeenCalledWith(`/booking/${mockBusinessId}`);
    });
  });
}); 