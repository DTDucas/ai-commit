import { AICommitConfig } from '../../types';
import { AIService } from './ai-service.interface';
import { BedrockService } from './bedrock-service';
import { GeminiService } from './gemini-service';

export class AIServiceFactory {
  private static geminiInstance: GeminiService | null = null;
  private static bedrockInstance: BedrockService | null = null;

  static createService(config: AICommitConfig): AIService {
    switch (config.provider) {
      case 'gemini':
        if (!this.geminiInstance) {
          this.geminiInstance = new GeminiService(config.apis.gemini);
        } else {
          this.geminiInstance.updateConfig(config.apis.gemini);
        }
        return this.geminiInstance;

      case 'bedrock':
        if (!this.bedrockInstance) {
          this.bedrockInstance = new BedrockService(config.apis.bedrock);
        } else {
          this.bedrockInstance.updateConfig(config.apis.bedrock);
        }
        return this.bedrockInstance;

      default:
        throw new Error(`Unsupported AI provider: ${config.provider}`);
    }
  }

  static resetInstances(): void {
    this.geminiInstance = null;
    this.bedrockInstance = null;
  }
}
