import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ parent }) => {
  const { memberRole } = await parent();

  if (memberRole !== "owner" && memberRole !== "admin") {
    error(
      403,
      "You don't have permission to access organisation settings."
    );
  }
};
