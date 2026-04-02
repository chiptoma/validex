import antfu from '@antfu/eslint-config'
import pluginRegexp from 'eslint-plugin-regexp'
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
            'scripts/*.ts',
            'packages/*/tsup.config.ts',
            'packages/*/vitest.config.ts',
            'packages/*/scripts/*.ts',
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

  // Strict TypeScript — scoped to .ts files for type-aware rules
  {
    files: ['**/*.ts'],
    rules: {
      'ts/consistent-type-definitions': ['error', 'interface'],
      'ts/explicit-function-return-type': 'error',
      'ts/no-explicit-any': 'error',
      'ts/strict-boolean-expressions': 'error',
      'ts/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      'ts/no-non-null-assertion': 'error',
      'no-console': 'warn',
      'prefer-const': 'error',
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
          'PLAN.md',
        ],
      }],
    },
  },

  // JSDoc on public exports — only for src/ files
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

  // Regex quality — critical for a validation library
  pluginRegexp.configs['flat/recommended'],
  {
    rules: {
      'regexp/no-super-linear-backtracking': 'error',
      'regexp/no-misleading-unicode-character': 'error',
      'regexp/strict': 'error',
    },
  },

  // Code quality and complexity
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

  // Scripts — relaxed rules
  {
    files: ['packages/*/scripts/**/*.ts'],
    rules: {
      'no-console': 'off',
      'ts/explicit-function-return-type': 'off',
      'max-lines-per-function': 'off',
      'jsdoc/require-jsdoc': 'off',
      'sonarjs/no-duplicate-string': 'off',
    },
  },

  // Test quality — relaxed rules
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

  // Config/script files — not in tsconfig scope, disable type-aware rules
  {
    files: ['**/*.config.ts', 'packages/*/scripts/**/*.ts'],
    rules: {
      'ts/strict-boolean-expressions': 'off',
      'ts/no-unsafe-argument': 'off',
      'ts/no-unsafe-call': 'off',
      'ts/no-unsafe-member-access': 'off',
    },
  },

  // pnpm workspace settings — pnpm 9.x keeps settings in package.json
  {
    files: ['package.json'],
    rules: {
      'pnpm/json-prefer-workspace-settings': 'off',
    },
  },
)
