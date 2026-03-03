import { error } from "@sveltejs/kit";
import { db, eq, schema } from "@leader/db";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, locals }) => {
	const [invitation] = await db
		.select({
			id: schema.invitation.id,
			email: schema.invitation.email,
			role: schema.invitation.role,
			status: schema.invitation.status,
			expiresAt: schema.invitation.expiresAt,
			organizationName: schema.organization.name,
		})
		.from(schema.invitation)
		.innerJoin(
			schema.organization,
			eq(schema.invitation.organizationId, schema.organization.id)
		)
		.where(eq(schema.invitation.id, params.id))
		.limit(1);

	if (!invitation) {
		error(404, "Invitation not found");
	}

	return {
		invitation,
		user: locals.user ?? null,
	};
};
