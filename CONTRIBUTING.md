# Contributing to n8n-nodes-input-validator

Thank you for your interest in contributing to n8n-nodes-input-validator! This guide will help you set up your development environment and test your changes.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 22.x or higher (LTS recommended)
  ```bash
  node --version  # Should be v22.x or higher
  ```

- **npm**: Version 10.x or higher (comes with Node.js)
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

## Development Workflow

### Watch Mode (Hot Reload)

For active development, use watch mode to automatically recompile on changes:

```bash
# Terminal 1: Start watch mode
npm run dev

# Terminal 2: Start n8n
n8n start
```

1. Open n8n at `http://localhost:5678`
2. Create a new workflow
3. Click the `+` button to add a node
4. Search for "Input Validator" or "Validator"
5. Your node should appear

### Making Changes

1. **Edit source files** in `nodes/ValidatorNode/`
2. **Save your changes** (watch mode will recompile automatically)
3. **Restart n8n** then **refresh your browser** (Cmd+R / Ctrl+F5)
4. **Test in n8n UI** at `http://localhost:5678`

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT License).

Thank you for contributing! 🎉

