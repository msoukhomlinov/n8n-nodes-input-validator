# Contributing to n8n-nodes-input-validator

Thank you for your interest in contributing to n8n-nodes-input-validator! This guide will help you set up your development environment and test your changes.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Development Workflow](#development-workflow)
- [Testing Your Changes](#testing-your-changes)
- [Building the Project](#building-the-project)
- [Code Style](#code-style)
- [Submitting Changes](#submitting-changes)

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18.x or higher (LTS recommended)
  ```bash
  node --version  # Should be v18.x or higher
  ```

- **npm**: Version 9.x or higher (comes with Node.js)
  ```bash
  npm --version
  ```

- **n8n**: Installed globally
  ```bash
  npm install -g n8n
  ```

## Environment Setup

### 1. Fork and Clone the Repository

```bash
# Fork the repository on GitHub first, then clone your fork
git clone https://github.com/YOUR_USERNAME/n8n-nodes-input-validator.git
cd n8n-nodes-input-validator
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build the Project

```bash
npm run build
```

This command:
1. Cleans the `dist/` directory
2. Compiles TypeScript to JavaScript
3. Processes SVG icons with Gulp
4. Outputs compiled files to `dist/nodes/ValidatorNode/`

### 4. Link to n8n (Development Mode)

Choose one of the following methods:

#### Method A: npm link (Recommended)

This creates a symlink so n8n can find your local development version:

```bash
# Step 1: Create a global link from your project
npm link

# Step 2: Navigate to n8n's custom nodes directory
cd ~/.n8n/nodes

# Step 3: Link your custom node
npm link n8n-nodes-input-validator

# Step 4: Verify the link
ls -la  # You should see a symlink to your project
```

#### Method B: Environment Variable

Set the `N8N_CUSTOM_EXTENSIONS` environment variable:

```bash
export N8N_CUSTOM_EXTENSIONS="/absolute/path/to/n8n-nodes-input-validator"
n8n start
```

Or add it to your shell profile (`~/.zshrc` or `~/.bashrc`):

```bash
echo 'export N8N_CUSTOM_EXTENSIONS="/absolute/path/to/n8n-nodes-input-validator"' >> ~/.zshrc
source ~/.zshrc
```

#### Method C: Docker (Production-like Testing)

Create a `docker-compose.yml` in your project root:

```yaml
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    container_name: n8n-dev
    ports:
      - "5678:5678"
    environment:
      - N8N_CUSTOM_EXTENSIONS=/data/custom-nodes
    volumes:
      - ./dist:/data/custom-nodes/n8n-nodes-input-validator:ro
      - n8n_data:/home/node/.n8n
    restart: unless-stopped

volumes:
  n8n_data:
```

Then run:
```bash
docker-compose up -d
```

---

## Development Workflow

### Watch Mode (Hot Reload)

For active development, use watch mode to automatically recompile on changes:

```bash
# Terminal 1: Start watch mode
npm run dev

# Terminal 2: Start n8n
n8n start
```

The `npm run dev` command runs TypeScript in watch mode, recompiling files as you save them.

### Making Changes

1. **Edit source files** in `nodes/ValidatorNode/`
2. **Save your changes** (watch mode will recompile automatically)
3. **Restart n8n** or hard refresh your browser (Cmd+Shift+R / Ctrl+Shift+F5)
4. **Test in n8n UI** at `http://localhost:5678`

## Testing Your Changes

### 1. Start n8n

```bash
# With npm link method
n8n start

# With environment variable
N8N_CUSTOM_EXTENSIONS="/path/to/n8n-nodes-input-validator" n8n start

# With Docker
docker-compose up
```

### 2. Verify Node Installation

1. Open n8n at `http://localhost:5678`
2. Create a new workflow
3. Click the `+` button to add a node
4. Search for "Input Validator" or "Validator"
5. Your node should appear with a validation icon ✓

### 3. Create Test Workflows

#### Test 1: Basic Email Validation

```
[Manual Trigger] → [Input Validator] → [Display]
```

**Input Validator Configuration:**
- Validation Name: `email`
- Validation Type: `string`
- String Data: `test@example.com`
- String Format: `email`
- Required: ✓

**Expected Output:**
```json
{
  "email": "test@example.com",
  "isValid": true
}
```

#### Test 2: Number Range Validation

**Input Validator Configuration:**
- Validation Name: `age`
- Validation Type: `number`
- Number Data: `25`
- Number Validation Type: `Range`
- Min Value: `18`
- Max Value: `100`

**Expected Output:**
```json
{
  "age": 25,
  "isValid": true
}
```

Test with `age: 150` → should fail validation.

#### Test 3: Phone Number Validation & Rewrite

**Node Settings:**
- Enable Phone Rewrite: ✓

**Input Validator Configuration:**
- Validation Name: `mobile`
- Validation Type: `string`
- String Data: `0412 345 678`
- String Format: `Phone Number`
- Phone Region: `AU`
- Validation Mode: `Valid (Strict)`
- Expected Type(s): `MOBILE`
- Enable Phone Rewrite: ✓
- Rewrite Format: `E.164`

**Expected Output:**
```json
{
  "mobile": "0412 345 678",
  "mobileFormatted": "+61412345678",
  "isValid": true,
  "phoneRewrites": [
    {
      "name": "mobile",
      "original": "0412 345 678",
      "formatted": "+61412345678",
      "format": "E164",
      "region": "AU",
      "type": "MOBILE",
      "valid": true
    }
  ]
}
```

#### Test 4: Error Handling Modes

Test each "On Invalid" option with an invalid email (`not-an-email`):

- **Continue**: Item passes through with `isValid: false` and errors array
- **Skip Field**: Email field removed from output
- **Skip Item**: Item not in output at all
- **Set to Null**: Email field set to `null`
- **Set to Empty**: Email field set to `""`
- **Throw Error**: Workflow execution stops with error message

#### Test 5: Multiple Validations

Add multiple fields to one Input Validator node:
1. Email validation (required)
2. Age number (range 18-100)
3. Status enum (pending, approved, rejected)
4. Mobile phone with rewrite

### 4. Debugging

#### Enable Debug Logging

```bash
export N8N_LOG_LEVEL=debug
n8n start
```

#### Add Console Logs

In your TypeScript code:

```typescript
console.log('[InputValidator] Validating field:', field.name);
console.log('[InputValidator] Field value:', field.stringData);
console.log('[InputValidator] Validation result:', result);
```

After adding logs:
1. Rebuild: `npm run build`
2. Restart n8n
3. Check terminal output when executing workflows

#### Check n8n Logs

```bash
# View logs in real-time
tail -f ~/.n8n/logs/n8n.log

# Search for errors
grep -i error ~/.n8n/logs/n8n.log
```

#### Common Issues

| Issue | Solution |
|-------|----------|
| Node not appearing in n8n | Verify `npm link` or check `N8N_CUSTOM_EXTENSIONS` path |
| Changes not reflecting | Rebuild (`npm run build`), restart n8n, hard refresh browser |
| TypeScript errors | Run `npm run lint` to check syntax |
| Import errors | Ensure `n8n-workflow` peer dependency is available |
| Build fails | Delete `node_modules/` and `dist/`, run `npm install && npm run build` |

---

## Building the Project

### Available Scripts

```bash
# Clean build directory
npm run clean

# Build for production (includes prebuild clean)
npm run build

# Watch mode for development
npm run dev

# Lint code
npm run lint

# Fix linting issues automatically
npm run lint:fix
```

### Build Output

After running `npm run build`, verify these files exist:

```bash
ls -la dist/nodes/ValidatorNode/
# Should show:
# - ValidatorNode.node.js (compiled main file)
# - ValidatorNode.node.d.ts (TypeScript declarations)
# - validation.svg (node icon)
# - Other .js and .d.ts files
```

---

## Code Style

This project uses **ESLint** and **Prettier** for code quality:

### Before Committing

```bash
# Check for linting errors
npm run lint

# Auto-fix linting issues
npm run lint:fix
```

### Coding Conventions

- **TypeScript**: All code must be properly typed
- **Naming**: Use camelCase for variables, PascalCase for types/interfaces
- **Formatting**: 2 spaces indentation, single quotes for strings
- **Comments**: Add JSDoc comments for public functions
- **Exports**: Use named exports, not default exports

### Example Code Structure

```typescript
/**
 * Validates a phone number using google-libphonenumber
 * @param value - The phone number string to validate
 * @param field - The input field configuration
 * @returns Validation result with error message if invalid
 */
export function validatePhoneNumber(
  value: string,
  field: InputField
): ValidationResult {
  // Implementation
}
```

---

## Submitting Changes

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 2. Make Your Changes

- Follow the code style guidelines
- Add/update tests if applicable
- Update documentation if needed

### 3. Test Thoroughly

- Build successfully: `npm run build`
- No lint errors: `npm run lint`
- Manual testing in n8n with various scenarios
- Test all validation types you modified

### 4. Commit Your Changes

```bash
git add .
git commit -m "feat: add new validation type for X"
# or
git commit -m "fix: resolve phone validation issue with Y"
```

Use conventional commit messages:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation only
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

### 5. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub with:
- Clear description of changes
- Screenshots/examples if UI changes
- Test results
- Any breaking changes noted

---

## Getting Help

- **Issues**: [GitHub Issues](https://github.com/msoukhomlinov/n8n-nodes-input-validator/issues)
- **n8n Community**: [n8n Community Forum](https://community.n8n.io/)
- **n8n Docs**: [Creating Custom Nodes](https://docs.n8n.io/integrations/creating-nodes/)

---

## Development Tips

### Quick Test Cycle

```bash
# Terminal 1: Watch mode
npm run dev

# Terminal 2: n8n with debug logging
N8N_LOG_LEVEL=debug n8n start

# Make changes → Auto-rebuild → Restart n8n → Test
```

### Reset Everything

If you encounter persistent issues:

```bash
# Clean everything
npm run clean
rm -rf node_modules package-lock.json

# Fresh install
npm install
npm run build

# Re-link to n8n
npm link
cd ~/.n8n/nodes
npm link n8n-nodes-input-validator
```

### Testing Different n8n Versions

```bash
# Test with specific n8n version
npm install -g n8n@1.x.x
n8n start
```

---

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT License).

---

Thank you for contributing! 🎉

