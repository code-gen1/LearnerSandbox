import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bot, 
  Send, 
  CheckCircle, 
  AlertTriangle,
  Lightbulb,
  Code,
  MessageCircle,
  Loader2
} from "lucide-react";
import { useAI } from "@/hooks/useAI";
import type { Task, AiInteraction } from "@shared/schema";

interface AIAssistantProps {
  task: Task | null;
  userId: number;
  currentCode: string;
  attempts: number;
  maxAttempts: number;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function AIAssistant({
  task,
  userId,
  currentCode,
  attempts,
  maxAttempts,
}: AIAssistantProps) {
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [activeTab, setActiveTab] = useState<"feedback" | "chat">("feedback");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    evaluateCode,
    chatWithAI,
    isEvaluating,
    isChatting,
    evaluationResult,
    chatResponse,
  } = useAI();

  const { data: aiInteractions = [] } = useQuery<AiInteraction[]>({
    queryKey: ["/api/ai/interactions", userId, task?.id],
    enabled: !!task,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  useEffect(() => {
    if (chatResponse) {
      setChatMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: chatResponse.response,
          timestamp: new Date(),
        },
      ]);
      setChatInput("");
    }
  }, [chatResponse]);

  const handleEvaluateCode = () => {
    if (!task || !currentCode.trim()) return;
    
    evaluateCode({
      code: currentCode,
      taskId: task.id,
      userId,
    });
  };

  const handleSendMessage = () => {
    if (!task || !chatInput.trim() || isChatting) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: chatInput,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);

    const conversationHistory = chatMessages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    chatWithAI({
      message: chatInput,
      taskId: task.id,
      userId,
      conversationHistory,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getQuickAction = (action: string) => {
    if (!task) return;

    switch (action) {
      case "hint":
        setChatInput("Can you give me a hint for this task?");
        break;
      case "explain":
        setChatInput("Can you explain the key concepts I need to understand?");
        break;
      case "solution":
        if (attempts >= maxAttempts) {
          setChatInput("Can you show me the solution?");
        }
        break;
    }
  };

  if (!task) {
    return (
      <Card className="w-80 h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center text-muted-foreground">
            <Bot className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Select a task to get AI assistance</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-80 h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <Bot className="w-5 h-5 mr-2 text-primary" />
            AI Assistant
          </CardTitle>
          <Badge className="success-bg">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-1" />
            Online
          </Badge>
        </div>
        
        {/* Tabs */}
        <div className="flex space-x-1 mt-3">
          <Button
            variant={activeTab === "feedback" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("feedback")}
            className="flex-1"
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Feedback
          </Button>
          <Button
            variant={activeTab === "chat" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("chat")}
            className="flex-1"
          >
            <MessageCircle className="w-4 h-4 mr-1" />
            Chat
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {activeTab === "feedback" && (
          <div className="flex-1 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Code Analysis</h4>
              <Button 
                size="sm" 
                onClick={handleEvaluateCode}
                disabled={isEvaluating || !currentCode.trim()}
              >
                {isEvaluating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Code className="w-4 h-4" />
                )}
                Analyze
              </Button>
            </div>

            {evaluationResult && (
              <div className="space-y-3">
                {/* What Went Well */}
                <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <h5 className="text-sm font-medium text-green-800 dark:text-green-300">
                        What went well
                      </h5>
                    </div>
                    <ul className="text-sm text-green-700 dark:text-green-400 space-y-1">
                      {evaluationResult.feedback.whatWentWell.map((item, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Areas to Improve */}
                <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      <h5 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                        Areas to improve
                      </h5>
                    </div>
                    <ul className="text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
                      {evaluationResult.feedback.whatToImprove.map((item, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Suggestions */}
                {evaluationResult.suggestions && (
                  <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                    <CardContent className="p-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <Lightbulb className="w-4 h-4 text-blue-600" />
                        <h5 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                          AI Suggestions
                        </h5>
                      </div>
                      <p className="text-sm text-blue-700 dark:text-blue-400">
                        {evaluationResult.suggestions}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Score */}
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Score</span>
                  <Badge variant={evaluationResult.score >= 80 ? "default" : "secondary"}>
                    {evaluationResult.score}%
                  </Badge>
                </div>
              </div>
            )}

            {/* Attempts Counter */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Attempts: {attempts}/{maxAttempts}</span>
              {attempts >= maxAttempts && (
                <span className="text-primary">Solution available</span>
              )}
            </div>
          </div>
        )}

        {activeTab === "chat" && (
          <div className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {/* Welcome message */}
                {chatMessages.length === 0 && (
                  <Card className="bg-muted/50">
                    <CardContent className="p-3">
                      <div className="flex items-start space-x-2">
                        <Bot className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <p className="text-sm text-foreground">
                            Hello! I'm here to help you with "{task.title}". 
                            I can provide hints, explain concepts, and guide you through the solution.
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Ask me anything about this task!
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Chat messages */}
                {chatMessages.map((message, index) => (
                  <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <Card className={`max-w-[80%] ${
                      message.role === "user" 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted"
                    }`}>
                      <CardContent className="p-3">
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.role === "user" 
                            ? "text-primary-foreground/70" 
                            : "text-muted-foreground"
                        }`}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                ))}

                {isChatting && (
                  <div className="flex justify-start">
                    <Card className="bg-muted">
                      <CardContent className="p-3">
                        <div className="flex items-center space-x-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm text-muted-foreground">AI is thinking...</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Chat input */}
            <div className="p-4 border-t border-border">
              <div className="flex space-x-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask the AI assistant..."
                  disabled={isChatting}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim() || isChatting}
                  size="icon"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>

              {/* Quick actions */}
              <div className="flex space-x-1 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => getQuickAction("hint")}
                  className="text-xs"
                >
                  💡 Hint
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => getQuickAction("explain")}
                  className="text-xs"
                >
                  📖 Explain
                </Button>
                {attempts >= maxAttempts && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => getQuickAction("solution")}
                    className="text-xs"
                  >
                    ✅ Solution
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
