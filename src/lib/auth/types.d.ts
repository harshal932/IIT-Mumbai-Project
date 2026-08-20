import "next-auth";
import type { UserRole } from "@/lib/types";

declare module "next-auth" {
  interface User {
    id?: string;
    role?: UserRole;
    isRestricted?: boolean;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: UserRole;
      isRestricted?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole;
    isRestricted?: boolean;
  }
}
