import { describe, it, expect } from "vitest";
import { haversineDistance, fuzzyCoordinate, isValidCoordinate, boundingBox } from "@/lib/utils/geo";
import { sanitizeText, sanitizeUrl, isSafeFilename, isAllowedMediaType } from "@/lib/utils/sanitize";
import { checkRateLimit } from "@/lib/services/rate-limiter";
import { hasPermission } from "@/lib/types";

describe("Geographic Utilities", () => {
  it("computes accurate Haversine distance", () => {
    // Distance between NYC (40.7128, -74.0060) and Philly (39.9526, -75.1652) is approx 130km
    const dist = haversineDistance(40.7128, -74.006, 39.9526, -75.1652);
    expect(dist).toBeGreaterThan(120);
    expect(dist).toBeLessThan(140);
  });

  it("validates coordinates correctly", () => {
    expect(isValidCoordinate(40.7128, -74.006)).toBe(true);
    expect(isValidCoordinate(95, 0)).toBe(false);
    expect(isValidCoordinate(0, 185)).toBe(false);
  });

  it("fuzzes coordinates within radius", () => {
    const lat = 40.7128;
    const lon = -74.006;
    const fuzzed = fuzzyCoordinate(lat, lon, 0.5);
    const dist = haversineDistance(lat, lon, fuzzed.lat, fuzzed.lon);
    expect(dist).toBeLessThanOrEqual(0.6); // within ~0.5km tolerance
  });

  it("creates bounding box correctly", () => {
    const bbox = boundingBox(40.7128, -74.006, 10);
    expect(bbox.minLat).toBeLessThan(40.7128);
    expect(bbox.maxLat).toBeGreaterThan(40.7128);
    expect(bbox.minLon).toBeLessThan(-74.006);
    expect(bbox.maxLon).toBeGreaterThan(-74.006);
  });
});

describe("Sanitization & Security Utilities", () => {
  it("strips HTML tags and XSS payloads", () => {
    const malicious = '<script>alert("xss")</script>Hello <b>World</b>';
    const clean = sanitizeText(malicious);
    expect(clean).not.toContain("<script>");
    expect(clean).not.toContain("<b>");
    expect(clean).toContain("Hello");
  });

  it("validates URLs safely", () => {
    expect(sanitizeUrl("https://example.com/path")).toBe("https://example.com/path");
    expect(sanitizeUrl("javascript:alert(1)")).toBeNull();
    expect(sanitizeUrl("invalid-url")).toBeNull();
  });

  it("checks safe filenames and MIME types", () => {
    expect(isSafeFilename("photo.jpg")).toBe(true);
    expect(isSafeFilename("../../../etc/passwd")).toBe(false);
    expect(isAllowedMediaType("image/jpeg")).toBe(true);
    expect(isAllowedMediaType("application/x-executable")).toBe(false);
  });
});

describe("RBAC Permissions Matrix", () => {
  it("enforces role permissions correctly", () => {
    expect(hasPermission("citizen", "problems:create")).toBe(true);
    expect(hasPermission("citizen", "admin:access")).toBe(false);
    expect(hasPermission("admin", "admin:access")).toBe(true);
    expect(hasPermission("moderator", "reports:review")).toBe(true);
  });
});

describe("In-Memory Rate Limiter", () => {
  it("allows requests under threshold and blocks overflow", async () => {
    const opts = { prefix: "test_limiter", limit: 3, windowSecs: 60 };
    const id = "user_123";

    expect((await checkRateLimit(id, opts)).allowed).toBe(true);
    expect((await checkRateLimit(id, opts)).allowed).toBe(true);
    expect((await checkRateLimit(id, opts)).allowed).toBe(true);
    expect((await checkRateLimit(id, opts)).allowed).toBe(false); // 4th request blocked
  });
});
