import * as vscode from 'vscode';

export class SCMIntegration {
  private static instance: SCMIntegration;

  private constructor() {}

  static getInstance(): SCMIntegration {
    if (!SCMIntegration.instance) {
      SCMIntegration.instance = new SCMIntegration();
    }
    return SCMIntegration.instance;
  }

  async fillCommitMessage(message: string): Promise<boolean> {
    try {
      const gitExtension = vscode.extensions.getExtension('vscode.git');
      if (!gitExtension) {
        vscode.window.showErrorMessage('Git extension not found');
        return false;
      }

      if (!gitExtension.isActive) {
        await gitExtension.activate();
      }

      const git = gitExtension.exports.getAPI(1);
      if (!git) {
        vscode.window.showErrorMessage('Git API not available');
        return false;
      }

      const repositories = git.repositories;
      if (repositories.length === 0) {
        vscode.window.showErrorMessage('No Git repositories found');
        return false;
      }

      // Use the first repository (or find the active one)
      const repository = repositories[0];

      // Set the commit message in the input box
      repository.inputBox.value = message;

      // Show the Source Control view
      await vscode.commands.executeCommand('workbench.view.scm');

      return true;
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to fill commit message: ${error}`);
      return false;
    }
  }

  async getRepository(): Promise<any> {
    try {
      const gitExtension = vscode.extensions.getExtension('vscode.git');
      if (!gitExtension) {
        return null;
      }

      if (!gitExtension.isActive) {
        await gitExtension.activate();
      }

      const git = gitExtension.exports.getAPI(1);
      if (!git || git.repositories.length === 0) {
        return null;
      }

      return git.repositories[0];
    } catch (error) {
      return null;
    }
  }

  async getCurrentCommitMessage(): Promise<string> {
    try {
      const repository = await this.getRepository();
      if (!repository) {
        return '';
      }

      return repository.inputBox.value || '';
    } catch (error) {
      return '';
    }
  }

  async hasStagedChanges(): Promise<boolean> {
    try {
      const repository = await this.getRepository();
      if (!repository) {
        return false;
      }

      return repository.state.indexChanges.length > 0;
    } catch (error) {
      return false;
    }
  }

  async getStagedFiles(): Promise<string[]> {
    try {
      const repository = await this.getRepository();
      if (!repository) {
        return [];
      }

      return repository.state.indexChanges.map((change: any) => change.uri.fsPath);
    } catch (error) {
      return [];
    }
  }
}
