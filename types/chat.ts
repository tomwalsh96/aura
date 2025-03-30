/**
 * Represents a message in the chat conversation
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'assistant';
  content: string;
  timestamp: number;
}

/**
 * Represents the state of the chat input
 */
export interface ChatInputState {
  prompt: string;
  loading: boolean;
  result: string;
} 