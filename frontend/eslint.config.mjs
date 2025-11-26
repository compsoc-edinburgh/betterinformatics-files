import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import globals from "globals";

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
            // Unused variables should begin with an underscore
            "@typescript-eslint/no-unused-vars": ["warn", {
                args: "none",
                ignoreRestSiblings: true,
                varsIgnorePattern: "^_",
            }],
            // Sometimes we do want explicit types even for the most obvious
            // and easily-inferred variables.
            "@typescript-eslint/no-inferrable-types": "off",
            // We use redundant types to document potential common values, like
            // "en" | "de" | string for the menu.
            "@typescript-eslint/no-redundant-type-constituents": "off",
            // We prefer writing callback props (that don't handle the event) as:
            //     onClick={() => doSomething()}
            // while the below rule enforces the (more uglier):
            //     onClick={() => { doSomething(); }}
            "@typescript-eslint/no-confusing-void-expression": "off",

            // TODO: Change the rules from here on below to errors.
            // They have been set to "warn" during the eslint 9 and flat config
            // migration (away from eslint-config-react-app) to reduce the number
            // of immediate fixes.
            "@typescript-eslint/restrict-template-expressions": ["warn", {
                // Allow number types to be used in template expressions
                allowNumber: true,
            }],
            "@typescript-eslint/array-type": ["warn", {
                // Prefer [] over Array<> syntax for array types
                default: "array",
            }],
            "@typescript-eslint/ban-tslint-comment": "warn",
            "@typescript-eslint/consistent-generic-constructors": "warn",
            "@typescript-eslint/consistent-indexed-object-style": "warn",
            "@typescript-eslint/consistent-type-definitions": "warn",
            "@typescript-eslint/dot-notation": "warn",
            "@typescript-eslint/no-base-to-string": "warn",
            "@typescript-eslint/no-deprecated": "warn",
            "@typescript-eslint/no-duplicate-type-constituents": "warn",
            "@typescript-eslint/no-empty-function": "warn",
            "@typescript-eslint/no-empty-object-type": "warn",
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/no-extraneous-class": "warn",
            "@typescript-eslint/no-floating-promises": "warn",
            "@typescript-eslint/no-misused-promises": "warn",
            "@typescript-eslint/no-non-null-assertion": "warn",
            "@typescript-eslint/no-unnecessary-condition": "warn",
            "@typescript-eslint/no-unnecessary-template-expression": "warn",
            "@typescript-eslint/no-unnecessary-type-arguments": "warn",
            "@typescript-eslint/no-unnecessary-type-assertion": "warn",
            "@typescript-eslint/no-unnecessary-type-parameters": "warn",
            "@typescript-eslint/no-unsafe-argument": "warn",
            "@typescript-eslint/no-unsafe-assignment": "warn",
            "@typescript-eslint/no-unsafe-call": "warn",
            "@typescript-eslint/no-unsafe-member-access": "warn",
            "@typescript-eslint/no-unsafe-return": "warn",
            "@typescript-eslint/no-unused-expressions": "warn",
            "@typescript-eslint/no-wrapper-object-types": "warn",
            "@typescript-eslint/non-nullable-type-assertion-style": "warn",
            "@typescript-eslint/prefer-for-of": "warn",
            "@typescript-eslint/prefer-includes": "warn",
            "@typescript-eslint/prefer-nullish-coalescing": "warn",
            "@typescript-eslint/prefer-optional-chain": "warn",
            "@typescript-eslint/prefer-promise-reject-errors": "warn",
            "@typescript-eslint/prefer-reduce-type-parameter": "warn",
            "@typescript-eslint/prefer-string-starts-ends-with": "warn",
            "@typescript-eslint/restrict-plus-operands": "warn",
            "@typescript-eslint/return-await": "warn",
            "@typescript-eslint/unbound-method": "warn",
            "@typescript-eslint/use-unknown-in-catch-callback-variable": "warn",
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

        languageOptions: {
            globals: {
                ...globals.browser,
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
            // As per https://typescript-eslint.io/troubleshooting/typed-linting/performance/#eslint-plugin-import,
            // the following import/ rules are recommended to be turned off
            // since the TS typechecker performs similar checks, and the eslint
            // version is very slow.
            // For our case in particular, import/namespace flags a bunch of
            // false positives where we import pdfjs-dist/legacy/build/pdf.
            // no-unresolved also had some issues with svgr.
            "import/named": "off",
            "import/namespace": "off",
            "import/default": "off",
            "import/no-named-as-default-member": "off",
            "import/no-unresolved": "off",


            // TODO: Change the rules from here on below to errors.
            // They have been set to "warn" during the eslint 9 and flat config
            // migration (away from eslint-config-react-app) to reduce the number
            // of immediate fixes.
            "no-prototype-builtins": "warn",
            "react/display-name": "warn",
            "react/no-children-prop": "warn",
            "react/prop-types": "warn",
            "react/no-unescaped-entities": "warn",
            "react-hooks/immutability": "warn",
            "react-hooks/preserve-manual-memoization": "warn",
            "react-hooks/refs": "warn",
            "react-hooks/set-state-in-effect": "warn",
        },
    }
);
