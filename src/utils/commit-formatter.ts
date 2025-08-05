import { CommitFormatRules } from '../types';

export class CommitFormatter {
  private static readonly EMOJI_MAP: Record<string, string> = {
    'feat': '✨',
    'fix': '🐛',
    'refactor': '♻️',
    'build': '📦',
    'perf': '🚀',
    'docs': '📝',
    'test': '✅',
    'style': '💄',
    'chore': '🔥',
    'deps': '⬆️'
  };

  private static readonly VALID_TYPES = [
    'feat', 'fix', 'refactor', 'build', 'perf', 'docs', 'test', 'style', 'chore', 'deps'
  ];

  private static readonly VALID_TAGS = [
    'FE', 'BE', 'API', 'DB', 'DOCS', 'CI', 'TEST'
  ];

  static getFormatRules(): CommitFormatRules {
    return {
      emojiMap: this.EMOJI_MAP,
      typeValidation: this.VALID_TYPES,
      tagValidation: this.VALID_TAGS,
      maxLength: 60
    };
  }

  static createPrompt(gitDiff: string, customPrompt?: string): string {
    const basePrompt = `Generate a commit message using this STRICT format:

<emoji> <type>(<scope>) [TAG]: <short message>

RULES:
- <emoji>: Use EXACT emoji from this mapping:
  ✨ for feat (new features)
  🐛 for fix (bug fixes)
  ♻️ for refactor (code cleanup)
  📦 for build (build system)
  🚀 for perf (performance improvements)
  📝 for docs (documentation)
  ✅ for test (tests)
  💄 for style (code formatting)
  🔥 for chore (removals)
  ⬆️ for deps (dependency updates)

- <type>: MUST be one of: feat, fix, refactor, build, perf, docs, test, style, chore, deps
- (<scope>): REQUIRED lowercase module/component name (e.g. auth, payment, user)
- [TAG]: MUST be one of: [FE], [BE], [API], [DB], [DOCS], [CI], [TEST]
- <short message>: Brief, imperative, max 60 characters, English only

EXAMPLES:
- ✨ feat(auth) [FE]: add Google OAuth login
- 🐛 fix(user) [API]: fix null response from endpoint
- ♻️ refactor(payment) [BE]: clean up retry logic
- ✅ test(button) [TEST]: add unit test for submit handler

IMPORTANT: Return ONLY the single-line commit message. No explanations or additional text.

${customPrompt ? `\nAdditional instructions: ${customPrompt}\n` : ''}

Git diff to analyze:
${gitDiff}`;

    return basePrompt;
  }

  static validateFormat(message: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check basic format: <emoji> <type>(<scope>) [TAG]: <message>
    const formatRegex = /^(.)\s+(\w+)\(([^)]+)\)\s+\[([^\]]+)\]:\s+(.+)$/;
    const match = message.match(formatRegex);

    if (!match) {
      errors.push('Message does not match required format: <emoji> <type>(<scope>) [TAG]: <message>');
      return { isValid: false, errors };
    }

    const [, emoji, type, scope, tag, shortMessage] = match;

    // Validate emoji
    const expectedEmoji = this.EMOJI_MAP[type];
    if (emoji !== expectedEmoji) {
      errors.push(`Wrong emoji. Expected "${expectedEmoji}" for type "${type}", got "${emoji}"`);
    }

    // Validate type
    if (!this.VALID_TYPES.includes(type)) {
      errors.push(`Invalid type "${type}". Must be one of: ${this.VALID_TYPES.join(', ')}`);
    }

    // Validate scope (should be lowercase)
    if (scope !== scope.toLowerCase()) {
      errors.push(`Scope "${scope}" must be lowercase`);
    }

    // Validate tag
    if (!this.VALID_TAGS.includes(tag)) {
      errors.push(`Invalid tag "[${tag}]". Must be one of: ${this.VALID_TAGS.map(t => `[${t}]`).join(', ')}`);
    }

    // Validate message length
    if (shortMessage.length > 60) {
      errors.push(`Message too long (${shortMessage.length} chars). Maximum 60 characters.`);
    }

    return { isValid: errors.length === 0, errors };
  }

  static extractScope(files: string[]): string {
    const commonPaths = files.map(file => {
      const parts = file.split('/');
      return parts.length > 1 ? parts[0] : 'root';
    });

    const pathCounts = commonPaths.reduce((acc, path) => {
      acc[path] = (acc[path] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostCommon = Object.entries(pathCounts)
      .sort(([,a], [,b]) => b - a)[0];

    return mostCommon ? mostCommon[0].toLowerCase() : 'general';
  }

  static determineTag(files: string[]): string {
    const extensions = files.map(file => {
      const ext = file.split('.').pop()?.toLowerCase();
      return ext || '';
    });

    if (extensions.some(ext => ['ts', 'js', 'tsx', 'jsx', 'vue', 'svelte'].includes(ext))) {
      return 'FE';
    }
    if (extensions.some(ext => ['py', 'java', 'go', 'rb', 'php', 'cs'].includes(ext))) {
      return 'BE';
    }
    if (extensions.some(ext => ['sql', 'db', 'migration'].includes(ext))) {
      return 'DB';
    }
    if (extensions.some(ext => ['md', 'txt', 'doc'].includes(ext))) {
      return 'DOCS';
    }
    if (extensions.some(ext => ['yml', 'yaml', 'json', 'dockerfile'].includes(ext))) {
      return 'CI';
    }
    if (files.some(file => file.includes('test') || file.includes('spec'))) {
      return 'TEST';
    }

    return 'FE';
  }
}
