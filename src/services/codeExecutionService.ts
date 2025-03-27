import { spawn } from "child_process";
import { promisify } from "util";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import { config } from "../config";

const exec = promisify(require("child_process").exec);

export class CodeExecutionService {
  private static instance: CodeExecutionService;
  private tempDir: string;

  private constructor() {
    this.tempDir = path.join(process.cwd(), "temp");
  }

  public static getInstance(): CodeExecutionService {
    if (!CodeExecutionService.instance) {
      CodeExecutionService.instance = new CodeExecutionService();
    }
    return CodeExecutionService.instance;
  }

  async executeJavaScript(code: string, testCases: any[]): Promise<any> {
    const fileName = `solution_${Date.now()}.js`;
    const filePath = path.join(this.tempDir, fileName);

    try {
      // Write code to temporary file
      await writeFile(filePath, code);

      // Run test cases
      const results = await Promise.all(
        testCases.map(async (testCase) => {
          try {
            const { stdout, stderr } = await exec(
              `node ${filePath} "${testCase.input}"`
            );
            return {
              input: testCase.input,
              expectedOutput: testCase.output,
              actualOutput: stdout.trim(),
              error: stderr,
              passed: stdout.trim() === testCase.output,
            };
          } catch (error) {
            return {
              input: testCase.input,
              expectedOutput: testCase.output,
              actualOutput: null,
              error: error.message,
              passed: false,
            };
          }
        })
      );

      // Calculate overall success
      const success = results.every((result) => result.passed);
      const feedback = this.generateFeedback(results);

      return {
        success,
        results,
        feedback,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        feedback: "Error executing code",
      };
    } finally {
      // Clean up temporary file
      try {
        await unlink(filePath);
      } catch (error) {
        console.error("Error cleaning up temporary file:", error);
      }
    }
  }

  async executePython(code: string, testCases: any[]): Promise<any> {
    const fileName = `solution_${Date.now()}.py`;
    const filePath = path.join(this.tempDir, fileName);

    try {
      // Write code to temporary file
      await writeFile(filePath, code);

      // Run test cases
      const results = await Promise.all(
        testCases.map(async (testCase) => {
          try {
            const { stdout, stderr } = await exec(
              `python ${filePath} "${testCase.input}"`
            );
            return {
              input: testCase.input,
              expectedOutput: testCase.output,
              actualOutput: stdout.trim(),
              error: stderr,
              passed: stdout.trim() === testCase.output,
            };
          } catch (error) {
            return {
              input: testCase.input,
              expectedOutput: testCase.output,
              actualOutput: null,
              error: error.message,
              passed: false,
            };
          }
        })
      );

      // Calculate overall success
      const success = results.every((result) => result.passed);
      const feedback = this.generateFeedback(results);

      return {
        success,
        results,
        feedback,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        feedback: "Error executing code",
      };
    } finally {
      // Clean up temporary file
      try {
        await unlink(filePath);
      } catch (error) {
        console.error("Error cleaning up temporary file:", error);
      }
    }
  }

  private generateFeedback(results: any[]): string {
    const failedTests = results.filter((result) => !result.passed);

    if (failedTests.length === 0) {
      return "All tests passed! Great job!";
    }

    return `Failed ${failedTests.length} test case(s):\n${failedTests
      .map(
        (test) =>
          `Input: ${test.input}\nExpected: ${test.expectedOutput}\nGot: ${
            test.actualOutput || "Error"
          }\n`
      )
      .join("\n")}`;
  }
}
