import { defineConfig } from "vite";

export default defineConfig({
    build: {
        lib: {
            entry: "src/index.ts",
            name: "richTextMarker",
            fileName: (format) => `rich-text-marker.${format}.js`,
        },
    },
    resolve: {
        alias: {
            "@": "/src",
        },
    },
});
