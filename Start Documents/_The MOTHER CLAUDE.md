# Claude Memory - Authentication Services

## Available Authenticated Services

This machine has the following services authenticated and ready to use:

1. **GitHub** - SSH key configured
2. **Vercel** - Logged in as `vanmoose`
3. **Supabase** - API token configured
4. **DigitalOcean** - Authenticated with `jaspervanmoose@gmail.com`
5. **Amazon SES** - AWS profile `bedrock-ses` configured in region `us-east-1`
6. **Stripe** - Logged in as Van Moose (account: `acct_1RUS3wCOq4Mlin6f`)
7. **Upstash** - Logged in as `jaspermoose@gmail.com`

All CLIs are installed and authenticated. The authentication persists across restarts.

## Usage Notes

- For AWS/SES commands, use: `aws ses [command] --profile bedrock-ses`
- For Stripe commands, use: `stripe [command]` (defaults to test mode, add `--live` for production)
- For Upstash commands, use: `upstash [command]`
- Stripe authentication expires after 90 days (current expiry: 2025-09-30)
- All other CLIs can be used directly without additional authentication

## Core Principles

KISS (Keep It Simple, Stupid): Simplicity should be a key goal in design. Choose straightforward solutions over complex ones whenever possible. Simple solutions are easier to understand, maintain, and debug.

YAGNI (You Aren't Gonna Need It): Avoid building functionality on speculation. Implement features only when they are needed, not when you anticipate they might be useful in the future.

Dependency Inversion: High-level modules should not depend on low-level modules. Both should depend on abstractions. This principle enables flexibility and testability.

Open/Closed Principle: Software entities should be open for extension but closed for modification. Design your systems so that new functionality can be added with minimal changes to existing code.

## 🧱 Code Structure & Modularity
- **Never create a file longer than 500 lines of code.** If a file approaches this limit, refactor by splitting it into modules or helper files.
- **Functions should be short and focused sub 50 lines of code** and have a single responsibility.
- **Classes should be short and focused sub 50 lines of code** and have a single responsibility.
- **Organize code into clearly separated modules**, grouped by feature or responsibility.

## Architecture

### Repository Structure (Monorepo Preferred)
Use a single repository with modular folder organization:

```
project-name/
├── frontend/         # Vercel deployment
├── backend/          # DigitalOcean deployment  
├── mobile/           # React Native/Flutter
├── docs/             # Documentation
├── shared/           # Shared utilities, types, constants
├── scripts/          # Build and deployment scripts
├── .github/          # GitHub Actions workflows
├── README.md         # Project overview
├── CLAUDE.md         # Living development journal
└── .env.example      # Environment template
```

### Python Project Structure
Strict vertical slice architecture with tests that live next to the code they test:

```
src/project/
    __init__.py
    main.py
    tests/test_main.py
    conftest.py
    module_one/ (eg. database, core, auth)
        __init__.py
        module_one.py
        tests/
            test_module_one.py
    module_two/ (eg. api, ui, cli)
        __init__.py
        module_two.py
        tests/
            test_module_two.py
    features/ (eg. business logic, tools, etc.)
        feature_one/
            __init__.py
            feature.py
            tests/
                test_feature.py
```

### Monorepo Benefits
- **Unified versioning**: Single source of truth for releases
- **Atomic commits**: Related changes across stack stay together
- **Streamlined CI/CD**: One pipeline manages all deployments
- **Seamless refactoring**: Easy code movement between components
- **Simplified dependencies**: Shared packages and utilities

## Testing

**Always create Pytest unit tests for new features**
(functions, classes, routes, etc)
Tests are always created in the same directory as the code they test in a tests/ directory. Create the tests directory if it doesn't exist.

**After updating any logic**, check whether existing unit tests need to be updated. If so, do it following the implementation.

Always test individual functions and classes.

## Style & Conventions

### 📎 Style & Conventions
- **Use Python** as the primary language.
- **Follow PEP8**, always use type hints, and format with `ruff`.
- **Use `pydanticv2` for data validation**.
- **ALWAYS use classes, data types, data models, for typesafety and verifiability**
- **ALWAYS use docstrings for every function** using the Google style:
  ```python
  def example():
      """
      Brief summary.

      Args:
          param1 (type): Description.

      Returns:
          type: Description.
          
      Raises:
          Exception: Description.
      """
  ```

## 🛠️ Environment Setup

```bash
# Create and activate virtual environment with uv
uv venv
source .venv/bin/activate  # On Unix/macOS
# .venv\Scripts\activate  # On Windows

# Install dependencies
uv sync

# Install package in development mode
uv pip install -e .
```

## 🛠️ Development Commands

```bash
# Run all tests
uv run pytest

# Run specific tests
uv run pytest concept_library/full_review_loop/tests/ -v

# Format code
uv run ruff format .

# Run linter
uv run ruff check .

# Run type checker  
uv run mypy .
```

## 🛠️ UV Package Management

This project uses UV for Python package management. Key commands include:

```bash
# Create virtual environment
uv venv

# Install dependencies from pyproject.toml
uv sync

# Install a specific package
uv add requests

# Remove a package
uv remove requests

# Run a Python script or command
uv run python script.py
uv run pytest

# Install editable packages
uv pip install -e .
```

When running scripts or tools, always use `uv run` to ensure proper virtual environment activation:

```bash
# Preferred way to run commands
uv run pytest
uv run black .

# Running tools without installing
uvx black .
uvx ruff check .
```

## 🛠️ BRANCHING STRATEGY

This repository follows a develop → main branching strategy, where:

- `main` is the production branch containing stable releases
- `develop` is the integration branch where features are merged
- Feature branches are created from `develop` for work in progress


When creating branches, follow these naming conventions:

- Feature branches: `feature/descriptive-name`
- Bug fix branches: `fix/issue-description`
- Documentation branches: `docs/what-is-changing`
- Refactoring branches: `refactor/what-is-changing`

## 🏗️ Van Moose Technology Stack

### Core Infrastructure
- **Frontend**: Vercel for all frontend deployments
- **Backend**: DigitalOcean for backend hosting and APIs
- **Database & Auth**: Supabase for real-time database, authentication, and storage
- **Version Control**: GitHub for all code and documentation
- **Payments**: Stripe for payment processing
- **Caching/Queues**: Upstash for Redis and message queuing

### Project Management
- Use GitHub Issues and Projects for task tracking
- Maintain semantic versioning
- Follow conventional commits specification
- Enable CI/CD with preview environments for PRs


## Behavioural Guidelines

- Always use `uv` for package management.
- Always use `ruff` for linting.

- *** NEVER ASSUME OR GUESS ***
- When in doubt, ask for clarification or ask for help. more often than not youcan do websearch to find relevant examples of check ai_docs/ for examples that the user have added. 

- **Always confirm file paths & module names** exist before using them.

- **Comment non-obvious code** and ensure everything is understandable to a mid-level developer.
- When writing complex logic, **add an inline `# Reason:` comment** explaining the why, not just the what.

- **KEEP README.md UPDATED**
- Whenever you make changes to the codebase, update the README.md file to reflect the changes. Especially if you add configuration changes or new features.

- **ALWAYS keep CLAUDE.md UPDATED**
- Use CLAUDE.md as a living development journal:
  - Current state and progress
  - Key decisions and rationale
  - Comprehensive TODO list
  - Blockers and solutions
  - Important types and patterns
  - New dependencies

### Documentation Requirements
Every project must include:
- **README.md**: Setup instructions, deployment guide, troubleshooting
- **CLAUDE.md**: Living development journal (as described above)
- **CONTRIBUTING.md**: For projects accepting contributions
- **.env.example**: Template for required environment variables

## IMPORTANT TYPES & PATTERNS

### 
> add important types and patterns here

## 🚨 Error Handling & Logging

- **Always handle errors explicitly** - never use bare except clauses
- **Log errors with context** - include relevant data that helps debugging
- **Use structured logging** with appropriate levels (DEBUG, INFO, WARNING, ERROR, CRITICAL)
- **Create custom exceptions** for domain-specific errors
- **Fail fast** - validate inputs early and provide clear error messages

```python
# Good error handling example
try:
    result = process_data(input_data)
except ValidationError as e:
    logger.error(f"Validation failed for input: {input_data}", exc_info=True)
    raise ProcessingError(f"Invalid input: {e}") from e
```

## 🔒 Security Best Practices

- **Never hardcode secrets** - use environment variables or secret management services
- **Validate all inputs** - especially from external sources
- **Use parameterized queries** for database operations
- **Implement rate limiting** for APIs
- **Keep dependencies updated** - regularly check for security vulnerabilities
- **Use HTTPS everywhere** - never transmit sensitive data over unencrypted connections
- **Implement proper authentication & authorization**
- **Store secrets using GitHub Secrets** and secure environment variables
- **Enable 2FA** on all GitHub accounts
- **Set repositories to private by default** - only make public with explicit approval
- **Do not apply open-source licenses** without explicit approval

## 📊 Performance Guidelines

- **Profile before optimizing** - measure first, optimize second
- **Use caching strategically** - but invalidate properly
- **Implement pagination** for large datasets
- **Use async/await** for I/O-bound operations
- **Batch database operations** when possible
- **Set appropriate timeouts** for external service calls

## 🚀 Deployment Checklist

Before deploying to production:
- [ ] All tests pass
- [ ] Code review completed
- [ ] Documentation updated (README.md and CLAUDE.md)
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] Performance tested under load
- [ ] Security scan completed
- [ ] Rollback plan documented
- [ ] Monitoring alerts configured
- [ ] Error tracking enabled (Sentry or similar)
- [ ] Preview deployment verified
- [ ] UptimeRobot or monitoring configured
- [ ] Supabase dashboards checked for metrics

## 📝 Documentation Standards

- **README.md must include**:
  - Project purpose and overview
  - Quick start guide
  - Installation instructions
  - Configuration options
  - API documentation (if applicable)
  - Troubleshooting guide
  - Contributing guidelines

- **Code documentation**:
  - Every public API must have docstrings
  - Complex algorithms need explanatory comments
  - Configuration files need inline documentation
  - Include examples in docstrings

## 🔄 Configuration Management

- **Use environment variables** for all configuration
- **Provide sensible defaults** with clear override mechanisms
- **Document all configuration options** in README
- **Use .env.example** files to show required variables
- **Validate configuration on startup**
- **Never commit .env files** to version control

## 📦 Dependency Management

- **Pin exact versions** in production (use ==)
- **Use version ranges** in libraries (use >=, <)
- **Regularly update dependencies** - set up automated checks
- **Document why** each dependency is needed
- **Minimize dependencies** - prefer standard library when possible
- **Audit dependencies** for security vulnerabilities
- **Enable Dependabot** for automated dependency updates
- **Use Prettier and ESLint** across all JavaScript/TypeScript codebases
- **Configure pre-commit hooks** for code quality checks

## 🎯 API Design Standards

- **Follow RESTful principles** where appropriate
- **Version your APIs** from the start (/api/v1/)
- **Use consistent naming** (snake_case for Python APIs)
- **Implement proper HTTP status codes**
- **Provide clear error messages** with error codes
- **Document with OpenAPI/Swagger**
- **Implement request/response validation**

## 🔍 Monitoring & Observability

- **Log all important events** but avoid logging sensitive data
- **Implement health checks** (/health endpoint)
- **Use structured logging** for easier parsing
- **Set up alerts** for critical errors
- **Monitor key metrics**: response time, error rate, throughput
- **Implement distributed tracing** for microservices
- **Keep logs for debugging** but rotate them appropriately

## 🧪 Advanced Testing & Automation

For projects requiring comprehensive E2E testing, visual regression testing, and production monitoring:

- **See**: `/Users/jasper/Documents/Poetsen/Van Moose Projects/_Tools for All Windsurf with Claude Code Projects.txt`
- **Includes**: Playwright setup, browser automation, visual analysis, deployment diagnostics
- **Use when**: Building production applications with complex UI/UX requirements
- **Key features**:
  - Automated E2E testing with Playwright
  - Visual regression testing
  - Production monitoring and diagnostics
  - Browser automation for dashboard access
  - Self-healing deployment scripts

## 🤖 Agent-First Development

For building applications optimized for AI agents and the future of software:

- **See**: `/Users/jasper/Documents/Poetsen/Van Moose Projects/_agent-first-development-guide.md`
- **Includes**: Agent-ready architecture, semantic APIs, MCP implementation, modern UI/UX standards
- **Use when**: Building new applications that need to be AI-ready from day one
- **Key concepts**:
  - Data first, UI last architecture
  - Semantic everything (APIs, schemas, documentation)
  - Tool-first development patterns
  - Agent collaboration and orchestration
  - Modern stack: GitHub + Vercel + DigitalOcean + Supabase
- **Critical standards**:
  - llms.txt standard for AI navigation
  - Model Context Protocol (MCP) implementation
  - Usage-based and outcome-based pricing models

## 📚 Additional References

- **Van Moose Standards**: `/Users/jasper/Documents/Poetsen/Van Moose Projects/_van_moose_best_practices.txt`
  - Specific technology stack preferences
  - Monorepo vs multi-repo decisions
  - Team-specific conventions