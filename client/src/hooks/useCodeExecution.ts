import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ExecutionResult {
  success: boolean;
  output: string;
  errors: string[];
  executionTime: number;
}

interface ExecuteCodeParams {
  code: string;
  language: string;
  userId?: number;
  taskId?: number;
}

export function useCodeExecution() {
  const queryClient = useQueryClient();

  const executeMutation = useMutation({
    mutationFn: async (params: ExecuteCodeParams): Promise<ExecutionResult> => {
      const response = await apiRequest("POST", "/api/code/execute", params);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/code/submissions"] });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (params: { code: string; taskId: number; userId: number; moduleId: number }) => {
      const response = await apiRequest("POST", "/api/code/save", params);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
  });

  return {
    executeCode: executeMutation.mutate,
    saveCode: saveMutation.mutate,
    isExecuting: executeMutation.isPending,
    isSaving: saveMutation.isPending,
    executionResult: executeMutation.data,
    executionError: executeMutation.error,
    saveError: saveMutation.error,
  };
}
