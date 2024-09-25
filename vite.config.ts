import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import * as path from "path";

export default defineConfig({
    plugins: [dts({ rollupTypes: true })],
    build: {
        lib: {
            entry: "src/index.ts",
            name: "rich-text-marker",
            fileName: (format) => {
                switch (format) {
                    case "es":
                        return "index.mjs";
                    case "cjs":
                        return "index.cjs";
                    default:
                        return "index.js";
                }
            },
            formats: ["es", "cjs"],
        }
    },
    resolve: {
        alias: [{ find: "@", replacement: path.resolve(__dirname, "src") }],
        
    },
});
