# Contributing to Zen kAI

Thank you for your interest in contributing to Zen kAI! This document provides guidelines for contributing to this project.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please be respectful and inclusive in all interactions.

## How Can I Contribute?

### Reporting Bugs

- Use the GitHub issue tracker
- Include detailed steps to reproduce the bug
- Include your device/OS information
- Include any error messages or logs

### Suggesting Enhancements

- Use the GitHub issue tracker
- Describe the enhancement clearly
- Explain why this enhancement would be useful
- Include mockups or examples if applicable

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests if applicable
5. Update documentation
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- MongoDB
- OpenAI API key

### Local Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see README)
4. Start the backend: `cd zenkai-backend && npm start`
5. Start the frontend: `npm start`

## Coding Standards

### JavaScript/React Native

- Use ES6+ features
- Follow React Native best practices
- Use meaningful variable and function names
- Add comments for complex logic
- Use consistent indentation (2 spaces)

### Backend (Node.js/Express)

- Follow Express.js conventions
- Use async/await for database operations
- Implement proper error handling
- Add input validation
- Use environment variables for configuration

### Git Commit Messages

- Use present tense ("Add feature" not "Added feature")
- Use imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests after the first line

Example:
```
Add user authentication feature

- Implement JWT token generation
- Add login/logout functionality
- Include password hashing with bcrypt

Closes #123
```

## Testing

- Write tests for new features
- Ensure existing tests pass
- Test on both iOS and Android when applicable
- Test edge cases and error conditions

## Documentation

- Update README.md for new features
- Add inline comments for complex code
- Update API documentation if backend changes
- Include setup instructions for new dependencies

## Security

- Never commit sensitive information (API keys, passwords, etc.)
- Use environment variables for configuration
- Validate all user inputs
- Implement proper authentication and authorization
- Follow OWASP security guidelines

## Questions?

If you have questions about contributing, please:

1. Check the existing issues and pull requests
2. Read the README.md file
3. Open a new issue for general questions

Thank you for contributing to Zen kAI! 🧘‍♀️ 