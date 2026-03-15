import type { LayoutServerLoad } from "./$types";
import { env } from "$env/dynamic/private";

export const load: LayoutServerLoad = () => {
  return {
    allowSignUp: env.ALLOW_SIGN_UP === "true",
  };
};
