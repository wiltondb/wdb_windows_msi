// This file is used to declare all external dependencies,
// see: https://deno.land/manual@v1.10.2/linking_to_external_code#it-seems-unwieldy-to-import-urls-everywhere
//
// After changing this file run the following to re-generate deps.js:
// deno bundle deps_gen.ts deps.js
//
// note: @ts-ignore before each export is required to suppress Typescript warning,
// see: https://github.com/Microsoft/TypeScript/issues/27481

// stdlib

// @ts-ignore extension
export * as fs from "https://deno.land/std@0.110.0/fs/mod.ts";

// @ts-ignore extension
export * as io from "https://deno.land/std@0.110.0/io/mod.ts";

// @ts-ignore extension
export * as path from "https://deno.land/std@0.110.0/path/mod.ts";

// @ts-ignore extension
export { Sha256 } from "https://deno.land/std@0.110.0/hash/sha256.ts";

// js2xml
// @ts-ignore extension
export { js2xml } from "https://deno.land/x/js2xml@1.0.2/mod.ts";
