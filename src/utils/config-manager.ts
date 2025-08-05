import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { AICommitConfig } from '../types';

export class ConfigManager {
  private static instance: ConfigManager;
  private config: AICommitConfig | null = null;
  private configPath: string | null = null;

  private constructor() {}

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  async loadConfig(): Promise<AICommitConfig> {
    if (this.config) {
      return this.config;
    }

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      return this.getDefaultConfig();
    }

    // Try .vscode/ai-commit.json first
    const vscodePath = path.join(workspaceFolder.uri.fsPath, '.vscode', 'ai-commit.json');
    // Then try workspace root
    const rootPath = path.join(workspaceFolder.uri.fsPath, 'ai-commit.json');

    for (const configPath of [vscodePath, rootPath]) {
      if (fs.existsSync(configPath)) {
        try {
          const configContent = fs.readFileSync(configPath, 'utf8');
          const config = JSON.parse(configContent) as AICommitConfig;
          this.config = { ...this.getDefaultConfig(), ...config };
          this.configPath = configPath;
          return this.config;
        } catch (error) {
          vscode.window.showErrorMessage(`Error reading config file: ${error}`);
        }
      }
    }

    return this.getDefaultConfig();
  }

  private getDefaultConfig(): AICommitConfig {
    return {
      provider: 'gemini',
      apis: {
        gemini: {
          apiKey: '',
          model: 'gemini-pro'
        },
        bedrock: {
          region: 'us-east-1',
          accessKeyId: '',
          secretAccessKey: '',
          model: 'anthropic.claude-3-sonnet-20240229-v1:0'
        }
      },
      settings: {
        autoFill: true,
        showPreview: false,
        maxRetries: 3,
        timeout: 30000
      }
    };
  }

  async createConfigFile(): Promise<void> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage('No workspace folder found');
      return;
    }

    const vscodePath = path.join(workspaceFolder.uri.fsPath, '.vscode');
    const configPath = path.join(vscodePath, 'ai-commit.json');

    // Create .vscode directory if it doesn't exist
    if (!fs.existsSync(vscodePath)) {
      fs.mkdirSync(vscodePath, { recursive: true });
    }

    const defaultConfig = this.getDefaultConfig();
    const configContent = JSON.stringify(defaultConfig, null, 2);

    fs.writeFileSync(configPath, configContent);
    this.configPath = configPath;

    // Open the config file
    const document = await vscode.workspace.openTextDocument(configPath);
    await vscode.window.showTextDocument(document);

    vscode.window.showInformationMessage('AI Commit config file created successfully!');
  }

  getConfig(): AICommitConfig {
    return this.config || this.getDefaultConfig();
  }

  async reloadConfig(): Promise<void> {
    this.config = null;
    await this.loadConfig();
  }

  validateConfig(config: AICommitConfig): boolean {
    if (config.provider === 'gemini' && !config.apis.gemini.apiKey) {
      vscode.window.showErrorMessage('Gemini API key is required');
      return false;
    }

    if (config.provider === 'bedrock') {
      const bedrock = config.apis.bedrock;
      if (!bedrock.accessKeyId || !bedrock.secretAccessKey || !bedrock.region) {
        vscode.window.showErrorMessage('AWS Bedrock credentials are required');
        return false;
      }
    }

    return true;
  }
}
