import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface EvaluationResult {
  feedback: {
    whatWentWell: string[];
    whatToImprove: string[];
  };
  suggestions: string;
  score: number;
  hints: string[];
  isCorrect: boolean;
}

interface ChatResponse {
  response: string;
}

interface ExerciseResult {
  title: string;
  description: string;
  objectives: string[];
  requirements: string[];
  starterCode: string;
  solution: string;
  difficulty: string;
  estimatedTime: number;
  testCases: Array<{input: string, expected: string}>;
  hints: string[];
}

interface EvaluateCodeParams {
  code: string;
  taskId: number;
  userId: number;
}

interface ChatParams {
  message: string;
  taskId: number;
  userId?: number;
  conversationHistory?: Array<{role: string, content: string}>;
}

interface GenerateExerciseParams {
  moduleId: number;
  difficulty?: string;
  topic?: string;
}

export function useAI() {
  const queryClient = useQueryClient();

  const evaluateMutation = useMutation({
    mutationFn: async (params: EvaluateCodeParams): Promise<EvaluationResult> => {
      const response = await apiRequest("POST", "/api/ai/evaluate", params);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ai/interactions"] });
    },
  });

  const chatMutation = useMutation({
    mutationFn: async (params: ChatParams): Promise<ChatResponse> => {
      const response = await apiRequest("POST", "/api/ai/chat", params);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/interactions"] });
    },
  });

  const generateExerciseMutation = useMutation({
    mutationFn: async (params: GenerateExerciseParams): Promise<ExerciseResult> => {
      const response = await apiRequest("POST", "/api/ai/generate-exercise", params);
      return response.json();
    },
  });

  return {
    evaluateCode: evaluateMutation.mutate,
    chatWithAI: chatMutation.mutate,
    generateExercise: generateExerciseMutation.mutate,
    isEvaluating: evaluateMutation.isPending,
    isChatting: chatMutation.isPending,
    isGenerating: generateExerciseMutation.isPending,
    evaluationResult: evaluateMutation.data,
    chatResponse: chatMutation.data,
    generatedExercise: generateExerciseMutation.data,
    evaluationError: evaluateMutation.error,
    chatError: chatMutation.error,
    generationError: generateExerciseMutation.error,
  };
}
