import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user?: DefaultSession["user"] & {
      id: string;
      role: "teacher" | "admin";
      subscriptionStatus: "pending" | "active" | "suspended" | "expired";
    };
  }

  interface User {
    role: "teacher" | "admin";
    subscriptionStatus: "pending" | "active" | "suspended" | "expired";
  }
}
