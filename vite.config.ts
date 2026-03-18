import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  run: {
    tasks: {
      "podman-build": {
        command: "echo done", // required field, but the real work is in dependsOn
        dependsOn: ["website#podman-build"],
      },
    },
  },
});
