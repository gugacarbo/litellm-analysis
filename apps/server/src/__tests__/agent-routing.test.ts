import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestServer } from "./helpers/create-test-server";

const mockGetRouterSettings = vi.fn();
const mockUpdateRouterSettings = vi.fn();

describe("GET /agent-routing", () => {
  beforeEach(() => {
    mockGetRouterSettings.mockClear();
    mockUpdateRouterSettings.mockClear();
  });

  it("returns 200 with current config when exists", async () => {
    const mockConfig = {
      model_group_alias: {
        "litellm/glm-5": "glm-5",
        "kimi-k2.5": "kimi-k2-5",
      },
    };
    mockGetRouterSettings.mockResolvedValue(mockConfig);

    const { app } = await createTestServer({
      getAgentRoutingConfig: vi
        .fn()
        .mockImplementation(() => mockGetRouterSettings()),
      updateAgentRoutingConfig: vi
        .fn()
        .mockImplementation((config: Record<string, string>) =>
          mockUpdateRouterSettings(config),
        ),
    });
    const res = await request(app).get("/agent-routing");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockConfig);
  });

  it("returns 200 with empty object when not exists", async () => {
    mockGetRouterSettings.mockResolvedValue(null);

    const { app } = await createTestServer({
      getAgentRoutingConfig: vi
        .fn()
        .mockImplementation(() => mockGetRouterSettings()),
      updateAgentRoutingConfig: vi
        .fn()
        .mockImplementation((config: Record<string, string>) =>
          mockUpdateRouterSettings(config),
        ),
    });
    const res = await request(app).get("/agent-routing");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({});
  });

  it("returns 500 when database error occurs", async () => {
    mockGetRouterSettings.mockRejectedValue(
      new Error("Database connection failed"),
    );

    const { app } = await createTestServer({
      getAgentRoutingConfig: vi
        .fn()
        .mockImplementation(() => mockGetRouterSettings()),
      updateAgentRoutingConfig: vi
        .fn()
        .mockImplementation((config: Record<string, string>) =>
          mockUpdateRouterSettings(config),
        ),
    });
    const res = await request(app).get("/agent-routing");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Error: Database connection failed" });
  });
});

describe("PUT /agent-routing", () => {
  beforeEach(() => {
    mockGetRouterSettings.mockClear();
    mockUpdateRouterSettings.mockClear();
  });

  it("returns 200 with success true when saved successfully", async () => {
    const mockConfig = {
      "litellm/glm-5": "glm-5",
      "kimi-k2.5": "kimi-k2-5",
    };
    mockGetRouterSettings.mockResolvedValue({});
    mockUpdateRouterSettings.mockResolvedValue(undefined);

    const { app } = await createTestServer({
      getAgentRoutingConfig: vi
        .fn()
        .mockImplementation(() => mockGetRouterSettings()),
      updateAgentRoutingConfig: vi
        .fn()
        .mockImplementation((config: Record<string, string>) =>
          mockUpdateRouterSettings(config),
        ),
    });
    const res = await request(app)
      .put("/agent-routing")
      .send({ model_group_alias: mockConfig });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(mockUpdateRouterSettings).toHaveBeenCalledWith(mockConfig);
  });

  it("returns 400 when model_group_alias is not an object", async () => {
    const { app } = await createTestServer({
      getAgentRoutingConfig: vi
        .fn()
        .mockImplementation(() => mockGetRouterSettings()),
      updateAgentRoutingConfig: vi
        .fn()
        .mockImplementation((config: Record<string, string>) =>
          mockUpdateRouterSettings(config),
        ),
    });
    const res = await request(app)
      .put("/agent-routing")
      .send({ model_group_alias: "invalid-string" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "model_group_alias object is required" });
    expect(mockUpdateRouterSettings).not.toHaveBeenCalled();
  });

  it("returns 400 when model_group_alias is an array", async () => {
    const { app } = await createTestServer({
      getAgentRoutingConfig: vi
        .fn()
        .mockImplementation(() => mockGetRouterSettings()),
      updateAgentRoutingConfig: vi
        .fn()
        .mockImplementation((config: Record<string, string>) =>
          mockUpdateRouterSettings(config),
        ),
    });
    const res = await request(app)
      .put("/agent-routing")
      .send({ model_group_alias: ["model1", "model2"] });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "model_group_alias object is required" });
    expect(mockUpdateRouterSettings).not.toHaveBeenCalled();
  });

  it("returns 400 when model_group_alias is null", async () => {
    const { app } = await createTestServer({
      getAgentRoutingConfig: vi
        .fn()
        .mockImplementation(() => mockGetRouterSettings()),
      updateAgentRoutingConfig: vi
        .fn()
        .mockImplementation((config: Record<string, string>) =>
          mockUpdateRouterSettings(config),
        ),
    });
    const res = await request(app)
      .put("/agent-routing")
      .send({ model_group_alias: null });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "model_group_alias object is required" });
    expect(mockUpdateRouterSettings).not.toHaveBeenCalled();
  });

  it("returns 400 when model_group_alias is missing", async () => {
    const { app } = await createTestServer({
      getAgentRoutingConfig: vi
        .fn()
        .mockImplementation(() => mockGetRouterSettings()),
      updateAgentRoutingConfig: vi
        .fn()
        .mockImplementation((config: Record<string, string>) =>
          mockUpdateRouterSettings(config),
        ),
    });
    const res = await request(app)
      .put("/agent-routing")
      .send({ otherField: "value" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "model_group_alias object is required" });
    expect(mockUpdateRouterSettings).not.toHaveBeenCalled();
  });

  it("returns 400 when model_group_alias has non-string values", async () => {
    const { app } = await createTestServer({
      getAgentRoutingConfig: vi
        .fn()
        .mockImplementation(() => mockGetRouterSettings()),
      updateAgentRoutingConfig: vi
        .fn()
        .mockImplementation((config: Record<string, string>) =>
          mockUpdateRouterSettings(config),
        ),
    });
    const res = await request(app)
      .put("/agent-routing")
      .send({ model_group_alias: { "litellm/glm-5": 123 } });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "model_group_alias values must be strings",
    });
    expect(mockUpdateRouterSettings).not.toHaveBeenCalled();
  });

  it("returns 500 when database error occurs", async () => {
    mockUpdateRouterSettings.mockRejectedValue(new Error("Update failed"));

    const { app } = await createTestServer({
      getAgentRoutingConfig: vi
        .fn()
        .mockImplementation(() => mockGetRouterSettings()),
      updateAgentRoutingConfig: vi
        .fn()
        .mockImplementation((config: Record<string, string>) =>
          mockUpdateRouterSettings(config),
        ),
    });
    const res = await request(app)
      .put("/agent-routing")
      .send({ model_group_alias: { "litellm/glm-5": "glm-5" } });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Error: Update failed" });
  });
});
