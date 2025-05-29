import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Settings, 
  Plus, 
  Save, 
  Brain,
  CheckCircle,
  Loader2,
  AlertCircle
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Module, Task } from "@shared/schema";

const moduleSchema = z.object({
  name: z.string().min(1, "Module name is required"),
  description: z.string().optional(),
  language: z.enum(["java", "python"]),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  aiTrainingData: z.string().optional(),
});

const taskSchema = z.object({
  moduleId: z.number(),
  title: z.string().min(1, "Task title is required"),
  description: z.string().min(1, "Task description is required"),
  objectives: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
  expectedOutput: z.string().optional(),
  starterCode: z.string().optional(),
  solution: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  estimatedTime: z.number().min(1).max(180),
  testCases: z.array(z.object({
    input: z.string(),
    expected: z.string(),
  })).default([]),
  hints: z.array(z.string()).default([]),
  order: z.number().default(0),
});

interface AdminConfigProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AdminConfig({ isOpen, onOpenChange }: AdminConfigProps) {
  const [activeTab, setActiveTab] = useState("modules");
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: modules = [] } = useQuery<Module[]>({
    queryKey: ["/api/modules"],
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const moduleForm = useForm<z.infer<typeof moduleSchema>>({
    resolver: zodResolver(moduleSchema),
    defaultValues: {
      name: "",
      description: "",
      language: "java",
      difficulty: "beginner",
      aiTrainingData: "",
    },
  });

  const taskForm = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      moduleId: 0,
      title: "",
      description: "",
      objectives: [],
      requirements: [],
      expectedOutput: "",
      starterCode: "",
      solution: "",
      difficulty: "easy",
      estimatedTime: 15,
      testCases: [],
      hints: [],
      order: 0,
    },
  });

  const createModuleMutation = useMutation({
    mutationFn: async (data: z.infer<typeof moduleSchema>) => {
      const response = await apiRequest("POST", "/api/modules", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/modules"] });
      moduleForm.reset();
      toast({ title: "Module created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create module", description: error.message, variant: "destructive" });
    },
  });

  const updateModuleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof moduleSchema> }) => {
      const response = await apiRequest("PUT", `/api/modules/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/modules"] });
      setEditingModule(null);
      moduleForm.reset();
      toast({ title: "Module updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update module", description: error.message, variant: "destructive" });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: z.infer<typeof taskSchema>) => {
      const response = await apiRequest("POST", "/api/tasks", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      taskForm.reset();
      toast({ title: "Task created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create task", description: error.message, variant: "destructive" });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof taskSchema> }) => {
      const response = await apiRequest("PUT", `/api/tasks/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setEditingTask(null);
      taskForm.reset();
      toast({ title: "Task updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update task", description: error.message, variant: "destructive" });
    },
  });

  const onModuleSubmit = (data: z.infer<typeof moduleSchema>) => {
    if (editingModule) {
      updateModuleMutation.mutate({ id: editingModule.id, data });
    } else {
      createModuleMutation.mutate(data);
    }
  };

  const onTaskSubmit = (data: z.infer<typeof taskSchema>) => {
    if (editingTask) {
      updateTaskMutation.mutate({ id: editingTask.id, data });
    } else {
      createTaskMutation.mutate(data);
    }
  };

  const handleEditModule = (module: Module) => {
    setEditingModule(module);
    moduleForm.reset({
      name: module.name,
      description: module.description || "",
      language: module.language as "java" | "python",
      difficulty: module.difficulty as "beginner" | "intermediate" | "advanced",
      aiTrainingData: module.aiTrainingData || "",
    });
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    taskForm.reset({
      moduleId: task.moduleId || 0,
      title: task.title,
      description: task.description,
      objectives: task.objectives || [],
      requirements: task.requirements || [],
      expectedOutput: task.expectedOutput || "",
      starterCode: task.starterCode || "",
      solution: task.solution || "",
      difficulty: task.difficulty as "easy" | "medium" | "hard",
      estimatedTime: task.estimatedTime || 15,
      testCases: task.testCases || [],
      hints: task.hints || [],
      order: task.order || 0,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2 text-primary" />
            Admin Configuration Panel
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="modules">Modules</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="ai-training">AI Training</TabsTrigger>
          </TabsList>

          <TabsContent value="modules" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Module List */}
              <Card>
                <CardHeader>
                  <CardTitle>Existing Modules</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {modules.map((module) => (
                    <Card key={module.id} className="cursor-pointer hover:shadow-md" onClick={() => handleEditModule(module)}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{module.name}</h4>
                          <div className="flex space-x-1">
                            <Badge variant="outline">{module.language}</Badge>
                            <Badge variant="secondary">{module.difficulty}</Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {module.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>

              {/* Module Form */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    {editingModule ? "Edit Module" : "Create New Module"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...moduleForm}>
                    <form onSubmit={moduleForm.handleSubmit(onModuleSubmit)} className="space-y-4">
                      <FormField
                        control={moduleForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Module Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Java Fundamentals" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={moduleForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Module description..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={moduleForm.control}
                          name="language"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Language</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="java">Java</SelectItem>
                                  <SelectItem value="python">Python</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={moduleForm.control}
                          name="difficulty"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Difficulty</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="beginner">Beginner</SelectItem>
                                  <SelectItem value="intermediate">Intermediate</SelectItem>
                                  <SelectItem value="advanced">Advanced</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={moduleForm.control}
                        name="aiTrainingData"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>AI Training Data</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Module-specific training context for AI evaluation..."
                                className="h-32"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex space-x-2">
                        <Button 
                          type="submit" 
                          disabled={createModuleMutation.isPending || updateModuleMutation.isPending}
                        >
                          {(createModuleMutation.isPending || updateModuleMutation.isPending) ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Save className="w-4 h-4 mr-2" />
                          )}
                          {editingModule ? "Update" : "Create"} Module
                        </Button>
                        {editingModule && (
                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={() => {
                              setEditingModule(null);
                              moduleForm.reset();
                            }}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Task List */}
              <Card>
                <CardHeader>
                  <CardTitle>Existing Tasks</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                  {tasks.map((task) => {
                    const module = modules.find(m => m.id === task.moduleId);
                    return (
                      <Card key={task.id} className="cursor-pointer hover:shadow-md" onClick={() => handleEditTask(task)}>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium line-clamp-1">{task.title}</h4>
                            <div className="flex space-x-1">
                              <Badge variant="outline">{task.difficulty}</Badge>
                              {module && <Badge variant="secondary">{module.name}</Badge>}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {task.description}
                          </p>
                          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                            <span>{task.estimatedTime} mins</span>
                            <span>Order: {task.order}</span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Task Form */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    {editingTask ? "Edit Task" : "Create New Task"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="max-h-96 overflow-y-auto">
                  <Form {...taskForm}>
                    <form onSubmit={taskForm.handleSubmit(onTaskSubmit)} className="space-y-4">
                      <FormField
                        control={taskForm.control}
                        name="moduleId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Module</FormLabel>
                            <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a module" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {modules.map((module) => (
                                  <SelectItem key={module.id} value={module.id.toString()}>
                                    {module.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={taskForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Task Title</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Simple Calculator" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={taskForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Task description..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={taskForm.control}
                          name="difficulty"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Difficulty</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="easy">Easy</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="hard">Hard</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={taskForm.control}
                          name="estimatedTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Time (mins)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="1" 
                                  max="180" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={taskForm.control}
                          name="order"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Order</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="0" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={taskForm.control}
                        name="starterCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Starter Code</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Initial code template..."
                                className="font-mono text-sm h-20"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={taskForm.control}
                        name="solution"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Expected Solution</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Complete solution..."
                                className="font-mono text-sm h-24"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex space-x-2">
                        <Button 
                          type="submit" 
                          disabled={createTaskMutation.isPending || updateTaskMutation.isPending}
                        >
                          {(createTaskMutation.isPending || updateTaskMutation.isPending) ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Save className="w-4 h-4 mr-2" />
                          )}
                          {editingTask ? "Update" : "Create"} Task
                        </Button>
                        {editingTask && (
                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={() => {
                              setEditingTask(null);
                              taskForm.reset();
                            }}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="ai-training" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="w-5 h-5 mr-2 text-primary" />
                  AI Model Training Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {modules.map((module) => (
                    <Card key={module.id} className="text-center">
                      <CardContent className="p-4">
                        <div className="w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center success-bg">
                          <CheckCircle className="w-6 h-6 text-white" />
                        </div>
                        <h4 className="font-medium text-sm mb-1">{module.name}</h4>
                        <Badge className="success-bg">
                          Trained
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-2">
                          AI model ready for {module.language} evaluation
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                <Separator className="my-6" />
                
                <div className="text-center">
                  <h4 className="font-medium mb-2">Training Configuration</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    AI models are automatically trained when modules are created or updated with training data.
                    The system uses OpenAI's GPT-4o model for code evaluation and feedback.
                  </p>
                  <Button variant="outline">
                    <Brain className="w-4 h-4 mr-2" />
                    Retrain All Models
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
