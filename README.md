# TypeScript Backend Template

A modern, production-ready TypeScript backend template built with **Bun** runtime, following the **Testing Trophy** philosophy and industry best practices.

## ✨ Features

- **⚡ Bun Runtime** - Native TypeScript execution, fast bundling, built-in test runner
- **🏗️ Elysia Framework** - Fast, end-to-end type safety, Bun-optimized web framework
- **📏 TypeScript Strict Mode** - Complete type safety with comprehensive error checking
- **🔍 ESLint v9 Flat Config** - Modern linting with security rules and TypeScript integration
- **🎨 Prettier Integration** - Consistent code formatting with modern settings
- **🏆 Testing Trophy Approach** - Balanced test distribution emphasizing integration tests
- **🐕 Husky v9 Pre-commit Hooks** - Automated quality checks with 80% coverage requirement
- **📊 Health Check Endpoint** - Production-ready monitoring and status reporting
- **🔧 Development-Optimized** - Hot reload, watch mode, comprehensive tooling

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh) v1.0.0 or higher
- Node.js 20+ (for compatibility)

### Installation

```bash
# Clone the template (or use as template)
git clone https://github.com/YOUR_USERNAME/ts-backend-template.git
cd ts-backend-template

# Install dependencies
bun install

# Setup git hooks
bun run prepare

# Start development server
bun run start:dev
```

The server will start at `http://localhost:3000` with hot reload enabled.

### Verify Installation

```bash
# Check health endpoint
curl http://localhost:3000/health

# Run tests
bun run test

# Run all quality checks
bun run pre-commit
```

## 📋 Available Scripts

### Development Commands

| Command             | Description                              |
| ------------------- | ---------------------------------------- |
| `bun run start:dev` | Start development server with hot reload |
| `bun run start`     | Start production server                  |
| `bun run build`     | Build for production                     |

### Code Quality Commands

| Command                | Description                  |
| ---------------------- | ---------------------------- |
| `bun run type-check`   | Run TypeScript type checking |
| `bun run lint`         | Run ESLint (check only)      |
| `bun run lint:fix`     | Run ESLint with auto-fix     |
| `bun run format`       | Format code with Prettier    |
| `bun run format:check` | Check code formatting (CI)   |

### Testing Commands

| Command                    | Description                    |
| -------------------------- | ------------------------------ |
| `bun run test`             | Run all tests                  |
| `bun run test:unit`        | Run unit tests (25-30%)        |
| `bun run test:integration` | Run integration tests (45-50%) |
| `bun run test:contract`    | Run contract tests (10-15%)    |
| `bun run test:e2e`         | Run end-to-end tests (10-15%)  |
| `bun run test:coverage`    | Run tests with coverage report |
| `bun run test:watch`       | Run tests in watch mode        |

### Maintenance Commands

| Command              | Description                        |
| -------------------- | ---------------------------------- |
| `bun run clean`      | Clean build artifacts and coverage |
| `bun run prepare`    | Setup Husky git hooks              |
| `bun run pre-commit` | Run all pre-commit checks manually |

## 🏗️ Project Structure

```
ts-backend-template/
├── 📁 src/
│   └── index.ts                 # Main application entry point
├── 📁 tests/
│   ├── 📁 unit/                 # Unit tests (25-30%)
│   │   ├── health.test.ts
│   │   └── error-handling.test.ts
│   ├── 📁 integration/          # Integration tests (45-50%)
│   │   ├── api-endpoints.test.ts
│   │   └── middleware-flow.test.ts
│   ├── 📁 contract/             # Contract tests (10-15%)
│   │   └── api-contract.test.ts
│   ├── 📁 e2e/                  # End-to-end tests (10-15%)
│   │   └── full-application.test.ts
│   └── test-utils.ts            # Shared test utilities
├── 📁 .husky/
│   └── pre-commit               # Git pre-commit hooks
├── ⚙️ Configuration Files
│   ├── package.json             # Dependencies and scripts
│   ├── tsconfig.json            # TypeScript configuration
│   ├── eslint.config.js         # ESLint flat configuration
│   ├── .prettierrc              # Prettier configuration
│   ├── bunfig.toml              # Bun configuration
│   └── .prettierignore          # Prettier ignore patterns
├── 📄 Documentation
│   ├── README.md                # This file
│   └── CLAUDE.md                # Development hooks and customization
└── 🔧 Generated
    ├── dist/                    # Build output
    └── coverage/                # Test coverage reports
```

## 🧪 Testing Strategy

This template follows the **Testing Trophy** philosophy:

> "Write tests. Not too many. Mostly integration." - Kent C. Dodds

### Test Distribution

| Test Type       | Percentage | Purpose                               | Location             |
| --------------- | ---------- | ------------------------------------- | -------------------- |
| **Integration** | 45-50%     | Component interactions, request flows | `tests/integration/` |
| **Unit**        | 25-30%     | Individual function behavior          | `tests/unit/`        |
| **Contract**    | 10-15%     | API contract compliance               | `tests/contract/`    |
| **E2E**         | 10-15%     | Full application workflows            | `tests/e2e/`         |

### Why This Distribution?

- **Integration tests** catch the most bugs with reasonable cost
- **Unit tests** provide fast feedback for business logic
- **Contract tests** ensure API reliability for consumers
- **E2E tests** validate critical user journeys

### Test Utilities

The template includes comprehensive test utilities in `tests/test-utils.ts`:

- HTTP request helpers
- Test data generators
- Environment setup
- Performance measurement tools
- Mock management

## 📊 API Endpoints

### Health Check

```http
GET /health
```

Returns comprehensive health information:

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "environment": "development",
  "version": "1.0.0"
}
```

### Root Endpoint

```http
GET /
```

Returns welcome message with API information:

```json
{
  "message": "Welcome to the TypeScript Backend Template",
  "documentation": "/health for health checks",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Not Found",
  "message": "The requested endpoint does not exist",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## ⚙️ Configuration

### Environment Variables

| Variable   | Default       | Description      |
| ---------- | ------------- | ---------------- |
| `NODE_ENV` | `development` | Environment mode |
| `PORT`     | `3000`        | Server port      |
| `HOST`     | `localhost`   | Server hostname  |

### TypeScript Configuration

- **Strict mode enabled** - Complete type safety
- **ESNext target** - Latest JavaScript features
- **Bundler module resolution** - Optimized for Bun
- **Source maps** - Enhanced debugging experience

### Bun Configuration

- **Native test runner** - Fast, built-in testing
- **Coverage reporting** - HTML, JSON, and text formats
- **80% coverage threshold** - Enforced quality standard
- **Parallel execution** - Maximum performance

### ESLint Rules

- **TypeScript integration** - Type-aware linting
- **Security plugin** - Vulnerability detection
- **Import validation** - Module consistency
- **Consistent code patterns** - Team alignment

## 🔒 Quality Gates

### Pre-commit Checks (Required)

1. ✅ **Type Checking** - Zero TypeScript errors
2. ✅ **Linting** - Zero ESLint violations
3. ✅ **Formatting** - Prettier compliance
4. ✅ **Test Suite** - All tests passing
5. ✅ **Coverage** - Minimum 80% threshold

### CI/CD Integration

Use the same quality checks in your pipeline:

```yaml
# GitHub Actions example
- name: Quality Checks
  run: |
    bun run type-check
    bun run lint:check
    bun run format:check
    bun run test:coverage
```

## 🚀 Deployment

### Build for Production

```bash
# Build optimized bundle
bun run build

# Start production server
bun run start
```

### Docker Example

```dockerfile
FROM oven/bun:1 as base
WORKDIR /app

# Install dependencies
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile --production

# Build application
COPY . .
RUN bun run build

# Start production server
EXPOSE 3000
CMD ["bun", "run", "start"]
```

## 🔧 Customization

### Adding New Endpoints

1. **Create endpoint** in `src/index.ts` or new route files
2. **Add tests** following Testing Trophy distribution:
   - 1 unit test for business logic
   - 2-3 integration tests for request flows
   - 1 contract test for API compliance
   - 1 E2E test for critical paths

### Extending Configuration

1. **Update `bunfig.toml`** for test configuration
2. **Modify `eslint.config.js`** for linting rules
3. **Adjust `tsconfig.json`** for TypeScript settings
4. **Update `CLAUDE.md`** with new development hooks

### Adding Dependencies

```bash
# Runtime dependencies
bun add <package>

# Development dependencies
bun add -D <package>
```

## 📈 Performance

### Benchmarks

- **Health check response**: < 5ms
- **Cold start time**: < 100ms
- **Memory usage**: < 50MB baseline
- **Test execution**: < 2s for full suite

### Optimization Features

- **Bun native runtime** - 3x faster than Node.js
- **Hot reload** - Instant development feedback
- **Efficient bundling** - Minimal production size
- **Parallel testing** - Maximum CI speed

## 🤝 Contributing

1. **Fork and clone** the repository
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Make changes** following existing patterns
4. **Add tests** maintaining Testing Trophy distribution
5. **Run quality checks**: `bun run pre-commit`
6. **Commit changes**: Git hooks will run automatically
7. **Submit pull request** with clear description

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- **Bun Team** - Amazing TypeScript runtime
- **Elysia** - Fast, end-to-end type safety web framework
- **Kent C. Dodds** - Testing Trophy philosophy
- **TypeScript Team** - Excellent type system
- **Open Source Community** - Supporting tools and libraries

---

## 🔗 Related Resources

- [Bun Documentation](https://bun.sh/docs)
- [Elysia Framework](https://elysiajs.com)
- [Testing Trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [ESLint Flat Config](https://eslint.org/docs/latest/use/configure/configuration-files)

**Happy coding! 🚀**
