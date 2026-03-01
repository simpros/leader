import { plugin } from "bun";
import { readFileSync } from "fs";
import { dirname } from "path";
import { afterEach } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register();

// Clean up DOM between tests
afterEach(() => {
  document.body.innerHTML = "";
  document.head.innerHTML = "";
});

// Cache resolved compilers per directory to avoid repeated resolution
const compilerCache = new Map<string, typeof import("svelte/compiler")>();

async function getCompiler(filePath: string) {
  const dir = dirname(filePath);
  if (compilerCache.has(dir)) return compilerCache.get(dir)!;
  const resolved = Bun.resolveSync("svelte/compiler", dir);
  const compiler = await import(resolved);
  compilerCache.set(dir, compiler);
  return compiler;
}

plugin({
  name: "svelte-loader",
  setup(builder) {
    // Compile .svelte.js and .svelte.ts rune modules
    builder.onLoad(
      { filter: /\.svelte\.[jt]s$/ },
      async ({ path }) => {
        const compiler = await getCompiler(path);
        const source = readFileSync(path, "utf-8");
        const result = compiler.compileModule(source, {
          filename: path,
          dev: false,
        });
        return { contents: result.js.code, loader: "js" };
      },
    );

    // Compile .svelte component files
    builder.onLoad({ filter: /\.svelte(\?[^.]+)?$/ }, async ({ path }) => {
      const filePath = path.includes("?")
        ? path.substring(0, path.indexOf("?"))
        : path;
      const compiler = await getCompiler(filePath);
      const source = readFileSync(filePath, "utf-8");

      const result = compiler.compile(source, {
        filename: filePath,
        generate: "client",
        dev: true,
        css: "injected",
        experimental: { async: true },
      });

      return { contents: result.js.code, loader: "js" };
    });
  },
});
