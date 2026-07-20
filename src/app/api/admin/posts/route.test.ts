import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  readSessionUser: vi.fn(),
  listAdminPosts: vi.fn(),
  parseAdminPostBody: vi.fn(),
  validatePrePublishRequirements: vi.fn(),
  createPost: vi.fn(),
  writeAdminAuditLog: vi.fn(),
}));

vi.mock("@/lib/server/auth/session", () => ({
  readSessionUser: mocks.readSessionUser,
}));

vi.mock("@/lib/server/blog/post-service", () => ({
  listAdminPosts: mocks.listAdminPosts,
  parseAdminPostBody: mocks.parseAdminPostBody,
  validatePrePublishRequirements: mocks.validatePrePublishRequirements,
  createPost: mocks.createPost,
  mapAdminPost: (row: unknown) => row,
}));

vi.mock("@/lib/server/audit-log", () => ({
  writeAdminAuditLog: mocks.writeAdminAuditLog,
}));

import { GET, POST } from "@/app/api/admin/posts/route";

describe("/api/admin/posts governance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.listAdminPosts.mockResolvedValue([]);
    mocks.validatePrePublishRequirements.mockReturnValue({ ok: true });
  });

  it("GET returns 401 for unauthenticated", async () => {
    mocks.readSessionUser.mockResolvedValue(null);
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it("POST forbids reviewer create action with explicit message", async () => {
    mocks.readSessionUser.mockResolvedValue({ id: "u1", role: "reviewer" });
    const response = await POST(
      new Request("http://localhost/api/admin/posts", {
        method: "POST",
        body: JSON.stringify({}),
      })
    );
    const body = await response.json();
    expect(response.status).toBe(403);
    expect(body.message).toContain("اجازه ایجاد");
    expect(mocks.writeAdminAuditLog).toHaveBeenCalled();
  });

  it("POST blocks publish when pre-publish metadata is missing", async () => {
    mocks.readSessionUser.mockResolvedValue({ id: "u2", role: "admin" });
    mocks.parseAdminPostBody.mockReturnValue({
      ok: true,
      data: { status: "published", slug: "x", title: "t", body: "b" },
    });
    mocks.validatePrePublishRequirements.mockReturnValue({
      ok: false,
      message: "برای انتشار مقاله...",
      missing: ["metaTitle"],
    });

    const response = await POST(
      new Request("http://localhost/api/admin/posts", {
        method: "POST",
        body: JSON.stringify({}),
      })
    );
    expect(response.status).toBe(400);
    expect(mocks.createPost).not.toHaveBeenCalled();
    expect(mocks.writeAdminAuditLog).toHaveBeenCalled();
  });
});
