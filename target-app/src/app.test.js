const request = require("supertest");
const app = require("./app");

describe("Target Application API Endpoints", () => {
  it("GET /health should return status UP", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual("UP");
  });

  it("GET /api/hello should return greeting message", async () => {
    const res = await request(app).get("/api/hello");
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toContain("Hello from DevSecOps Target Application!");
  });
});
