export interface AIService {
  generateCommitMessage(prompt: string): Promise<string>;
  isConfigured(): boolean;
  getProviderName(): string;
}
