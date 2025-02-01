import cleanup from 'rollup-plugin-cleanup';
import prettier from 'rollup-plugin-prettier';
import typescript from 'rollup-plugin-typescript2';

export default {
  output: {
    dir: 'dist',
    format: 'esm',
    preserveModules: true,
  },
  plugins: [
    cleanup({ comments: 'none', extensions: ['.ts'] }),
    typescript(),
    prettier({ parser: 'typescript' }),
  ],
  context: 'this',
};
