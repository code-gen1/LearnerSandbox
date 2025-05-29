import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("learner"), // learner, admin
  createdAt: timestamp("created_at").defaultNow(),
});

export const modules = pgTable("modules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  language: text("language").notNull(), // java, python
  difficulty: text("difficulty").notNull(), // beginner, intermediate, advanced
  aiTrainingData: text("ai_training_data"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").references(() => modules.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  objectives: jsonb("objectives").$type<string[]>(),
  requirements: jsonb("requirements").$type<string[]>(),
  expectedOutput: text("expected_output"),
  starterCode: text("starter_code"),
  solution: text("solution"),
  difficulty: text("difficulty").notNull(),
  estimatedTime: integer("estimated_time"), // in minutes
  testCases: jsonb("test_cases").$type<Array<{input: string, expected: string}>>(),
  hints: jsonb("hints").$type<string[]>(),
  order: integer("order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  taskId: integer("task_id").references(() => tasks.id),
  moduleId: integer("module_id").references(() => modules.id),
  status: text("status").notNull(), // not_started, in_progress, completed
  code: text("code"),
  attempts: integer("attempts").default(0),
  score: integer("score"), // 0-100
  completedAt: timestamp("completed_at"),
  lastSavedAt: timestamp("last_saved_at").defaultNow(),
});

export const aiInteractions = pgTable("ai_interactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  taskId: integer("task_id").references(() => tasks.id),
  userCode: text("user_code").notNull(),
  aiResponse: jsonb("ai_response").$type<{
    feedback: {
      whatWentWell: string[];
      whatToImprove: string[];
    };
    suggestions: string;
    score: number;
    hints: string[];
  }>(),
  interactionType: text("interaction_type").notNull(), // evaluation, hint, solution_request
  createdAt: timestamp("created_at").defaultNow(),
});

export const codeSubmissions = pgTable("code_submissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  taskId: integer("task_id").references(() => tasks.id),
  code: text("code").notNull(),
  language: text("language").notNull(),
  executionResult: jsonb("execution_result").$type<{
    success: boolean;
    output: string;
    errors: string[];
    executionTime: number;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertModuleSchema = createInsertSchema(modules).omit({
  id: true,
  createdAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
});

export const insertUserProgressSchema = createInsertSchema(userProgress).omit({
  id: true,
  lastSavedAt: true,
});

export const insertAiInteractionSchema = createInsertSchema(aiInteractions).omit({
  id: true,
  createdAt: true,
});

export const insertCodeSubmissionSchema = createInsertSchema(codeSubmissions).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Module = typeof modules.$inferSelect;
export type InsertModule = z.infer<typeof insertModuleSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;

export type AiInteraction = typeof aiInteractions.$inferSelect;
export type InsertAiInteraction = z.infer<typeof insertAiInteractionSchema>;

export type CodeSubmission = typeof codeSubmissions.$inferSelect;
export type InsertCodeSubmission = z.infer<typeof insertCodeSubmissionSchema>;
