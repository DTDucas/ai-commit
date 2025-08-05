import { exec } from 'child_process';
import { promisify } from 'util';
import * as vscode from 'vscode';
import { GitChange } from '../types';

const execAsync = promisify(exec);

export class GitService {
  private static instance: GitService;

  private constructor() {}

  static getInstance(): GitService {
    if (!GitService.instance) {
      GitService.instance = new GitService();
    }
    return GitService.instance;
  }

  async getStagedDiff(): Promise<string> {
    try {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        throw new Error('No workspace folder found');
      }

      const { stdout } = await execAsync('git diff --staged', {
        cwd: workspaceFolder.uri.fsPath
      });

      if (!stdout.trim()) {
        throw new Error('No staged changes found. Please stage your changes first.');
      }

      return stdout;
    } catch (error) {
      throw new Error(`Failed to get git diff: ${error}`);
    }
  }

  async getStagedFiles(): Promise<string[]> {
    try {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        throw new Error('No workspace folder found');
      }

      const { stdout } = await execAsync('git diff --staged --name-only', {
        cwd: workspaceFolder.uri.fsPath
      });

      return stdout.trim().split('\n').filter(file => file.length > 0);
    } catch (error) {
      throw new Error(`Failed to get staged files: ${error}`);
    }
  }

  async getStagedChanges(): Promise<GitChange[]> {
    try {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        throw new Error('No workspace folder found');
      }

      const { stdout } = await execAsync('git diff --staged --numstat', {
        cwd: workspaceFolder.uri.fsPath
      });

      const changes: GitChange[] = [];
      const lines = stdout.trim().split('\n').filter(line => line.length > 0);

      for (const line of lines) {
        const parts = line.split('\t');
        if (parts.length >= 3) {
          const additions = parseInt(parts[0]) || 0;
          const deletions = parseInt(parts[1]) || 0;
          const file = parts[2];

          const status = await this.getFileStatus(file);

          changes.push({
            file,
            status,
            additions,
            deletions
          });
        }
      }

      return changes;
    } catch (error) {
      throw new Error(`Failed to get staged changes: ${error}`);
    }
  }

  private async getFileStatus(file: string): Promise<'A' | 'M' | 'D' | 'R' | 'C'> {
    try {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        return 'M';
      }

      const { stdout } = await execAsync(`git status --porcelain "${file}"`, {
        cwd: workspaceFolder.uri.fsPath
      });

      const statusCode = stdout.trim()[0];
      switch (statusCode) {
        case 'A': return 'A';
        case 'M': return 'M';
        case 'D': return 'D';
        case 'R': return 'R';
        case 'C': return 'C';
        default: return 'M';
      }
    } catch (error) {
      return 'M';
    }
  }

  async isGitRepository(): Promise<boolean> {
    try {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        return false;
      }

      await execAsync('git rev-parse --git-dir', {
        cwd: workspaceFolder.uri.fsPath
      });

      return true;
    } catch (error) {
      return false;
    }
  }

  async hasStagedChanges(): Promise<boolean> {
    try {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        return false;
      }

      const { stdout } = await execAsync('git diff --staged --name-only', {
        cwd: workspaceFolder.uri.fsPath
      });

      return stdout.trim().length > 0;
    } catch (error) {
      return false;
    }
  }

  async getCurrentBranch(): Promise<string> {
    try {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        return 'main';
      }

      const { stdout } = await execAsync('git rev-parse --abbrev-ref HEAD', {
        cwd: workspaceFolder.uri.fsPath
      });

      return stdout.trim();
    } catch (error) {
      return 'main';
    }
  }

  async getRecentCommits(count: number = 5): Promise<string[]> {
    try {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        return [];
      }

      const { stdout } = await execAsync(`git log --oneline -${count}`, {
        cwd: workspaceFolder.uri.fsPath
      });

      return stdout.trim().split('\n').filter(line => line.length > 0);
    } catch (error) {
      return [];
    }
  }
}
