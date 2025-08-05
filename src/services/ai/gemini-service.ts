import { GoogleGenerativeAI } from '@google/generative-ai';
import { AICommitConfig } from '../../types';
import { AIService } from './ai-service.interface';

export class GeminiService implements AIService {
  private genAI: GoogleGenerativeAI | null = null;
  private config: AICommitConfig['apis']['gemini'];

  constructor(config: AICommitConfig['apis']['gemini']) {
    this.config = config;
    if (this.isConfigured()) {
      this.genAI = new GoogleGenerativeAI(config.apiKey);
    }
  }

  async generateCommitMessage(prompt: string): Promise<string> {
    if (!this.genAI) {
      throw new Error('Gemini service not configured. Please provide API key.');
    }

    try {
      const model = this.genAI.getGenerativeModel({
        model: this.config.model || 'gemini-pro'
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (!text) {
        throw new Error('Empty response from Gemini API');
      }

      return text.trim();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Gemini API error: ${error.message}`);
      }
      throw new Error('Unknown error occurred with Gemini API');
    }
  }

  isConfigured(): boolean {
    return Boolean(this.config.apiKey && this.config.apiKey.trim().length > 0);
  }

  getProviderName(): string {
    return 'Gemini';
  }

  updateConfig(config: AICommitConfig['apis']['gemini']): void {
    this.config = config;
    if (this.isConfigured()) {
      this.genAI = new GoogleGenerativeAI(config.apiKey);
    } else {
      this.genAI = null;
    }
  }
}
