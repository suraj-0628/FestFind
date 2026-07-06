# Security Rules

## Must Always
- Never hardcode secrets, API keys, tokens, or credentials
- Use environment variables for all sensitive configuration
- Validate all user inputs at system boundaries
- Sanitize HTML output to prevent XSS attacks
- Use parameterized queries to prevent SQL injection
- Implement CSRF protection on all forms
- Rate limit all API endpoints
- Verify authentication/authorization before data access

## Must Never
- Commit `.env` files or secrets to version control
- Expose sensitive data in error messages
- Trust external data without validation
- Skip security checks for "quick fixes"

## If Security Issue Found
1. STOP working on current task
2. Assess severity (CRITICAL/HIGH/MEDIUM/LOW)
3. Fix CRITICAL issues immediately
4. Rotate any exposed secrets
5. Review codebase for similar patterns
