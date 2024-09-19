import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import * as path from "path";

export default defineConfig({
    plugins: [dts()],
    build: {
        lib: {
            entry: "src/index.ts",
            name: "richTextMarker",
            fileName: (format) => `richTextMarker.${format}.js`,
        },
    },
    resolve: {
        alias: [{ find: "@", replacement: path.resolve(__dirname, "src") }],
    },
});
