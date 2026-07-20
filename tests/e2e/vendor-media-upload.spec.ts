import { test, expect } from "@playwright/test";
import sharp from "sharp";

function randomIranPhone(): string {
  const suffix = Math.floor(Math.random() * 1_000_000_000)
    .toString()
    .padStart(9, "0");
  return `09${suffix}`;
}

test.describe("Vendor Media Upload", () => {
  test.setTimeout(120_000);

  test("rejects unauthenticated upload", async ({ request }) => {
    const response = await request.post("/api/vendor/media", {
      multipart: {
        file: {
          name: "ring.png",
          mimeType: "image/png",
          buffer: Buffer.from([137, 80, 78, 71]),
        },
      },
    });
    expect(response.status()).toBe(401);
  });

  test("allows vendor member to upload image", async ({ request }) => {
    const phone = randomIranPhone();

    const otpRequest = await request.post("/api/auth/otp/request", {
      data: { phone },
    });
    expect(otpRequest.status()).toBe(200);
    const otpPayload = (await otpRequest.json()) as { otpPreview?: string };
    expect(otpPayload.otpPreview).toBeTruthy();

    const otpVerify = await request.post("/api/auth/otp/verify", {
      data: { phone, code: otpPayload.otpPreview },
    });
    expect(otpVerify.status()).toBe(200);

    const applyVendor = await request.post("/api/vendor/apply", {
      data: { displayName: `Vendor ${Date.now()}` },
    });
    expect(applyVendor.status()).toBe(201);

    const validPngBuffer = await sharp({
      create: {
        width: 640,
        height: 640,
        channels: 3,
        background: { r: 210, g: 180, b: 140 },
      },
    })
      .png()
      .toBuffer();

    const upload = await request.post("/api/vendor/media", {
      multipart: {
        file: {
          name: "vendor-image.png",
          mimeType: "image/png",
          buffer: validPngBuffer,
        },
      },
    });
    expect(upload.status()).toBe(200);
    const payload = (await upload.json()) as {
      asset?: { url?: string; canonicalUrl?: string };
    };
    expect(payload.asset?.canonicalUrl).toMatch(/^\/uploads\/vendor-media\/.+\.webp$/);
  });
});
