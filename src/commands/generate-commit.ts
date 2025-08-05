import * as vscode from 'vscode';
import { CommitService } from '../services/commit-service';

export class GenerateCommitCommand {
  private commitService: CommitService;

  constructor() {
    this.commitService = CommitService.getInstance();
  }

  async execute(): Promise<void> {
    await this.commitService.generateCommitMessage();
  }

  register(context: vscode.ExtensionContext): void {
    const disposable = vscode.commands.registerCommand(
      'ai-commit.generate',
      async () => {
        await this.execute();
      }
    );

    context.subscriptions.push(disposable);
  }
}
