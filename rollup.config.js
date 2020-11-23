import svelte from 'rollup-plugin-svelte';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import livereload from 'rollup-plugin-livereload';
import sveltePreprocess from 'svelte-preprocess';
import { terser } from 'rollup-plugin-terser';
import typescript from '@rollup/plugin-typescript';

const isDev = Boolean(process.env.ROLLUP_WATCH);

export default {
  input: 'src/main.ts',
  output: {
    sourcemap: isDev,
    file: `public/build/components.js`,
    format: 'iife',
    name: 'components',
  },
  plugins: [
    svelte({
      include: 'src/**/*.svelte',
      dev: isDev,
      preprocess: sveltePreprocess()
    }),
    resolve(),
    commonjs(),
    typescript({
      sourceMap: isDev,
      inlineSources: isDev
    }),
    isDev && livereload('public'),
    !isDev && terser()
  ],
}

