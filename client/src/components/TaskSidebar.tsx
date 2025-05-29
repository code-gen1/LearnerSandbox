import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  Clock, 
  Code, 
  CheckCircle, 
  Circle, 
  Sparkles,
  BookOpen,
  Star
} from "lucide-react";
import type { Module, Task, UserProgress } from "@shared/schema";

interface TaskSidebarProps {
  selectedModuleId: number | null;
  selectedTaskId: number | null;
  userId: number;
  onModuleSelect: (moduleId: number) => void;
  onTaskSelect: (task: Task) => void;
  onGenerateTask: () => void;
}

export default function TaskSidebar({
  selectedModuleId,
  selectedTaskId,
  userId,
  onModuleSelect,
  onTaskSelect,
  onGenerateTask,
}: TaskSidebarProps) {
  const [expandedModule, setExpandedModule] = useState<number | null>(selectedModuleId);

  const { data: modules = [] } = useQuery<Module[]>({
    queryKey: ["/api/modules"],
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks", selectedModuleId],
    enabled: !!selectedModuleId,
  });

  const { data: userProgress = [] } = useQuery<UserProgress[]>({
    queryKey: ["/api/users", userId, "progress"],
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "hard":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getTaskStatus = (taskId: number) => {
    const progress = userProgress.find(p => p.taskId === taskId);
    return progress?.status || "not_started";
  };

  const getTaskScore = (taskId: number) => {
    const progress = userProgress.find(p => p.taskId === taskId);
    return progress?.score;
  };

  const getModuleProgress = (moduleId: number) => {
    const moduleTasks = tasks.filter(t => t.moduleId === moduleId);
    const completedTasks = moduleTasks.filter(t => getTaskStatus(t.id) === "completed");
    return moduleTasks.length > 0 ? (completedTasks.length / moduleTasks.length) * 100 : 0;
  };

  const selectedModule = modules.find(m => m.id === selectedModuleId);

  return (
    <div className="w-80 h-full bg-card border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Code className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">E1 Sandbox</h1>
            <p className="text-xs text-muted-foreground">Learning Platform</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Current Module</label>
          <Select 
            value={selectedModuleId?.toString()} 
            onValueChange={(value) => onModuleSelect(parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a module" />
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
      </div>

      {/* Tasks List */}
      <div className="flex-1 overflow-y-auto">
        {selectedModuleId && (
          <div className="p-4">
            <div className="mb-4">
              <h3 className="text-sm font-medium text-foreground mb-3">Practice Tasks</h3>
              <div className="space-y-2">
                {tasks.map((task) => {
                  const status = getTaskStatus(task.id);
                  const score = getTaskScore(task.id);
                  const isSelected = task.id === selectedTaskId;

                  return (
                    <Card 
                      key={task.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        isSelected ? "ring-2 ring-primary" : ""
                      } ${status === "completed" ? "bg-green-50 dark:bg-green-900/20" : ""}`}
                      onClick={() => onTaskSelect(task)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-foreground line-clamp-1">
                            {task.title}
                          </h4>
                          <div className="flex items-center space-x-1">
                            {status === "completed" && (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                            {status === "in_progress" && (
                              <Circle className="w-4 h-4 text-yellow-600" />
                            )}
                            <Badge className={getDifficultyColor(task.difficulty)}>
                              {task.difficulty}
                            </Badge>
                          </div>
                        </div>
                        
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {task.description}
                        </p>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-3 h-3" />
                            <span>{task.estimatedTime} mins</span>
                          </div>
                          {score !== undefined && (
                            <div className="flex items-center space-x-1">
                              <Star className="w-3 h-3 text-yellow-500" />
                              <span className="font-medium">{score}%</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Module Progress */}
            {selectedModule && (
              <Card className="mb-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Module Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Overall Progress</span>
                      <span className="font-medium">{Math.round(getModuleProgress(selectedModuleId))}%</span>
                    </div>
                    <Progress value={getModuleProgress(selectedModuleId)} className="h-2" />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Completed</span>
                      <span className="font-medium text-green-600">
                        {tasks.filter(t => getTaskStatus(t.id) === "completed").length}/{tasks.length}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Average Score</span>
                      <span className="font-medium">
                        {Math.round(
                          userProgress
                            .filter(p => p.moduleId === selectedModuleId && p.score)
                            .reduce((sum, p) => sum + (p.score || 0), 0) /
                          Math.max(userProgress.filter(p => p.moduleId === selectedModuleId && p.score).length, 1)
                        )}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {selectedModuleId && (
        <div className="p-4 border-t border-border">
          <Button 
            onClick={onGenerateTask}
            className="w-full"
            variant="outline"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate New Task
          </Button>
        </div>
      )}

      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">E1 Learner</p>
            <p className="text-xs text-muted-foreground">Active Session</p>
          </div>
        </div>
      </div>
    </div>
  );
}
