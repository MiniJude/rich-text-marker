import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
    plugins: [dts()],
    build: {
        lib: {
            entry: "src/index.ts",
            name: "richTextMarker",
            fileName: (format) => `richTextMarker.${format}.js`,
        },
    },
    base: './',
    resolve: {
        alias: {
            "@": "/src",
        },
    },
});
