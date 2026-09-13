import { Reader } from "@maxmind/geoip2-node";
import path from "path";

let readerModel: Awaited<ReturnType<typeof Reader.open>> | null = null;

async function getReader() {
  if (readerModel) return readerModel;

  try {
    const dbPath = path.join(process.cwd(), "data", "GeoLite2-Country.mmdb");
    readerModel = await Reader.open(dbPath);
    return readerModel;
  } catch (error) {
    console.error("Erreur MaxMind GeoLite2:", error);
    return null;
  }
}

export interface GeoIPInfo {
  country: string | null;
  countryCode: string | null;
  continent: string | null;
  continentCode: string | null;
}

export async function getGeoIPInfo(ip: string): Promise<GeoIPInfo | null> {
  if (!ip || ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
    return { country: "Local", countryCode: "LOCAL", continent: null, continentCode: null };
  }

  const r = await getReader();
  if (!r) return fetchFromFallback(ip);

  try {
    const result = r.country(ip);
    if (!result?.country) return null;

    return {
      country: result.country.names?.fr || result.country.names?.en || null,
      countryCode: result.country.isoCode || null,
      continent: result.continent?.names?.fr || result.continent?.names?.en || null,
      continentCode: result.continent?.code || null,
    };
  } catch {
    return fetchFromFallback(ip);
  }
}

async function fetchFromFallback(ip: string): Promise<GeoIPInfo | null> {
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,continent,continentCode`);
    const data = (await res.json()) as any;
    if (data.status !== "success") return null;
    return { country: data.country, countryCode: data.countryCode, continent: data.continent, continentCode: data.continentCode };
  } catch {
    return null;
  }
}

export async function getCountryCode(ip: string): Promise<string | null> {
  const info = await getGeoIPInfo(ip);
  return info?.countryCode || null;
}

export async function getCountryName(ip: string): Promise<string | null> {
  const info = await getGeoIPInfo(ip);
  return info?.country || null;
}

export function countryCodeToFlag(countryCode: string | null): string {
  if (!countryCode || countryCode === "LOCAL") return "🏠";
  const codePoints = countryCode.toUpperCase().split("").map((c) => 127397 + c.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
