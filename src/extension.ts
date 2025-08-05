import * as vscode from 'vscode';
import { GenerateCommitCommand } from './commands/generate-commit';
import { CommitService } from './services/commit-service';
import { GitService } from './services/git-service';
import { ConfigManager } from './utils/config-manager';

export function activate(context: vscode.ExtensionContext) {
  console.log('AI Commit Generator extension is now active!');

  // Initialize services
  const configManager = ConfigManager.getInstance();
  const gitService = GitService.getInstance();

  // Register commands
  const generateCommitCommand = new GenerateCommitCommand();
  generateCommitCommand.register(context);

  // Register config command
  const openConfigCommand = vscode.commands.registerCommand(
    'ai-commit.openConfig',
    async () => {
      await configManager.createConfigFile();
    }
  );
  context.subscriptions.push(openConfigCommand);

  // Register repository analysis command (for debugging)
  const analyzeRepoCommand = vscode.commands.registerCommand(
    'ai-commit.analyzeRepo',
    async () => {
      const commitService = CommitService.getInstance();
      await commitService.analyzeRepository();
    }
  );
  context.subscriptions.push(analyzeRepoCommand);

  // Watch for config file changes
  const configWatcher = vscode.workspace.createFileSystemWatcher(
    '**/ai-commit.json',
    false, // createEvents
    false, // changeEvents
    true   // deleteEvents
  );

  configWatcher.onDidChange(async () => {
    await configManager.reloadConfig();
    vscode.window.showInformationMessage('AI Commit configuration reloaded');
  });

  configWatcher.onDidCreate(async () => {
    await configManager.reloadConfig();
    vscode.window.showInformationMessage('AI Commit configuration loaded');
  });

  context.subscriptions.push(configWatcher);

  // Status bar item
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );
  statusBarItem.text = '$(sparkle) AI Commit';
  statusBarItem.tooltip = 'Generate AI Commit Message';
  statusBarItem.command = 'ai-commit.generate';

  // Show status bar item only in git repositories
  const updateStatusBarVisibility = async () => {
    const isGitRepo = await gitService.isGitRepository();
    if (isGitRepo) {
      statusBarItem.show();
    } else {
      statusBarItem.hide();
    }
  };

  // Check initially and when workspace changes
  updateStatusBarVisibility();

  const workspaceWatcher = vscode.workspace.onDidChangeWorkspaceFolders(() => {
    updateStatusBarVisibility();
  });

  context.subscriptions.push(statusBarItem, workspaceWatcher);

  // Welcome message for first-time users
  const showWelcomeMessage = async () => {
    const config = await configManager.loadConfig();
    const hasValidConfig = configManager.validateConfig(config);

    if (!hasValidConfig) {
      const action = await vscode.window.showInformationMessage(
        'Welcome to AI Commit Generator! Would you like to create a configuration file?',
        'Create Config',
        'Later'
      );

      if (action === 'Create Config') {
        await configManager.createConfigFile();
      }
    }
  };

  // Show welcome message after a short delay
  setTimeout(showWelcomeMessage, 2000);
}

export function deactivate() {
  console.log('AI Commit Generator extension is now deactivated');
}
