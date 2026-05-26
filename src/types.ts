
export interface CodeExecutionResult {
  code: string;
  output: string;
  status?: 'success' | 'error';
}

export interface WebsiteContent {
  files: Record<string, string>;
  mainFile: string;
}

export interface Message {
  role: 'user' | 'model' | 'system' | 'assistant';
  text: string;
  timestamp: number;
  codeExecution?: CodeExecutionResult;
  websiteContent?: WebsiteContent;
  isError?: boolean;
}

export enum CompanionState {
  IDLE = 'IDLE',
  LISTENING = 'LISTENING',
  THINKING = 'THINKING',
  CODING = 'CODING',
  BUILDING = 'BUILDING',
  SPEAKING = 'SPEAKING',
}

// Updated ModelId to Gemini series models
export type ModelId = 
  | 'gemini-3-pro-preview'
  | 'gemini-3-flash-preview';
