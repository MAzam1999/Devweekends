import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { headersMock } = vi.hoisted(() => ({ headersMock: vi.fn() }));
vi.mock("next/headers", () => ({ headers: headersMock }));

const { dbMock } = vi.hoisted(() => ({
  dbMock: {
    course: { findUnique: vi.fn() },
    purchase: { upsert: vi.fn() },
  },
}));
vi.mock("@/lib/db", () => ({ db: dbMock }));

const { stripeMock } = vi.hoisted(() => ({
  stripeMock: { webhooks: { constructEvent: vi.fn() } },
}));
vi.mock("@/lib/stripe", () => ({ stripe: stripeMock }));

const { POST } = await import("./route");

function makeRequest(body: string, signature?: string) {
  return new NextRequest("http://localhost:3000/api/webhooks/stripe", {
    method: "POST",
    body,
  });
}

const course = { id: "course_1", price: 4999 };

beforeEach(() => {
  vi.clearAllMocks();
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_secret";
});

describe("POST /api/webhooks/stripe", () => {
  it("rejects requests with no stripe-signature header", async () => {
    headersMock.mockResolvedValue(new Map());

    const res = await POST(makeRequest("{}"));

    expect(res.status).toBe(400);
    expect(stripeMock.webhooks.constructEvent).not.toHaveBeenCalled();
  });

  it("rejects requests with an invalid signature", async () => {
    headersMock.mockResolvedValue(new Map([["stripe-signature", "bad_sig"]]));
    stripeMock.webhooks.constructEvent.mockImplementation(() => {
      throw new Error("signature mismatch");
    });

    const res = await POST(makeRequest("{}"));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain("signature mismatch");
  });

  it("ignores metadata-less checkout.session.completed events", async () => {
    headersMock.mockResolvedValue(new Map([["stripe-signature", "good_sig"]]));
    stripeMock.webhooks.constructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: { object: { metadata: {} } },
    });

    const res = await POST(makeRequest("{}"));

    expect(res.status).toBe(400);
    expect(dbMock.purchase.upsert).not.toHaveBeenCalled();
  });

  it("records a purchase (idempotently) on checkout.session.completed", async () => {
    headersMock.mockResolvedValue(new Map([["stripe-signature", "good_sig"]]));
    stripeMock.webhooks.constructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_1",
          payment_intent: "pi_test_1",
          amount_total: course.price,
          metadata: { courseId: course.id, userId: "user_db_1" },
        },
      },
    });
    dbMock.course.findUnique.mockResolvedValue(course);
    dbMock.purchase.upsert.mockResolvedValue({ id: "purchase_1" });

    const res = await POST(makeRequest("{}"));

    expect(res.status).toBe(200);
    expect(dbMock.purchase.upsert).toHaveBeenCalledWith({
      where: { userId_courseId: { userId: "user_db_1", courseId: course.id } },
      create: {
        userId: "user_db_1",
        courseId: course.id,
        stripeChargeId: "pi_test_1",
        amount: course.price,
      },
      update: {},
    });

    // Replaying the same event must not throw and must upsert (not duplicate-insert).
    const replay = await POST(makeRequest("{}"));
    expect(replay.status).toBe(200);
    expect(dbMock.purchase.upsert).toHaveBeenCalledTimes(2);
  });

  it("returns 404 when the course referenced in metadata no longer exists", async () => {
    headersMock.mockResolvedValue(new Map([["stripe-signature", "good_sig"]]));
    stripeMock.webhooks.constructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: {
        object: { metadata: { courseId: "missing_course", userId: "user_db_1" } },
      },
    });
    dbMock.course.findUnique.mockResolvedValue(null);

    const res = await POST(makeRequest("{}"));

    expect(res.status).toBe(404);
    expect(dbMock.purchase.upsert).not.toHaveBeenCalled();
  });

  it("acknowledges event types it doesn't act on", async () => {
    headersMock.mockResolvedValue(new Map([["stripe-signature", "good_sig"]]));
    stripeMock.webhooks.constructEvent.mockReturnValue({
      type: "payment_intent.created",
      data: { object: {} },
    });

    const res = await POST(makeRequest("{}"));

    expect(res.status).toBe(200);
    expect(dbMock.purchase.upsert).not.toHaveBeenCalled();
  });
});
