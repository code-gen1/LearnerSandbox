import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Play, 
  Save, 
  Download, 
  Settings,
  Terminal,
  Bug,
  AlertTriangle,
  CheckCircle,
  Clock,
  Code2,
  FileText
} from "lucide-react";
import CodeEditor from "@/components/CodeEditor";
import TaskSidebar from "@/components/TaskSidebar";
import AIAssistant from "@/components/AIAssistant";
import AdminConfig from "@/components/AdminConfig";
import { useCodeExecution } from "@/hooks/useCodeExecution";
import { useAI } from "@/hooks/useAI";
import { useToast } from "@/hooks/use-toast";
import type { Module, Task, UserProgress } from "@shared/schema";

export default function Sandbox() {
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [currentCode, setCurrentCode] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<"java" | "python">("java");
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [outputTab, setOutputTab] = useState<"output" | "debug" | "errors">("output");
  const { toast } = useToast();

  // Mock user ID - in production this would come from authentication
  const userId = 2; // learner user

  const {
    executeCode,
    saveCode,
    isExecuting,
    isSaving,
    executionResult,
    executionError,
  } = useCodeExecution();

  const {
    generateExercise,
    isGenerating,
    generatedExercise,
  } = useAI();

  const { data: modules = [] } = useQuery<Module[]>({
    queryKey: ["/api/modules"],
  });

  const { data: userProgress = [] } = useQuery<UserProgress[]>({
    queryKey: ["/api/users", userId, "progress"],
  });

  // Auto-select first module on load
  useEffect(() => {
    if (modules.length > 0 && !selectedModuleId) {
      setSelectedModuleId(modules[0].id);
    }
  }, [modules, selectedModuleId]);

  // Update language when module changes
  useEffect(() => {
    if (selectedModuleId) {
      const module = modules.find(m => m.id === selectedModuleId);
      if (module) {
        setSelectedLanguage(module.language as "java" | "python");
      }
    }
  }, [selectedModuleId, modules]);

  // Set starter code when task changes
  useEffect(() => {
    if (selectedTask) {
      setCurrentCode(selectedTask.starterCode || "");
    }
  }, [selectedTask]);

  const handleModuleSelect = (moduleId: number) => {
    setSelectedModuleId(moduleId);
    setSelectedTask(null);
    setCurrentCode("");
  };

  const handleTaskSelect = (task: Task) => {
    setSelectedTask(task);
  };

  const handleRunCode = () => {
    if (!currentCode.trim()) {
      toast({
        title: "No code to run",
        description: "Please write some code before running.",
        variant: "destructive",
      });
      return;
    }

    executeCode({
      code: currentCode,
      language: selectedLanguage,
      userId,
      taskId: selectedTask?.id,
    });
  };

  const handleSaveCode = () => {
    if (!selectedTask || !currentCode.trim()) {
      toast({
        title: "Nothing to save",
        description: "Please select a task and write some code.",
        variant: "destructive",
      });
      return;
    }

    saveCode({
      code: currentCode,
      taskId: selectedTask.id,
      userId,
      moduleId: selectedTask.moduleId!,
    });

    toast({
      title: "Code saved",
      description: "Your progress has been saved successfully.",
    });
  };

  const handleDownloadCode = () => {
    if (!currentCode.trim() || !selectedTask) {
      toast({
        title: "Nothing to download",
        description: "Please write some code first.",
        variant: "destructive",
      });
      return;
    }

    const blob = new Blob([currentCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTask.title.replace(/\s+/g, '_')}.${selectedLanguage === 'java' ? 'java' : 'py'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Code downloaded",
      description: "Your code file has been downloaded.",
    });
  };

  const handleGenerateTask = () => {
    if (!selectedModuleId) return;

    generateExercise({
      moduleId: selectedModuleId,
      difficulty: "easy",
    });
  };

  useEffect(() => {
    if (generatedExercise) {
      toast({
        title: "New task generated",
        description: `"${generatedExercise.title}" has been created!`,
      });
    }
  }, [generatedExercise, toast]);

  const getCurrentAttempts = () => {
    if (!selectedTask) return 0;
    const progress = userProgress.find(p => p.taskId === selectedTask.id);
    return progress?.attempts || 0;
  };

  const getFileName = () => {
    if (!selectedTask) return `Main.${selectedLanguage === 'java' ? 'java' : 'py'}`;
    const className = selectedLanguage === 'java' ? 
      (currentCode.match(/public\s+class\s+(\w+)/) || [])[1] || 'Main' :
      'main';
    return `${className}.${selectedLanguage === 'java' ? 'java' : 'py'}`;
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Code2 className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">E1 Learning Sandbox</h1>
                <p className="text-xs text-muted-foreground">Interactive Coding Environment</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Module:</span>
              <Select 
                value={selectedModuleId?.toString()} 
                onValueChange={(value) => handleModuleSelect(parseInt(value))}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select module" />
                </SelectTrigger>
                <SelectContent>
                  {modules.map((module) => (
                    <SelectItem key={module.id} value={module.id.toString()}>
                      {module.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-muted-foreground">EL</span>
              </div>
              <span className="text-sm text-foreground">E1 Learner</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Task Sidebar */}
        <TaskSidebar
          selectedModuleId={selectedModuleId}
          selectedTaskId={selectedTask?.id || null}
          userId={userId}
          onModuleSelect={handleModuleSelect}
          onTaskSelect={handleTaskSelect}
          onGenerateTask={handleGenerateTask}
        />

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Workspace Header */}
          <div className="bg-card border-b border-border px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-foreground">
                  {selectedTask ? selectedTask.title : "Select a task to get started"}
                </h2>
                {selectedTask && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {modules.find(m => m.id === selectedModuleId)?.name} • Task {selectedTask.order || 1}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <Select 
                  value={selectedLanguage}
                  onValueChange={(value: "java" | "python") => setSelectedLanguage(value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="java">Java</SelectItem>
                    <SelectItem value="python">Python</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button 
                  onClick={handleRunCode}
                  disabled={isExecuting || !currentCode.trim()}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Run Code
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={handleSaveCode}
                  disabled={isSaving}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={handleDownloadCode}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </div>

          {/* Workspace Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Panel - Task Description */}
            <div className="w-80 bg-card border-r border-border flex flex-col">
              <div className="p-4 border-b border-border">
                <h3 className="text-lg font-medium text-foreground">Task Description</h3>
              </div>
              <ScrollArea className="flex-1 p-4">
                {selectedTask ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-2">Objective</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedTask.description}
                      </p>
                    </div>

                    {selectedTask.objectives && selectedTask.objectives.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-2">Requirements</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {selectedTask.objectives.map((objective, index) => (
                            <li key={index} className="flex items-start">
                              <span className="mr-2">•</span>
                              <span>{objective}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedTask.expectedOutput && (
                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-2">Expected Output</h4>
                        <div className="bg-muted rounded-lg p-3 text-sm font-mono text-foreground">
                          {selectedTask.expectedOutput}
                        </div>
                      </div>
                    )}

                    {selectedTask.hints && selectedTask.hints.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-2">Hints</h4>
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                          <div className="flex items-center space-x-2 mb-2">
                            <FileText className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                              Tips to help you get started
                            </span>
                          </div>
                          <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                            {selectedTask.hints.map((hint, index) => (
                              <li key={index} className="flex items-start">
                                <span className="mr-2">•</span>
                                <span>{hint}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>Est. {selectedTask.estimatedTime} mins</span>
                      </div>
                      <Badge variant="outline">
                        {selectedTask.difficulty}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Select a task to see details</p>
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Center Panel - Code Editor */}
            <div className="flex-1 flex flex-col">
              {/* Editor Tabs */}
              <div className="bg-muted border-b border-border px-4 py-2">
                <div className="flex space-x-1">
                  <div className="bg-card px-3 py-1.5 rounded-t-md border-b-2 border-primary text-sm font-medium text-foreground">
                    <Code2 className="w-4 h-4 inline mr-2" />
                    {getFileName()}
                  </div>
                </div>
              </div>

              {/* Code Editor */}
              <div className="flex-1 relative">
                {selectedTask ? (
                  <CodeEditor
                    value={currentCode}
                    onChange={setCurrentCode}
                    language={selectedLanguage}
                    height="100%"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-muted/50">
                    <div className="text-center text-muted-foreground">
                      <Code2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">Welcome to E1 Sandbox</h3>
                      <p>Select a task from the sidebar to start coding</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Output Panel */}
              <div className="h-48 bg-card border-t border-border flex flex-col">
                <div className="bg-muted border-b border-border px-4 py-2">
                  <Tabs value={outputTab} onValueChange={(value: any) => setOutputTab(value)}>
                    <TabsList className="h-8">
                      <TabsTrigger value="output" className="text-xs">
                        <Terminal className="w-3 h-3 mr-1" />
                        Console Output
                      </TabsTrigger>
                      <TabsTrigger value="debug" className="text-xs">
                        <Bug className="w-3 h-3 mr-1" />
                        Debug
                      </TabsTrigger>
                      <TabsTrigger value="errors" className="text-xs">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Errors
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                
                <ScrollArea className="flex-1 p-4">
                  <div className="font-mono text-sm">
                    {outputTab === "output" && (
                      <div>
                        {executionResult ? (
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2 text-xs">
                              {executionResult.success ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-red-600" />
                              )}
                              <span className={executionResult.success ? "text-green-600" : "text-red-600"}>
                                {executionResult.success ? "Execution successful" : "Execution failed"}
                              </span>
                              <span className="text-muted-foreground">
                                ({executionResult.executionTime}ms)
                              </span>
                            </div>
                            {executionResult.output && (
                              <div className="text-foreground whitespace-pre-wrap">
                                {executionResult.output}
                              </div>
                            )}
                          </div>
                        ) : isExecuting ? (
                          <div className="text-muted-foreground">
                            Running code...
                          </div>
                        ) : (
                          <div className="text-muted-foreground">
                            Ready to run your code. Click "Run Code" to execute.
                          </div>
                        )}
                      </div>
                    )}

                    {outputTab === "errors" && (
                      <div>
                        {executionResult?.errors && executionResult.errors.length > 0 ? (
                          <div className="space-y-1">
                            {executionResult.errors.map((error, index) => (
                              <div key={index} className="text-red-600">
                                {error}
                              </div>
                            ))}
                          </div>
                        ) : executionError ? (
                          <div className="text-red-600">
                            {executionError.message}
                          </div>
                        ) : (
                          <div className="text-muted-foreground">
                            No errors to display
                          </div>
                        )}
                      </div>
                    )}

                    {outputTab === "debug" && (
                      <div className="text-muted-foreground">
                        Debug information will appear here during code execution
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>

            {/* Right Panel - AI Assistant */}
            <AIAssistant
              task={selectedTask}
              userId={userId}
              currentCode={currentCode}
              attempts={getCurrentAttempts()}
              maxAttempts={3}
            />
          </div>
        </main>
      </div>

      {/* Admin Config Modal */}
      <AdminConfig isOpen={isAdminOpen} onOpenChange={setIsAdminOpen} />

      {/* Floating Admin Button */}
      <Button
        className="fixed bottom-6 left-6 w-12 h-12 rounded-full shadow-lg"
        onClick={() => setIsAdminOpen(true)}
        variant="secondary"
      >
        <Settings className="w-5 h-5" />
      </Button>
    </div>
  );
}
