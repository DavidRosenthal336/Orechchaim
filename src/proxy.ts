import { NextResponse, type NextRequest } from "next/server";
import { decrypt, SESSION_COOKIE } from "@/lib/session";

// Optimistic route protection only — reads the session cookie, never the DB.
// The real authorization boundary lives in the Data Access Layer (lib/dal.ts),
// which every protected page/action calls.

const PUBLIC_PATHS = ["/", "/login"];
const PROTECTED_PREFIXES = [
  "/today",
  "/rebbe",
  "/settings",
  "/checklists",
  "/history",
];

function homeFor(role: string | undefined): string {
  return role === "REBBE" ? "/rebbe" : "/today";
}

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const session = await decrypt(req.cookies.get(SESSION_COOKIE)?.value);

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );

  if (isProtected && !session?.userId) {
    const url = new URL("/login", req.nextUrl);
    return NextResponse.redirect(url);
  }

  // Signed-in users shouldn't see the login page.
  if (session?.userId && PUBLIC_PATHS.includes(path)) {
    return NextResponse.redirect(new URL(homeFor(session.role), req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|icons|.*\\.png$|.*\\.svg$).*)",
  ],
};
