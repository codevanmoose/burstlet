# Contributing to Burstlet

Thank you for your interest in contributing to Burstlet! This document provides guidelines and instructions for contributing to the project.

## Van Moose Development Standards

All contributions must follow Van Moose development standards:

1. **Modular Architecture**: Keep features isolated in modules
2. **File Size Limit**: No file should exceed 500 lines
3. **Type Safety**: Use TypeScript with strict mode
4. **Testing**: Write comprehensive tests for all code
5. **Documentation**: Update relevant documentation

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- PostgreSQL 15+
- Redis
- Git

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/burstlet.git
   cd burstlet
   ```

3. Install dependencies:
   ```bash
   pnpm install
   ```

4. Set up environment variables:
   ```bash
   cp .env.example .env.local
   # Fill in required variables
   ```

5. Run database setup:
   ```bash
   pnpm db:migrate
   pnpm db:seed
   ```

6. Start development:
   ```bash
   pnpm dev
   ```

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-description
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation updates
- `test/` - Test additions/fixes

### 2. Make Changes

Follow the module structure when adding features:

```
backend/src/modules/your-module/
├── types.ts      # TypeScript types and Zod schemas
├── service.ts    # Business logic (< 500 lines)
├── controller.ts # HTTP handlers
├── routes.ts     # Express routes
├── module.ts     # Module initialization
├── index.ts      # Public exports
├── spec.md       # Specification
└── *.test.ts     # Tests
```

### 3. Write Tests

All code must have tests:

```typescript
// service.test.ts
describe('YourService', () => {
  it('should perform expected behavior', async () => {
    // Test implementation
  });
});
```

Run tests:
```bash
pnpm test              # All tests
pnpm test:watch       # Watch mode
pnpm test:coverage    # Coverage report
```

### 4. Code Quality

Before committing:

```bash
pnpm lint             # ESLint
pnpm type-check      # TypeScript
pnpm format          # Prettier
```

### 5. Commit Messages

Use conventional commits:

```
feat: add video thumbnail generation
fix: resolve OAuth callback error
docs: update API documentation
refactor: simplify auth middleware
test: add platform integration tests
```

Format:
```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Tests
- `chore`: Maintenance

### 6. Push Changes

```bash
git push origin feature/your-feature-name
```

### 7. Create Pull Request

1. Go to GitHub
2. Create PR from your branch to `main`
3. Fill out PR template
4. Wait for review

## Code Style Guide

### TypeScript

```typescript
// Use interfaces for object shapes
interface UserData {
  id: string;
  email: string;
  name: string;
}

// Use async/await
async function getUser(id: string): Promise<User> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new NotFoundError('User not found');
  }
  return user;
}

// Use Zod for validation
const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  password: z.string().min(8),
});

// Export types separately
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
```

### Error Handling

```typescript
// Create custom error classes
export class ValidationError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Handle errors properly
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  logger.error('Operation failed', { error, context });
  throw new ServiceError('Operation failed', error);
}
```

### API Design

```typescript
// RESTful endpoints
router.get('/users', controller.listUsers);
router.get('/users/:id', controller.getUser);
router.post('/users', controller.createUser);
router.put('/users/:id', controller.updateUser);
router.delete('/users/:id', controller.deleteUser);

// Consistent responses
res.json({
  success: true,
  data: userData,
  meta: { page: 1, total: 100 }
});
```

## Testing Guidelines

### Unit Tests

Test individual functions/methods:

```typescript
describe('calculatePrice', () => {
  it('should calculate basic plan price', () => {
    const price = calculatePrice('basic', 'monthly');
    expect(price).toBe(9.99);
  });

  it('should apply annual discount', () => {
    const price = calculatePrice('pro', 'annual');
    expect(price).toBe(199.99);
  });
});
```

### Integration Tests

Test API endpoints:

```typescript
describe('POST /api/v1/content', () => {
  it('should create content', async () => {
    const response = await request(app)
      .post('/api/v1/content')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Test Content',
        type: 'video'
      });

    expect(response.status).toBe(201);
    expect(response.body.data).toHaveProperty('id');
  });
});
```

### E2E Tests

Test complete user flows:

```typescript
test('user can create and publish content', async ({ page }) => {
  await page.goto('/dashboard');
  await page.click('text=Create Content');
  await page.fill('[name=title]', 'My Video');
  await page.click('text=Generate');
  await page.waitForSelector('text=Ready to publish');
  await page.click('text=Publish');
  await expect(page).toHaveURL(/\/content\/\w+/);
});
```

## Documentation

### Code Documentation

```typescript
/**
 * Generates a video from a text prompt using AI
 * @param prompt - The text prompt describing the video
 * @param options - Generation options
 * @returns Promise resolving to generation job
 * @throws {ValidationError} If prompt is invalid
 * @throws {QuotaExceededError} If user quota exceeded
 */
async function generateVideo(
  prompt: string,
  options: GenerationOptions
): Promise<GenerationJob> {
  // Implementation
}
```

### API Documentation

Update `docs/API.md` when adding/changing endpoints.

### Module Specification

Update `spec.md` in the module directory.

## Pull Request Guidelines

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass (if applicable)

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] No files exceed 500 lines
```

### Review Process

1. Automated checks must pass
2. Code review by maintainer
3. Testing in staging environment
4. Approval and merge

## Module Development

### Creating a New Module

1. Create module directory:
   ```bash
   mkdir -p backend/src/modules/your-module
   ```

2. Create required files:
   - `types.ts` - Types and schemas
   - `service.ts` - Business logic
   - `controller.ts` - HTTP handlers
   - `routes.ts` - Route definitions
   - `module.ts` - Module setup
   - `index.ts` - Exports
   - `spec.md` - Specification

3. Register module in `backend/src/modules/index.ts`

4. Add to module manifest

### Module Guidelines

- Keep modules focused on a single domain
- Define clear interfaces between modules
- Avoid circular dependencies
- Document all public APIs
- Test module integration points

## Security

### Security Checklist

- [ ] No hardcoded secrets
- [ ] Input validation with Zod
- [ ] SQL injection prevention (use Prisma)
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Rate limiting implemented
- [ ] Authentication required
- [ ] Authorization checked
- [ ] Sensitive data encrypted

### Reporting Security Issues

Email security@vanmoose.com - do NOT create public issues.

## Release Process

1. **Version Bump**: Update version in package.json
2. **Changelog**: Update CHANGELOG.md
3. **Testing**: Full test suite passes
4. **Staging**: Deploy to staging
5. **QA**: Manual testing
6. **Production**: Deploy to production
7. **Tag**: Create git tag

## Getting Help

- Check existing issues
- Read documentation
- Ask in discussions
- Contact maintainers

## License

By contributing, you agree that your contributions will be licensed under the project's license.

---

Thank you for contributing to Burstlet! 🚀