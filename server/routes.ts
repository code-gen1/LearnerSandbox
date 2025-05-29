import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { evaluateCode, generateExercise, provideChatAssistance } from "./openai";
import { codeExecutor } from "./codeExecution";
import { 
  insertUserSchema, 
  insertModuleSchema, 
  insertTaskSchema,
  insertUserProgressSchema,
  insertAiInteractionSchema,
  insertCodeSubmissionSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // In production, use proper session management
      res.json({ 
        user: { 
          id: user.id, 
          username: user.username, 
          role: user.role 
        } 
      });
    } catch (error) {
      res.status(500).json({ message: "Login failed", error: (error as Error).message });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser(userData);
      res.status(201).json({ 
        user: { 
          id: user.id, 
          username: user.username, 
          role: user.role 
        } 
      });
    } catch (error) {
      res.status(400).json({ message: "Registration failed", error: (error as Error).message });
    }
  });

  // Module routes
  app.get("/api/modules", async (req, res) => {
    try {
      const modules = await storage.getModules();
      res.json(modules);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch modules", error: (error as Error).message });
    }
  });

  app.get("/api/modules/:id", async (req, res) => {
    try {
      const moduleId = parseInt(req.params.id);
      const module = await storage.getModule(moduleId);
      
      if (!module) {
        return res.status(404).json({ message: "Module not found" });
      }

      res.json(module);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch module", error: (error as Error).message });
    }
  });

  app.post("/api/modules", async (req, res) => {
    try {
      const moduleData = insertModuleSchema.parse(req.body);
      const module = await storage.createModule(moduleData);
      res.status(201).json(module);
    } catch (error) {
      res.status(400).json({ message: "Failed to create module", error: (error as Error).message });
    }
  });

  app.put("/api/modules/:id", async (req, res) => {
    try {
      const moduleId = parseInt(req.params.id);
      const updateData = insertModuleSchema.partial().parse(req.body);
      
      const module = await storage.updateModule(moduleId, updateData);
      if (!module) {
        return res.status(404).json({ message: "Module not found" });
      }

      res.json(module);
    } catch (error) {
      res.status(400).json({ message: "Failed to update module", error: (error as Error).message });
    }
  });

  // Task routes
  app.get("/api/tasks", async (req, res) => {
    try {
      const moduleId = req.query.moduleId ? parseInt(req.query.moduleId as string) : undefined;
      const tasks = await storage.getTasks(moduleId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks", error: (error as Error).message });
    }
  });

  app.get("/api/tasks/:id", async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch task", error: (error as Error).message });
    }
  });

  app.get("/api/modules/:moduleId/tasks", async (req, res) => {
    try {
      const moduleId = parseInt(req.params.moduleId);
      const tasks = await storage.getTasksByModule(moduleId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks for module", error: (error as Error).message });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const taskData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(taskData);
      res.status(201).json(task);
    } catch (error) {
      res.status(400).json({ message: "Failed to create task", error: (error as Error).message });
    }
  });

  app.put("/api/tasks/:id", async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const updateData = insertTaskSchema.partial().parse(req.body);
      
      const task = await storage.updateTask(taskId, updateData);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      res.json(task);
    } catch (error) {
      res.status(400).json({ message: "Failed to update task", error: (error as Error).message });
    }
  });

  // Code execution routes
  app.post("/api/code/execute", async (req, res) => {
    try {
      const { code, language, userId, taskId } = req.body;
      
      if (!code || !language) {
        return res.status(400).json({ message: "Code and language are required" });
      }

      const result = await codeExecutor.executeCode(code, language);
      
      // Save code submission if userId and taskId are provided
      if (userId && taskId) {
        const submissionData = insertCodeSubmissionSchema.parse({
          userId: parseInt(userId),
          taskId: parseInt(taskId),
          code,
          language,
          executionResult: result
        });
        
        await storage.createCodeSubmission(submissionData);
      }

      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Code execution failed", error: (error as Error).message });
    }
  });

  // AI evaluation routes
  app.post("/api/ai/evaluate", async (req, res) => {
    try {
      const { code, taskId, userId } = req.body;
      
      if (!code || !taskId || !userId) {
        return res.status(400).json({ message: "Code, taskId, and userId are required" });
      }

      const task = await storage.getTask(parseInt(taskId));
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      const module = await storage.getModule(task.moduleId!);
      if (!module) {
        return res.status(404).json({ message: "Module not found" });
      }

      const evaluation = await evaluateCode(
        code,
        task.solution || "",
        task.description,
        module.aiTrainingData || "",
        module.language
      );

      // Save AI interaction
      const interactionData = insertAiInteractionSchema.parse({
        userId: parseInt(userId),
        taskId: parseInt(taskId),
        userCode: code,
        aiResponse: evaluation,
        interactionType: "evaluation"
      });
      
      await storage.createAiInteraction(interactionData);

      // Update user progress
      const currentProgress = await storage.getUserProgressByTask(parseInt(userId), parseInt(taskId));
      const attempts = (currentProgress?.attempts || 0) + 1;
      
      const progressData = insertUserProgressSchema.parse({
        userId: parseInt(userId),
        taskId: parseInt(taskId),
        moduleId: task.moduleId!,
        status: evaluation.isCorrect ? "completed" : "in_progress",
        code,
        attempts,
        score: evaluation.score,
        completedAt: evaluation.isCorrect ? new Date() : undefined
      });

      await storage.createOrUpdateUserProgress(progressData);

      res.json(evaluation);
    } catch (error) {
      res.status(500).json({ message: "AI evaluation failed", error: (error as Error).message });
    }
  });

  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, taskId, userId, conversationHistory } = req.body;
      
      if (!message || !taskId) {
        return res.status(400).json({ message: "Message and taskId are required" });
      }

      const task = await storage.getTask(parseInt(taskId));
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      const module = await storage.getModule(task.moduleId!);
      if (!module) {
        return res.status(404).json({ message: "Module not found" });
      }

      const response = await provideChatAssistance(
        message,
        task.description,
        module.aiTrainingData || "",
        conversationHistory || []
      );

      // Save chat interaction if userId is provided
      if (userId) {
        const interactionData = insertAiInteractionSchema.parse({
          userId: parseInt(userId),
          taskId: parseInt(taskId),
          userCode: message,
          aiResponse: { feedback: { whatWentWell: [], whatToImprove: [] }, suggestions: response, score: 0, hints: [] },
          interactionType: "hint"
        });
        
        await storage.createAiInteraction(interactionData);
      }

      res.json({ response });
    } catch (error) {
      res.status(500).json({ message: "Chat assistance failed", error: (error as Error).message });
    }
  });

  app.post("/api/ai/generate-exercise", async (req, res) => {
    try {
      const { moduleId, difficulty, topic } = req.body;
      
      if (!moduleId) {
        return res.status(400).json({ message: "Module ID is required" });
      }

      const module = await storage.getModule(parseInt(moduleId));
      if (!module) {
        return res.status(404).json({ message: "Module not found" });
      }

      const exercise = await generateExercise(
        module.aiTrainingData || "",
        difficulty || "easy",
        module.language,
        topic
      );

      res.json(exercise);
    } catch (error) {
      res.status(500).json({ message: "Exercise generation failed", error: (error as Error).message });
    }
  });

  // User progress routes
  app.get("/api/users/:userId/progress", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const taskId = req.query.taskId ? parseInt(req.query.taskId as string) : undefined;
      
      const progress = await storage.getUserProgress(userId, taskId);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user progress", error: (error as Error).message });
    }
  });

  app.post("/api/users/:userId/progress", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const progressData = insertUserProgressSchema.parse({
        ...req.body,
        userId
      });
      
      const progress = await storage.createOrUpdateUserProgress(progressData);
      res.json(progress);
    } catch (error) {
      res.status(400).json({ message: "Failed to save progress", error: (error as Error).message });
    }
  });

  // File operations
  app.post("/api/code/save", async (req, res) => {
    try {
      const { code, taskId, userId, language } = req.body;
      
      if (!code || !taskId || !userId) {
        return res.status(400).json({ message: "Code, taskId, and userId are required" });
      }

      // Update user progress with saved code
      const progressData = insertUserProgressSchema.parse({
        userId: parseInt(userId),
        taskId: parseInt(taskId),
        moduleId: parseInt(req.body.moduleId), // Should be provided by client
        status: "in_progress",
        code
      });

      await storage.createOrUpdateUserProgress(progressData);
      
      res.json({ message: "Code saved successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to save code", error: (error as Error).message });
    }
  });

  app.get("/api/code/download/:userId/:taskId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const taskId = parseInt(req.params.taskId);
      
      const progress = await storage.getUserProgressByTask(userId, taskId);
      if (!progress || !progress.code) {
        return res.status(404).json({ message: "No saved code found" });
      }

      const task = await storage.getTask(taskId);
      const filename = task ? `${task.title.replace(/\s+/g, '_')}.${task.moduleId === 1 ? 'java' : 'py'}` : 'code.txt';
      
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'text/plain');
      res.send(progress.code);
    } catch (error) {
      res.status(500).json({ message: "Failed to download code", error: (error as Error).message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
