import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  readSessionUser: vi.fn(),
  postFindUnique: vi.fn(),
  parseAdminPostBody: vi.fn(),
  validatePrePublishRequirements: vi.fn(),
  updatePost: vi.fn(),
  deletePost: vi.fn(),
  writeAdminAuditLog: vi.fn(),
}));

vi.mock("@/lib/server/auth/session", () => ({
  readSessionUser: mocks.readSessionUser,
}));

vi.mock("@/lib/server/prisma", () => ({
  prisma: {
    post: {
      findUnique: mocks.postFindUnique,
    },
  },
}));

vi.mock("@/lib/server/blog/post-service", () => ({
  parseAdminPostBody: mocks.parseAdminPostBody,
  validatePrePublishRequirements: mocks.validatePrePublishRequirements,
  updatePost: mocks.updatePost,
  deletePost: mocks.deletePost,
  mapAdminPost: (row: unknown) => row,
}));

vi.mock("@/lib/server/audit-log", () => ({
  writeAdminAuditLog: mocks.writeAdminAuditLog,
}));

import { DELETE, PATCH } from "@/app/api/admin/posts/[id]/route";

describe("/api/admin/posts/[id] governance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.validatePrePublishRequirements.mockReturnValue({ ok: true });
  });

  it("PATCH returns 401 for unauthenticated", async () => {
    mocks.readSessionUser.mockResolvedValue(null);
    const response = await PATCH(
      new Request("http://localhost/api/admin/posts/p1", { method: "PATCH", body: "{}" }),
      { params: Promise.resolve({ id: "p1" }) }
    );
    expect(response.status).toBe(401);
  });

  it("PATCH blocks out-of-scope transition with explicit message", async () => {
    mocks.readSessionUser.mockResolvedValue({ id: "u1", role: "editor" });
    mocks.postFindUnique.mockResolvedValue({ id: "p1", status: "review" });
    mocks.parseAdminPostBody.mockReturnValue({
      ok: true,
      data: { status: "published", slug: "x", title: "x", body: "x" },
    });

    const response = await PATCH(
      new Request("http://localhost/api/admin/posts/p1", { method: "PATCH", body: "{}" }),
      { params: Promise.resolve({ id: "p1" }) }
    );
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.message).toContain("تغییر وضعیت");
    expect(mocks.writeAdminAuditLog).toHaveBeenCalled();
  });

  it("PATCH blocks publish when pre-publish checks fail", async () => {
    mocks.readSessionUser.mockResolvedValue({ id: "u2", role: "reviewer" });
    mocks.postFindUnique.mockResolvedValue({ id: "p1", status: "review" });
    mocks.parseAdminPostBody.mockReturnValue({
      ok: true,
      data: { status: "published", slug: "x", title: "x", body: "x" },
    });
    mocks.validatePrePublishRequirements.mockReturnValue({
      ok: false,
      message: "برای انتشار مقاله...",
      missing: ["metaDescription"],
    });

    const response = await PATCH(
      new Request("http://localhost/api/admin/posts/p1", { method: "PATCH", body: "{}" }),
      { params: Promise.resolve({ id: "p1" }) }
    );
    expect(response.status).toBe(400);
    expect(mocks.updatePost).not.toHaveBeenCalled();
  });

  it("DELETE forbids non-admin users", async () => {
    mocks.readSessionUser.mockResolvedValue({ id: "u3", role: "editor" });
    const response = await DELETE(
      new Request("http://localhost/api/admin/posts/p1", { method: "DELETE" }),
      { params: Promise.resolve({ id: "p1" }) }
    );
    expect(response.status).toBe(403);
    expect(mocks.writeAdminAuditLog).toHaveBeenCalled();
  });
});
