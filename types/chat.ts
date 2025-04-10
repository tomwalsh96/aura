/**
 * Represents a message in the chat conversation
 */
export interface ChatMessage {
    id: string;
    role: 'user' | 'model' | 'assistant';
    content: string;
    audioUri?: string;
    timestamp: number;
  }