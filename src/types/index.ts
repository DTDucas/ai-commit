export interface AICommitConfig {
  provider: 'gemini' | 'bedrock';
  apis: {
    gemini: {
      apiKey: string;
      model?: string;
    };
    bedrock: {
      region: string;
      accessKeyId: string;
      secretAccessKey: string;
      model?: string;
    };
  };
  settings: {
    autoFill: boolean;
    showPreview: boolean;
    maxRetries: number;
    timeout: number;
  };
  customPrompt?: string;
}

export interface GitChange {
  file: string;
  status: 'A' | 'M' | 'D' | 'R' | 'C';
  additions: number;
  deletions: number;
}

export interface CommitAnalysis {
  type: 'feat' | 'fix' | 'refactor' | 'build' | 'perf' | 'docs' | 'test' | 'style' | 'chore' | 'deps';
  scope: string;
  tag: 'FE' | 'BE' | 'API' | 'DB' | 'DOCS' | 'CI' | 'TEST';
  emoji: string;
  changes: GitChange[];
  summary: string;
}

export interface AIService {
  generateCommitMessage(prompt: string): Promise<string>;
  isConfigured(): boolean;
}

export interface CommitFormatRules {
  emojiMap: Record<string, string>;
  typeValidation: string[];
  tagValidation: string[];
  maxLength: number;
}
