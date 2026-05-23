import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      common: path.resolve(__dirname, "../common"),
    },
  },
});
