/**
 * '*.ts': {
 *  title: 'Log staged TS files to console',
 *  task: async (files) => {
 *   console.log('Staged TS files:', files);
 *  },
 * },
 * @filename: lint-staged.config.js
 * @type {import('lint-staged').Configuration}
 */
export default {
  "*.{js,ts,mjs,cjs,json,jsonc,yml,yaml,toml,html,css}": "pnpm format",
  "*.{js,ts}": "tsc-files --noEmit",
  "*.{md,mdx}": (files) => {
    const paths = files.map((file) => `"${file}"`).join(" ");
    return `pnpm prettier --write ${paths} --log-level=warn --no-error-on-unmatched-pattern --cache`;
  },
};
