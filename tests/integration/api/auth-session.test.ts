import { GET as getSession } from "@/app/api/auth/session/route";
import { GET as getSessionRole } from "@/app/api/auth/session-role/route";
import { parseJsonResponse } from "../../helpers/parse-response";
import { regularUser } from "../../fixtures/users";

jest.mock("@/lib/server/auth/session", () => ({
  readSessionUser: jest.fn(),
}));

import { readSessionUser } from "@/lib/server/auth/session";

describe("Integration — /api/auth/session*", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET /api/auth/session returns 401 without session", async () => {
    jest.mocked(readSessionUser).mockResolvedValue(null);
    const response = await getSession();
    expect(response.status).toBe(401);
  });

  it("GET /api/auth/session returns user payload", async () => {
    jest.mocked(readSessionUser).mockResolvedValue(regularUser as never);
    const response = await getSession();
    const { status, json } = await parseJsonResponse<{ user: { id: string; phone: string } }>(response);

    expect(status).toBe(200);
    expect(json.user.id).toBe(regularUser.id);
    expect(json.user.phone).toBe(regularUser.phone);
  });

  it("GET /api/auth/session-role returns role/blocked", async () => {
    jest.mocked(readSessionUser).mockResolvedValue({ ...regularUser, role: "admin", blocked: false } as never);
    const response = await getSessionRole();
    const { status, json } = await parseJsonResponse<{ role: string; blocked: boolean }>(response);

    expect(status).toBe(200);
    expect(json.role).toBe("admin");
    expect(json.blocked).toBe(false);
  });
});
