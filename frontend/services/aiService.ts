import { ChatMessage } from '@/types/chat';

interface MessagePart {
  text: string;
}

interface ChatContent {
  role: 'user' | 'model';
  parts: MessagePart[];
}

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent';

/**
 * Service for handling AI-related operations
 */
export class AIService {
  private apiKey: string;
  private history: ChatContent[] = [];

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Generates a response from the AI model using chat history
   * @param prompt - The user's input message
   * @returns The AI's response
   */
  async generateResponse(prompt: string): Promise<string> {
    try {
      // Add user message to history
      this.history.push({
        role: 'user',
        parts: [{ text: prompt }]
      });

      const response = await fetch(`${GEMINI_API_URL}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: this.history
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      const modelResponse = data.candidates[0].content.parts[0].text;

      // Add model response to history
      this.history.push({
        role: 'model',
        parts: [{ text: modelResponse }]
      });

      return modelResponse;
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

  /**
   * Resets the chat history
   */
  resetChat() {
    this.history = [];
  }
} 