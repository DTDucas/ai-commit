import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { AICommitConfig } from '../../types';
import { AIService } from './ai-service.interface';

export class BedrockService implements AIService {
  private client: BedrockRuntimeClient | null = null;
  private config: AICommitConfig['apis']['bedrock'];

  constructor(config: AICommitConfig['apis']['bedrock']) {
    this.config = config;
    if (this.isConfigured()) {
      this.initializeClient();
    }
  }

  private initializeClient(): void {
    this.client = new BedrockRuntimeClient({
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey
      }
    });
  }

  async generateCommitMessage(prompt: string): Promise<string> {
    if (!this.client) {
      throw new Error('Bedrock service not configured. Please provide AWS credentials.');
    }

    try {
      const modelId = this.config.model || 'anthropic.claude-3-sonnet-20240229-v1:0';

      let body;
      let responseField;

      if (modelId.includes('anthropic.claude')) {
        // Claude format
        body = JSON.stringify({
          anthropic_version: "bedrock-2023-05-31",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: prompt
            }
          ]
        });
        responseField = 'content';
      } else if (modelId.includes('amazon.titan')) {
        // Titan format
        body = JSON.stringify({
          inputText: prompt,
          textGenerationConfig: {
            maxTokenCount: 1000,
            temperature: 0.1,
            topP: 0.9
          }
        });
        responseField = 'results';
      } else {
        throw new Error(`Unsupported model: ${modelId}`);
      }

      const command = new InvokeModelCommand({
        modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: body
      });

      const response = await this.client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));

      let text = '';
      if (modelId.includes('anthropic.claude')) {
        text = responseBody.content[0]?.text || '';
      } else if (modelId.includes('amazon.titan')) {
        text = responseBody.results[0]?.outputText || '';
      }

      if (!text) {
        throw new Error('Empty response from Bedrock API');
      }

      return text.trim();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Bedrock API error: ${error.message}`);
      }
      throw new Error('Unknown error occurred with Bedrock API');
    }
  }

  isConfigured(): boolean {
    return Boolean(
      this.config.accessKeyId &&
      this.config.secretAccessKey &&
      this.config.region &&
      this.config.accessKeyId.trim().length > 0 &&
      this.config.secretAccessKey.trim().length > 0 &&
      this.config.region.trim().length > 0
    );
  }

  getProviderName(): string {
    return 'AWS Bedrock';
  }

  updateConfig(config: AICommitConfig['apis']['bedrock']): void {
    this.config = config;
    if (this.isConfigured()) {
      this.initializeClient();
    } else {
      this.client = null;
    }
  }
}
