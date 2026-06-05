import { GET } from "@/app/api/health/route";
import { parseJsonResponse } from "../../helpers/parse-response";

describe("Integration — GET /api/health", () => {
  it("returns lightweight ok payload", async () => {
    const response = await GET(new Request("http://localhost/api/health"));
    const { status, json } = await parseJsonResponse<{
      healthy?: boolean;
      status: string;
    }>(response);

    expect(status).toBe(200);
    expect(json.status).toBeDefined();
  });

  it("rejects detailed probe without secret when configured", async () => {
    const previous = process.env.HEALTH_CHECK_SECRET;
    process.env.HEALTH_CHECK_SECRET = "test-health-secret";

    try {
      const response = await GET(
        new Request("http://localhost/api/health?detailed=1")
      );
      expect(response.status).toBe(401);
    } finally {
      process.env.HEALTH_CHECK_SECRET = previous;
    }
  });
});
