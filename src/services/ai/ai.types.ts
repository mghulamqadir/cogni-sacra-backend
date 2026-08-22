export interface TutorAiInput {
  question: string;
  courseMaterial: string;
  allowedLessonIds: string[];
}
export interface TutorAiResult {
  answer: string;
  grounded: boolean;
  citedLessonIds: string[];
  inputTokens?: number;
  outputTokens?: number;
}
export interface AiProvider {
  generateTutorAnswer(input: TutorAiInput): Promise<TutorAiResult>;
}
