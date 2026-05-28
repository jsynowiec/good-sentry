import globals from 'globals';
import pluginJs from '@eslint/js';
import prettier from 'eslint-plugin-prettier';

export default [
  pluginJs.configs.recommended,
  {
    plugins: { prettier },
    rules: { 'prettier/prettier': 'error' },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
      },
    },
    ignores: ['node_modules', 'coverage', 'lib'],
  },
];
