import globals from "globals";
import tseslint from "typescript-eslint";


export default [
  {files: ["server/**/*.{js,mjs,cjs,ts}"]},
  {languageOptions: { globals: globals.browser }},
  ...tseslint.configs.recommended,
];