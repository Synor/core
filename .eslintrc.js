module.exports = {
  extends: [
    'standard-with-typescript',
    'plugin:prettier/recommended',
    'prettier/standard',
    'prettier/@typescript-eslint'
  ],
  parserOptions: {
    project: './tsconfig.json',
    createDefaultProgram: true
  },
  rules: {
    '@typescript-eslint/consistent-type-definitions': 'off',
    '@typescript-eslint/no-empty-interface': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/promise-function-async': 'off',
    '@typescript-eslint/strict-boolean-expressions': 'off'
  }
}
