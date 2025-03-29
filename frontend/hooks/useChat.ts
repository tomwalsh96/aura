import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AIService } from '@/services/aiService';
import { ChatMessage } from '@/types/chat';

const aiService = new AIService(process.env.EXPO_PUBLIC_GEMINI_API_KEY || '');

export function useChat() {
  const queryClient = useQueryClient();

  const mutation = useMutation<string, Error, string>({
    mutationFn: async (message: string) => {
      const response = await aiService.generateResponse(message);
      return response;
    },
    onSuccess: (response: string, message: string) => {
      // Update chat history in cache
      queryClient.setQueryData<ChatMessage[]>(['chat-history'], (old = []) => [
        ...old,
        // Add user message
        aiService.createMessage('user', message),
        // Add AI response
        aiService.createMessage('assistant', response),
      ]);
    },
  });

  const resetChat = () => {
    aiService.resetChat();
    queryClient.setQueryData(['chat-history'], []);
  };

  return {
    sendMessage: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error,
    resetChat,
  };
} 