import { defineConfig } from 'vite-plus';

export default defineConfig({
  run: {
    tasks: {
      dev: {
        command: 'tsx watch src/index.ts',
      },
      'podman-build': {
        command: 'podman build -t website:latest .',
        dependsOn: ['pack'],
        input: ['dist/index.mjs'],
      },
      pack: {
        command: 'vp pack',
        input: [{ auto: true }],
      },
    },
  },
  build: {},
  pack: {
    entry: ['src/index.ts'],
    sourcemap: false,
    minify: true,
    deps: {
      alwaysBundle: ['@effect/platform-node', '@effect/platform-node-shared'],
    },
  },
});
