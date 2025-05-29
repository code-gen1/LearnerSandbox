import { exec } from 'child_process';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface ExecutionResult {
  success: boolean;
  output: string;
  errors: string[];
  executionTime: number;
}

export class CodeExecutor {
  private tempDir: string;

  constructor() {
    this.tempDir = join(process.cwd(), 'temp_code');
    this.ensureTempDir();
  }

  private ensureTempDir() {
    if (!existsSync(this.tempDir)) {
      mkdirSync(this.tempDir, { recursive: true });
    }
  }

  private cleanup(filePath: string) {
    try {
      if (existsSync(filePath)) {
        rmSync(filePath, { force: true });
      }
    } catch (error) {
      console.warn('Cleanup warning:', error);
    }
  }

  async executeJava(code: string, className: string = 'Main'): Promise<ExecutionResult> {
    const startTime = Date.now();
    const fileName = `${className}.java`;
    const filePath = join(this.tempDir, fileName);
    const classPath = join(this.tempDir, `${className}.class`);

    try {
      // Write code to file
      writeFileSync(filePath, code);

      // Compile Java code
      const compileCommand = `javac "${filePath}"`;
      try {
        await execAsync(compileCommand, { timeout: 10000 });
      } catch (compileError: any) {
        this.cleanup(filePath);
        return {
          success: false,
          output: '',
          errors: [`Compilation Error: ${compileError.stderr || compileError.message}`],
          executionTime: Date.now() - startTime
        };
      }

      // Execute Java code
      const executeCommand = `cd "${this.tempDir}" && java ${className}`;
      try {
        const { stdout, stderr } = await execAsync(executeCommand, { timeout: 15000 });
        
        this.cleanup(filePath);
        this.cleanup(classPath);

        return {
          success: true,
          output: stdout || 'Program executed successfully (no output)',
          errors: stderr ? [stderr] : [],
          executionTime: Date.now() - startTime
        };
      } catch (executeError: any) {
        this.cleanup(filePath);
        this.cleanup(classPath);

        return {
          success: false,
          output: executeError.stdout || '',
          errors: [`Runtime Error: ${executeError.stderr || executeError.message}`],
          executionTime: Date.now() - startTime
        };
      }
    } catch (error: any) {
      this.cleanup(filePath);
      this.cleanup(classPath);

      return {
        success: false,
        output: '',
        errors: [`System Error: ${error.message}`],
        executionTime: Date.now() - startTime
      };
    }
  }

  async executePython(code: string, fileName: string = 'main.py'): Promise<ExecutionResult> {
    const startTime = Date.now();
    const filePath = join(this.tempDir, fileName);

    try {
      // Write code to file
      writeFileSync(filePath, code);

      // Execute Python code
      const executeCommand = `python3 "${filePath}"`;
      try {
        const { stdout, stderr } = await execAsync(executeCommand, { timeout: 15000 });
        
        this.cleanup(filePath);

        return {
          success: true,
          output: stdout || 'Program executed successfully (no output)',
          errors: stderr ? [stderr] : [],
          executionTime: Date.now() - startTime
        };
      } catch (executeError: any) {
        this.cleanup(filePath);

        return {
          success: false,
          output: executeError.stdout || '',
          errors: [`Error: ${executeError.stderr || executeError.message}`],
          executionTime: Date.now() - startTime
        };
      }
    } catch (error: any) {
      this.cleanup(filePath);

      return {
        success: false,
        output: '',
        errors: [`System Error: ${error.message}`],
        executionTime: Date.now() - startTime
      };
    }
  }

  async executeCode(code: string, language: string, fileName?: string): Promise<ExecutionResult> {
    switch (language.toLowerCase()) {
      case 'java':
        const className = this.extractJavaClassName(code) || 'Main';
        return this.executeJava(code, className);
      case 'python':
        return this.executePython(code, fileName);
      default:
        return {
          success: false,
          output: '',
          errors: [`Unsupported language: ${language}`],
          executionTime: 0
        };
    }
  }

  private extractJavaClassName(code: string): string | null {
    const classMatch = code.match(/public\s+class\s+(\w+)/);
    return classMatch ? classMatch[1] : null;
  }
}

export const codeExecutor = new CodeExecutor();
