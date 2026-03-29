import antfu from '@antfu/eslint-config'
import sonarjs from 'eslint-plugin-sonarjs'
import pluginRegexp from 'eslint-plugin-regexp'
import vitest from 'eslint-plugin-vitest'

export default antfu(
  {
    type: 'lib',
    typescript: {
      tsconfigPath: 'tsconfig.json',
    },
    stylistic: {
      indent: 2,
      quotes: 'single',
      semi: false,
    },
    jsonc: true,
    yaml: false,
    markdown: false,
    ignores: ['**/fixtures', '**/dist'],
  },

  // Strict TypeScript
  {
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
          'README.md', 'CHANGELOG.md', 'BUILD.md', 'SPEC.md',
          'OPTIONS.md', 'DEFAULTS.md', 'CONTRIBUTING.md', 'LICENSE', 'CLAUDE.md',
          'vitest.config.ts', 'tsup.config.ts', 'eslint.config.ts',
        ],
      }],
    },
  },

  // JSDoc on public exports — only for src/ files
  {
    files: ['src/**/*.ts'],
    rules: {
      'jsdoc/require-jsdoc': ['error', {
        require: {
          FunctionDeclaration: true,
          MethodDefinition: true,
          ClassDeclaration: true,
        },
        contexts: [
          'ExportNamedDeclaration > FunctionDeclaration',
          'ExportNamedDeclaration > VariableDeclaration',
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

  // Test quality — relaxed rules + vitest enforcement
  {
    files: ['tests/**/*.ts'],
    plugins: { vitest },
    rules: {
      ...vitest.configs.recommended.rules,
      'vitest/no-focused-tests': 'error',
      'vitest/no-disabled-tests': 'warn',
      'vitest/expect-expect': 'error',
      'vitest/no-identical-title': 'error',
      'ts/explicit-function-return-type': 'off',
      'max-lines-per-function': 'off',
      'max-lines': ['error', { max: 500, skipBlankLines: true, skipComments: true }],
      'jsdoc/require-jsdoc': 'off',
      'sonarjs/no-duplicate-string': 'off',
    },
  },
)
