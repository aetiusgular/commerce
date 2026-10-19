import { cookies, headers } from "next/headers";
import {
  COUNTRY_COOKIE,
  normalizeCountry,
  type CountryCode,
} from "./localization-shared";

export {
  COUNTRIES,
  COUNTRY_COOKIE,
  DEFAULT_COUNTRY,
  normalizeCountry,
  type CountryCode,
} from "./localization-shared";

// Buyer's country: explicit picker choice (cookie) first, then Vercel's
// geo-IP header, then US. Reading cookies/headers makes the caller dynamic.
export async function getCountry(): Promise<CountryCode> {
  const fromCookie = (await cookies()).get(COUNTRY_COOKIE)?.value;
  if (fromCookie) return normalizeCountry(fromCookie);
  return normalizeCountry((await headers()).get("x-vercel-ip-country"));
}
