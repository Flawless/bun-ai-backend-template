import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import security from 'eslint-plugin-security';
import noOnlyTests from 'eslint-plugin-no-only-tests';
import prettierConfig from 'eslint-config-prettier';

export default [
  // Base configuration for all files
  js.configs.recommended,

  // TypeScript files configuration
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        // Node.js globals
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        // Bun and Web globals
        Bun: 'readonly',
        fetch: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        performance: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      security: security,
      'no-only-tests': noOnlyTests,
    },
    rules: {
      // TypeScript specific rules
      ...tseslint.configs.recommended.rules,

      // Security rules - STRICT MODE
      ...security.configs.recommended.rules,
      'security/detect-eval-with-expression': 'error',
      'security/detect-non-literal-fs-filename': 'error',
      'security/detect-non-literal-regexp': 'error',
      'security/detect-non-literal-require': 'error',
      'security/detect-possible-timing-attacks': 'error',
      'security/detect-pseudoRandomBytes': 'error',
      'security/detect-unsafe-regex': 'error',
      'security/detect-buffer-noassert': 'error',
      'security/detect-child-process': 'error',
      'security/detect-disable-mustache-escape': 'error',
      'security/detect-object-injection': 'error',
      'security/detect-new-buffer': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',

      // Custom rules
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',

      // STRICT RULES - NO DEVELOPER SHORTCUTS ALLOWED
      'no-console': 'error', // NO console.log in production code
      'no-debugger': 'error',
      'no-alert': 'error',
      'no-empty': 'error',
      'no-empty-function': 'error',
      'no-unreachable': 'error',
      'no-unused-expressions': 'error',
      'no-useless-catch': 'error',
      'no-useless-return': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-arrow-callback': 'error',
      'prefer-template': 'error',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],

      // PREVENT TEST WORKAROUNDS AND SHORTCUTS
      'no-only-tests/no-only-tests': 'error', // No .only() in tests

      // PREVENT DANGEROUS PATTERNS
      'no-with': 'error',
      'no-void': 'error',
      'no-throw-literal': 'error',
      'no-script-url': 'error',
      'no-proto': 'error',
      'no-octal-escape': 'error',
      'no-new-wrappers': 'error',
      'no-loop-func': 'error',
      'no-iterator': 'error',
      'no-implicit-globals': 'error',
      'no-extend-native': 'error',

      // FORCE MODERN PATTERNS
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSAnyKeyword',
          message: 'any is forbidden - use proper types',
        },
        {
          selector: 'Literal[raw=/.*\\.only\\s*\\(/]',
          message: 'test.only() is forbidden in committed code',
        },
        {
          selector: 'Literal[raw=/.*\\.skip\\s*\\(/]',
          message: 'test.skip() is forbidden in committed code',
        },
      ],
    },
  },

  // JavaScript files configuration
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: {
      security: security,
    },
    rules: {
      ...security.configs.recommended.rules,
      'no-console': 'warn',
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },

  // Test files - more relaxed rules
  {
    files: ['**/*.test.{ts,js}', '**/__tests__/**/*.{ts,js}', '**/tests/**/*.{ts,js}'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },

  // Ignore patterns
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      '*.config.js',
      '*.config.ts',
      '.husky/**',
    ],
  },

  // Prettier integration - must be last
  prettierConfig,
];
