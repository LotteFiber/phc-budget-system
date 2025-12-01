import { getServerSession } from "next-auth";
import { authConfig } from "./auth";

export async function auth() {
  return await getServerSession(authConfig);
}
