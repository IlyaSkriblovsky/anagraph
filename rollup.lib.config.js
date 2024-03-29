import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";
import terser from "@rollup/plugin-terser";
import peerDepsExternal from "rollup-plugin-peer-deps-external";

import packageJson from "./package.json";

export default [
    {
        input: "src/lib/index.ts",
        output: [
            {
                file: packageJson.main,
                format: "cjs",
                sourcemap: true,
            },
            {
                file: packageJson.module,
                format: "esm",
                sourcemap: true,
            },
        ],
        plugins: [peerDepsExternal(), resolve(), commonjs(), typescript({ tsconfig: "./tsconfig.json" }), terser()],
        external: ["react", "react-dom"],
    },
    // {
    //     input: "src/lib/worker.ts",
    //     output: [
    //         { file: "dist/worker.js", format: "cjs", sourcemap: true },
    //         { file: "dist/worker.esm.js", format: "esm", sourcemap: true },
    //     ],
    //     plugins: [peerDepsExternal(), resolve(), commonjs(), typescript({ tsconfig: "./tsconfig.json" }), terser()],
    // },
    {
        input: "src/lib/index.ts",
        output: [{ file: "dist/anagraph.d.ts", format: "es" }],
        plugins: [dts.default()],
    },
];
