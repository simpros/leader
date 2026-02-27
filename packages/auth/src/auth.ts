import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, organization } from "better-auth/plugins";
import { db, schema } from "@leader/db";
import { sendEmail } from "./email";

const baseURL =
  process.env.BETTER_AUTH_BASE_URL ?? "http://localhost:5173";
const secret = process.env.BETTER_AUTH_SECRET ?? "dev-secret-change-me";

export const auth = betterAuth({
  baseURL,
  secret,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your email address",
        html: `Click the link to verify your email: <a href="${url}">${url}</a>`,
      });
    },
  },
  plugins: [
    admin(),
    organization({
      sendInvitationEmail: async (data) => {
        const inviteLink = `${baseURL}/accept-invitation/${data.id}`;
        await sendEmail({
          to: data.email,
          subject: "You've been invited to join an organization",
          html: `You've been invited by ${data.inviter.user.name} to join ${data.organization.name}.<br><br>Click the link to accept: <a href="${inviteLink}">${inviteLink}</a>`,
        });
      },
    }),
  ],
});
