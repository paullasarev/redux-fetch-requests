const { terser } = require('rollup-plugin-terser');
export default {
  input: 'src/index.js',
  external: ['lodash', 'lodash/fp'],
  output: [
    {
      file: 'dist/bundle.min.js',
      format: 'cjs',
    },
    {
      file: 'dist/bundle.js',
      format: 'cjs',
    },
    {
      file: 'dist/bundle.esm.js',
      format: 'esm',
    }
  ],
  plugins: [
    terser({
      include: [/^.+\.min\.js$/],
    })
  ]
}
