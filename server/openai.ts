import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface CodeEvaluationResult {
  feedback: {
    whatWentWell: string[];
    whatToImprove: string[];
  };
  suggestions: string;
  score: number;
  hints: string[];
  isCorrect: boolean;
}

export interface ExerciseGenerationResult {
  title: string;
  description: string;
  objectives: string[];
  requirements: string[];
  starterCode: string;
  solution: string;
  difficulty: string;
  estimatedTime: number;
  testCases: Array<{input: string, expected: string}>;
  hints: string[];
}

export async function evaluateCode(
  userCode: string, 
  expectedSolution: string, 
  taskDescription: string,
  moduleTrainingData: string,
  language: string = "java"
): Promise<CodeEvaluationResult> {
  try {
    const prompt = `You are an AI assistant specialized in evaluating E1 module programming exercises. 

Module Context: ${moduleTrainingData}

Task Description: ${taskDescription}

Expected Solution:
${expectedSolution}

Student's Code:
${userCode}

Programming Language: ${language}

Please evaluate the student's code and provide detailed feedback in JSON format with the following structure:
{
  "feedback": {
    "whatWentWell": ["list of positive aspects"],
    "whatToImprove": ["list of areas that need improvement"]
  },
  "suggestions": "specific suggestions for improvement",
  "score": number between 0-100,
  "hints": ["helpful hints for the student"],
  "isCorrect": boolean indicating if the solution is correct
}

Focus on:
- Code correctness and functionality
- Code quality and best practices
- Alignment with learning objectives
- Appropriate difficulty level for E1 module
- Constructive feedback that helps learning`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert programming educator specializing in E1 module content. Provide constructive, educational feedback that helps students learn effectively."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      feedback: {
        whatWentWell: result.feedback?.whatWentWell || [],
        whatToImprove: result.feedback?.whatToImprove || []
      },
      suggestions: result.suggestions || "Keep practicing and refer to the module materials.",
      score: Math.max(0, Math.min(100, result.score || 0)),
      hints: result.hints || [],
      isCorrect: result.isCorrect || false
    };
  } catch (error) {
    console.error("Error evaluating code:", error);
    throw new Error("Failed to evaluate code: " + (error as Error).message);
  }
}

export async function generateExercise(
  moduleTrainingData: string,
  difficulty: string,
  language: string,
  topic?: string
): Promise<ExerciseGenerationResult> {
  try {
    const prompt = `Generate a new programming exercise for an E1 learning module.

Module Context: ${moduleTrainingData}
Difficulty Level: ${difficulty}
Programming Language: ${language}
${topic ? `Focus Topic: ${topic}` : ''}

Create an exercise that is appropriate for E1 module students. The exercise should be practical, engaging, and aligned with real-world scenarios that E1 students might encounter.

Provide the response in JSON format with this structure:
{
  "title": "Exercise title",
  "description": "Detailed description of what students need to build",
  "objectives": ["learning objective 1", "learning objective 2"],
  "requirements": ["requirement 1", "requirement 2"],
  "starterCode": "initial code template with TODO comments",
  "solution": "complete working solution",
  "difficulty": "easy|medium|hard",
  "estimatedTime": number in minutes,
  "testCases": [{"input": "test input", "expected": "expected output"}],
  "hints": ["helpful hint 1", "helpful hint 2"]
}

Ensure the exercise is:
- Appropriate for the specified difficulty level
- Practical and relevant to E1 module content
- Includes clear learning objectives
- Has comprehensive test cases
- Provides helpful hints for students`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert curriculum designer for E1 learning modules. Create engaging, practical programming exercises that help students learn effectively."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      title: result.title || "Generated Exercise",
      description: result.description || "Complete the programming task as described.",
      objectives: result.objectives || [],
      requirements: result.requirements || [],
      starterCode: result.starterCode || "// TODO: Implement your solution here",
      solution: result.solution || "// Solution not available",
      difficulty: result.difficulty || difficulty,
      estimatedTime: result.estimatedTime || 15,
      testCases: result.testCases || [],
      hints: result.hints || []
    };
  } catch (error) {
    console.error("Error generating exercise:", error);
    throw new Error("Failed to generate exercise: " + (error as Error).message);
  }
}

export async function provideChatAssistance(
  userMessage: string,
  taskContext: string,
  moduleTrainingData: string,
  conversationHistory: Array<{role: string, content: string}> = []
): Promise<string> {
  try {
    const systemMessage = `You are an AI teaching assistant for E1 learning modules. 

Module Context: ${moduleTrainingData}
Current Task: ${taskContext}

Your role is to:
- Provide helpful hints without giving away complete solutions
- Encourage learning through guided discovery
- Explain concepts clearly and simply
- Be supportive and encouraging
- Focus on E1 module learning objectives

Keep responses concise but informative. Always encourage the student to think through problems step by step.`;

    const messages = [
      { role: "system", content: systemMessage },
      ...conversationHistory,
      { role: "user", content: userMessage }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages as any,
      temperature: 0.6,
      max_tokens: 500,
    });

    return response.choices[0].message.content || "I'm here to help! Could you please rephrase your question?";
  } catch (error) {
    console.error("Error providing chat assistance:", error);
    throw new Error("Failed to provide assistance: " + (error as Error).message);
  }
}
