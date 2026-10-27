import { redirect } from "next/navigation";
import { getCurrentUser } from "./api";
import type { User } from "./types";

export async function requireUser(nextPath: string): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(nextPath)}`);
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?next=%2Fadmin");
  if (user.role !== "admin") redirect("/");
  return user;
}
