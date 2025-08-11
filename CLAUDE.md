# CLAUDE.md - TypeScript Backend Template

This is a modern TypeScript backend template built with **Bun** runtime, following industry best practices and the Testing Trophy philosophy.

## 📋 Project Information

**Project Name:** [YOUR_PROJECT_NAME]  
**Description:** [YOUR_PROJECT_DESCRIPTION]  
**Version:** 1.0.0  
**Author:** [YOUR_NAME]  
**Repository:** [YOUR_REPOSITORY_URL]

## 🔧 Development Hooks

### Type Checking

```bash
bun run type-check
```

- Runs TypeScript compiler without emitting files
- Uses strict mode with comprehensive type checking
- Configured for Bun-specific optimizations

### Linting

```bash
bun run lint          # Auto-fix issues
bun run lint:check    # Check only (CI/CD)
```

- ESLint with flat config (v9+)
- TypeScript ESLint rules with type-aware linting
- Security plugin for vulnerability detection
- Prettier integration for consistent formatting

### Formatting

```bash
bun run format        # Format all files
bun run format:check  # Check formatting (CI/CD)
```

- Prettier with modern configuration
- 100 character line width
- Single quotes, trailing commas
- Consistent indentation (2 spaces)

### Testing

```bash
bun run test              # Run all tests
bun run test:unit         # Unit tests only
bun run test:integration  # Integration tests only
bun run test:contract     # Contract tests only
bun run test:e2e          # End-to-end tests only
bun run test:coverage     # Run with coverage report
bun run test:watch        # Watch mode
```

#### Testing Philosophy

This project follows the **Testing Trophy** approach advocated by Kent C. Dodds:

> "The modern approach emphasizes integration testing over unit tests, following Kent C. Dodds' 'Testing Trophy' philosophy: 'Write tests. Not too many. Mostly integration.' For TypeScript API projects, this means allocating 45-50% of tests to integration coverage, 25-30% to unit tests, and 10-15% each to contract and E2E tests."

**Test Distribution:**

- **Integration Tests (45-50%)**: `tests/integration/` - Multi-component interactions
- **Unit Tests (25-30%)**: `tests/unit/` - Individual function/class behavior
- **Contract Tests (10-15%)**: `tests/contract/` - API contract compliance
- **E2E Tests (10-15%)**: `tests/e2e/` - Full application workflows

### Claude Code Hooks

Automatic post-write checks run after editing files with Claude Code:

```bash
.claude/postwrite.sh
```

**For TypeScript/JavaScript files:**

1. **Type checking** - Full project type validation
2. **Linting** - File-specific ESLint with auto-fix
3. **Testing** - Related test files execution
4. **Formatting** - File-specific Prettier formatting

**For JSON/Markdown/YAML files:**

- **Formatting** - Prettier formatting only

**Configuration:**

- `.claude/settings.json` - Hook configuration
- `.claude/postwrite.sh` - Hook script (executable)

### Pre-commit Hooks

Husky v9 automatically runs these checks before each commit:

1. **Type checking** - Ensures no TypeScript errors
2. **Linting** - Code quality and security checks
3. **Formatting** - Code style consistency
4. **Test suite** - All tests with coverage
5. **Coverage threshold** - Minimum 80% coverage required

## 🏗️ Architecture & Stack

### Core Technologies

- **Runtime:** Bun (ESNext, fast bundler, native test runner)
- **Language:** TypeScript (strict mode, latest features)
- **Framework:** Elysia (fast, end-to-end type safety, Bun-optimized)
- **HTTP Server:** Built-in Bun HTTP server

### Development Tools

- **Package Manager:** Bun
- **Linter:** ESLint v9 (flat config)
- **Formatter:** Prettier
- **Test Runner:** Bun Test (native, with coverage)
- **Git Hooks:** Husky v9
- **Type Checker:** TypeScript 5.6+

## 📁 Project Structure

```
[YOUR_PROJECT_NAME]/
├── src/
│   └── index.ts           # Main application entry point
├── tests/
│   ├── unit/              # Unit tests (25-30%)
│   ├── integration/       # Integration tests (45-50%)
│   ├── contract/          # Contract tests (10-15%)
│   ├── e2e/              # End-to-end tests (10-15%)
│   └── test-utils.ts     # Shared test utilities
├── dist/                  # Build output (ignored)
├── coverage/             # Test coverage reports (ignored)
├── .husky/               # Git hooks
├── package.json          # Project dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── eslint.config.js      # ESLint flat configuration
├── .prettierrc           # Prettier configuration
├── bunfig.toml          # Bun configuration
└── README.md            # Project documentation
```

## 🚀 Available Commands

### Development

- `bun run start:dev` - Start development server with hot reload
- `bun run start` - Start production server
- `bun run build` - Build for production

### Code Quality

- `bun run type-check` - Type checking only
- `bun run lint` / `bun run lint:check` - Linting
- `bun run format` / `bun run format:check` - Formatting

### Testing

- `bun run test` - Run all tests
- `bun run test:[unit|integration|contract|e2e]` - Run specific test type
- `bun run test:coverage` - Coverage report
- `bun run test:watch` - Watch mode

### Maintenance

- `bun run clean` - Clean build artifacts
- `bun run prepare` - Setup Husky hooks

## 🔧 Configuration Notes

### Bun Optimizations

- Native TypeScript execution
- Fast bundling and dependency resolution
- Built-in test runner with coverage
- Module resolution: "bundler" mode
- Target: ESNext for maximum performance

### TypeScript Strict Mode

- All strict flags enabled
- `noUncheckedIndexedAccess` for safer array access
- `exactOptionalPropertyTypes` for precise optionals
- Comprehensive error checking and type safety

### ESLint Security

- `eslint-plugin-security` for vulnerability detection
- Type-aware rules for TypeScript
- Import/export validation
- Consistent code patterns

## 📊 Health Check Endpoint

The template includes a comprehensive health check endpoint at `/health`:

```typescript
GET /health
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "environment": "development",
  "version": "1.0.0"
}
```

## 🎯 Getting Started

1. **Install dependencies:** `bun install`
2. **Start development:** `bun run start:dev`
3. **Run tests:** `bun run test`
4. **Build for production:** `bun run build`

## 📝 Customization Checklist

- [ ] Update project name in `package.json` and this file
- [ ] Replace placeholders in CLAUDE.md with actual values
- [ ] Configure environment variables for your use case
- [ ] Add project-specific dependencies
- [ ] Implement your API endpoints in `src/`
- [ ] Write tests following the Testing Trophy distribution
- [ ] Update README.md with project-specific information
- [ ] Configure CI/CD pipelines to use the same hooks
- [ ] Set up environment-specific configurations
- [ ] Add database or external service integrations as needed

## 🏆 Quality Standards

This template enforces:

- **80% minimum test coverage** (configurable in bunfig.toml)
- **Zero TypeScript errors** in strict mode
- **Zero ESLint violations** including security rules
- **Consistent code formatting** with Prettier
- **Testing Trophy distribution** for comprehensive test coverage

## 🔗 Integration Points

When extending this template:

- Add new endpoints in `src/` with corresponding tests
- Follow the Testing Trophy ratio for new test files
- Use the test utilities in `tests/test-utils.ts`
- Maintain the existing code quality standards
- Update this CLAUDE.md file with new hooks or customizations

---

_This template uses Bun for optimal TypeScript performance and follows modern best practices for backend development._
