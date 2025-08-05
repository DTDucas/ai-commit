import * as vscode from 'vscode';
import { CommitFormatter } from '../utils/commit-formatter';
import { ConfigManager } from '../utils/config-manager';
import { SCMIntegration } from '../utils/scm-integration';
import { AIServiceFactory } from './ai/ai-factory';
import { GitService } from './git-service';

export class CommitService {
  private static instance: CommitService;
  private gitService: GitService;
  private configManager: ConfigManager;
  private scmIntegration: SCMIntegration;

  private constructor() {
    this.gitService = GitService.getInstance();
    this.configManager = ConfigManager.getInstance();
    this.scmIntegration = SCMIntegration.getInstance();
  }

  static getInstance(): CommitService {
    if (!CommitService.instance) {
      CommitService.instance = new CommitService();
    }
    return CommitService.instance;
  }

  async generateCommitMessage(): Promise<void> {
    try {
      // Show loading message
      const loadingMessage = vscode.window.setStatusBarMessage('$(loading~spin) Generating commit message...');

      // Check if we're in a git repository
      const isGitRepo = await this.gitService.isGitRepository();
      if (!isGitRepo) {
        vscode.window.showErrorMessage('Not a Git repository');
        return;
      }

      // Check for staged changes
      const hasStagedChanges = await this.gitService.hasStagedChanges();
      if (!hasStagedChanges) {
        vscode.window.showWarningMessage('No staged changes found. Please stage your changes first.');
        return;
      }

      // Load configuration
      const config = await this.configManager.loadConfig();

      // Validate configuration
      if (!this.configManager.validateConfig(config)) {
        const action = await vscode.window.showErrorMessage(
          'AI Commit configuration is invalid or missing.',
          'Create Config'
        );
        if (action === 'Create Config') {
          await this.configManager.createConfigFile();
        }
        return;
      }

      // Get git diff
      const gitDiff = await this.gitService.getStagedDiff();
      const stagedFiles = await this.gitService.getStagedFiles();

      // Create AI service
      const aiService = AIServiceFactory.createService(config);

      if (!aiService.isConfigured()) {
        vscode.window.showErrorMessage(`${aiService.getProviderName()} service is not properly configured`);
        return;
      }

      // Generate prompt
      const prompt = CommitFormatter.createPrompt(gitDiff, config.customPrompt);

      // Generate commit message with retry logic
      let commitMessage = '';
      let lastError = '';

      for (let attempt = 1; attempt <= config.settings.maxRetries; attempt++) {
        try {
          // Set timeout for AI request
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), config.settings.timeout);
          });

          const aiPromise = aiService.generateCommitMessage(prompt);
          commitMessage = await Promise.race([aiPromise, timeoutPromise]);

          if (commitMessage) {
            break;
          }
        } catch (error) {
          lastError = error instanceof Error ? error.message : 'Unknown error';
          if (attempt < config.settings.maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
            continue;
          }
        }
      }

      if (!commitMessage) {
        vscode.window.showErrorMessage(`Failed to generate commit message: ${lastError}`);
        return;
      }

      // Clean up the message (remove any extra formatting)
      commitMessage = commitMessage.split('\n')[0].trim();

      // Validate format
      const validation = CommitFormatter.validateFormat(commitMessage);
      if (!validation.isValid) {
        // Try to auto-fix common issues or show warning
        vscode.window.showWarningMessage(
          `Generated message format issues: ${validation.errors.join(', ')}`
        );

        // Still allow the message to be used, but with warning
      }

      // Show preview if enabled
      if (config.settings.showPreview) {
        const action = await vscode.window.showInformationMessage(
          `Generated commit message:\n${commitMessage}`,
          'Use Message', 'Cancel'
        );

        if (action !== 'Use Message') {
          return;
        }
      }

      if (config.settings.autoFill) {
        const success = await this.scmIntegration.fillCommitMessage(commitMessage);
        if (success) {
          vscode.window.showInformationMessage('✨ Commit message generated successfully!');
        }
      } else {
        await vscode.window.showInformationMessage(
          `Generated commit message:\n${commitMessage}`,
          'Copy to Clipboard'
        ).then(action => {
          if (action === 'Copy to Clipboard') {
            vscode.env.clipboard.writeText(commitMessage);
          }
        });
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      vscode.window.showErrorMessage(`Failed to generate commit message: ${errorMessage}`);
    } finally {
      vscode.window.setStatusBarMessage('');
    }
  }

  async analyzeRepository(): Promise<void> {
    try {
      const isGitRepo = await this.gitService.isGitRepository();
      if (!isGitRepo) {
        vscode.window.showInformationMessage('Not a Git repository');
        return;
      }

      const currentBranch = await this.gitService.getCurrentBranch();
      const hasStagedChanges = await this.gitService.hasStagedChanges();
      const stagedFiles = await this.gitService.getStagedFiles();
      const recentCommits = await this.gitService.getRecentCommits(3);

      const analysis = [
        `📁 Current branch: ${currentBranch}`,
        `📝 Staged changes: ${hasStagedChanges ? 'Yes' : 'No'}`,
        `📄 Staged files: ${stagedFiles.length}`,
        ...stagedFiles.map(file => `  • ${file}`),
        `🕐 Recent commits:`,
        ...recentCommits.map(commit => `  • ${commit}`)
      ].join('\n');

      vscode.window.showInformationMessage(analysis, { modal: true });
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to analyze repository: ${error}`);
    }
  }
}
