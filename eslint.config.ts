// ==============================================================================
// ESLINT CONFIG — validex monorepo
// Extends @antfu/eslint-config (type: lib) with stricter rules for a
// validation library. Each override block documents what it changes and why.
// ==============================================================================

import antfu from '@antfu/eslint-config'
import sonarjs from 'eslint-plugin-sonarjs'

export default antfu(
  {
    type: 'lib',
    typescript: {
      tsconfigPath: 'tsconfig.json',
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            '*.config.ts',
            '*.config.base.ts',
            'scripts/*.ts',
            'packages/*/tsup.config.ts',
            'packages/*/vitest.config.ts',
          ],
        },
      },
    },
    stylistic: {
      indent: 2,
      quotes: 'single',
      semi: false,
    },
    jsonc: true,
    yaml: false,
    markdown: false,
    ignores: ['**/fixtures', '**/dist', '**/smoke'],
  },

  // -- STRICT TS: Promotes no-explicit-any and no-non-null-assertion from
  // -- antfu's defaults (off) to error. A validation library must never
  // -- use `any` or `!` without explicit justification.
  // -- Also adds max-lines, max-lines-per-function, max-depth, and
  // -- unicorn/filename-case which antfu does not include.
  // -- no-console is set to warn (antfu defaults to error with allow).
  {
    files: ['**/*.ts'],
    rules: {
      'ts/no-explicit-any': 'error',
      'ts/no-non-null-assertion': 'error',
      'no-console': 'warn',
      'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['error', { max: 50, skipBlankLines: true, skipComments: true }],
      'max-depth': ['error', 3],
      'unicorn/filename-case': ['error', {
        case: 'camelCase',
        ignore: [
          'README.md',
          'CHANGELOG.md',
          'BUILD.md',
          'SPEC.md',
          'OPTIONS.md',
          'DEFAULTS.md',
          'CONTRIBUTING.md',
          'LICENSE',
          'CLAUDE.md',
          'vitest.config.ts',
          'tsup.config.ts',
          'eslint.config.ts',
        ],
      }],
    },
  },

  // -- IMPORT SORTING: Override antfu's perfectionist defaults to enforce
  // -- blank lines between groups and recognize @-prefixed path aliases
  // -- as internal imports.
  {
    rules: {
      'perfectionist/sort-imports': ['error', {
        groups: [
          'type-import',
          ['type-parent', 'type-sibling', 'type-index', 'type-internal'],
          'value-builtin',
          'value-external',
          'value-internal',
          ['value-parent', 'value-sibling', 'value-index'],
          'side-effect',
        ],
        newlinesBetween: 1,
        internalPattern: [
          '^@checks',
          '^@rules',
          '^@core',
          '^@config',
          '^@internal',
          '^@loaders',
          '^@utilities',
          '^@augmentation',
          '^@locales',
          '^@validex-types',
        ],
        order: 'asc',
        type: 'natural',
      }],
    },
  },

  // -- JSDOC: Promotes antfu's warn-level defaults to error and requires
  // -- JSDoc on all exported symbols in src/. Required for a public API.
  {
    files: ['packages/*/src/**/*.ts'],
    rules: {
      'jsdoc/require-jsdoc': ['error', {
        require: {
          FunctionDeclaration: true,
          MethodDefinition: true,
          ClassDeclaration: true,
        },
        contexts: [
          'ExportNamedDeclaration:has(VariableDeclaration)',
          'TSInterfaceDeclaration',
          'TSTypeAliasDeclaration',
        ],
      }],
      'jsdoc/require-description': 'error',
      'jsdoc/require-param': 'error',
      'jsdoc/require-returns': 'error',
    },
  },

  // -- SONARJS: Cognitive complexity and code quality rules not included
  // -- in antfu. Critical for readable validation logic.
  {
    plugins: { sonarjs },
    rules: {
      'sonarjs/cognitive-complexity': ['error', 15],
      'sonarjs/no-identical-expressions': 'error',
      'sonarjs/no-duplicate-string': ['error', { threshold: 3 }],
      'sonarjs/no-redundant-jump': 'error',
      'sonarjs/no-collapsible-if': 'error',
      'sonarjs/prefer-single-boolean-return': 'error',
    },
  },

  // -- TESTS: Relaxed limits (large describe blocks), no JSDoc, no
  // -- duplicate string (assertion messages repeat). Enforces vitest
  // -- best practices.
  {
    files: ['packages/*/tests/**/*.ts'],
    rules: {
      'test/no-only-tests': 'error',
      'test/no-identical-title': 'error',
      'test/consistent-test-it': ['error', { fn: 'it' }],
      'ts/explicit-function-return-type': 'off',
      'max-lines-per-function': 'off',
      'max-lines': ['error', { max: 500, skipBlankLines: true, skipComments: true }],
      'jsdoc/require-jsdoc': 'off',
      'sonarjs/no-duplicate-string': 'off',
    },
  },

  // -- CONFIG FILES: Not in tsconfig project scope. Disable type-aware
  // -- rules that require type information to avoid parser errors.
  {
    files: ['**/*.config.ts', '**/*.config.base.ts'],
    rules: {
      'ts/strict-boolean-expressions': 'off',
      'ts/no-unsafe-argument': 'off',
      'ts/no-unsafe-assignment': 'off',
      'ts/no-unsafe-call': 'off',
      'ts/no-unsafe-member-access': 'off',
    },
  },
)
