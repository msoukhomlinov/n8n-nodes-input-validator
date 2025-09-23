import tseslint from 'typescript-eslint';
import eslint from '@eslint/js';

export default tseslint.config(
    // Global ignores (must be first and only contain ignores)
    {
        ignores: [
            'node_modules/**',
            'dist/**',
            '**/*.js',
            '**/*.d.ts',
            'gulpfile.js',
            '.eslintrc.js',
            '.eslintrc.prepublish.js',
            '.prettierrc.js',
        ],
    },

    // Base ESLint recommended rules
    eslint.configs.recommended,

    // TypeScript-specific recommended rules
    ...tseslint.configs.recommended,

    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            parserOptions: {
                project: './tsconfig.json',
                tsconfigRootDir: import.meta.dirname,
            },
        },

        rules: {
            // Code quality rules
            '@typescript-eslint/no-unused-vars': 'error',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/explicit-function-return-type': 'warn',
            '@typescript-eslint/no-var-requires': 'error',

            // Style rules
            '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
            '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],

            // General ESLint rules
            'curly': ['error', 'all'],
            'eqeqeq': ['error', 'always'],
            'no-console': 'warn',
            'no-debugger': 'error',
            'no-duplicate-imports': 'error',
            'prefer-const': 'error',

            // Semicolon rules
            'semi': ['error', 'always'],

            // Quotes
            'quotes': ['error', 'single', { 'allowTemplateLiterals': true }],

            // Indentation (spaces instead of tabs)
            'indent': ['error', 2],

            // Trailing comma
            'comma-dangle': ['error', 'always-multiline'],
        },

        files: ['**/*.ts', '**/*.tsx'],
    },

    // Specific rules for test files (if any)
    {
        files: ['**/*.test.ts', '**/*.spec.ts'],
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
        },
    }
);
