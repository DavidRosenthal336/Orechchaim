import { NextResponse, type NextRequest } from "next/server";
import { consumeMagicToken, findOrCreateUser } from "@/lib/auth";
import { createSession } from "@/lib/session";
import type { Role } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=invalid", req.url));
  }

  const email = await consumeMagicToken(token);
  if (!email) {
    return NextResponse.redirect(new URL("/login?error=expired", req.url));
  }

  const user = await findOrCreateUser(email);
  await createSession(user.id, user.role as Role);

  const destination = user.role === "REBBE" ? "/rebbe" : "/today";
  return NextResponse.redirect(new URL(destination, req.url));
}
