# Security Policy

## Supported Versions

Use this section to tell people about which versions of your project are currently being supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security vulnerability in Zen kAI, please follow these steps:

### 1. **DO NOT** create a public GitHub issue

Security vulnerabilities should be reported privately to prevent potential exploitation.

### 2. Email the security team

Send an email to security@zenkai.app with the following information:

- **Subject**: `[SECURITY] Vulnerability Report - Zen kAI`
- **Description**: Detailed description of the vulnerability
- **Steps to reproduce**: Clear steps to reproduce the issue
- **Impact**: Potential impact of the vulnerability
- **Suggested fix**: If you have a suggested fix (optional)

### 3. What to expect

- You will receive an acknowledgment within 48 hours
- We will investigate and provide updates
- We will work with you to coordinate disclosure
- We will credit you in the security advisory (if desired)

### 4. Responsible disclosure timeline

- **Initial response**: Within 48 hours
- **Investigation**: 1-2 weeks
- **Fix development**: 1-4 weeks (depending on complexity)
- **Public disclosure**: After fix is available

## Security Best Practices

### For Contributors

- Never commit sensitive information (API keys, passwords, etc.)
- Use environment variables for configuration
- Validate all user inputs
- Follow OWASP security guidelines
- Keep dependencies updated

### For Users

- Use strong, unique passwords
- Enable two-factor authentication when available
- Keep your app updated to the latest version
- Report suspicious activity immediately
- Use secure networks when possible

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting on API endpoints
- CORS protection
- Environment variable configuration

## Updates

Security updates will be released as patch versions (e.g., 1.0.1, 1.0.2). Users are encouraged to update promptly when security patches are available.

## Contact

For security-related questions or concerns:

- Email: security@zenkai.app
- GitHub: Create a private issue with the `[SECURITY]` prefix

Thank you for helping keep Zen kAI secure! 🔒 