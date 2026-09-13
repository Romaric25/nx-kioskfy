import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { users as userTable } from "./db/auth-schema";
import { hashPassword, verifyPassword } from "./lib/argon2";
import { APIError } from "better-auth/api";
import {
  ac,
  admin,
  editor,
  member,
  owner,
  superadmin,
  user as userRole,
} from "./lib/permissions";
import {
  openAPI,
  organization,
  admin as adminPlugin,
} from "better-auth/plugins";
import { expo } from "@better-auth/expo";

const isProduction = process.env.NODE_ENV === "production";

export const auth = betterAuth({
  baseURL: isProduction ? process.env.APP_URL : "http://localhost:3000",
  basePath: "/api/auth",
  socialProviders: {
    google: {
      accessType: "offline",
      prompt: "select_account consent",
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
    facebook: {
      clientId: process.env.FACEBOOK_CLIENT_ID as string,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET as string,
      scopes: ["email", "public_profile", "user_friends"],
      fields: ["user_friends"],
    },
  },
  database: drizzleAdapter(db, {
    provider: "mysql",
  }),
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003",
    "https://kioskfy.com",
    "https://*.kioskfy.com",
    "http://kioskfy.com",
    "http://*.kioskfy.com",
    "kioskfy://",
    "exp://",
    "exp://**",
    "exp://192.168.*.*:*/",
  ],
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          // Récupérer l'utilisateur pour vérifier son type et son statut de vérification d'email
          const [user] = await db
            .select()
            .from(userTable)
            .where(eq(userTable.id, session.userId))
            .limit(1);

          if (!user) {
            return { data: session };
          }

          // Vérifier si l'utilisateur est une agence et si l'email n'est pas vérifié
          if (user.typeUser === "agency" && !user.emailVerified) {
            throw new APIError("FORBIDDEN", {
              message:
                "Veuillez vérifier votre adresse email avant de vous connecter.",
            });
          }

          return { data: session };
        },
      },
    },
  },
  rateLimit: {
    enabled: false,
  },
  // emailVerification géré manuellement dans UsersController.createPartnership
  emailAndPassword: {
    enabled: true,
    autoSignIn: false, // Désactivé pour permettre l'envoi d'email de vérification
    requireEmailVerification: false,
    sendVerificationEmailOnSignUp: false, // Désactivé car géré manuellement
    minPasswordLength: 8,
    maxPasswordLength: 128,
    password: {
      hash: hashPassword,
      verify: verifyPassword,
    },
    sendResetPassword: async ({ user, url }) => {
   
    },
  },
  user: {
    modelName: "users",
    additionalFields: {
      phone: {
        type: "string",
        required: false,
        unique: false,
        input: true,
        defaultValue: "",
      },
      lastName: {
        type: "string",
        required: false,
        input: true,
        defaultValue: "",
      },
      role: {
        type: "string",
        required: false,
        input: true,
      },
      isActive: {
        type: "boolean",
        required: false,
        defaultValue: false,
      },
      typeUser: {
        type: "string",
        required: false,
        defaultValue: "client",
        input: true,
      },
      address: {
        type: "string",
        required: false,
      },
    },
    changeEmail: {
      enabled: true,
    },
  },
  session: {
      modelName: "sessions",
      cookieCache: {
        enabled: true,
        maxAge: 60 * 60 * 24 * 30, // 30 jours
      },
    },
  account: {
    modelName: "accounts",
    accountLinking: {
      enabled: true,
      trustedProviders: ["facebook", "google"],
    },
  },
  verification: {
    modelName: "verifications",
  },
  // Add any additional Better Auth configuration here
  // plugins: [],
  plugins: [
    openAPI(),
    expo(),
    organization({
      teams: {
        enabled: true,
      },
      ac,
      roles: {
        owner,
        admin,
        member,
        editor,
      },
      schema: {
        organization: {
          modelName: "organizations",
          additionalFields: {
            email: {
              type: "string",
              required: false,
              unique: true,
              input: true,
            },
            phone: {
              type: "string",
              required: true,
              unique: true,
              input: true,
            },
            country: {
              type: "string",
              required: true,
              input: true,
            },
            price: {
              type: "number",
              required: false,
              input: true,
            },
            address: {
              type: "string",
              required: true,
              input: true,
            },
            suspended: {
              type: "boolean",
              required: false,
              input: true,
            },
            suspendedReason: {
              type: "string",
              required: false,
              input: true,
            },
            suspendedUntil: {
              type: "date",
              required: false,
              input: true,
            },
            description: {
              type: "string",
              required: true,
              input: true,
            },
            logoUploadId: {
              type: "number",
              required: false,
              input: true,
            },
          },
        },
        team: {
          modelName: "teams",
        },
        teamMember: {
          modelName: "team_members",
        },
        member: {
          modelName: "members",
        },
        invitation: {
          modelName: "invitations",
        },
      },
      organizationHooks: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        beforeCreateOrganization: async ({ organization }) => {
          /* return {
                      data: {
                        ...organization,
                        metadata: {
                          //customField: "value",
                        },
                      },
                    }*/
        },
      },
      allowUserToCreateOrganization: async (authUser) => {
        const [fullUser] = await db
          .select()
          .from(userTable)
          .where(eq(userTable.id, authUser.id))
          .limit(1);

        if (!fullUser) {
          return false;
        }

        if (!fullUser.isActive) {
          return false;
        }

        return fullUser.typeUser === "agency";
      },
      dynamicAccessControl: {
        enabled: true,
      },
      requireEmailVerificationOnInvitation: true,
    }),
    adminPlugin({
      adminRoles: ["admin", "superadmin"],
      defaultRole: "user",
      defaultBanReason: "Spamming",
      bannedUserMessage: "Vous avez été banni pour de cette application",
      ac,
      roles: {
        admin,
        user: userRole,
        superadmin,
        owner,
        member,
      },
    }),
    // emailOTP plugin removed to avoid conflict with link-based verification
  ],
  advanced: {
    ipAddress: {
      ipAddressHeaders: ["x-client-ip", "x-forwarded-for"],
      disableIpTracking: false,
    },
    cookiePrefix: "kioskfy",
    // Cross-subdomain cookies only in production. On localhost, cookies with
    // Domain=kioskfy.com are rejected by the browser, which silently breaks
    // the session (get-session returns null even after a successful sign-in).
    ...(isProduction
      ? {
          crossSubDomainCookies: {
            enabled: true,
            domain: "kioskfy.com",
          },
        }
      : {}),
  },
});
// Type exports for use in other parts of the application
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;