import { Quiz } from "@/types";
import { Type, Schema } from "@google/genai";

export interface QuizGenerationResult {
  quiz?: Quiz;
  refusalReason?: string;
}

const quizDetailsSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "A catchy title for the quiz" },
    description: { type: Type.STRING, description: "Brief description of the quiz content" },
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.INTEGER },
          question: { type: Type.STRING },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of 4 possible answers"
          },
          correctAnswerIndex: { 
            type: Type.INTEGER, 
            description: "The index (0-3) of the correct answer in the options array" 
          },
          explanation: { type: Type.STRING, description: "Short explanation of why this answer is correct" }
        },
        required: ["id", "question", "options", "correctAnswerIndex", "explanation"]
      }
    }
  },
  required: ["title", "description", "questions"]
};


export const quizResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    quiz: {
      type: Type.OBJECT,
      description: "The generated quiz object. Populated ONLY if valid content exists to create a quiz.",
      properties: quizDetailsSchema.properties,
      required: quizDetailsSchema.required
    },
    refusalReason: {
      type: Type.STRING,
      description: "A polite apology and reason why a quiz could not be generated (e.g., 'The uploaded file appears to be empty' or 'Please provide a topic'). Populated ONLY if the quiz cannot be generated."
    }
  }
};