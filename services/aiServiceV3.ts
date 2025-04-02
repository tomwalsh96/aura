import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, SchemaType, Tool } from '@google/generative-ai';
import { ChatMessage } from '@/types/chat';
import { db } from '../firebase-config';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  Timestamp, 
  addDoc,
  DocumentData 
} from 'firebase/firestore';

interface FirestoreBooking {
  id: string;
  staffId: string;
  serviceId: string;
  date: string;
  startTime: string;
  duration: number;
  status: string;
  createdAt: Timestamp;
}

interface FirestoreService {
  id: string;
  name: string;
  duration: number;
  staffIds: string[];
  price: number;
  description: string;
}

interface FirestoreStaff {
  id: string;
  name: string;
  workingDays: string[];
  role: string;
  imageUrl: string;
  bio: string;
}

interface FirestoreBusiness {
  id: string;
  name: string;
  description: string;
  type: string;
  rating: number;
  reviews: number;
  city: string;
  address: string;
  imageUrl: string;
  openingHours: Record<string, string>;
}

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
      const businessesRef = collection(db, 'businesses');
      const businessesSnapshot = await getDocs(businessesRef);
      const businesses = [];

      for (const businessDoc of businessesSnapshot.docs) {
        const businessData = businessDoc.data() as FirestoreBusiness;
        
        // Get services
        const servicesRef = collection(businessDoc.ref, 'services');
        const servicesSnapshot = await getDocs(servicesRef);
        const services = servicesSnapshot.docs.map(doc => ({
          ...(doc.data() as FirestoreService),
          id: doc.id
        }));

        // Get staff
        const staffRef = collection(businessDoc.ref, 'staff');
        const staffSnapshot = await getDocs(staffRef);
        const staff = staffSnapshot.docs.map(doc => ({
          ...(doc.data() as FirestoreStaff),
          id: doc.id
        }));

        businesses.push({
          businessName: businessData.name,
          businessDescription: businessData.description,
          businessType: businessData.type,
          businessRating: businessData.rating,
          businessReviews: businessData.reviews,
          businessCity: businessData.city,
          staff: staff.map(s => ({
            staffName: s.name,
            staffRole: s.role,
            staffWorkingDays: s.workingDays
          })),
          services: services.map(s => ({
            serviceName: s.name,
            servicePrice: s.price,
            serviceDuration: s.duration,
            serviceStaffMembers: s.staffIds.map(id => 
              staff.find(st => st.id === id)?.name
            ).filter(Boolean)
          }))
        });
      }

      console.log('Retrieved businesses:', businesses.map(b => ({ 
        businessName: b.businessName, 
        businessCity: b.businessCity 
      })));
      return businesses;
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
  ): Promise<{ staffName: string, startTime: string, endTime: string }[]> {
    try {
      console.log('Starting executeFindAvailableSlots with:', { businessName, serviceName, date, staffName });
      
      // Find the business
      const businessesRef = collection(db, 'businesses');
      const businessQuery = query(businessesRef, where('name', '==', businessName));
      const businessSnapshot = await getDocs(businessQuery);
      
      if (businessSnapshot.empty) {
        console.log('No business found with name:', businessName);
        return [];
      }
      
      const businessDoc = businessSnapshot.docs[0];
      const business = businessDoc.data() as FirestoreBusiness;
      
      // Get the service
      const servicesRef = collection(businessDoc.ref, 'services');
      const serviceQuery = query(servicesRef, where('name', '==', serviceName));
      const serviceSnapshot = await getDocs(serviceQuery);
      
      if (serviceSnapshot.empty) {
        console.log('No service found with name:', serviceName);
        return [];
      }
      
      const service = serviceSnapshot.docs[0].data() as FirestoreService;
      
      // Get the day of the week
      const dayOfWeek = new Date(date).toLocaleDateString('en-IE', { weekday: 'long' });
      
      // Get all staff members for this service
      const staffRef = collection(businessDoc.ref, 'staff');
      let staffSnapshot;
      
      if (staffName) {
        const staffQuery = query(staffRef, where('name', '==', staffName));
        staffSnapshot = await getDocs(staffQuery);
      } else {
        staffSnapshot = await getDocs(staffRef);
      }
      
      const relevantStaff = staffSnapshot.docs
        .map(doc => ({ ...(doc.data() as FirestoreStaff), id: doc.id }))
        .filter(staff => service.staffIds.includes(staff.id));
      
      // Get all bookings for the date
      const bookingsRef = collection(businessDoc.ref, 'bookings');
      const dateQuery = query(bookingsRef, where('date', '==', date));
      const bookingsSnapshot = await getDocs(dateQuery);
      const dateBookings = bookingsSnapshot.docs
        .map(doc => ({
          ...(doc.data() as FirestoreBooking),
          id: doc.id
        }))
        .filter(booking => booking.status !== 'cancelled'); // Filter cancelled bookings in memory
      
      const availableSlots: { staffName: string, startTime: string, endTime: string }[] = [];
      
      // For each staff member
      for (const staff of relevantStaff) {
        // Check if staff member works on this day
        if (!staff.workingDays.includes(dayOfWeek)) continue;
        
        // Get business opening hours for this day
        const openingHours = business.openingHours[dayOfWeek];
        if (!openingHours) continue;
        
        // Parse opening hours
        const [openTime, closeTime] = openingHours.split(' - ');
        const [openHour, openMinute] = openTime.split(' ')[0].split(':').map(Number);
        const [closeHour, closeMinute] = closeTime.split(' ')[0].split(':').map(Number);
        
        // Convert to 24-hour format
        let startHour = openHour;
        let endHour = closeHour;
        
        if (openTime.includes('PM') && startHour !== 12) startHour += 12;
        if (openTime.includes('AM') && startHour === 12) startHour = 0;
        if (closeTime.includes('PM') && endHour !== 12) endHour += 12;
        if (closeTime.includes('AM') && endHour === 12) endHour = 0;
        
        // Create slots from opening time until closing time
        let currentTime = new Date();
        currentTime.setFullYear(new Date(date).getFullYear());
        currentTime.setMonth(new Date(date).getMonth());
        currentTime.setDate(new Date(date).getDate());
        currentTime.setHours(startHour, openMinute, 0, 0);
        
        const endTime = new Date(currentTime);
        endTime.setHours(endHour, closeMinute, 0, 0);
        
        while (currentTime < endTime) {
          const slotStartTime = currentTime.toLocaleTimeString('en-IE', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          });
          
          // Calculate slot end time based on service duration
          const slotEndTime = new Date(currentTime.getTime() + (service.duration * 60000));
          
          // Check if this slot overlaps with any existing active bookings
          const isOverlapping = dateBookings.some(booking => {
            if (booking.staffId !== staff.id) return false;
            
            // Create date objects for booking times
            const [bookingHour, bookingMinute] = booking.startTime.split(':').map(Number);
            const bookingStart = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), bookingHour, bookingMinute, 0, 0);
            const bookingEnd = new Date(bookingStart.getTime() + (booking.duration * 60000));
            
            // Check for overlap
            return (
              (currentTime >= bookingStart && currentTime < bookingEnd) ||
              (slotEndTime > bookingStart && slotEndTime <= bookingEnd) ||
              (currentTime <= bookingStart && slotEndTime >= bookingEnd)
            );
          });
          
          // Check if the slot would extend past closing time
          const wouldExtendPastClosing = slotEndTime > endTime;
          
          if (!isOverlapping && !wouldExtendPastClosing) {
            availableSlots.push({
              staffName: staff.name,
              startTime: slotStartTime,
              endTime: slotEndTime.toLocaleTimeString('en-IE', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
              })
            });
          }
          
          currentTime.setMinutes(currentTime.getMinutes() + 30);
        }
      }
      
      return availableSlots;
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
  ): Promise<any> {
    try {
      console.log('Starting executeCreateBooking with:', { businessId, staffId, serviceId, date, startTime });
      
      const businessRef = doc(db, 'businesses', businessId);
      const businessDoc = await getDoc(businessRef);
      
      if (!businessDoc.exists()) {
        throw new Error('Business not found');
      }
      
      // Get the service to get duration
      const serviceRef = doc(collection(businessRef, 'services'), serviceId);
      const serviceDoc = await getDoc(serviceRef);
      
      if (!serviceDoc.exists()) {
        throw new Error('Service not found');
      }
      
      const service = serviceDoc.data() as FirestoreService;
      
      // Create the booking
      const bookingsRef = collection(businessRef, 'bookings');
      const newBooking = {
        staffId,
        serviceId,
        date,
        startTime,
        duration: service.duration,
        status: 'confirmed',
        createdAt: Timestamp.now()
      };
      
      const docRef = await addDoc(bookingsRef, newBooking);
      
      return {
        id: docRef.id,
        ...newBooking
      };
    } catch (error) {
      console.error('Error in executeCreateBooking:', error);
      return null;
    }
  }
} 