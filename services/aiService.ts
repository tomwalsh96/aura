import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChatMessage } from '@/types/chat';

/**
 * Service for handling AI-related operations
 */
export class AIService {
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  /**
   * Generates a response from the AI model
   * @param prompt - The user's input message
   * @returns The AI's response
   */
  async generateResponse(prompt: string): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
      const generationResult = await model.generateContent(prompt);
      const response = await generationResult.response;
      return response.text();
    } catch (error) {
      console.error("Error generating content:", error);
      throw new Error("Failed to generate content");
    }
  }

  /**
   * Creates a chat message object
   * @param role - The role of the message sender
   * @param content - The message content
   * @returns A ChatMessage object
   */
  createMessage(role: 'user' | 'assistant', content: string): ChatMessage {
    return { 
      id: Math.random().toString(36).substring(7),
      role, 
      content,
      timestamp: Date.now()
    };
  }
} 