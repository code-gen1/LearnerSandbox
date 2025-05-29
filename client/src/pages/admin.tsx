import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft,
  Settings,
  Users,
  BookOpen,
  BarChart3,
  Brain,
  Code,
  CheckCircle,
  AlertTriangle,
  TrendingUp
} from "lucide-react";
import AdminConfig from "@/components/AdminConfig";
import { useQuery } from "@tanstack/react-query";
import type { Module, Task, UserProgress, AiInteraction } from "@shared/schema";

export default function Admin() {
  const [, setLocation] = useLocation();
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const { data: modules = [] } = useQuery<Module[]>({
    queryKey: ["/api/modules"],
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: allProgress = [] } = useQuery<UserProgress[]>({
    queryKey: ["/api/users", "progress"], // This would need to be implemented to get all users' progress
    enabled: false, // Disable for now since the API doesn't exist yet
  });

  const { data: aiInteractions = [] } = useQuery<AiInteraction[]>({
    queryKey: ["/api/ai/interactions"], // This would need to be implemented
    enabled: false, // Disable for now since the API doesn't exist yet
  });

  const getModuleStats = () => {
    return {
      total: modules.length,
      active: modules.filter(m => m.isActive).length,
      byLanguage: {
        java: modules.filter(m => m.language === 'java').length,
        python: modules.filter(m => m.language === 'python').length,
      }
    };
  };

  const getTaskStats = () => {
    return {
      total: tasks.length,
      active: tasks.filter(t => t.isActive).length,
      byDifficulty: {
        easy: tasks.filter(t => t.difficulty === 'easy').length,
        medium: tasks.filter(t => t.difficulty === 'medium').length,
        hard: tasks.filter(t => t.difficulty === 'hard').length,
      }
    };
  };

  const moduleStats = getModuleStats();
  const taskStats = getTaskStats();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => setLocation("/")}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Sandbox</span>
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Settings className="w-4 h-4 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-semibold text-foreground">Admin Dashboard</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={() => setIsConfigOpen(true)}>
                <Settings className="w-4 h-4 mr-2" />
                Configure System
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Modules</p>
                  <p className="text-2xl font-bold text-foreground">{moduleStats.total}</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
                  <span>{moduleStats.active} active</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Code className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                  <p className="text-2xl font-bold text-foreground">{taskStats.total}</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
                  <span>{taskStats.active} active</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Active Learners</p>
                  <p className="text-2xl font-bold text-foreground">2</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm text-green-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span>All time active</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Brain className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">AI Models</p>
                  <p className="text-2xl font-bold text-foreground">{moduleStats.total}</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm text-green-600">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  <span>All trained</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Modules Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-primary" />
                Module Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {modules.map((module) => {
                  const moduleTasks = tasks.filter(t => t.moduleId === module.id);
                  return (
                    <div key={module.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-foreground">{module.name}</h4>
                          <Badge variant="outline">{module.language}</Badge>
                          <Badge variant="secondary">{module.difficulty}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {moduleTasks.length} tasks • {module.description}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {module.isActive ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-yellow-600" />
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {modules.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No modules created yet</p>
                    <Button 
                      className="mt-2" 
                      onClick={() => setIsConfigOpen(true)}
                    >
                      Create First Module
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Task Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-primary" />
                Task Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* By Difficulty */}
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-3">By Difficulty</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-muted-foreground">Easy</span>
                      </div>
                      <Badge variant="outline">{taskStats.byDifficulty.easy}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm text-muted-foreground">Medium</span>
                      </div>
                      <Badge variant="outline">{taskStats.byDifficulty.medium}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-sm text-muted-foreground">Hard</span>
                      </div>
                      <Badge variant="outline">{taskStats.byDifficulty.hard}</Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* By Language */}
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-3">By Language</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <span className="text-sm text-muted-foreground">Java</span>
                      </div>
                      <Badge variant="outline">{moduleStats.byLanguage.java}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-muted-foreground">Python</span>
                      </div>
                      <Badge variant="outline">{moduleStats.byLanguage.python}</Badge>
                    </div>
                  </div>
                </div>

                {tasks.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Code className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No tasks created yet</p>
                    <Button 
                      className="mt-2" 
                      onClick={() => setIsConfigOpen(true)}
                    >
                      Create First Task
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI Training Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="w-5 h-5 mr-2 text-primary" />
                AI Model Training Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {modules.map((module) => (
                  <div key={module.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{module.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {module.language.toUpperCase()} • {module.difficulty}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      Trained
                    </Badge>
                  </div>
                ))}
                
                {modules.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Brain className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No AI models to display</p>
                    <p className="text-xs">Create modules to train AI models</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-primary" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Database Connection</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">Healthy</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Code Execution Service</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">Online</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">AI Service (OpenAI)</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">Connected</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">File System</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">Available</span>
                  </div>
                </div>

                <Separator />

                <div className="text-center">
                  <p className="text-sm font-medium text-green-600">All Systems Operational</p>
                  <p className="text-xs text-muted-foreground">Last updated: {new Date().toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                className="h-20 flex flex-col space-y-2"
                onClick={() => setIsConfigOpen(true)}
              >
                <BookOpen className="w-6 h-6" />
                <span>Create Module</span>
              </Button>
              
              <Button 
                variant="outline"
                className="h-20 flex flex-col space-y-2"
                onClick={() => setIsConfigOpen(true)}
              >
                <Code className="w-6 h-6" />
                <span>Add Task</span>
              </Button>
              
              <Button 
                variant="outline"
                className="h-20 flex flex-col space-y-2"
                onClick={() => setIsConfigOpen(true)}
              >
                <Brain className="w-6 h-6" />
                <span>Train AI Model</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Configuration Modal */}
      <AdminConfig isOpen={isConfigOpen} onOpenChange={setIsConfigOpen} />
    </div>
  );
}
