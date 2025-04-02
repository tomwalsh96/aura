import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, SchemaType, Tool } from '@google/generative-ai';
import { ChatMessage } from '@/types/chat';
import { 
  getAllBusinesses,
  createBooking,
  findAvailableSlotsForService
} from '@/data/dummyBusinesses';
import { db } from '../firebase-config';
import { collection, doc, setDoc, writeBatch } from 'firebase/firestore';

const tools: Tool[] = [{
  functionDeclarations: [
    {
      name: "list_businesses",
      description: "Lists all available businesses with their key details. It is VERY IMPORTANT that you use this before claiming to have found information about a any business.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          dummy: {
            type: SchemaType.STRING,
            description: "This property is required but not used."
          }
        },
        required: []
      }
    },
    {
      name: "find_available_slots",
      description: "Finds available time slots for a specific service, business and date. If a staffName is provided, it will find slots for that specific staff member otherwise it will find slots for any staff member. It is VERY IMPORTANT that you use this before claiming to have found slots.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          businessName: {
            type: SchemaType.STRING,
            description: "The name of the business to find slots for."
          },
          serviceName: {
            type: SchemaType.STRING,
            description: "The name of the service to find slots for."
          },
          date: {
            type: SchemaType.STRING,
            description: "The date to find slots for (YYYY-MM-DD format)."
          },
          staffName: {
            type: SchemaType.STRING,
            description: "Optional: The name of a specific staff member to find slots for."
          }
        },
        required: ["businessName", "serviceName", "date"]
      }
    },
    {
      name: "create_booking",
      description: "Creates a new booking for a specific service at a business.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          businessId: {
            type: SchemaType.STRING,
            description: "The ID of the business to book at."
          },
          staffId: {
            type: SchemaType.STRING,
            description: "The ID of the staff member to book with."
          },
          serviceId: {
            type: SchemaType.STRING,
            description: "The ID of the service to book."
          },
          date: {
            type: SchemaType.STRING,
            description: "The date to book (YYYY-MM-DD format)."
          },
          startTime: {
            type: SchemaType.STRING,
            description: "The start time of the booking (HH:mm format)."
          }
        },
        required: ["businessId", "staffId", "serviceId", "date", "startTime"]
      }
    },
  ]
}];

/**
 * Service for handling AI-related operations
 */
export class AIServiceV3 {
  private model: any;
  private chat: any;
  private history: ChatMessage[] = [];
  private systemInstruction: string;

  constructor(apiKey: string) {
    const genAI = new GoogleGenerativeAI(apiKey);
    this.systemInstruction = `
    You are a focused booking assistant with one clear goal: help users book appointments efficiently. Your responses should be direct and action-oriented, but also friendly and engaging.

    CURRENT DATE AND TIME:
    ${new Date().toLocaleString('en-IE', { 
      timeZone: 'Europe/Dublin',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })}

    VERY IMPORTANT:
    - Always, on the first response, use the list_businesses function to get the business data.
    - You MUST use the list_businesses function before claiming to have found information about a business.
    - You MUST use the find_available_slots function before claiming to have found slots.
    - You MUST use the create_booking function before claiming to have booked an appointment.
    - You MUST ALWAYS use the exact businessName, serviceName, and staffName from the business data.
    - NEVER make up or guess names - they must come from the list_businesses response.
    - Avoid saying you are going to do something, or that you need to check something first, just do the thing you are saying you are going to do.
    
    Initial greeting and booking process explanation:
    "Hi! 👋 I'm Aura, your friendly booking assistant.

    🎯 **Search by:**
    • City (Dublin, Cork, Galway...)
    • Service (Haircuts, wellness treatments...)
    • Business name

    ✨ **Quick Guide:**
    1. **Find Business** - Search by city/service/name
    2. **Pick Service** - View staff, prices & duration
    3. **Book Date** - Choose date (e.g., "Thursday" or "April 25th")
    4. **Select Time** - Pick slot & complete booking

    What would you like to search for? 😊"

    CRITICAL RULES:
    1. SEARCH REFINEMENT:
       - ALWAYS ask users to refine their search first
       - Ask for at least one of: city, service type, or business name
       - Only call list_businesses after getting search criteria
       - Example: "Could you please specify which city you're interested in?"

    2. FUNCTION CALL REQUIREMENTS:
       - Call list_businesses ONLY after getting search criteria
       - NEVER list all businesses without specific search criteria
       - NEVER assume or make up information about businesses
       - ALWAYS use find_available_slots to check time availability
       - NEVER suggest or list times without checking availability first
       - ALWAYS use exact names from the business data:
         • businessName from the business object
         • serviceName from the service object
         • staffName from the staff object
       - NEVER make up or guess names
       - NEVER claim a booking was created without:
         • First calling create_booking function
         • Waiting for a successful response
         • Only then confirming the booking to the user

    3. LANGUAGE RULES:
       - NEVER use passive phrases like:
         • "let me"
         • "I'll"
         • "I will"
         • "let's"
         • "we can"
         • "we should"
       - ALWAYS use direct, active language
       - ALWAYS ask for search refinement first
       - NEVER say "I've created your booking" or similar without first calling create_booking
       - If create_booking fails, explain the error and suggest alternatives

    4. DATE AND TIME RULES:
       - When user mentions a day (e.g., "Thursday"), use the next instance of that day
       - When user mentions a time without AM/PM, assume 24-hour format
       - ALWAYS check availability using find_available_slots before suggesting times

    RESPONSE FORMATTING:
    1. When user needs to refine search:
       - Ask for specific criteria (city/service/business name)
       - Provide examples of valid options
       - Keep the response concise and friendly

    2. After using list_businesses:
       - Present only businesses matching the search criteria
       - Group businesses by city
       - For each business, show:
         • Name and rating
         • Available services with prices
       - Use bullet points for better readability
       - Ask the user what they'd like to do next

    3. After using find_available_slots:
       - Show available slots grouped by staff member
       - Include start and end times in 24-hour format
       - If no slots are available, explain why and suggest alternatives
       - Ask the user to select a time slot

    4. After using create_booking:
       - ONLY confirm the booking if create_booking returned successfully
       - Show the date, time, and service booked
       - If create_booking failed, explain the error and suggest alternatives
       - Ask if they need anything else

    EXAMPLE RESPONSES:
    User: "I'm looking for wellness treatments"
    Assistant: "Could you please specify which city you're interested in? I can help you find wellness treatments in Dublin, Cork, or Galway."

    User: "Dublin"
    Assistant: [CALLS list_businesses]
    "Here are the available wellness businesses in Dublin:

    • Serenity Wellness Centre (4.9★)
      - Therapeutic Treatment: €90
      - Sports Therapy: €85
      - Aromatherapy Treatment: €95
      Staff: 
      • Dr. Sarah O'Connor - Senior Practitioner
      • Michael Murphy - Specialist
      • Emma Walsh - Aromatherapist

    What type of treatment would you like to book?"

    User: "I want a therapeutic treatment on Thursday"
    Assistant: [CALLS find_available_slots with correct names from the business data]
    "Here are the available slots for Therapeutic Treatment at Serenity Wellness Centre on Thursday:

    Dr. Sarah O'Connor:
    • 09:00 - 10:00
    • 10:30 - 11:30
    • 14:00 - 15:00
    • 15:30 - 16:30

    Please select a time slot to proceed with your booking."

    User: "Book me for 14:00"
    Assistant: [CALLS create_booking]
    "I've successfully created your booking for Therapeutic Treatment at Serenity Wellness Centre on Thursday at 14:00 with Dr. Sarah O'Connor. Would you like to book anything else?"
    `;

    this.model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-pro-exp-03-25", 
      tools,
      systemInstruction: this.systemInstruction,
      generationConfig: {
        temperature: 0, 
        topK: 40, 
        topP: 0.95,
        maxOutputTokens: 1024,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        }
      ],
    });

    this.chat = this.model.startChat({
      history: [],
    });
  }

  /**
   * Generates a response from the AI model using chat history
   * @param message - The user's input message
   * @returns The AI's response
   */
  async generateResponse(message: string): Promise<string> {
    try {
      console.log('Starting generateResponse with message:', message);
      
      this.addMessage('user', message);
      console.log('Added user message to history');

      this.chat = this.model.startChat({
        history: this.history.map(msg => ({
          role: msg.role,
          parts: [{ text: msg.content }],
        })),
      });
      console.log('Started new chat with history');

      let result = await this.chat.sendMessage(message);
      console.log('Received initial response from model');
      
      let response = await result.response;
      console.log('Processed response:', response);

      const functionCall = response.candidates?.[0]?.content?.parts?.[0]?.functionCall;
      console.log('Function call detected:', functionCall);

      if (functionCall) {
        const { name, args } = functionCall;
        console.log('Executing function:', name, 'with args:', args);
        let functionResponseData;

        switch (name) {
          case 'list_businesses':
            functionResponseData = await this.executeListBusinesses();
            break;
          case 'find_available_slots':
            functionResponseData = await this.executeFindAvailableSlots(
              args.businessName,
              args.serviceName,
              args.date,
              args.staffName
            );
            break;
          case 'create_booking':
            functionResponseData = await this.executeCreateBooking(
              args.businessId,
              args.staffId,
              args.serviceId,
              args.date,
              args.startTime
            );
            break;
          default:
            console.warn(`Function ${name} not implemented.`);
            throw new Error(`The function ${name} is not supported.`);
        }

        console.log('Function response data:', functionResponseData);

        result = await this.chat.sendMessage([
          {
            functionResponse: {
              name,
              response: { name, content: functionResponseData },
            },
          },
        ]);
        console.log('Sent function response to model');
        
        response = await result.response;
        console.log('Received final response from model');

        const formattedResponse = response.text();
        console.log('Formatted response:', formattedResponse);

        if (!formattedResponse || formattedResponse.trim() === '') {
          console.error('Empty response after function call:', {
            functionName: name,
            functionArgs: args,
            functionResponse: functionResponseData
          });
          throw new Error('The model did not generate a response after processing the function call. Please try again.');
        }

        this.addMessage('model', formattedResponse);
        console.log('Added formatted response to history');

        return formattedResponse;
      }

      const finalResponse = response.text();
      console.log('Final response text:', finalResponse);

      if (!finalResponse || finalResponse.trim() === '') {
        console.error('Empty direct response:', {
          message,
          history: this.history
        });
        throw new Error('The model did not generate a response. Please try again.');
      }

      this.addMessage('model', finalResponse);
      console.log('Added model response to history');

      return finalResponse;

    } catch (error) {
      console.error('Error in generateResponse:', error);
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
        throw error;
      }
      throw new Error('An unexpected error occurred. Please try again.');
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
    this.chat = this.model.startChat({
      history: [],
    });
  }

  private async executeListBusinesses() {
    try {
      console.log('Starting executeListBusinesses');
      const businesses = await getAllBusinesses();
      console.log('Retrieved businesses:', businesses.map(b => ({ name: b.name, city: b.city })));

      if (businesses.length === 0) {
        console.log('No businesses found');
        return [];
      }

      const result = businesses.map(business => ({
        businessName: business.name,
        businessDescription: business.description,
        businessType: business.type,
        businessRating: business.rating,
        businessReviews: business.reviews,
        businessCity: business.city,
        staff: business.staff.map(staff => ({
          staffName: staff.name,
          staffRole: staff.role,
          staffWorkingDays: staff.workingDays
        })),
        services: business.services.map(service => ({
          serviceName: service.name,
          servicePrice: service.price,
          serviceDuration: service.duration,
          serviceStaffMembers: service.staffIds.map(id => 
            business.staff.find(s => s.id === id)?.name
          ).filter(Boolean)
        }))
      }));

      console.log('Final results:', result.map(b => ({ 
        businessName: b.businessName, 
        businessCity: b.businessCity,
        services: b.services.map(s => s.serviceName),
        staff: b.staff.map(s => s.staffName)
      })));
      return result;
    } catch (error) {
      console.error('Error in executeListBusinesses:', error);
      return [];
    }
  }

  private async executeFindAvailableSlots(
    businessName: string,
    serviceName: string,
    date: string,
    staffName?: string
  ) {
    try {
      console.log('Starting executeFindAvailableSlots with:', { businessName, serviceName, date, staffName });
      const slots = await findAvailableSlotsForService(businessName, serviceName, date, staffName);
      console.log('Found available slots:', slots);
      return slots;
    } catch (error) {
      console.error('Error in executeFindAvailableSlots:', error);
      return [];
    }
  }

    private async executeCreateBooking(
    businessId: string,
    staffId: string,
    serviceId: string,
    date: string,
    startTime: string
  ) {
    try {
      console.log('Starting executeCreateBooking with:', { businessId, staffId, serviceId, date, startTime });
      const booking = await createBooking(businessId, staffId, serviceId, date, startTime);
      console.log('Created booking:', booking);
      return booking;
    } catch (error) {
      console.error('Error in executeCreateBooking:', error);
      return null;
    }
  }
}

export async function loadDummyDataToFirestore() {
  try {
    const businesses = await getAllBusinesses();
    const batch = writeBatch(db);
    
    for (const business of businesses) {
      // Create business document
      const businessRef = doc(collection(db, 'businesses'), business.id);
      
      // Create business data without nested arrays
      const businessData = {
        id: business.id,
        name: business.name,
        description: business.description,
        address: business.address,
        city: business.city,
        rating: business.rating,
        reviews: business.reviews,
        imageUrl: business.imageUrl,
        type: business.type,
        openingHours: business.openingHours
      };
      
      // Set business document
      batch.set(businessRef, businessData);
      
      // Create staff subcollection
      for (const staff of business.staff) {
        const staffRef = doc(collection(businessRef, 'staff'), staff.id);
        batch.set(staffRef, {
          id: staff.id,
          name: staff.name,
          role: staff.role,
          imageUrl: staff.imageUrl,
          bio: staff.bio,
          workingDays: staff.workingDays
        });
      }
      
      // Create services subcollection
      for (const service of business.services) {
        const serviceRef = doc(collection(businessRef, 'services'), service.id);
        batch.set(serviceRef, {
          id: service.id,
          name: service.name,
          price: service.price,
          duration: service.duration,
          description: service.description,
          staffIds: service.staffIds
        });
      }
      
      // Create bookings subcollection
      for (const booking of business.bookings) {
        const bookingRef = doc(collection(businessRef, 'bookings'), booking.id);
        batch.set(bookingRef, {
          id: booking.id,
          staffId: booking.staffId,
          serviceId: booking.serviceId,
          date: booking.date,
          startTime: booking.startTime,
          duration: booking.duration
        });
      }
    }
    
    // Commit all writes
    await batch.commit();
    return { success: true, message: 'Successfully loaded dummy data to Firestore' };
  } catch (error) {
    console.error('Error loading dummy data to Firestore:', error);
    throw new Error('Failed to load dummy data to Firestore');
  }
} 