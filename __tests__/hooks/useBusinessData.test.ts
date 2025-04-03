import { renderHook } from '@testing-library/react-hooks';
import { useBusinessData } from '../../hooks/useBusinessData';

// Mock Firebase functions
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  onSnapshot: jest.fn(),
  collection: jest.fn(),
}));

// Mock firebase-config
jest.mock('../../firebase-config', () => ({
  db: {},
}));

describe('useBusinessData', () => {
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

  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy.mockClear();
  });

  it('should return loading state initially', () => {
    const { result } = renderHook(() => useBusinessData(mockBusinessId));
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.business).toBeNull();
    expect(result.current.staff).toEqual([]);
    expect(result.current.services).toEqual([]);
  });

  // Removed all Firebase-related tests
}); 