import createIntlMiddleware from "next-intl/middleware";
import { NextRequest } from "next/server";
import { locales } from "./i18n";

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale: "en",
  localePrefix: "always",
});

export default function middleware(request: NextRequest) {
  return intlMiddleware(request);
}

export const config = {
  matcher: ["/", "/(th|en)/:path*"],
};
