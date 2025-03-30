import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, SchemaType, Tool } from '@google/generative-ai';
import { ChatMessage } from '@/types/chat';
import { 
  getBusinessData, 
  getAvailableTimeSlots, 
  getStaffMembers, 
  getServices, 
  createBooking, 
  cancelBooking,
  getAllBusinesses
} from '@/data/dummyBusinesses';
import { LocationService, LocationData } from './locationService';

const tools: Tool[] = [{
  functionDeclarations: [
    {
      name: "getCurrentDateTime",
      description: `Get the current date and time information.
        This allows you to understand the current date and time and convert relative dates to actual dates.
        It also allows you to understand the current day of the week, month, and year as well as the timestamp.`,
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          dummy: {
            type: SchemaType.STRING,
            description: "This parameter is not used but required by the schema"
          }
        },
        required: []
      }
    },
    {
      name: "getAllBusinesses",
      description: "Get a list of all available businesses with their basic information including name, type, rating, and address",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          dummy: {
            type: SchemaType.STRING,
            description: "This parameter is not used but required by the schema"
          }
        },
        required: []
      }
    },
    {
      name: "getBusinessData",
      description: "Get detailed information about a specific business including all its services, staff, and booking information. Use this when you need complete information about a business.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          businessId: {
            type: SchemaType.STRING,
            description: "The unique identifier of the business"
          }
        },
        required: ["businessId"]
      }
    },
    {
      name: "getAvailableTimeSlots",
      description: "Get available time slots for a business on a specific date",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          businessId: {
            type: SchemaType.STRING,
            description: "The unique identifier of the business"
          },
          date: {
            type: SchemaType.STRING,
            description: "The date to check for availability (YYYY-MM-DD format)"
          }
        },
        required: ["businessId", "date"]
      }
    },
    {
      name: "getStaffMembers",
      description: "Get all staff members working at a business",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          businessId: {
            type: SchemaType.STRING,
            description: "The unique identifier of the business"
          }
        },
        required: ["businessId"]
      }
    },
    {
      name: "getServices",
      description: "Get a list of all services offered by a specific business, including prices, durations, and descriptions. Use this when you need to know what services are available at a business.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          businessId: {
            type: SchemaType.STRING,
            description: "The unique identifier of the business"
          }
        },
        required: ["businessId"]
      }
    },
    {
      name: "createBooking",
      description: "Create a new booking for a service at a business",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          businessId: {
            type: SchemaType.STRING,
            description: "The unique identifier of the business"
          },
          customerId: {
            type: SchemaType.STRING,
            description: "The unique identifier of the customer"
          },
          staffId: {
            type: SchemaType.STRING,
            description: "The unique identifier of the staff member"
          },
          serviceId: {
            type: SchemaType.STRING,
            description: "The unique identifier of the service"
          },
          date: {
            type: SchemaType.STRING,
            description: "The date of the booking (YYYY-MM-DD format)"
          },
          timeSlotId: {
            type: SchemaType.STRING,
            description: "The unique identifier of the time slot"
          }
        },
        required: ["businessId", "customerId", "staffId", "serviceId", "date", "timeSlotId"]
      }
    },
    {
      name: "cancelBooking",
      description: "Cancel an existing booking",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          businessId: {
            type: SchemaType.STRING,
            description: "The unique identifier of the business"
          },
          bookingId: {
            type: SchemaType.STRING,
            description: "The unique identifier of the booking to cancel"
          }
        },
        required: ["businessId", "bookingId"]
      }
    },
    {
      name: "getCurrentLocation",
      description: "Get the user's current location. This will request location permission if not already granted.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          dummy: {
            type: SchemaType.STRING,
            description: "This parameter is not used but required by the schema"
          }
        },
        required: []
      }
    },
    {
      name: "getLocationFromAddress",
      description: "Convert an address to coordinates (geocoding)",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          address: {
            type: SchemaType.STRING,
            description: "The address to geocode"
          }
        },
        required: ["address"]
      }
    },
    {
      name: "calculateDistance",
      description: "Calculate the distance between two locations in metres",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          location1: {
            type: SchemaType.OBJECT,
            description: "First location coordinates",
            properties: {
              latitude: { type: SchemaType.NUMBER },
              longitude: { type: SchemaType.NUMBER }
            },
            required: ["latitude", "longitude"]
          },
          location2: {
            type: SchemaType.OBJECT,
            description: "Second location coordinates",
            properties: {
              latitude: { type: SchemaType.NUMBER },
              longitude: { type: SchemaType.NUMBER }
            },
            required: ["latitude", "longitude"]
          }
        },
        required: ["location1", "location2"]
      }
    }
  ]
}];

/**
 * Service for handling AI-related operations
 */
export class AIService {
  private model: any;
  private chat: any;
  private history: ChatMessage[] = [];

  constructor(apiKey: string) {
    const genAI = new GoogleGenerativeAI(apiKey);
    const systemInstruction = `You are a helpful chatbot designed to assist users with booking appointments at salons, barbershops, and other beauty industry businesses. 
    Your capabilities include:
    - Finding and listing available businesses based on user preferences
    - Retrieving information about businesses, including their services, staff, and existing bookings, you will use the existing bookings to infer the availability of staff and time slots.
    - Checking a user's existing bookings
    - Making new bookings for users
    - Cancelling or modifying existing bookings
    
    When a user asks about businesses:
    1. First use getAllBusinesses to get a list of all available businesses
    2. If the user asks about a specific business's services, use getServices with that business's ID
    3. If you need complete information about a business, use getBusinessData
    4. Help them find the right business based on their preferences

    When responding to the user, try to be as helpful as possible. If you don't have the information, say so.
    If you don't know the answer, say so.
    If you are unsure of the answer, say so.
    If the user asks for suggestions, recommendations, or advice, try to help them out. Try to avoid being vague and avoid asking for too much more information.
    Try not to overload the user with too much information at once. If there are a lot of options, try and narrow them down to a few, and say that you can provide more if needed.

    Some usual booking flow is as follows:
    - User browses for a business, their services, staff, and available time slots
    - User selects a business and a time slot
    - User confirms the booking and pays
    - User receives a booking confirmation
    - User can cancel or modify the booking
    
    When a user mentions a relative date (like "next Thursday" or "tomorrow"), use getCurrentDateTime to understand the current date and convert the relative date to an actual date.
    
    When retrieving information, present it clearly to the user. 
    IMPORTANT: Before making, cancelling, or modifying any booking, you MUST explicitly ask the user for confirmation. Do not proceed with any booking modification without direct confirmation.`;

    this.model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash", 
      tools,
      systemInstruction: { role: "system", parts: [{ text: systemInstruction }] }, 
      generationConfig: {
        // Set temperature to 0 for minimal creativity and maximum predictability
        temperature: 0, 
        // Set topK to 1 to only consider the single most likely token at each step, making output highly deterministic
        topK: 1, 
        // topP is effectively ignored when topK is 1, but setting it low reinforces conservatism if topK were different
        // topP: 0.1, // Can be omitted when topK=1
        maxOutputTokens: 1024, // Keep a reasonable limit for response length
      },
      // Set safety settings to the strictest level, blocking content rated LOW and above
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
        },
        // Consider adding other categories if relevant, with the same strict threshold
        // {
        //   category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY,
        //   threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
        // },
      ],
    });
  }

  /**
   * Generates a response from the AI model using chat history
   * @param message - The user's input message
   * @returns The AI's response
   */
  async generateResponse(message: string): Promise<string> {
    try {
      // Create a new chat for each message to avoid context issues
      this.chat = this.model.startChat({
        history: this.history.map(msg => ({
          role: msg.role,
          parts: [{ text: msg.content }],
        })),
      });

      let result = await this.chat.sendMessage(message);
      let response = await result.response;

      // Check if the response contains a function call
      const functionCall = response.candidates?.[0]?.content?.parts?.[0]?.functionCall;

      if (functionCall) {
        const { name, args } = functionCall;
        let functionResponseData;

        console.log(`AI requested function call: ${name} with args:`, args);

        // Call the appropriate local function based on the function call name
        switch (name) {
          case 'getCurrentDateTime':
            functionResponseData = await this.executeGetCurrentDateTime();
            break;
          case 'getAllBusinesses':
            functionResponseData = await this.executeGetAllBusinesses();
            break;
          case 'getBusinessData':
            functionResponseData = await this.executeGetBusinessData(args.businessId);
            break;
          case 'getAvailableTimeSlots':
            functionResponseData = await this.executeGetAvailableTimeSlots(args.businessId, args.date);
            break;
          case 'getStaffMembers':
            functionResponseData = await this.executeGetStaffMembers(args.businessId);
            break;
          case 'getServices':
            functionResponseData = await this.executeGetServices(args.businessId);
            break;
          case 'createBooking':
            functionResponseData = await this.executeCreateBooking(
              args.businessId,
              args.customerId,
              args.staffId,
              args.serviceId,
              args.date,
              args.timeSlotId
            );
            break;
          case 'cancelBooking':
            functionResponseData = await this.executeCancelBooking(args.businessId, args.bookingId);
            break;
          case 'getCurrentLocation':
            functionResponseData = await this.executeGetCurrentLocation();
            break;
          case 'getLocationFromAddress':
            functionResponseData = await this.executeGetLocationFromAddress(args.address);
            break;
          case 'calculateDistance':
            functionResponseData = await this.executeCalculateDistance(args.location1, args.location2);
            break;
          default:
            console.warn(`Function ${name} not implemented.`);
            return `I apologize, but I encountered an error. The function ${name} is not supported.`;
        }

        // Send the function result back to the model and get a new response
        result = await this.chat.sendMessage([
          {
            functionResponse: {
              name,
              response: { name, content: functionResponseData },
            },
          },
        ]);
        response = await result.response;
      }

      // Get the final text response
      const finalResponse = response.text();
      
      // If the response is empty or just a loading message, return a helpful message
      if (!finalResponse || finalResponse.toLowerCase().includes('looking for') || finalResponse.toLowerCase().includes('moment')) {
        return "I apologize, but I encountered an issue processing your request. Could you please try rephrasing your question?";
      }

      return finalResponse;

    } catch (error) {
      console.error('Error generating response:', error);
      return "I apologize, but I encountered an error while processing your request. Could you please try again?";
    }
  }

  /**
   * Creates a chat message object
   * @param role - The role of the message sender
   * @param content - The message content
   * @returns A ChatMessage object
   */
  createMessage(role: 'user' | 'model', content: string): ChatMessage {
    return {
      id: Date.now().toString(),
      role,
      content,
      timestamp: Date.now(),
    };
  }

  /**
   * Adds a message to the chat history
   * @param role - The role of the message sender
   * @param content - The message content
   */
  addMessage(role: 'user' | 'model', content: string) {
    const message = this.createMessage(role, content);
    this.history.push(message);
  }

  /**
   * Resets the chat history
   */
  resetChat() {
    this.history = [];
  }

  private async executeGetBusinessData(businessId: string) {
    return getBusinessData(businessId);
  }

  private async executeGetAvailableTimeSlots(businessId: string, date: string) {
    return getAvailableTimeSlots(businessId, date);
  }

  private async executeGetStaffMembers(businessId: string) {
    return getStaffMembers(businessId);
  }

  private async executeGetServices(businessId: string) {
    return getServices(businessId);
  }

  private async executeCreateBooking(
    businessId: string,
    customerId: string,
    staffId: string,
    serviceId: string,
    date: string,
    timeSlotId: string
  ) {
    return createBooking(businessId, customerId, staffId, serviceId, date, timeSlotId);
  }

  private async executeCancelBooking(businessId: string, bookingId: string) {
    return cancelBooking(businessId, bookingId);
  }

  private async executeGetAllBusinesses() {
    return getAllBusinesses();
  }

  private async executeGetCurrentDateTime() {
    const now = new Date();
    return {
      currentDate: now.toISOString().split('T')[0], // YYYY-MM-DD format
      currentTime: now.toLocaleTimeString('en-US', { hour12: false }), // 24-hour format
      currentDay: now.getDay(), // 0-6 (Sunday-Saturday)
      currentMonth: now.getMonth() + 1, // 1-12
      currentYear: now.getFullYear(),
      timestamp: now.getTime()
    };
  }

  private async executeGetCurrentLocation() {
    const locationService = LocationService.getInstance();
    try {
      const hasPermission = await locationService.checkPermission();
      if (!hasPermission) {
        const granted = await locationService.requestPermission();
        if (!granted) {
          return {
            error: "Location permission is required for this feature. Tell the user they can go to the Profile tab, and go to the settings menu to enable location services."
          };
        }
      }
      const location = await locationService.getCurrentLocation();
      return location;
    } catch (error) {
      console.error('Error getting current location:', error);
      return {
        error: "Location permission is required for this feature. Tell the user they can go to the Profile tab, and go to the settings menu to enable location services."
      };
    }
  }

  private async executeGetLocationFromAddress(address: string) {
    const locationService = LocationService.getInstance();
    try {
      const hasPermission = await locationService.checkPermission();
      if (!hasPermission) {
        const granted = await locationService.requestPermission();
        if (!granted) {
          return {
            error: "Location permission is required for this feature. Tell the user they can go to the Profile tab, and go to the settings menu to enable location services."
          };
        }
      }
      const location = await locationService.getLocationFromAddress(address);
      return location;
    } catch (error) {
      console.error('Error getting location from address:', error);
      return {
        error: "Location permission is required for this feature. Tell the user they can go to the Profile tab, and go to the settings menu to enable location services."
      };
    }
  }

  private async executeCalculateDistance(location1: { latitude: number; longitude: number }, location2: { latitude: number; longitude: number }) {
    const locationService = LocationService.getInstance();
    const distance = locationService.calculateDistance(
      { ...location1, accuracy: 0, timestamp: Date.now() },
      { ...location2, accuracy: 0, timestamp: Date.now() }
    );
    return distance;
  }
} 