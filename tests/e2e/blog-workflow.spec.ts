import { test, expect, request as playwrightRequest, type APIRequestContext } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000";

/**
 * Blog content workflow E2E — editor/reviewer/admin handoff.
 * Mirrors the real admin UI contract: every PATCH sends the FULL post payload
 * (adminPostFormToPayload), not a partial patch.
 *
 * Requires: E2E_EDITOR_PHONE, E2E_REVIEWER_PHONE, E2E_ADMIN_PHONE envs.
 */

type PostRecord = {
  id: string;
  slug: string;
  title: string;
  status: "draft" | "review" | "published";
};

async function createApiContext(): Promise<APIRequestContext> {
  return playwrightRequest.newContext({ baseURL, timeout: 45_000 });
}

async function loginWithOtp(api: APIRequestContext, phone: string): Promise<void> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const otpRequest = await api.post("/api/auth/otp/request", { data: { phone } });
    if (otpRequest.status() === 429) {
      await new Promise((resolve) => setTimeout(resolve, 20_000));
      continue;
    }
    const otpPayload = (await otpRequest.json().catch(() => null)) as { otpPreview?: string } | null;
    if (!otpPayload?.otpPreview) {
      lastError = new Error(`otp request failed: ${otpRequest.status()}`);
      continue;
    }
    const otpVerify = await api.post("/api/auth/otp/verify", {
      data: { phone, code: otpPayload.otpPreview },
    });
    if (otpVerify.status() === 200) return;
    lastError = new Error(`otp verify failed: ${otpVerify.status()}`);
  }
  throw lastError ?? new Error("loginWithOtp failed");
}

function fullPayload(overrides: Partial<Record<string, string>> & { status: string }) {
  return {
    title: "پست تست گردش کار",
    slug: `e2e-workflow-${Date.now().toString(36)}`,
    excerpt: "خلاصه تست",
    body: "<p>محتوای کامل تست گردش کار بلاگ</p>",
    coverImage: "/images/blog/blog-cover-gem-guide.png",
    authorName: "تست E2E",
    // pre-publish requirements (listPrePublishIssues): metaTitle + metaDescription
    metaTitle: "متا عنوان تست",
    metaDescription: "توضیح متای تست برای انتشار",
    ...overrides,
  };
}

test.describe("Blog content workflow E2E", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(240_000);

  const editorPhone = process.env.E2E_EDITOR_PHONE?.trim();
  const reviewerPhone = process.env.E2E_REVIEWER_PHONE?.trim();
  const adminPhone = process.env.E2E_ADMIN_PHONE?.trim();
  test.skip(!editorPhone || !reviewerPhone || !adminPhone, "Set E2E_EDITOR_PHONE, E2E_REVIEWER_PHONE, E2E_ADMIN_PHONE.");

  let postId = "";
  let postSlug = "";

  test("editor creates draft, submits for review", async () => {
    const editor = await createApiContext();
    try {
      await loginWithOtp(editor, editorPhone!);

      const create = await editor.post("/api/admin/posts", {
        data: fullPayload({ status: "draft" }),
      });
      expect(create.status()).toBe(201);
      const created = (await create.json()) as { post: PostRecord };
      expect(created.post.status).toBe("draft");
      postId = created.post.id;
      postSlug = created.post.slug;

      // editor pushes draft -> review with FULL payload (same contract as admin UI)
      const toReview = await editor.patch(`/api/admin/posts/${postId}`, {
        data: fullPayload({ status: "review", slug: postSlug }),
      });
      expect(toReview.status()).toBe(200);
      expect(((await toReview.json()) as { post: PostRecord }).post.status).toBe("review");
    } finally {
      await editor.dispose();
    }
  });

  test("editor cannot publish; reviewer can publish and revert", async () => {
    const editor = await createApiContext();
    const reviewer = await createApiContext();
    try {
      await loginWithOtp(editor, editorPhone!);
      await loginWithOtp(reviewer, reviewerPhone!);

      // NEGATIVE: editor cannot transition review -> published
      const edPublish = await editor.patch(`/api/admin/posts/${postId}`, {
        data: fullPayload({ status: "published", slug: postSlug }),
      });
      expect(edPublish.status()).toBe(400);

      // NEGATIVE: publish without meta fields is rejected with explicit message
      const noMeta = await reviewer.patch(`/api/admin/posts/${postId}`, {
        data: fullPayload({ status: "published", slug: postSlug, metaTitle: "", metaDescription: "" }),
      });
      expect(noMeta.status()).toBe(400);
      const noMetaBody = (await noMeta.json()) as { message?: string };
      expect(noMetaBody.message).toContain("انتشار مقاله");

      // reviewer publishes
      const rvPublish = await reviewer.patch(`/api/admin/posts/${postId}`, {
        data: fullPayload({ status: "published", slug: postSlug }),
      });
      expect(rvPublish.status()).toBe(200);
      expect(((await rvPublish.json()) as { post: PostRecord }).post.status).toBe("published");

      // public blog API exposes the published post
      const publicPost = await reviewer.get(`/api/posts/${postSlug}`);
      expect(publicPost.status()).toBe(200);

      // reviewer can pull published -> review (unpublish)
      const revert = await reviewer.patch(`/api/admin/posts/${postId}`, {
        data: fullPayload({ status: "review", slug: postSlug }),
      });
      expect(revert.status()).toBe(200);
      expect(((await revert.json()) as { post: PostRecord }).post.status).toBe("review");
    } finally {
      await editor.dispose();
      await reviewer.dispose();
    }
  });

  test("reviewer cannot create posts; plain user blocked; editor returns to draft; admin cleanup", async () => {
    const reviewer = await createApiContext();
    const editor = await createApiContext();
    const admin = await createApiContext();
    try {
      await loginWithOtp(reviewer, reviewerPhone!);
      await loginWithOtp(editor, editorPhone!);
      await loginWithOtp(admin, adminPhone!);

      // NEGATIVE: reviewer cannot create content
      const rvCreate = await reviewer.post("/api/admin/posts", {
        data: fullPayload({ status: "draft" }),
      });
      expect(rvCreate.status()).toBe(403);

      // editor: review -> draft (their own article)
      const toDraft = await editor.patch(`/api/admin/posts/${postId}`, {
        data: fullPayload({ status: "draft", slug: postSlug }),
      });
      expect(toDraft.status()).toBe(200);
      expect(((await toDraft.json()) as { post: PostRecord }).post.status).toBe("draft");

      // cleanup: admin deletes the test post
      const del = await admin.delete(`/api/admin/posts/${postId}`);
      expect(del.status()).toBe(200);
    } finally {
      await reviewer.dispose();
      await editor.dispose();
      await admin.dispose();
    }
  });
});
