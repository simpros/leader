import { browser } from "$app/environment";
import type { LayoutLoad } from "./$types";

export const load: LayoutLoad = async ({ data }) => {
  return {
    user: data.user,
    memberRole: data.memberRole,
    session: data.session
      ? { activeOrganizationId: data.session.activeOrganizationId }
      : null,
    locale: browser ? navigator.language : (data.requestLocale ?? "en-US"),
  };
};
