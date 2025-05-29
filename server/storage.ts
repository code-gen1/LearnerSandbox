import { 
  users, 
  modules, 
  tasks, 
  userProgress, 
  aiInteractions,
  codeSubmissions,
  type User, 
  type InsertUser,
  type Module,
  type InsertModule,
  type Task,
  type InsertTask,
  type UserProgress,
  type InsertUserProgress,
  type AiInteraction,
  type InsertAiInteraction,
  type CodeSubmission,
  type InsertCodeSubmission
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Module operations
  getModules(): Promise<Module[]>;
  getModule(id: number): Promise<Module | undefined>;
  createModule(module: InsertModule): Promise<Module>;
  updateModule(id: number, module: Partial<InsertModule>): Promise<Module | undefined>;

  // Task operations
  getTasks(moduleId?: number): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  getTasksByModule(moduleId: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;

  // User progress operations
  getUserProgress(userId: number, taskId?: number): Promise<UserProgress[]>;
  getUserProgressByTask(userId: number, taskId: number): Promise<UserProgress | undefined>;
  createOrUpdateUserProgress(progress: InsertUserProgress): Promise<UserProgress>;

  // AI interaction operations
  createAiInteraction(interaction: InsertAiInteraction): Promise<AiInteraction>;
  getAiInteractions(userId: number, taskId?: number): Promise<AiInteraction[]>;

  // Code submission operations
  createCodeSubmission(submission: InsertCodeSubmission): Promise<CodeSubmission>;
  getCodeSubmissions(userId: number, taskId?: number): Promise<CodeSubmission[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private modules: Map<number, Module>;
  private tasks: Map<number, Task>;
  private userProgress: Map<string, UserProgress>; // key: userId-taskId
  private aiInteractions: Map<number, AiInteraction>;
  private codeSubmissions: Map<number, CodeSubmission>;
  
  private currentUserId: number;
  private currentModuleId: number;
  private currentTaskId: number;
  private currentProgressId: number;
  private currentInteractionId: number;
  private currentSubmissionId: number;

  constructor() {
    this.users = new Map();
    this.modules = new Map();
    this.tasks = new Map();
    this.userProgress = new Map();
    this.aiInteractions = new Map();
    this.codeSubmissions = new Map();
    
    this.currentUserId = 1;
    this.currentModuleId = 1;
    this.currentTaskId = 1;
    this.currentProgressId = 1;
    this.currentInteractionId = 1;
    this.currentSubmissionId = 1;

    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Create default admin user
    const adminUser: User = {
      id: this.currentUserId++,
      username: "admin",
      password: "admin123", // In production, this should be hashed
      role: "admin",
      createdAt: new Date(),
    };
    this.users.set(adminUser.id, adminUser);

    // Create default learner
    const learnerUser: User = {
      id: this.currentUserId++,
      username: "learner",
      password: "learner123",
      role: "learner",
      createdAt: new Date(),
    };
    this.users.set(learnerUser.id, learnerUser);

    // Create default modules
    const javaModule: Module = {
      id: this.currentModuleId++,
      name: "Java Fundamentals",
      description: "Learn the basics of Java programming",
      language: "java",
      difficulty: "beginner",
      aiTrainingData: "This module focuses on Java basics including variables, control structures, methods, and object-oriented programming concepts.",
      isActive: true,
      createdAt: new Date(),
    };
    this.modules.set(javaModule.id, javaModule);

    const pythonModule: Module = {
      id: this.currentModuleId++,
      name: "Python Basics",
      description: "Introduction to Python programming",
      language: "python",
      difficulty: "beginner",
      aiTrainingData: "This module covers Python fundamentals including syntax, data types, control flow, functions, and basic object-oriented programming.",
      isActive: true,
      createdAt: new Date(),
    };
    this.modules.set(pythonModule.id, pythonModule);

    const productModule: Module = {
      id: this.currentModuleId++,
      name: "Product Development",
      description: "Learn product management and development practices",
      language: "java",
      difficulty: "intermediate",
      aiTrainingData: "This module teaches product development lifecycle, CRUD operations, data validation, and business logic implementation.",
      isActive: true,
      createdAt: new Date(),
    };
    this.modules.set(productModule.id, productModule);

    // Create default tasks
    const calculatorTask: Task = {
      id: this.currentTaskId++,
      moduleId: javaModule.id,
      title: "Simple Calculator",
      description: "Create a basic calculator with arithmetic operations",
      objectives: [
        "Create a Calculator class",
        "Implement add, subtract, multiply, divide methods",
        "Handle division by zero",
        "Test with different inputs"
      ],
      requirements: [
        "Use proper Java syntax",
        "Include error handling",
        "Add documentation comments",
        "Follow naming conventions"
      ],
      expectedOutput: "Calculator should perform arithmetic operations correctly",
      starterCode: `public class Calculator {
    // TODO: Implement calculator methods
    
    public static void main(String[] args) {
        // Test your calculator here
    }
}`,
      solution: `public class Calculator {
    public static int add(int a, int b) {
        return a + b;
    }
    
    public static int subtract(int a, int b) {
        return a - b;
    }
    
    public static int multiply(int a, int b) {
        return a * b;
    }
    
    public static double divide(int a, int b) {
        if (b == 0) {
            throw new IllegalArgumentException("Cannot divide by zero");
        }
        return (double) a / b;
    }
    
    public static void main(String[] args) {
        System.out.println("Add: " + add(5, 3));
        System.out.println("Subtract: " + subtract(5, 3));
        System.out.println("Multiply: " + multiply(5, 3));
        System.out.println("Divide: " + divide(5, 3));
    }
}`,
      difficulty: "easy",
      estimatedTime: 15,
      testCases: [
        { input: "add(5, 3)", expected: "8" },
        { input: "subtract(10, 4)", expected: "6" },
        { input: "multiply(3, 7)", expected: "21" },
        { input: "divide(10, 2)", expected: "5.0" }
      ],
      hints: [
        "Start by implementing the add method",
        "Remember to handle division by zero",
        "Use proper return types for each method"
      ],
      order: 1,
      isActive: true,
      createdAt: new Date(),
    };
    this.tasks.set(calculatorTask.id, calculatorTask);

    const productCrudTask: Task = {
      id: this.currentTaskId++,
      moduleId: productModule.id,
      title: "Product CRUD Operations",
      description: "Implement basic product management system",
      objectives: [
        "Create Product class with properties",
        "Implement CRUD operations",
        "Add data validation",
        "Handle error cases"
      ],
      requirements: [
        "Product should have id, name, price, category",
        "Implement addProduct, getProduct, updateProduct, deleteProduct",
        "Validate product data",
        "Use appropriate data structures"
      ],
      expectedOutput: "Product management system with full CRUD functionality",
      starterCode: `import java.util.*;

public class ProductManager {
    // TODO: Implement product management system
    
    public static void main(String[] args) {
        // Test your product manager here
    }
}`,
      solution: `import java.util.*;

class Product {
    private int id;
    private String name;
    private double price;
    private String category;
    
    public Product(int id, String name, double price, String category) {
        this.id = id;
        this.name = name;
        this.price = price;
        this.category = category;
    }
    
    // Getters and setters
    public int getId() { return id; }
    public String getName() { return name; }
    public double getPrice() { return price; }
    public String getCategory() { return category; }
    
    public void setName(String name) { this.name = name; }
    public void setPrice(double price) { this.price = price; }
    public void setCategory(String category) { this.category = category; }
}

public class ProductManager {
    private Map<Integer, Product> products = new HashMap<>();
    private int nextId = 1;
    
    public void addProduct(String name, double price, String category) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Product name cannot be empty");
        }
        if (price < 0) {
            throw new IllegalArgumentException("Price cannot be negative");
        }
        
        Product product = new Product(nextId++, name, price, category);
        products.put(product.getId(), product);
        System.out.println("Product added: " + name + " (ID: " + product.getId() + ")");
    }
    
    public Product getProduct(int id) {
        return products.get(id);
    }
    
    public void updateProduct(int id, String name, double price, String category) {
        Product product = products.get(id);
        if (product == null) {
            throw new IllegalArgumentException("Product not found");
        }
        
        product.setName(name);
        product.setPrice(price);
        product.setCategory(category);
        System.out.println("Product updated: " + name);
    }
    
    public void deleteProduct(int id) {
        Product removed = products.remove(id);
        if (removed == null) {
            throw new IllegalArgumentException("Product not found");
        }
        System.out.println("Product deleted: ID " + id);
    }
    
    public static void main(String[] args) {
        ProductManager pm = new ProductManager();
        pm.addProduct("Laptop", 999.99, "Electronics");
        pm.addProduct("Book", 29.99, "Education");
        
        Product laptop = pm.getProduct(1);
        if (laptop != null) {
            System.out.println("Retrieved: " + laptop.getName() + " - $" + laptop.getPrice());
        }
        
        pm.updateProduct(1, "Gaming Laptop", 1299.99, "Electronics");
        pm.deleteProduct(2);
    }
}`,
      difficulty: "medium",
      estimatedTime: 25,
      testCases: [
        { input: "addProduct('Laptop', 999.99, 'Electronics')", expected: "Product added: Laptop (ID: 1)" },
        { input: "getProduct(1)", expected: "Product found with name Laptop" },
        { input: "updateProduct(1, 'Gaming Laptop', 1299.99, 'Electronics')", expected: "Product updated: Gaming Laptop" },
        { input: "deleteProduct(1)", expected: "Product deleted: ID 1" }
      ],
      hints: [
        "Use a Map to store products with ID as key",
        "Validate input parameters in each method",
        "Consider using auto-incrementing IDs"
      ],
      order: 1,
      isActive: true,
      createdAt: new Date(),
    };
    this.tasks.set(productCrudTask.id, productCrudTask);
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  async getModules(): Promise<Module[]> {
    return Array.from(this.modules.values()).filter(module => module.isActive);
  }

  async getModule(id: number): Promise<Module | undefined> {
    return this.modules.get(id);
  }

  async createModule(insertModule: InsertModule): Promise<Module> {
    const id = this.currentModuleId++;
    const module: Module = {
      ...insertModule,
      id,
      createdAt: new Date()
    };
    this.modules.set(id, module);
    return module;
  }

  async updateModule(id: number, updateData: Partial<InsertModule>): Promise<Module | undefined> {
    const module = this.modules.get(id);
    if (!module) return undefined;

    const updatedModule = { ...module, ...updateData };
    this.modules.set(id, updatedModule);
    return updatedModule;
  }

  async getTasks(moduleId?: number): Promise<Task[]> {
    const allTasks = Array.from(this.tasks.values()).filter(task => task.isActive);
    if (moduleId) {
      return allTasks.filter(task => task.moduleId === moduleId);
    }
    return allTasks;
  }

  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async getTasksByModule(moduleId: number): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter(task => task.moduleId === moduleId && task.isActive)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.currentTaskId++;
    const task: Task = {
      ...insertTask,
      id,
      createdAt: new Date()
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: number, updateData: Partial<InsertTask>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;

    const updatedTask = { ...task, ...updateData };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async getUserProgress(userId: number, taskId?: number): Promise<UserProgress[]> {
    const allProgress = Array.from(this.userProgress.values())
      .filter(progress => progress.userId === userId);
    
    if (taskId) {
      return allProgress.filter(progress => progress.taskId === taskId);
    }
    return allProgress;
  }

  async getUserProgressByTask(userId: number, taskId: number): Promise<UserProgress | undefined> {
    const key = `${userId}-${taskId}`;
    return this.userProgress.get(key);
  }

  async createOrUpdateUserProgress(insertProgress: InsertUserProgress): Promise<UserProgress> {
    const key = `${insertProgress.userId}-${insertProgress.taskId}`;
    const existing = this.userProgress.get(key);
    
    if (existing) {
      const updated: UserProgress = {
        ...existing,
        ...insertProgress,
        lastSavedAt: new Date()
      };
      this.userProgress.set(key, updated);
      return updated;
    } else {
      const id = this.currentProgressId++;
      const progress: UserProgress = {
        ...insertProgress,
        id,
        lastSavedAt: new Date()
      };
      this.userProgress.set(key, progress);
      return progress;
    }
  }

  async createAiInteraction(insertInteraction: InsertAiInteraction): Promise<AiInteraction> {
    const id = this.currentInteractionId++;
    const interaction: AiInteraction = {
      ...insertInteraction,
      id,
      createdAt: new Date()
    };
    this.aiInteractions.set(id, interaction);
    return interaction;
  }

  async getAiInteractions(userId: number, taskId?: number): Promise<AiInteraction[]> {
    const allInteractions = Array.from(this.aiInteractions.values())
      .filter(interaction => interaction.userId === userId);
    
    if (taskId) {
      return allInteractions.filter(interaction => interaction.taskId === taskId);
    }
    return allInteractions;
  }

  async createCodeSubmission(insertSubmission: InsertCodeSubmission): Promise<CodeSubmission> {
    const id = this.currentSubmissionId++;
    const submission: CodeSubmission = {
      ...insertSubmission,
      id,
      createdAt: new Date()
    };
    this.codeSubmissions.set(id, submission);
    return submission;
  }

  async getCodeSubmissions(userId: number, taskId?: number): Promise<CodeSubmission[]> {
    const allSubmissions = Array.from(this.codeSubmissions.values())
      .filter(submission => submission.userId === userId);
    
    if (taskId) {
      return allSubmissions.filter(submission => submission.taskId === taskId);
    }
    return allSubmissions;
  }
}

export const storage = new MemStorage();
