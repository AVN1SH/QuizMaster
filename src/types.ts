export enum MessageRole {
  USER = 'user',
  MODEL = 'model',
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface Quiz {
  title: string;
  description: string;
  questions: QuizQuestion[];
}

export interface Message {
  id: string;
  role: MessageRole;
  text: string;
  quizData?: Quiz | null;
  timestamp: number;
  isError?: boolean;
}

export interface FileAttachment {
  name: string;
  type: string;
  data: string;
}

export enum AppView {
  CHAT = 'CHAT',
  QUIZ = 'QUIZ',
}