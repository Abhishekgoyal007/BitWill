# Contributing to BitWill

First off, thank you for considering contributing to BitWill! It's people like you that make BitWill such a great tool.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct: be respectful, inclusive, and constructive.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include:

- **Clear title** describing the issue
- **Steps to reproduce** the behavior
- **Expected behavior**
- **Actual behavior**
- **Screenshots** if applicable
- **Environment** (OS, browser, Node version)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Clear title** describing the suggestion
- **Detailed description** of the proposed functionality
- **Why this would be useful** to most users
- **Possible implementation** approach if you have ideas

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. Ensure the test suite passes
4. Make sure your code lints
5. Issue the pull request

## Development Setup

```bash
# Clone your fork
git clone https://github.com/yourusername/bitwill.git
cd bitwill

# Install dependencies
npm install

# Start development server
npm run dev

# Run linting
npm run lint

# Build for production
npm run build
```

## Project Structure

```
bitwill/
├── src/
│   ├── components/     # Reusable UI components
│   ├── context/        # React context providers
│   ├── pages/          # Page components
│   ├── services/       # External service integrations
│   ├── types/          # TypeScript type definitions
│   └── index.css       # Global styles
├── public/             # Static assets
└── README.md           # Project documentation
```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define interfaces for all data structures
- Use `import type` for type-only imports

### React

- Use functional components with hooks
- Follow the single responsibility principle
- Keep components focused and reusable

### CSS

- Use CSS variables for theming
- Follow BEM-like naming convention
- Keep styles modular

### Commits

- Use clear, descriptive commit messages
- Reference issues when applicable
- Keep commits atomic and focused

## Charms Protocol Integration

When working on Charms-related code:

1. Read the [Charms Documentation](https://docs.charms.dev)
2. Test on Bitcoin testnet first
3. Document any new spell structures
4. Ensure backwards compatibility

## Questions?

Feel free to open an issue with your question or reach out to the maintainers.

---

Thank you for contributing to BitWill! 🙏
