import { authClient } from "@leader/auth/client";

export type OrgMember = {
	id: string;
	userId: string;
	role: string;
	createdAt: string;
	user: {
		id: string;
		name: string;
		email: string;
		image: string | null;
	};
};

export type OrgInvitation = {
	id: string;
	email: string;
	role: string | null;
	status: string;
	expiresAt: string;
	createdAt: string;
};

export type StatusMessage = {
	type: "success" | "error";
	text: string;
};

export function createOrganizationState() {
	let members = $state<OrgMember[]>([]);
	let invitations = $state<OrgInvitation[]>([]);
	let loading = $state(true);

	const pendingInvitations = $derived(
		invitations.filter((inv) => inv.status === "pending")
	);

	async function load() {
		loading = true;
		const { data } = await authClient.organization.getFullOrganization();
		if (data?.members) {
			members = data.members as unknown as OrgMember[];
		}
		if (data?.invitations) {
			invitations = data.invitations as unknown as OrgInvitation[];
		}
		loading = false;
	}

	return {
		get members() {
			return members;
		},
		get pendingInvitations() {
			return pendingInvitations;
		},
		get loading() {
			return loading;
		},
		load,
	};
}

export type OrganizationState = ReturnType<typeof createOrganizationState>;
