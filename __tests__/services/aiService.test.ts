import { AIService } from '../../services/aiService';
import { db } from '../../firebase-config';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import * as FileSystem from 'expo-file-system';
import { v4 as uuidv4 } from 'uuid';

// Mock the Firebase modules
jest.mock('../../firebase-config', () => ({
  db: {
    collection: jest.fn(),
  },
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(),
  Timestamp: {
    now: jest.fn(() => new Date()),
  },
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: {
      uid: 'test-user-id',
      email: 'test@example.com',
    },
  })),
}));

// Mock the Google Generative AI
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      startChat: jest.fn().mockReturnValue({
        sendMessage: jest.fn().mockResolvedValue({
          response: {
            text: jest.fn().mockReturnValue('AI response'),
            candidates: [
              {
                content: {
                  parts: [
                    {
                      functionCall: {
                        name: 'list_businesses',
                        args: {},
                      },
                    },
                  ],
                },
              },
            ],
          },
        }),
      }),
    }),
  })),
  HarmCategory: {
    HARM_CATEGORY_HARASSMENT: 'HARM_CATEGORY_HARASSMENT',
    HARM_CATEGORY_HATE_SPEECH: 'HARM_CATEGORY_HATE_SPEECH',
    HARM_CATEGORY_SEXUALLY_EXPLICIT: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    HARM_CATEGORY_DANGEROUS_CONTENT: 'HARM_CATEGORY_DANGEROUS_CONTENT',
  },
  HarmBlockThreshold: {
    BLOCK_ONLY_HIGH: 'BLOCK_ONLY_HIGH',
  },
  SchemaType: {
    OBJECT: 'OBJECT',
    STRING: 'STRING',
  },
}));

// Mock the FileSystem
jest.mock('expo-file-system', () => ({
  readAsStringAsync: jest.fn().mockResolvedValue('base64-encoded-audio'),
  EncodingType: {
    Base64: 'base64',
  },
}));

// Mock the uuid
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('test-uuid'),
}));

describe('AIService', () => {
  let aiService: AIService;
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Initialize the AIService
    aiService = new AIService(mockApiKey);
  });

  describe('constructor', () => {
    it('should initialize with the provided API key', () => {
      expect(aiService).toBeDefined();
    });
  });

  describe('generateResponse', () => {
    it('should handle text messages', async () => {
      const message = 'Hello, AI!';
      const response = await aiService.generateResponse(message);
      
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
    });

    it('should handle audio messages', async () => {
      const audioUri = 'file://test-audio.m4a';
      const response = await aiService.generateResponse(audioUri, true);
      
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
      expect(FileSystem.readAsStringAsync).toHaveBeenCalledWith(audioUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
    });

    it('should handle errors gracefully', async () => {
      // Mock the sendMessage to throw an error
      const mockError = new Error('AI service error');
      jest.spyOn(aiService['chat'], 'sendMessage').mockRejectedValueOnce(mockError);
      
      await expect(aiService.generateResponse('test message')).rejects.toThrow('AI service error');
    });
  });

  describe('executeListBusinesses', () => {
    it('should return a list of businesses', async () => {
      // Mock the Firestore response
      const mockBusinesses = [
        {
          id: 'business1',
          name: 'Test Business',
          description: 'Test Description',
          type: 'Test Type',
          rating: 4.5,
          reviews: 10,
          city: 'Dublin',
          address: 'Test Address',
          imageUrl: 'test-image.jpg',
          openingHours: { Monday: '9:00 - 17:00' },
        },
      ];
      
      const mockServices = [
        {
          id: 'service1',
          name: 'Test Service',
          duration: 60,
          staffIds: ['staff1'],
          price: 50,
          description: 'Test Service Description',
        },
      ];
      
      const mockStaff = [
        {
          id: 'staff1',
          name: 'Test Staff',
          workingDays: ['Monday'],
          role: 'Test Role',
          imageUrl: 'test-staff-image.jpg',
          bio: 'Test Bio',
        },
      ];
      
      // Mock the Firestore collection and getDocs
      (collection as jest.Mock).mockReturnValue('businessesRef');
      (getDocs as jest.Mock).mockResolvedValueOnce({
        docs: mockBusinesses.map(business => ({
          data: () => business,
          ref: { id: business.id },
        })),
      });
      
      // Mock the services collection
      (collection as jest.Mock).mockReturnValueOnce('servicesRef');
      (getDocs as jest.Mock).mockResolvedValueOnce({
        docs: mockServices.map(service => ({
          data: () => service,
          id: service.id,
        })),
      });
      
      // Mock the staff collection
      (collection as jest.Mock).mockReturnValueOnce('staffRef');
      (getDocs as jest.Mock).mockResolvedValueOnce({
        docs: mockStaff.map(staff => ({
          data: () => staff,
          id: staff.id,
        })),
      });
      
      // Call the private method using any type
      const result = await (aiService as any).executeListBusinesses();
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].businessName).toBe('Test Business');
      expect(result[0].services[0].serviceName).toBe('Test Service');
      expect(result[0].staff[0].staffName).toBe('Test Staff');
    });

    it('should handle errors gracefully', async () => {
      // Mock the Firestore collection to throw an error
      (collection as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Firestore error');
      });
      
      // Call the private method using any type
      const result = await (aiService as any).executeListBusinesses();
      
      expect(result).toEqual([]);
    });
  });

  describe('executeFindAvailableSlots', () => {
    it('should return available slots for a business, service, and date', async () => {
      // Mock the Firestore responses
      const mockBusiness = {
        id: 'business1',
        name: 'Test Business',
        openingHours: { Monday: '09:00 - 17:00' },
      };
      
      const mockService = {
        id: 'service1',
        name: 'Test Service',
        duration: 60,
        staffIds: ['staff1'],
      };
      
      const mockStaff = {
        id: 'staff1',
        name: 'Test Staff',
        workingDays: ['Monday'],
      };
      
      const mockBookings = [
        {
          id: 'booking1',
          staffId: 'staff1',
          serviceId: 'service1',
          date: '2023-04-01',
          startTime: '10:00',
          duration: 60,
          status: 'confirmed',
        },
      ];
      
      // Mock the business query
      (collection as jest.Mock).mockReturnValueOnce('businessesRef');
      (query as jest.Mock).mockReturnValueOnce('businessQuery');
      (where as jest.Mock).mockReturnValueOnce('whereClause');
      (getDocs as jest.Mock).mockResolvedValueOnce({
        empty: false,
        docs: [{
          data: () => mockBusiness,
          ref: { id: mockBusiness.id },
        }],
      });
      
      // Mock the service query
      (collection as jest.Mock).mockReturnValueOnce('servicesRef');
      (query as jest.Mock).mockReturnValueOnce('serviceQuery');
      (where as jest.Mock).mockReturnValueOnce('whereClause');
      (getDocs as jest.Mock).mockResolvedValueOnce({
        empty: false,
        docs: [{
          data: () => mockService,
          id: mockService.id,
        }],
      });
      
      // Mock the staff query
      (collection as jest.Mock).mockReturnValueOnce('staffRef');
      (query as jest.Mock).mockReturnValueOnce('staffQuery');
      (where as jest.Mock).mockReturnValueOnce('whereClause');
      (getDocs as jest.Mock).mockResolvedValueOnce({
        empty: false,
        docs: [{
          data: () => mockStaff,
          id: mockStaff.id,
        }],
      });
      
      // Mock the bookings query
      (collection as jest.Mock).mockReturnValueOnce('bookingsRef');
      (query as jest.Mock).mockReturnValueOnce('bookingsQuery');
      (where as jest.Mock).mockReturnValueOnce('whereClause');
      (getDocs as jest.Mock).mockResolvedValueOnce({
        docs: mockBookings.map(booking => ({
          data: () => booking,
          id: booking.id,
        })),
      });
      
      // Call the private method using any type
      const result = await (aiService as any).executeFindAvailableSlots(
        'Test Business',
        'Test Service',
        '2023-04-01',
        'Test Staff'
      );
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      // The result should include available slots that don't overlap with existing bookings
      expect(result.some((slot: { startTime: string }) => slot.startTime === '10:00')).toBe(false);
      expect(result.some((slot: { startTime: string }) => slot.startTime === '09:00')).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      // Mock the business query to throw an error
      (collection as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Firestore error');
      });
      
      // Call the private method using any type
      const result = await (aiService as any).executeFindAvailableSlots(
        'Test Business',
        'Test Service',
        '2023-04-01',
        'Test Staff'
      );
      
      expect(result).toEqual([]);
    });
  });

  describe('executeCreateBooking', () => {
    it('should create a booking for a business, staff, service, date, and time', async () => {
      // Mock the Firestore responses
      const mockBusiness = {
        id: 'business1',
        name: 'Test Business',
        address: 'Test Address',
      };
      
      const mockService = {
        id: 'service1',
        name: 'Test Service',
        duration: 60,
        price: 50,
      };
      
      const mockStaff = {
        id: 'staff1',
        name: 'Test Staff',
      };
      
      // Mock the business query
      (collection as jest.Mock).mockReturnValueOnce('businessesRef');
      (query as jest.Mock).mockReturnValueOnce('businessQuery');
      (where as jest.Mock).mockReturnValueOnce('whereClause');
      (getDocs as jest.Mock).mockResolvedValueOnce({
        empty: false,
        docs: [{
          data: () => mockBusiness,
          ref: { id: mockBusiness.id },
        }],
      });
      
      // Mock the service query
      (collection as jest.Mock).mockReturnValueOnce('servicesRef');
      (query as jest.Mock).mockReturnValueOnce('serviceQuery');
      (where as jest.Mock).mockReturnValueOnce('whereClause');
      (getDocs as jest.Mock).mockResolvedValueOnce({
        empty: false,
        docs: [{
          data: () => mockService,
          id: mockService.id,
        }],
      });
      
      // Mock the staff query
      (collection as jest.Mock).mockReturnValueOnce('staffRef');
      (query as jest.Mock).mockReturnValueOnce('staffQuery');
      (where as jest.Mock).mockReturnValueOnce('whereClause');
      (getDocs as jest.Mock).mockResolvedValueOnce({
        empty: false,
        docs: [{
          data: () => mockStaff,
          id: mockStaff.id,
        }],
      });
      
      // Mock the existing bookings query
      (collection as jest.Mock).mockReturnValueOnce('bookingsRef');
      (query as jest.Mock).mockReturnValueOnce('existingBookingsQuery');
      (where as jest.Mock).mockReturnValueOnce('whereClause');
      (getDocs as jest.Mock).mockResolvedValueOnce({
        empty: true,
        docs: [],
      });
      
      // Mock the booking document creation
      (collection as jest.Mock).mockReturnValueOnce('bookingsRef');
      (doc as jest.Mock).mockReturnValueOnce('bookingDocRef');
      (setDoc as jest.Mock).mockResolvedValueOnce(undefined);
      
      // Mock the user bookings collection
      (collection as jest.Mock).mockReturnValueOnce('userBookingsRef');
      (doc as jest.Mock).mockReturnValueOnce('userBookingDocRef');
      (setDoc as jest.Mock).mockResolvedValueOnce(undefined);
      
      // Call the private method using any type
      const result = await (aiService as any).executeCreateBooking(
        'Test Business',
        'Test Staff',
        'Test Service',
        '2023-04-01',
        '09:00'
      );
      
      expect(result).toBeDefined();
      expect(result.id).toBe('test-uuid');
      expect(setDoc).toHaveBeenCalledTimes(2);
    });

    it('should handle errors gracefully', async () => {
      // Mock the business query to throw an error
      (collection as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Firestore error');
      });
      
      // Call the private method using any type
      const result = await (aiService as any).executeCreateBooking(
        'Test Business',
        'Test Staff',
        'Test Service',
        '2023-04-01',
        '09:00'
      );
      
      expect(result).toBeNull();
    });
  });

  describe('createMessage', () => {
    it('should create a message with the correct properties', () => {
      const message = aiService.createMessage('user', 'Test message');
      
      expect(message).toBeDefined();
      expect(message.role).toBe('user');
      expect(message.content).toBe('Test message');
      expect(message.timestamp).toBeDefined();
      expect(message.id).toBeDefined();
    });
  });

  describe('addMessage', () => {
    it('should add a message to the history', () => {
      const initialHistoryLength = aiService['history'].length;
      
      aiService.addMessage('user', 'Test message');
      
      expect(aiService['history'].length).toBe(initialHistoryLength + 1);
      expect(aiService['history'][initialHistoryLength].content).toBe('Test message');
    });
  });

  describe('resetChat', () => {
    it('should reset the chat history', () => {
      // Add a message to the history
      aiService.addMessage('user', 'Test message');
      
      // Reset the chat
      aiService.resetChat();
      
      expect(aiService['history'].length).toBe(0);
    });
  });
}); 