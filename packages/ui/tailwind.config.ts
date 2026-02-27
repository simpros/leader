import type { Config } from "tailwindcss";
import sharedConfig from "@leader/tailwind-config";

const config: Config = {
  content: ["./src/**/*.{svelte,ts,js}"],
  theme: {
    ...sharedConfig.theme,
  },
  plugins: [...(sharedConfig.plugins ?? [])],
};

export default config;
