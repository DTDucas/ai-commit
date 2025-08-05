# AI Commit Generator

Generate professional commit messages using AI (Google Gemini or AWS Bedrock) directly in VSCode.

**Author**: [Duong Tran Quang (DTDucas)](https://github.com/DTDucas)
**Contact**: [baymax.contact@gmail.com](mailto:baymax.contact@gmail.com)

## Features

- 🤖 **Dual AI Support**: Choose between Google Gemini or AWS Bedrock
- ✨ **Smart Analysis**: Analyzes staged git changes to generate appropriate commit messages
- 📝 **Strict Format**: Follows conventional commit format with emojis and tags
- 🎯 **VSCode Integration**: Button in Source Control panel + auto-fill commit input
- ⚙️ **JSON Configuration**: Simple workspace-specific configuration
- 🔄 **Retry Logic**: Automatic retry with exponential backoff
- 🎨 **Format Validation**: Ensures generated messages follow your exact format

## Commit Message Format

The extension generates commits in this strict format:

```
<emoji> <type>(<scope>) [TAG]: <short message>
```

### Examples

- `✨ feat(auth) [FE]: add Google OAuth login`
- `🐛 fix(user) [API]: fix null response from endpoint`
- `♻️ refactor(payment) [BE]: clean up retry logic`
- `✅ test(button) [TEST]: add unit test for submit handler`

### Emoji Mapping

- ✨ `feat` - New features
- 🐛 `fix` - Bug fixes
- ♻️ `refactor` - Code cleanup
- 📦 `build` - Build system
- 🚀 `perf` - Performance improvements
- 📝 `docs` - Documentation
- ✅ `test` - Tests
- 💄 `style` - Code formatting
- 🔥 `chore` - Removals
- ⬆️ `deps` - Dependency updates

### Tags

- `[FE]` - Frontend
- `[BE]` - Backend
- `[API]` - API communication
- `[DB]` - Database
- `[DOCS]` - Documentation
- `[CI]` - CI/CD
- `[TEST]` - Testing

## Installation

1. Install the extension from VSCode Marketplace
2. Create configuration file (see Configuration section)
3. Stage your changes and click the sparkle button in Source Control panel

## Configuration

Create an `ai-commit.json` file in your workspace root or `.vscode/` folder:

```json
{
  "provider": "gemini",
  "apis": {
    "gemini": {
      "apiKey": "your-gemini-api-key-here",
      "model": "gemini-pro"
    },
    "bedrock": {
      "region": "us-east-1",
      "accessKeyId": "your-aws-access-key-id",
      "secretAccessKey": "your-aws-secret-access-key",
      "model": "anthropic.claude-3-sonnet-20240229-v1:0"
    }
  },
  "settings": {
    "autoFill": true,
    "showPreview": false,
    "maxRetries": 3,
    "timeout": 30000
  },
  "customPrompt": "Focus on describing the business impact of changes when possible"
}
```

### Configuration Options

#### Provider Settings

- `provider`: Choose `"gemini"` or `"bedrock"`

#### API Configuration

- **Gemini**: Requires `apiKey` from Google AI Studio
- **Bedrock**: Requires AWS `region`, `accessKeyId`, and `secretAccessKey`

#### Behavior Settings

- `autoFill`: Auto-fill commit message in Source Control (default: `true`)
- `showPreview`: Show preview dialog before filling (default: `false`)
- `maxRetries`: Number of retry attempts (default: `3`)
- `timeout`: Request timeout in milliseconds (default: `30000`)
- `customPrompt`: Additional instructions for the AI (optional)

## Usage

### Method 1: Source Control Button

1. Stage your changes in the Source Control panel
2. Click the sparkle ✨ button in the Source Control title bar
3. The commit message will auto-fill in the input field

### Method 2: Command Palette

1. Stage your changes
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
3. Type "Generate AI Commit" and press Enter

### Method 3: Status Bar

1. Stage your changes
2. Click "✨ AI Commit" in the status bar

## Requirements

- VSCode 1.74.0 or higher
- Git repository
- API key for chosen provider (Gemini or Bedrock)

## Getting API Keys

### Google Gemini

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key to your configuration

### AWS Bedrock

1. Create an AWS account and enable Bedrock service
2. Create IAM user with Bedrock permissions
3. Generate access keys and configure your region

## Supported Models

### Gemini

- `gemini-pro` (default)
- `gemini-pro-vision`

### AWS Bedrock

- `anthropic.claude-3-sonnet-20240229-v1:0` (default)
- `anthropic.claude-3-haiku-20240307-v1:0`
- `amazon.titan-text-express-v1`

## Troubleshooting

### No staged changes error

Make sure you have staged files before generating a commit message.

### API errors

- Check your API keys and credentials
- Verify network connectivity
- Ensure your provider quotas aren't exceeded

### Format validation warnings

The extension validates generated messages against the strict format. Minor issues are allowed but warned.

### Configuration not found

Run the "Open AI Commit Config" command to create a configuration file.

## Development

```bash
# Clone repository
git clone https://github.com/DTDucas/ai-commit
cd ai-commit-generator

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch for changes
npm run watch
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Follow the commit format used by this extension
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Changelog

### 1.0.0

- Initial release
- Support for Google Gemini and AWS Bedrock
- JSON configuration system
- Source Control integration
- Strict commit format validation
