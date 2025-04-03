import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, SchemaType, Tool } from '@google/generative-ai';
import { ChatMessage } from '@/types/chat';
import { db } from '../firebase-config';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  Timestamp, 
  addDoc,
  DocumentData,
  setDoc,
  serverTimestamp,
  updateDoc,
  writeBatch
} from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import * as FileSystem from 'expo-file-system';

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
          businessName: {
            type: SchemaType.STRING,
            description: "The name of the business to book at."
          },
          staffName: {
            type: SchemaType.STRING,
            description: "The name of the staff member to book with."
          },
          serviceName: {
            type: SchemaType.STRING,
            description: "The name of the service to book."
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
        required: ["businessName", "staffName", "serviceName", "date", "startTime"]
      }
    },
  ]
}];

/**
 * Service for handling AI-related operations
 */
export class AIService {
  private model: any;
  private chat: any;
  private history: ChatMessage[] = [];
  private systemInstruction: string;

  constructor(apiKey: string) {
    const genAI = new GoogleGenerativeAI(apiKey);
    this.systemInstruction = `
    You are a focused booking assistant with one clear goal: help users book appointments efficiently. Your responses should be direct and action-oriented, but also friendly and engaging.

    CRITICAL BOOKING RULES:
    1. NEVER EVER say "booking" or "booked" without calling create_booking function
    2. NEVER EVER say "confirmed" or "confirmation" without calling create_booking function
    3. NEVER EVER say "appointment" or "scheduled" without calling create_booking function
    4. NEVER EVER say "I will book" or "I'll book" - just call the function directly
    5. NEVER EVER say "Okay, booking..." or similar phrases without calling the function
    6. NEVER EVER respond with a success message without calling create_booking function
    7. If user selects a time, ALWAYS call create_booking function immediately
    8. If user says "okay" or "yes" after selecting a time, ALWAYS call create_booking function
    9. NEVER EVER make assumptions about booking status without function confirmation
    10. Never use markdown in your responses for styling

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

    CRITICAL FUNCTION CALL REQUIREMENTS:
    1. ALWAYS use list_businesses function when:
       - User mentions a city (e.g., "Dublin", "Cork")
       - User mentions a service type (e.g., "haircut", "massage")
       - User asks to see available businesses
       - BEFORE mentioning any business information

    2. ALWAYS use find_available_slots function when:
       - User mentions a day of the week (e.g., "Saturday", "Thursday")
       - User mentions a specific date
       - User asks about availability
       - User wants to book a time slot
       - BEFORE suggesting or mentioning any time slots
       - If user just mentions a day (e.g., "Thursday"), automatically use the next instance of that day

    3. ALWAYS use create_booking function when:
       - User selects a time slot
       - BEFORE confirming the booking
       - NEVER EVER claim a booking was created without calling this function
       - NEVER EVER say "I've created your booking" or similar without calling this function
       - NEVER EVER respond with a success message about a booking without calling this function

    VERY IMPORTANT:
    - NEVER make up or guess information about businesses, services, or availability
    - NEVER suggest or list times without first calling find_available_slots
    - NEVER EVER claim a booking was created without first calling create_booking
    - NEVER EVER say "I've created your booking" or similar without calling create_booking
    - NEVER EVER respond with a success message about a booking without calling create_booking
    - ALWAYS use exact names from the business data
    - Avoid saying you are going to do something, just do it directly
    - Don't say you can't process audio, you can. If you don't understand the user, just say you don't understand and ask them to repeat.
    
    Initial greeting and booking process explanation:
    "Hi! I'm Aura, your friendly booking assistant.

    Search by:
    - City (Dublin, Cork, Galway...)
    - Service (Haircuts, wellness treatments...)
    - Business name

    Quick Guide:
    1. Find Business - Search by city/service/name
    2. Pick Service - View staff, prices & duration
    3. Book Date - Choose date (e.g., "Thursday" or "April 25th")
    4. Select Time - Pick slot & complete booking

    What would you like to search for?"

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
         - businessName from the business object
         - serviceName from the service object
         - staffName from the staff object
       - NEVER make up or guess names
       - NEVER claim a booking was created without:
         - First calling create_booking function
         - Waiting for a successful response
         - Only then confirming the booking to the user

    3. LANGUAGE RULES:
       - NEVER use passive phrases like:
         - "let me"
         - "I'll"
         - "I will"
         - "let's"
         - "we can"
         - "we should"
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
         - Name and rating
         - Available services with prices
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

    Serenity Wellness Centre (4.9★)
    - Therapeutic Treatment: €90
    - Sports Therapy: €85
    - Aromatherapy Treatment: €95
    Staff: 
    - Dr. Sarah O'Connor - Senior Practitioner
    - Michael Murphy - Specialist
    - Emma Walsh - Aromatherapist

    What type of treatment would you like to book?"

    User: "I want a therapeutic treatment on Thursday"
    Assistant: [CALLS find_available_slots with correct names from the business data]
    "Here are the available slots for Therapeutic Treatment at Serenity Wellness Centre on Thursday:

    Dr. Sarah O'Connor:
    - 09:00 - 10:00
    - 10:30 - 11:30
    - 14:00 - 15:00
    - 15:30 - 16:30

    Please select a time slot to proceed with your booking."

    User: "Book me for 14:00"
    Assistant: [CALLS create_booking]
    "I've successfully created your booking for Therapeutic Treatment at Serenity Wellness Centre on Thursday at 14:00 with Dr. Sarah O'Connor. Would you like to book anything else?"

    EXAMPLE OF HANDLING DAY-OF-WEEK REQUESTS:
    User: "I want to book a haircut on Saturday"
    Assistant: [CALLS find_available_slots with the next Saturday's date]
    "Here are the available slots for Haircut at Shear Madness on Saturday, April 13th:

    Mike Johnson:
    - 10:00 - 10:30
    - 10:30 - 11:00
    - 11:00 - 11:30
    - 14:00 - 14:30
    - 14:30 - 15:00

    Please select a time slot to proceed with your booking."
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
   * @param message - The user's input message or audio file URI
   * @param isAudio - Whether the input is an audio file
   * @returns The AI's response
   */
  async generateResponse(message: string, isAudio: boolean = false): Promise<string> {
    try {
      console.log('Starting generateResponse with:', { message, isAudio });
      
      let userInput: any;
      
      if (isAudio) {
        // Read the audio file
        const audioBase64 = await FileSystem.readAsStringAsync(message, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        // Create a multimodal part with the audio
        userInput = [{
          text: "[Audio Message]"
        }, {
          inlineData: {
            mimeType: "audio/m4a",
            data: audioBase64
          }
        }];
      } else {
        userInput = message;
      }

      this.addMessage('user', isAudio ? '[Audio Message]' : message);
      console.log('Added user message to history');

      this.chat = this.model.startChat({
        history: this.history.map(msg => ({
          role: msg.role,
          parts: [{ text: msg.content }],
        })),
      });
      console.log('Started new chat with history');

      let result = await this.chat.sendMessage(userInput);
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
              args.businessName,
              args.staffName,
              args.serviceName,
              args.date,
              args.startTime
            );
            break;
          default:
            console.warn(`Function ${name} not implemented.`);
            throw new Error(`The function ${name} is not supported.`);
        }

        console.log('Function response data:', functionResponseData);

        // Format the function response based on the function type
        let formattedResponse = '';
        if (functionResponseData) {
          switch (name) {
            case 'list_businesses':
              const businesses = functionResponseData as any[];
              if (businesses.length > 0) {
                formattedResponse = 'Here are the available businesses:\n\n';
                businesses.forEach(business => {
                  formattedResponse += `• ${business.businessName} (${business.businessRating}★)\n`;
                  business.services.forEach((service: any) => {
                    formattedResponse += `  - ${service.serviceName}: €${service.servicePrice}\n`;
                  });
                  formattedResponse += `  Staff:\n`;
                  business.staff.forEach((staff: any) => {
                    formattedResponse += `  • ${staff.staffName} - ${staff.staffRole}\n`;
                  });
                  formattedResponse += '\n';
                });
                formattedResponse += 'What would you like to book?';
              } else {
                formattedResponse = 'No businesses found matching your criteria. Please try a different search.';
              }
              break;

            case 'find_available_slots':
              const slots = functionResponseData as any[];
              if (slots.length > 0) {
                formattedResponse = `Here are the available slots for ${args.serviceName} at ${args.businessName} on ${args.date}:\n\n`;
                const slotsByStaff = slots.reduce((acc: any, slot: any) => {
                  if (!acc[slot.staffName]) {
                    acc[slot.staffName] = [];
                  }
                  acc[slot.staffName].push(slot);
                  return acc;
                }, {});

                Object.entries(slotsByStaff).forEach(([staffName, staffSlots]) => {
                  formattedResponse += `${staffName}:\n`;
                  (staffSlots as any[]).forEach(slot => {
                    formattedResponse += `• ${slot.startTime} - ${slot.endTime}\n`;
                  });
                  formattedResponse += '\n';
                });
                formattedResponse += 'Please select a time slot to proceed with your booking.';
              } else {
                formattedResponse = `No available slots found for ${args.serviceName} at ${args.businessName} on ${args.date}. Would you like to try a different date?`;
              }
              break;

            case 'create_booking':
              if (functionResponseData && functionResponseData.id) {
                formattedResponse = functionResponseData.message || 
                  `Successfully created your booking for ${args.serviceName} at ${args.businessName} on ${args.date} at ${args.startTime}. This booking is not yet paid. Please go to the My Bookings page to complete your payment.`;
              } else {
                formattedResponse = 'Sorry, I was unable to create your booking. Please try again or select a different time slot.';
              }
              break;
          }
        }

        if (!formattedResponse) {
          console.error('Empty formatted response after function call:', {
            functionName: name,
            functionArgs: args,
            functionResponse: functionResponseData
          });
          throw new Error('Failed to format response after function call');
        }

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

        const finalResponse = response.text();
        console.log('Final response text:', finalResponse);

        if (!finalResponse || finalResponse.trim() === '') {
          console.log('Using formatted response as final response');
          this.addMessage('model', formattedResponse);
        return formattedResponse;
        }

        // Only check for booking success phrases if there was no function call
        if (!functionCall) {
          const bookingSuccessPhrases = [
            'successfully created your booking',
            'created your booking',
            'booked your appointment',
            'confirmed your booking',
            'booking is confirmed',
            'booking has been created'
          ];

          const containsBookingSuccess = bookingSuccessPhrases.some(phrase => 
            finalResponse.toLowerCase().includes(phrase)
          );

          if (containsBookingSuccess) {
            console.log('Model attempted to claim booking success without calling create_booking function. Forcing retry with function call.');
            
            // Remove the last message from history (the one claiming success)
            this.history.pop();
            
            // Add a system message to force function call
            this.addMessage('model', 'I need to properly create your booking using the create_booking function. Please try again.');
            
            // Retry the response generation
            return this.generateResponse(message, isAudio);
          }
        }

        this.addMessage('model', finalResponse);
        console.log('Added model response to history');

        return finalResponse;
      } else {
        // If no function call, extract the text from the model's response
        const textResponse = response.candidates?.[0]?.content?.parts?.[0]?.text;
        console.log('Text response from model:', textResponse);

        if (!textResponse || textResponse.trim() === '') {
          console.error('Empty text response from model:', {
            message,
            history: this.history
          });
          throw new Error('The model did not generate a response. Please try again.');
        }

        this.addMessage('model', textResponse);
        console.log('Added model response to history');

        return textResponse;
      }

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
      console.log('Found business:', { 
        name: business.name,
        openingHours: business.openingHours 
      });
      
      // Get the service
      const servicesRef = collection(businessDoc.ref, 'services');
      const serviceQuery = query(servicesRef, where('name', '==', serviceName));
      const serviceSnapshot = await getDocs(serviceQuery);
      
      if (serviceSnapshot.empty) {
        console.log('No service found with name:', serviceName);
      return [];
      }
      
      const service = serviceSnapshot.docs[0].data() as FirestoreService;
      console.log('Found service:', { 
        name: service.name,
        duration: service.duration,
        staffIds: service.staffIds 
      });
      
      // Get the day of the week
      const dayOfWeek = new Date(date).toLocaleDateString('en-IE', { weekday: 'long' });
      console.log('Day of week:', dayOfWeek);
      
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
      
      console.log('Relevant staff:', relevantStaff.map(staff => ({
        name: staff.name,
        workingDays: staff.workingDays,
        worksOnDay: staff.workingDays.includes(dayOfWeek)
      })));
      
      // Get all bookings for the date
      const bookingsRef = collection(businessDoc.ref, 'bookings');
      const dateQuery = query(bookingsRef, where('date', '==', date));
      const bookingsSnapshot = await getDocs(dateQuery);
      const dateBookings = bookingsSnapshot.docs
        .map(doc => ({
          ...(doc.data() as FirestoreBooking),
          id: doc.id
        }))
        .filter(booking => booking.status !== 'cancelled');
      
      console.log('Existing bookings for date:', dateBookings);
      
      const availableSlots: { staffName: string, startTime: string, endTime: string }[] = [];
      
      // For each staff member
      for (const staff of relevantStaff) {
        // Check if staff member works on this day
        if (!staff.workingDays.includes(dayOfWeek)) {
          console.log(`Staff member ${staff.name} does not work on ${dayOfWeek}`);
          continue;
        }
        
        // Get business opening hours for this day
        const openingHours = business.openingHours[dayOfWeek];
        if (!openingHours) {
          console.log(`No opening hours found for ${dayOfWeek}`);
          continue;
        }
        
        console.log(`Opening hours for ${dayOfWeek}:`, openingHours);
        
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
        
        console.log('Converted hours:', { startHour, endHour });
        
        // Create slots from opening time until closing time
        let currentTime = new Date();
        currentTime.setFullYear(new Date(date).getFullYear());
        currentTime.setMonth(new Date(date).getMonth());
        currentTime.setDate(new Date(date).getDate());
        currentTime.setHours(startHour, openMinute, 0, 0);
        
        const endTime = new Date(currentTime);
        endTime.setHours(endHour, closeMinute, 0, 0);
        
        console.log('Time range:', {
          start: currentTime.toLocaleTimeString(),
          end: endTime.toLocaleTimeString()
        });
        
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
      
      console.log('Available slots:', availableSlots);
      return availableSlots;
    } catch (error) {
      console.error('Error in executeFindAvailableSlots:', error);
      return [];
    }
  }

  private async executeCreateBooking(
    businessName: string,
    staffName: string,
    serviceName: string,
    date: string,
    startTime: string
  ): Promise<any> {
    try {
      console.log('Starting executeCreateBooking with:', { businessName, staffName, serviceName, date, startTime });
      
      // Get the current user's ID
      const auth = getAuth();
      if (!auth.currentUser) {
        console.error('No authenticated user found');
        throw new Error('User must be authenticated to create a booking');
      }
      
      const userId = auth.currentUser.uid;
      console.log('Creating booking for user:', userId);
      
      // First find the business by name
      const businessesRef = collection(db, 'businesses');
      const businessQuery = query(businessesRef, where('name', '==', businessName));
      const businessSnapshot = await getDocs(businessQuery);
      
      if (businessSnapshot.empty) {
        console.log('No business found with name:', businessName);
        throw new Error('Business not found');
      }
      
      const businessDoc = businessSnapshot.docs[0];
      const business = businessDoc.data() as FirestoreBusiness;
      console.log('Found business:', { 
        id: businessDoc.id,
        name: business.name 
      });
      
      // Get the service to get duration
      const servicesRef = collection(businessDoc.ref, 'services');
      const serviceQuery = query(servicesRef, where('name', '==', serviceName));
      const serviceSnapshot = await getDocs(serviceQuery);
      
      if (serviceSnapshot.empty) {
        console.log('No service found with name:', serviceName);
        throw new Error('Service not found');
      }
      
      const serviceDoc = serviceSnapshot.docs[0];
      const service = serviceDoc.data() as FirestoreService;
      console.log('Found service:', { 
        id: serviceDoc.id,
        name: service.name,
        duration: service.duration 
      });
      
      // Get the staff member
      const staffRef = collection(businessDoc.ref, 'staff');
      const staffQuery = query(staffRef, where('name', '==', staffName));
      const staffSnapshot = await getDocs(staffQuery);
      
      if (staffSnapshot.empty) {
        console.log('No staff member found with name:', staffName);
        throw new Error('Staff member not found');
      }
      
      const staffDoc = staffSnapshot.docs[0];
      const staffData = staffDoc.data() as FirestoreStaff;
      console.log('Found staff member:', { 
        id: staffDoc.id,
        name: staffName 
      });

      // Check if a booking already exists for this time slot
      const bookingsRef = collection(businessDoc.ref, 'bookings');
      const existingBookingsQuery = query(
        bookingsRef,
        where('date', '==', date),
        where('startTime', '==', startTime),
        where('staffId', '==', staffDoc.id),
        where('status', '==', 'confirmed')
      );
      
      const existingBookings = await getDocs(existingBookingsQuery);
      if (!existingBookings.empty) {
        console.log('Booking already exists for this time slot');
        throw new Error('This time slot is already booked');
      }

      // Generate a proper UUID format using the uuid library
      const uuid = uuidv4();
      const now = new Date().toISOString();

      // Create the minimal booking object with only required fields
      const businessBooking = {
        id: uuid,
        businessId: businessDoc.id,
        businessName: business.name,
        businessAddress: business.address,
        staffId: staffDoc.id,
        staffName: staffData.name,
        serviceId: serviceDoc.id,
        serviceName: service.name,
        servicePrice: service.price,
        serviceDuration: service.duration,
        userId: userId,
        userEmail: auth.currentUser.email || '',
        date: date,
        startTime: startTime,
        duration: service.duration,
        status: 'confirmed',
        paymentStatus: 'unpaid',
        createdAt: now,
        updatedAt: now
      };
      
      // Create the booking document with the generated ID
      const bookingDocRef = doc(bookingsRef, uuid);
      await setDoc(bookingDocRef, businessBooking);
      console.log('Created booking in business collection:', businessBooking);

      // Create the user's booking with additional fields
      const userBooking = {
        id: uuid,
        businessId: businessDoc.id,
        businessName: business.name,
        businessAddress: business.address,
        staffId: staffDoc.id,
        staffName: staffData.name,
        serviceId: serviceDoc.id,
        serviceName: service.name,
        servicePrice: service.price,
        serviceDuration: service.duration,
        userId: userId,
        userEmail: auth.currentUser.email || '',
        date: date,
        startTime: startTime,
        duration: service.duration,
        status: 'confirmed',
        paymentStatus: 'unpaid',
        createdAt: now,
        updatedAt: now
      };

      // Create the booking in the user's bookings collection with the same ID
      const userBookingsRef = collection(db, 'users', userId, 'bookings');
      const userBookingDocRef = doc(userBookingsRef, uuid);
      await setDoc(userBookingDocRef, userBooking);
      console.log('Created booking in user collection:', userBooking);
      
      return {
        ...businessBooking,
        message: `Your booking for ${serviceName} at ${businessName} on ${date} at ${startTime} with ${staffName} has been confirmed. This booking is not yet paid. You can complete the payment in the My Bookings page.`
      };
    } catch (error) {
      console.error('Error in executeCreateBooking:', error);
      return null;
    }
  }

  async confirmBooking(bookingId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get the current user
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        return { success: false, error: 'User not authenticated' };
      }

      // Get the user's pending bookings
      const userBookingsRef = collection(db, 'users', currentUser.uid, 'bookings');
      const bookingDoc = await getDoc(doc(userBookingsRef, bookingId));

      if (!bookingDoc.exists()) {
        return { success: false, error: 'Booking not found' };
      }

      const bookingData = bookingDoc.data();

      // Create the booking in the business collection
      const businessBookingRef = doc(collection(db, 'businesses', bookingData.businessId, 'bookings'), bookingId);
      await setDoc(businessBookingRef, {
        ...bookingData,
        status: 'confirmed',
        isPaid: true,
        updatedAt: serverTimestamp()
      });

      // Update the booking in the user's collection
      await updateDoc(doc(userBookingsRef, bookingId), {
        status: 'confirmed',
        isPaid: true,
        updatedAt: serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('Error confirming booking:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      };
    }
  }
} 