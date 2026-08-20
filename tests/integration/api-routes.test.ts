import { describe, it, expect } from "vitest";

const BASE_URL = "http://localhost:3000";

describe("LocalLoop API Route Integration Tests", () => {
  it("GET /api/problems — should return paginated problems list", async () => {
    const res = await fetch(`${BASE_URL}/api/problems`);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("items");
    expect(Array.isArray(json.items)).toBe(true);
  });

  it("GET /api/problems with search filter", async () => {
    const res = await fetch(`${BASE_URL}/api/problems?search=pothole`);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("items");
  });

  it("GET /api/search — should return problems and locations", async () => {
    const res = await fetch(`${BASE_URL}/api/search?q=5th`);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("problems");
    expect(json).toHaveProperty("locations");
  });

  it("GET /api/organizations — should return organization list", async () => {
    const res = await fetch(`${BASE_URL}/api/organizations`);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("data");
    expect(Array.isArray(json.data)).toBe(true);
  });

  it("POST /api/users — should register new account", async () => {
    const testEmail = `test_${Date.now()}@example.com`;
    const res = await fetch(`${BASE_URL}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "API Tester",
        email: testEmail,
        password: "Password123!",
        confirmPassword: "Password123!",
      }),
    });

    expect([201, 429]).toContain(res.status);
  });

  it("GET /api/problems/sample-1 — should return problem detail", async () => {
    const res = await fetch(`${BASE_URL}/api/problems/sample-1`);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("data");
    expect(json.data).toHaveProperty("problem");
    expect(json.data.problem.id).toBe("sample-1");
  });

  it("GET /api/problems/sample-1/comments — should return comment list", async () => {
    const res = await fetch(`${BASE_URL}/api/problems/sample-1/comments`);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("items");
  });

  it("POST /api/problems/sample-1/help-offers — should accept a demo help offer", async () => {
    const res = await fetch(`${BASE_URL}/api/problems/sample-1/help-offers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        helpTypes: ["information"],
        message: "I can share the city work-order number from last week.",
        isPrivate: true,
      }),
    });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data).toHaveProperty("id");
  });

  it("POST /api/problems/sample-1/verify — should accept a demo ground-truth verification", async () => {
    const res = await fetch(`${BASE_URL}/api/problems/sample-1/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        verificationType: "confirm",
        note: "I walked this corner last night and it is still unlit.",
      }),
    });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data).toHaveProperty("id");
  });

  it("POST /api/admin/reports — should submit a report", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contentType: "comment",
        contentId: "comment-1",
        reason: "spam",
        description: "Test report submission",
      }),
    });

    expect([201, 401]).toContain(res.status);
  });

  it("GET /api/admin/reports — moderator queue check", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/reports`);
    expect([200, 401, 403]).toContain(res.status);
  });
});
