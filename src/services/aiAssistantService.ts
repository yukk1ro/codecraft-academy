import OpenAI from "openai";
import { config } from "../config";

export class AIAssistantService {
  private static instance: AIAssistantService;
  private openai: OpenAI;

  private constructor() {
    this.openai = new OpenAI({
      apiKey: config.openaiApiKey,
    });
  }

  public static getInstance(): AIAssistantService {
    if (!AIAssistantService.instance) {
      AIAssistantService.instance = new AIAssistantService();
    }
    return AIAssistantService.instance;
  }

  async getCodeHint(challenge: any, userCode: string): Promise<string> {
    try {
      const prompt = this.generateHintPrompt(challenge, userCode);
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful programming assistant. Provide hints that guide users to solve coding challenges without giving away the solution.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 150,
      });

      return response.choices[0].message.content || "Unable to generate hint";
    } catch (error) {
      console.error("Error getting AI hint:", error);
      return "Unable to generate hint at this time";
    }
  }

  async analyzeCode(code: string, language: string): Promise<any> {
    try {
      const prompt = this.generateAnalysisPrompt(code, language);
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are a code analysis expert. Analyze the code and provide feedback on style, potential issues, and improvements.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
      });

      return {
        analysis: response.choices[0].message.content,
        suggestions: this.parseSuggestions(response.choices[0].message.content),
      };
    } catch (error) {
      console.error("Error analyzing code:", error);
      return {
        analysis: "Unable to analyze code at this time",
        suggestions: [],
      };
    }
  }

  private generateHintPrompt(challenge: any, userCode: string): string {
    return `
Challenge: ${challenge.title}
Description: ${challenge.description}
Difficulty: ${challenge.difficulty}
User's current code:
${userCode}

Please provide a helpful hint that guides the user toward the solution without giving it away.
Focus on:
1. Identifying potential issues in the current approach
2. Suggesting relevant concepts or techniques
3. Pointing out any obvious mistakes
4. Encouraging good programming practices

Keep the hint concise and actionable.`;
  }

  private generateAnalysisPrompt(code: string, language: string): string {
    return `
Please analyze this ${language} code:

${code}

Provide feedback on:
1. Code style and readability
2. Potential bugs or issues
3. Performance considerations
4. Best practices
5. Suggested improvements

Format the response in a clear, structured way.`;
  }

  private parseSuggestions(analysis: string): string[] {
    // Simple parsing of suggestions from the analysis
    return analysis
      .split("\n")
      .filter(
        (line) => line.trim().startsWith("-") || line.trim().startsWith("*")
      )
      .map((line) => line.replace(/^[-*]\s*/, "").trim());
  }
}
