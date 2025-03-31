import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, SchemaType, Tool } from '@google/generative-ai';
import { ChatMessage } from '@/types/chat';
import { 
  getAllBusinesses,
  getBusinessData
} from '@/data/dummyBusinesses';
import { Business, BusinessSelectionState } from '@/types/business';

const tools: Tool[] = [{
  functionDeclarations: [
    {
      name: "list_businesses",
      description: "Lists all available businesses with their key details to help the user make a selection.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          filter: {
            type: SchemaType.STRING,
            description: "Optional filter to narrow down businesses by type or service."
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
          business_id: {
            type: SchemaType.STRING,
            description: "The unique identifier of the business the user is interested in."
          }
        },
        required: ["business_id"]
      }
    },
    {
      name: "confirm_business_selection",
      description: "Confirms the user's selection of a business and saves it to state.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          business_id: {
            type: SchemaType.STRING,
            description: "The unique identifier of the selected business."
          }
        },
        required: ["business_id"]
      }
    },
    {
      name: "getCurrentDateTime",
      description: "Gets the current date and time in a formatted way.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {},
        required: []
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
  private selectionState: BusinessSelectionState = {
    selectedBusiness: null,
    selectionConfirmed: false,
    selectionTimestamp: null
  };

  constructor(apiKey: string) {
    const genAI = new GoogleGenerativeAI(apiKey);
    const systemInstruction = `
    You are a helpful chatbot designed to assist users with selecting a business for their appointment booking.
    Your primary focus is to help users choose the right business by:
    1. Understanding their needs and preferences
    2. Presenting relevant businesses with clear comparisons
    3. Providing detailed information about each business
    4. Guiding them to make a confident selection

    When helping users select a business:
    1. First, use list_businesses to show available options
    2. When a user shows interest in a specific business, use get_business_details to provide more information
    3. Help users compare businesses based on:
       - Services offered
       - Ratings and reviews
       - Location and accessibility
       - Opening hours
       - Price ranges
    4. Once the user has made a clear choice, use confirm_business_selection to save their selection

    Important guidelines:
    - Present information in a clear, structured way
    - Focus on helping users make an informed decision
    - Don't overwhelm users with too many options at once
    - Ask clarifying questions when needed
    - Confirm the selection only when the user is certain
    - If the user wants to change their selection, allow them to do so
    - if providing a list of items as information to the user, display it in a list format

    Remember: The goal is to help users find the right business for their needs.`;

    this.model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash", 
      tools,
      generationConfig: {
        temperature: 0.7, 
        topK: 1, 
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
        },
      ],
    });

    this.chat = this.model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: systemInstruction }],
        },
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
      this.chat = this.model.startChat({
        history: this.history.map(msg => ({
          role: msg.role,
          parts: [{ text: msg.content }],
        })),
      });

      let result = await this.chat.sendMessage(message);
      let response = await result.response;

      const functionCall = response.candidates?.[0]?.content?.parts?.[0]?.functionCall;

      if (functionCall) {
        const { name, args } = functionCall;
        let functionResponseData;

        switch (name) {
          case 'list_businesses':
            functionResponseData = await this.executeListBusinesses(args.filter);
            break;
          case 'get_business_details':
            functionResponseData = await this.executeGetBusinessDetails(args.business_id);
            break;
          case 'confirm_business_selection':
            functionResponseData = await this.executeConfirmBusinessSelection(args.business_id);
            break;
          case 'getCurrentDateTime':
            functionResponseData = await this.executeGetCurrentDateTime();
            break;
          default:
            console.warn(`Function ${name} not implemented.`);
            return `I apologize, but I encountered an error. The function ${name} is not supported.`;
        }

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

      const finalResponse = response.text();
      
      if (!finalResponse || finalResponse.toLowerCase().includes('looking for') || finalResponse.toLowerCase().includes('moment')) {
        return "I apologize, but I encountered an issue processing your request. Could you please try rephrasing your question?";
      }

      return finalResponse;

    } catch (error) {
      console.error('Error generating response:', error);
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
  }

  private async executeListBusinesses(filter?: string) {
    const businesses = await getAllBusinesses();
    let filteredBusinesses = businesses;

    if (filter) {
      filteredBusinesses = businesses.filter(business => 
        business.type.toLowerCase().includes(filter.toLowerCase()) ||
        business.services.some(service => 
          service.name.toLowerCase().includes(filter.toLowerCase()) ||
          service.description.toLowerCase().includes(filter.toLowerCase())
        )
      );
    }

    return filteredBusinesses.map(business => ({
      id: business.id,
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
  }

  private async executeGetBusinessDetails(businessId: string) {
    const business = await getBusinessData(businessId);
    if (!business) return null;

    return {
      id: business.id,
      name: business.name,
      description: business.description,
      address: business.address,
      city: business.city,
      rating: business.rating,
      reviews: business.reviews,
      imageUrl: business.imageUrl,
      type: business.type,
      openingHours: business.openingHours,
      services: business.services.map(service => ({
        id: service.id,
        name: service.name,
        price: service.price,
        duration: service.duration,
        description: service.description
      }))
    };
  }

  private async executeConfirmBusinessSelection(businessId: string) {
    const business = await getBusinessData(businessId);
    if (!business) {
      throw new Error('Business not found');
    }

    this.selectionState = {
      selectedBusiness: business,
      selectionConfirmed: true,
      selectionTimestamp: Date.now()
    };

    return {
      success: true,
      business: {
        id: business.id,
        name: business.name,
        type: business.type
      }
    };
  }

  private async executeGetCurrentDateTime() {
    const now = new Date();
    return {
      date: now.toISOString().split('T')[0], // Format: YYYY-MM-DD
      time: now.toLocaleTimeString('en-IE', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }), // Format: HH:MM (24-hour)
      dayOfWeek: now.toLocaleDateString('en-IE', { weekday: 'long' }), // Format: Monday, Tuesday, etc.
      timestamp: now.getTime()
    };
  }

  getSelectionState(): BusinessSelectionState {
    return this.selectionState;
  }

  resetSelection() {
    this.selectionState = {
      selectedBusiness: null,
      selectionConfirmed: false,
      selectionTimestamp: null
    };
  }
} 