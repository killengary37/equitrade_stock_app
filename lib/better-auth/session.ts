import { headers } from "next/headers";
import { auth } from "@/lib/better-auth/auth";

export const getServerSession = async () => {
    return auth.api.getSession({ headers: await headers() });
};