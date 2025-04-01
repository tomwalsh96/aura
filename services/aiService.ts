import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, SchemaType, Tool } from '@google/generative-ai';
import { ChatMessage } from '@/types/chat';
import { 
  getAllBusinesses,
  getBusinessData,
  getAvailableTimeSlots
} from '@/data/dummyBusinesses';
import { Business, BusinessSelectionState, StaffMember } from '@/types/business';

const tools: Tool[] = [{
  functionDeclarations: [
    {
      name: "list_businesses",
      description: "Lists all available businesses with their key details. MUST be used when user mentions a city, service type, or asks to see available businesses.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          city: {
            type: SchemaType.STRING,
            description: "Optional city name to filter businesses by location (e.g., 'Dublin', 'Cork', 'Galway', 'Limerick', 'Waterford', etc.)."
          },
          service: {
            type: SchemaType.STRING,
            description: "Optional service name to filter businesses by service type (e.g., 'haircut', 'massage', 'nails', etc.)."
          }
        },
        required: []
      }
    },
    {
      name: "get_business_details",
      description: "Retrieves detailed information about a specific business to help the user make an informed decision.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          business_name: {
            type: SchemaType.STRING,
            description: "The name of the business the user is interested in."
          }
        },
        required: ["business_name"]
      }
    },
    {
      name: "get_staff_members",
      description: "CRITICAL: Retrieves information about staff members working at a specific business. MUST be used before mentioning any staff members. NEVER make up or assume staff members exist - always use this function to get real data.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          business_name: {
            type: SchemaType.STRING,
            description: "The name of the business to get staff members for."
          }
        },
        required: ["business_name"]
      }
    },
    {
      name: "get_services",
      description: "Retrieves information about services offered by a specific business.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          business_name: {
            type: SchemaType.STRING,
            description: "The name of the business to get services for."
          }
        },
        required: ["business_name"]
      }
    },
    {
      name: "get_staff_services",
      description: "Retrieves information about services performed by a specific staff member at a business.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          business_name: {
            type: SchemaType.STRING,
            description: "The name of the business."
          },
          staff_name: {
            type: SchemaType.STRING,
            description: "The name of the staff member."
          }
        },
        required: ["business_name", "staff_name"]
      }
    },
    {
      name: "get_service_staff",
      description: "Retrieves information about staff members who perform a specific service at a business.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          business_name: {
            type: SchemaType.STRING,
            description: "The name of the business."
          },
          service_name: {
            type: SchemaType.STRING,
            description: "The name of the service."
          }
        },
        required: ["business_name", "service_name"]
      }
    },
    {
      name: "get_current_date_time",
      description: "Gets the current date and time. Only to be used for context on the current date and time, especially when the user asks for relative dates or times.",
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
      name: "get_staff_availability_date",
      description: "Gets available time slots for a staff member on a specific date, considering service duration.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          business_name: {
            type: SchemaType.STRING,
            description: "The name of the business."
          },
          staff_name: {
            type: SchemaType.STRING,
            description: "The name of the staff member."
          },
          service_name: {
            type: SchemaType.STRING,
            description: "The name of the service to check availability for."
          },
          date: {
            type: SchemaType.STRING,
            description: "The date to check availability for (YYYY-MM-DD format)."
          }
        },
        required: ["business_name", "staff_name", "service_name", "date"]
      }
    },
    {
      name: "get_staff_by_day",
      description: "Gets all staff members who work at a business on a specific day of the week.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          business_name: {
            type: SchemaType.STRING,
            description: "The name of the business."
          },
          day: {
            type: SchemaType.STRING,
            description: "The day of the week to check (e.g., 'Monday', 'Tuesday', etc.)."
          }
        },
        required: ["business_name", "day"]
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
  private systemInstruction: string;

  constructor(apiKey: string) {
    const genAI = new GoogleGenerativeAI(apiKey);
    this.systemInstruction = `
    You are a focused booking assistant with one clear goal: help users book appointments efficiently. Your responses should be direct and action-oriented, but also friendly and engaging.

    CRITICAL: You MUST use the appropriate functions to get real data. NEVER make up or assume information about staff members, services, or availability.

    Initial greeting and booking process explanation:
    "Hi there! 👋 I'm your friendly booking buddy, here to help you find the perfect appointment with local businesses in Ireland.

    🎯 **How can I help you today?**
    • Looking for a specific city? (Dublin, Cork, Galway...)
    • Need a particular service? (Haircuts, massages, beauty treatments)
    • Have a favourite spot in mind? (Just tell me the business name)

    ✨ **Here's how it works:**
    1. **Find Your Spot**
       • Search however you like - by city, service, or business name
       • Check out ratings and reviews from other customers

    2. **Pick Your Service**
       • See what each staff member offers
       • Check out their specialities
       • Get the lowdown on prices and how long each service takes

    3. **Choose Your Date**
       • Tell me which date you'd like to book (e.g., "Thursday" or "April 25th")
       • If you just mention a day (e.g., "Thursday"), I'll book for the next instance of that day
       • I'll show you available slots for that specific date

    4. **Lock in Your Time**
       • Choose from available slots that suit you
       • Book and pay - easy peasy!

    What would you like to search for? 😊"

    CRITICAL FUNCTION USAGE RULES:
    1. ALWAYS use list_businesses function when:
       - User mentions a city (e.g., "Dublin", "Cork")
       - User mentions a service type (e.g., "haircut", "massage")
       - User asks to see available businesses
    2. CRITICAL: ALWAYS use get_staff_members function when:
       - User selects a business
       - User asks about staff at a business
       - User mentions a business name
       - BEFORE mentioning any staff members
    3. ALWAYS use get_staff_services when a staff member is mentioned
    4. CRITICAL: ALWAYS use get_staff_availability_date when:
       - User mentions a service
       - User asks about availability
       - User wants to book a time slot
       - BEFORE suggesting or mentioning any time slots
       - If user just mentions a day (e.g., "Thursday"), automatically use the next instance of that day
    5. Be direct and action-oriented
    6. Don't show unnecessary business details unless asked
    7. Focus on the booking process
    8. Show relevant information only (services, availability)
    9. NEVER say "let me" or "I'll" - instead, directly provide the information
    10. When a user requests information, immediately fetch and display it without announcing the action
    11. Be concise and focused on the next step in the booking process
    12. CRITICAL: NEVER make up or hallucinate staff members or services - always use the functions to get real data
    13. CRITICAL: If you're not sure about staff members, ALWAYS call get_staff_members first
    14. CRITICAL: NEVER suggest or mention time slots without first calling get_staff_availability_date
    15. CRITICAL: If get_staff_availability_date returns no slots, say "No available time slots found" - do not make up slots
    16. CRITICAL: When user mentions a day of the week, automatically use the next instance of that day

    Example conversation flow:
    User: "Show me businesses in Dublin"
    Assistant: [Uses list_businesses with city="Dublin"] "Here are the businesses in Dublin..."

    User: "I want to book at Shear Madness"
    Assistant: [Uses get_staff_members] "Here are the staff members at Shear Madness. Who would you like to book with?"

    User: "I want to book with John"
    Assistant: [Uses get_staff_services] "Here are John's services at Shear Madness. Which service would you like to book?"
    
    User: "A haircut"
    Assistant: "Which date would you like to book the haircut for? (e.g., Thursday or April 25th)"

    User: "Thursday"
    Assistant: [Uses get_staff_availability_date with next Thursday's date] "Here are the available time slots for John's haircut service on Thursday, April 25th. When would you like to book?"

    Remember: Your goal is to help users book appointments quickly and efficiently. Every response should move the conversation toward this goal.
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
        }
      ],
    });

    // Initialize chat with empty history
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
      
      // Add user message to chat history
      this.addMessage('user', message);
      console.log('Added user message to history');

      // Start a new chat with the current history
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
            functionResponseData = await this.executeListBusinesses(args.city, args.service);
            break;
          case 'get_business_details':
            functionResponseData = await this.executeGetBusinessDetails(args.business_name);
            break;
          case 'get_staff_members':
            functionResponseData = await this.executeGetStaffMembers(args.business_name);
            break;
          case 'get_services':
            functionResponseData = await this.executeGetServices(args.business_name);
            break;
          case 'get_staff_services':
            functionResponseData = await this.executeGetStaffServices(args.business_name, args.staff_name);
            break;
          case 'get_service_staff':
            functionResponseData = await this.executeGetServiceStaff(args.business_name, args.service_name);
            break;
          case 'get_current_date_time':
            functionResponseData = await this.executeGetCurrentDateTime();
            break;
          case 'get_staff_availability_date':
            functionResponseData = await this.executeGetStaffAvailabilityDate(
              args.business_name,
              args.staff_name,
              args.service_name,
              args.date
            );
            break;
          case 'get_staff_by_day':
            functionResponseData = await this.executeGetStaffByDay(args.business_name, args.day);
            break;
          default:
            console.warn(`Function ${name} not implemented.`);
            return `I apologize, but I encountered an error. The function ${name} is not supported.`;
        }

        console.log('Function response data:', functionResponseData);

        // Format the response based on the function type
        let formattedResponse = '';
        if (name === 'list_businesses') {
          const businesses = functionResponseData as any[];
          if (businesses && businesses.length > 0) {
            formattedResponse = 'Here are the available businesses:\n\n';
            businesses.forEach(business => {
              formattedResponse += `**${business.name}**\n`;
              formattedResponse += `Type: ${business.type}\n`;
              formattedResponse += `City: ${business.city}\n`;
              formattedResponse += `Rating: ${business.rating} (${business.reviews} reviews)\n`;
              formattedResponse += `Description: ${business.description}\n\n`;
            });
          } else {
            formattedResponse = 'No businesses found matching your criteria.';
          }
        } else if (name === 'get_business_details') {
          const business = functionResponseData as any;
          if (business) {
            if (business.notFound) {
              formattedResponse = `I couldn't find a business named "${business.searchTerm}". `;
              if (business.similarBusinesses.length > 0) {
                formattedResponse += `Did you mean one of these businesses?\n\n`;
                business.similarBusinesses.forEach((b: any) => {
                  formattedResponse += `**${b.name}**\n`;
                  formattedResponse += `Type: ${b.type}\n`;
                  formattedResponse += `City: ${b.city}\n\n`;
                });
              } else {
                formattedResponse += `Here are all available businesses:\n\n`;
                const allBusinesses = await getAllBusinesses();
                allBusinesses.forEach((b: any) => {
                  formattedResponse += `**${b.name}**\n`;
                  formattedResponse += `Type: ${b.type}\n`;
                  formattedResponse += `City: ${b.city}\n\n`;
                });
              }
            } else {
              formattedResponse = `**${business.name}**\n\n`;
              formattedResponse += `Description: ${business.description}\n`;
              formattedResponse += `Address: ${business.address}\n`;
              formattedResponse += `City: ${business.city}\n`;
              formattedResponse += `Rating: ${business.rating} (${business.reviews} reviews)\n`;
              formattedResponse += `Type: ${business.type}\n\n`;
              formattedResponse += '**Opening Hours:**\n';
              Object.entries(business.openingHours).forEach(([day, hours]) => {
                formattedResponse += `${day}: ${hours}\n`;
              });
              formattedResponse += '\n**Services Offered:**\n';
              business.services.forEach((service: any) => {
                formattedResponse += `• ${service.name} - €${service.price} (${service.duration} minutes)\n`;
                formattedResponse += `  ${service.description}\n`;
              });
            }
          } else {
            formattedResponse = 'Business details not found.';
          }
        } else if (name === 'get_staff_members') {
          const response = functionResponseData as any;
          if (response) {
            if (response.notFound) {
              formattedResponse = `I couldn't find a business named "${response.searchTerm}". Did you mean one of these businesses?\n\n`;
              response.similarBusinesses.forEach((b: any) => {
                formattedResponse += `**${b.name}**\n`;
                formattedResponse += `Type: ${b.type}\n`;
                formattedResponse += `City: ${b.city}\n\n`;
              });
            } else if (response.found && response.staff) {
              formattedResponse = '**Staff Members:**\n\n';
              for (const member of response.staff) {
                formattedResponse += `**${member.name}**\n`;
                formattedResponse += `Role: ${member.role}\n`;
                formattedResponse += `Bio: ${member.bio}\n`;
                formattedResponse += `Working Days: ${member.workingDays.join(', ')}\n`;
                formattedResponse += `Available Today: ${member.isAvailable ? 'Yes' : 'No'}\n\n`;
              }
            } else {
              formattedResponse = 'No staff members found.';
            }
          } else {
            formattedResponse = 'No staff members found.';
          }
        } else if (name === 'get_staff_by_day') {
          const response = functionResponseData as any;
          if (response.notFound) {
            formattedResponse = `I couldn't find a business named "${response.searchTerm}". Did you mean one of these businesses?\n\n`;
            response.similarBusinesses.forEach((b: any) => {
              formattedResponse += `**${b.name}**\n`;
              formattedResponse += `Type: ${b.type}\n`;
              formattedResponse += `City: ${b.city}\n\n`;
            });
          } else if (response.found) {
            if (response.staff.length === 0) {
              formattedResponse = response.message;
            } else {
              formattedResponse = `**Staff Members Working on ${args.day}:**\n\n`;
              response.staff.forEach((member: StaffMember) => {
                formattedResponse += `**${member.name}**\n`;
                formattedResponse += `Role: ${member.role}\n`;
                formattedResponse += `Bio: ${member.bio}\n\n`;
              });
            }
          } else {
            formattedResponse = 'No staff members found.';
          }
        } else if (name === 'get_services') {
          const services = functionResponseData as any[];
          if (services && services.length > 0) {
            formattedResponse = '**Available Services:**\n\n';
            services.forEach(service => {
              formattedResponse += `**${service.name}**\n`;
              formattedResponse += `Price: €${service.price}\n`;
              formattedResponse += `Duration: ${service.duration} minutes\n`;
              formattedResponse += `Description: ${service.description}\n\n`;
            });
          } else {
            formattedResponse = 'No services found.';
          }
        } else if (name === 'get_staff_services') {
          const response = functionResponseData as any;
          if (response.notFound) {
            formattedResponse = `I couldn't find a business named "${response.searchTerm}". Did you mean one of these businesses?\n\n`;
            response.similarBusinesses.forEach((b: any) => {
              formattedResponse += `**${b.name}**\n`;
              formattedResponse += `Type: ${b.type}\n`;
              formattedResponse += `City: ${b.city}\n\n`;
            });
          } else if (response.found) {
            if (response.staffNotFound) {
              formattedResponse = `I couldn't find a staff member named "${response.searchTerm}" at ${response.businessName}. Did you mean one of these staff members?\n\n`;
              response.similarStaff.forEach((s: any) => {
                formattedResponse += `**${s.name}**\n`;
                formattedResponse += `Role: ${s.role}\n\n`;
              });
            } else if (response.services && response.services.length > 0) {
              formattedResponse = `**Services Offered by ${response.staffName}:**\n\n`;
              response.services.forEach((service: any) => {
                formattedResponse += `**${service.name}**\n`;
                formattedResponse += `Price: €${service.price}\n`;
                formattedResponse += `Duration: ${service.duration} minutes\n`;
                formattedResponse += `Description: ${service.description}\n\n`;
              });
            } else {
              formattedResponse = `No services found for ${response.staffName}.`;
            }
          } else {
            formattedResponse = `No services found for ${args.staff_name}.`;
          }
        } else if (name === 'get_staff_availability_date') {
          const availability = functionResponseData as any[];
          if (availability && availability.length > 0) {
            formattedResponse = `**Available Time Slots for ${args.staff_name} at ${args.business_name}:**\n\n`;
            availability.forEach(day => {
              // Parse the date string (YYYY-MM-DD format)
              const [year, month, dayNum] = day.date.split('-').map(Number);
              const date = new Date(year, month - 1, dayNum); // month is 0-based in JavaScript
              
              const formattedDate = date.toLocaleDateString('en-IE', { 
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              });
              
              formattedResponse += `**${formattedDate}:**\n`;
              if (day.availableSlots && day.availableSlots.length > 0) {
                day.availableSlots.forEach((slot: { startTime: string; endTime: string }) => {
                  formattedResponse += `• ${slot.startTime} - ${slot.endTime}\n`;
                });
              } else {
                formattedResponse += `No available slots\n`;
              }
              formattedResponse += '\n';
            });
          } else {
            formattedResponse = `No available time slots found for ${args.staff_name} at ${args.business_name} for the next week.`;
          }
        } else {
          formattedResponse = JSON.stringify(functionResponseData, null, 2);
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

        // Add the formatted response to chat history
        this.addMessage('model', formattedResponse);
        console.log('Added formatted response to history');

        return formattedResponse;
      }

      const finalResponse = response.text();
      console.log('Final response text:', finalResponse);

      // Add model response to chat history
      this.addMessage('model', finalResponse);
      console.log('Added model response to history');

      return finalResponse;

    } catch (error) {
      console.error('Error in generateResponse:', error);
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
      }
      return "I apologize, but I encountered an error processing your request. Please try again.";
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
    // Initialize chat with empty history
    this.chat = this.model.startChat({
      history: [],
    });
  }

  private normalizeString(str: string): string {
    return str.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  }

  private getWordMatches(searchTerm: string, targetString: string): number {
    const searchWords = this.normalizeString(searchTerm).split(/\s+/);
    const targetWords = this.normalizeString(targetString).split(/\s+/);
    
    // Count how many words from the search term appear in the target string
    return searchWords.filter(word => 
      targetWords.some(targetWord => 
        targetWord.includes(word) || word.includes(targetWord)
      )
    ).length;
  }

  private findMatches<T>(
    searchTerm: string,
    items: T[],
    getProperty: (item: T) => string
  ): { exactMatch: T | null; similarMatches: { item: T; matchScore: number }[] } {
    // First try exact match
    const exactMatch = items.find(item => 
      getProperty(item).toLowerCase() === searchTerm.toLowerCase()
    );
    
    if (exactMatch) {
      return { exactMatch, similarMatches: [] };
    }

    // If search term is a single word, try matching against first or last names
    if (!searchTerm.includes(' ')) {
      const singleWordMatches = items.map(item => {
        const fullName = getProperty(item);
        const nameParts = fullName.split(' ');
        const matchScore = nameParts.some(part => 
          part.toLowerCase() === searchTerm.toLowerCase()
        ) ? 2 : 0; // Higher score for single name matches
        
        return { item, matchScore };
      })
      .filter(match => match.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore);

      // If we found exactly one match with a single name, return it
      if (singleWordMatches.length === 1) {
        return { exactMatch: singleWordMatches[0].item, similarMatches: [] };
      }
      
      // If we found multiple matches, include them in similar matches
      if (singleWordMatches.length > 0) {
        return { exactMatch: null, similarMatches: singleWordMatches };
      }
    }
    
    // If no single name matches or search term has multiple words, use word overlap
    const searchWords = this.normalizeString(searchTerm).split(/\s+/);
    const matches = items.map(item => {
      const targetWords = this.normalizeString(getProperty(item)).split(/\s+/);
      const matchScore = searchWords.filter(word => 
        targetWords.some(targetWord => 
          targetWord.includes(word) || word.includes(targetWord)
        )
      ).length;
      
      return { item, matchScore };
    })
    .filter(match => match.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5); // Get top 5 matches
    
    return { exactMatch: null, similarMatches: matches };
  }

  private async executeListBusinesses(city?: string, service?: string) {
    try {
      console.log('Starting executeListBusinesses with:', { city, service });
      const businesses = await getAllBusinesses();
      console.log('Retrieved businesses:', businesses.map(b => ({ name: b.name, city: b.city })));
      
      let filteredBusinesses = businesses;

      if (city) {
        console.log('Filtering by city:', city);
        filteredBusinesses = filteredBusinesses.filter(business => 
          business.city.toLowerCase().includes(city.toLowerCase())
        );
        console.log('Filtered businesses by city:', filteredBusinesses.map(b => ({ name: b.name, city: b.city })));
      }
      
      if (service) {
        console.log('Filtering by service:', service);
        filteredBusinesses = filteredBusinesses.filter(business => 
          business.type.toLowerCase().includes(service.toLowerCase()) ||
          business.services.some(businessService => 
            businessService.name.toLowerCase().includes(service.toLowerCase()) ||
            businessService.description.toLowerCase().includes(service.toLowerCase())
          )
        );
        console.log('Filtered businesses by service:', filteredBusinesses.map(b => ({ 
          name: b.name, 
          services: b.services.map(s => s.name)
        })));
      }

      if (filteredBusinesses.length === 0) {
        console.log('No businesses found after filtering');
        return [];
      }

      const result = filteredBusinesses.map(business => ({
        name: business.name,
        description: business.description,
        type: business.type,
        rating: business.rating,
        reviews: business.reviews,
        city: business.city,
        services: business.services.map(service => ({
          name: service.name,
          price: service.price,
          duration: service.duration
        }))
      }));

      console.log('Final filtered results:', result.map(b => ({ 
        name: b.name, 
        city: b.city,
        services: b.services.map(s => s.name)
      })));
      return result;
    } catch (error) {
      console.error('Error in executeListBusinesses:', error);
      return [];
    }
  }

  private async executeGetBusinessDetails(businessName: string) {
    const businesses = await getAllBusinesses();
    const { exactMatch, similarMatches } = this.findMatches(
      businessName,
      businesses,
      (b) => b.name
    );
    
    if (exactMatch) {
      return this.formatBusinessDetails(exactMatch);
    }
    
    return {
      notFound: true,
      searchTerm: businessName,
      similarBusinesses: similarMatches.map(({ item, matchScore }) => ({
        name: item.name,
        city: item.city,
        type: item.type,
        matchScore
      }))
    };
  }

  private formatBusinessDetails(business: any) {
    return {
      name: business.name,
      description: business.description,
      address: business.address,
      city: business.city,
      rating: business.rating,
      reviews: business.reviews,
      type: business.type,
      openingHours: business.openingHours,
      services: business.services.map((service: { name: string; price: number; duration: number; description: string }) => ({
        name: service.name,
        price: service.price,
        duration: service.duration,
        description: service.description
      }))
    };
  }

  private async executeGetStaffMembers(businessName: string) {
    const businesses = await getAllBusinesses();
    const { exactMatch, similarMatches } = this.findMatches(
      businessName,
      businesses,
      (b) => b.name
    );
    
    if (!exactMatch) {
      return {
        notFound: true,
        searchTerm: businessName,
        similarBusinesses: similarMatches.map(({ item, matchScore }) => ({
          name: item.name,
          city: item.city,
          type: item.type,
          matchScore
        }))
      };
    }

    // Get current date and day of week
    const now = new Date();
    const dayOfWeek = now.toLocaleDateString('en-IE', { weekday: 'long' });

    return {
      found: true,
      staff: exactMatch.staff.map(staff => ({
        name: staff.name,
        role: staff.role,
        bio: staff.bio,
        workingDays: staff.workingDays,
        isAvailable: staff.workingDays.includes(dayOfWeek)
      }))
    };
  }

  private async executeGetServices(businessName: string) {
    const businesses = await getAllBusinesses();
    const { exactMatch } = this.findMatches(
      businessName,
      businesses,
      (b) => b.name
    );
    
    if (!exactMatch) return null;

    return exactMatch.services.map(service => ({
      name: service.name,
      price: service.price,
      duration: service.duration,
      description: service.description
    }));
  }

  private async executeGetStaffServices(businessName: string, staffName: string) {
    const businesses = await getAllBusinesses();
    const { exactMatch: business, similarMatches: similarBusinesses } = this.findMatches(
      businessName,
      businesses,
      (b) => b.name
    );
    
    if (!business) {
          return {
        notFound: true,
        searchTerm: businessName,
        similarBusinesses: similarBusinesses.map(({ item, matchScore }) => ({
          name: item.name,
          city: item.city,
          type: item.type,
          matchScore
        }))
      };
    }

    const { exactMatch: staff, similarMatches: similarStaff } = this.findMatches(
      staffName,
      business.staff,
      (s) => s.name
    );
    
    if (!staff) {
      return {
        found: true,
        businessName: business.name,
        staffNotFound: true,
        searchTerm: staffName,
        similarStaff: similarStaff.map(({ item, matchScore }) => ({
          name: item.name,
          role: item.role,
          matchScore
        }))
      };
    }

    // Filter services to only include those performed by the specified staff member
    const staffServices = business.services.filter(service => 
      service.staffIds.includes(staff.id)
    );

      return {
      found: true,
      staffName: staff.name,
      services: staffServices.map(service => ({
        name: service.name,
        price: service.price,
        duration: service.duration,
        description: service.description
      }))
    };
  }

  private async executeGetServiceStaff(businessName: string, serviceName: string) {
    const businesses = await getAllBusinesses();
    const { exactMatch: business } = this.findMatches(
      businessName,
      businesses,
      (b) => b.name
    );
    
    if (!business) return null;

    const { exactMatch: service } = this.findMatches(
      serviceName,
      business.services,
      (s) => s.name
    );
    
    if (!service) return null;

    // Get all staff members who perform this service
    const staffMembers = business.staff.filter(staff => 
      service.staffIds.includes(staff.id)
    );

    return staffMembers.map(staff => ({
      name: staff.name,
      role: staff.role,
      bio: staff.bio,
      workingDays: staff.workingDays
    }));
  }

  private getNextInstanceOfDay(dayOfWeek: string): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date();
    const currentDay = today.getDay();
    const targetDay = days.indexOf(dayOfWeek);
    
    if (targetDay === -1) {
      throw new Error('Invalid day of week');
    }
    
    // Calculate days until next instance
    let daysUntilNext = targetDay - currentDay;
    if (daysUntilNext <= 0) {
      daysUntilNext += 7; // Move to next week if the day has passed
    }
    
    // Create date for next instance
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysUntilNext);
    
    // Format as YYYY-MM-DD
    return nextDate.toISOString().split('T')[0];
  }

  private async executeGetStaffAvailabilityDate(
    businessName: string,
    staffName: string,
    serviceName: string,
    date: string
  ) {
    try {
      const businesses = await getAllBusinesses();
      const { exactMatch: business } = this.findMatches(
        businessName,
        businesses,
        (b) => b.name
      );
      
      if (!business) {
        console.error(`Business not found: ${businessName}`);
        return null;
      }

      const { exactMatch: staff } = this.findMatches(
        staffName,
        business.staff,
        (s) => s.name
      );
      
      if (!staff) {
        console.error(`Staff member not found: ${staffName} at ${businessName}`);
        return null;
      }

      const { exactMatch: service } = this.findMatches(
        serviceName,
        business.services,
        (s) => s.name
      );
      
      if (!service) {
        console.error(`Service not found: ${serviceName} at ${businessName}`);
        return null;
      }

      // Handle relative dates (e.g., "Thursday")
      let targetDate = date;
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      if (days.includes(date)) {
        targetDate = this.getNextInstanceOfDay(date);
      }

      // Parse the date string (YYYY-MM-DD format)
      const [year, month, day] = targetDate.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day); // month is 0-based in JavaScript
      
      if (isNaN(dateObj.getTime())) {
        console.error(`Invalid date format: ${targetDate}`);
        return null;
      }

      const dayOfWeek = dateObj.toLocaleDateString('en-IE', { weekday: 'long' });

      // Check if staff works on this day
      if (!staff.workingDays.includes(dayOfWeek)) {
        console.warn(`Staff member ${staffName} does not work on ${dayOfWeek}`);
        return null;
      }

      // Get available slots using the actual function
      const availableSlots = await getAvailableTimeSlots(business.id, targetDate);
      
      // Filter slots for this staff member
      const staffSlots = availableSlots
        .filter(slot => slot.staffId === staff.id)
        .map(slot => ({
          startTime: slot.startTime,
          endTime: slot.endTime
        }));

      return {
        date: targetDate,
        availableSlots: staffSlots
      };
    } catch (error) {
      console.error('Error in executeGetStaffAvailabilityDate:', error);
      return null;
    }
  }

  private async executeGetStaffByDay(businessName: string, day: string) {
    const businesses = await getAllBusinesses();
    const { exactMatch, similarMatches } = this.findMatches(
      businessName,
      businesses,
      (b) => b.name
    );
    
    if (!exactMatch) {
      return {
        notFound: true,
        searchTerm: businessName,
        similarBusinesses: similarMatches.map(({ item, matchScore }) => ({
          name: item.name,
          city: item.city,
          type: item.type,
          matchScore
        }))
      };
    }

    const staff = exactMatch.staff.filter(s => s.workingDays.includes(day));
    if (staff.length === 0) {
      return {
        found: true,
        staff: [],
        message: `No staff members found working on ${day} at ${exactMatch.name}.`
      };
    }

    return {
      found: true,
      staff: staff.map(s => ({
        name: s.name,
        role: s.role,
        bio: s.bio,
        workingDays: s.workingDays,
        isAvailable: s.workingDays.includes(day)
      }))
    };
  }

  private async executeGetCurrentDateTime() {
    const now = new Date();
    return {
      currentDate: now.toLocaleDateString('en-IE', { 
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      currentTime: now.toLocaleTimeString('en-IE', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }),
      dayOfWeek: now.toLocaleDateString('en-IE', { weekday: 'long' }),
      timestamp: now.getTime()
    };
  }
} 