import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";

export default defineConfig(
    js.configs.recommended,
    importPlugin.flatConfigs.recommended,
    reactPlugin.configs.flat.recommended,
    reactPlugin.configs.flat["jsx-runtime"],
    reactHooksPlugin.configs.flat.recommended,
    {
        // Custom configuration to apply to TypeScript files
        files: ["**/*.{ts,tsx}"],

        // TypeScript variants of plugins to make sure types are OK
        extends: [
            importPlugin.flatConfigs.typescript,
            tseslint.configs.recommendedTypeChecked,
            tseslint.configs.stylisticTypeChecked,
            tseslint.configs.strictTypeChecked,
        ],

        // Configuration used by typescript-eslint.
        // projectService intelligently finds the nearest tsconfig.json for each
        // TypeScript file that it needs to compile and get types for.
        languageOptions: {
            parserOptions: {
                projectService: true,
            },
        },

        // Custom rules
        rules: {
            "@typescript-eslint/no-unused-vars": ["warn", {
                args: "none",
                ignoreRestSiblings: true,
                varsIgnorePattern: "^_",
            }],
        }
    },
    {
        // Custom configuration applied to all files.

        // Configuration used by eslint-plugin-react.
        // Automatically detect the version of React.
        settings: {
            react: {
                version: "detect",
            },
        },

        // Custom rules
        rules: {
            "prefer-arrow-callback": "warn",
            "prefer-template": "error",
            "react/no-typos": "error",
            "object-shorthand": "error",
            "prefer-const": "error",
            "no-new": "error",
            "react/self-closing-comp": "error",
            "guard-for-in": "error",
        },
    }
);
