import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { getAuthUserMock } = vi.hoisted(() => ({ getAuthUserMock: vi.fn() }));
vi.mock("@/lib/auth", () => ({ getAuthUser: getAuthUserMock }));

const { dbMock } = vi.hoisted(() => ({
  dbMock: {
    course: { findUnique: vi.fn() },
    purchase: { findUnique: vi.fn() },
    stripeCustomer: { findUnique: vi.fn(), create: vi.fn() },
  },
}));
vi.mock("@/lib/db", () => ({ db: dbMock }));

const { stripeMock } = vi.hoisted(() => ({
  stripeMock: {
    customers: { create: vi.fn() },
    checkout: { sessions: { create: vi.fn() } },
  },
}));
vi.mock("@/lib/stripe", () => ({ stripe: stripeMock }));

const { POST } = await import("./route");

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost:3000/api/stripe/checkout", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

const user = { id: "user_db_1", email: "student@example.com" };
const course = {
  id: "course_1",
  title: "Intro to LMS",
  description: "A course",
  imageUrl: null,
  price: 4999,
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
});

describe("POST /api/stripe/checkout", () => {
  it("rejects unauthenticated requests", async () => {
    getAuthUserMock.mockResolvedValue(null);

    const res = await POST(makeRequest({ courseId: course.id }));

    expect(res.status).toBe(401);
    expect(stripeMock.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it("rejects an invalid body", async () => {
    getAuthUserMock.mockResolvedValue(user);

    const res = await POST(makeRequest({}));

    expect(res.status).toBe(400);
  });

  it("rejects when the course is not found or unpublished", async () => {
    getAuthUserMock.mockResolvedValue(user);
    dbMock.course.findUnique.mockResolvedValue(null);

    const res = await POST(makeRequest({ courseId: course.id }));

    expect(res.status).toBe(404);
  });

  it("rejects when the course was already purchased", async () => {
    getAuthUserMock.mockResolvedValue(user);
    dbMock.course.findUnique.mockResolvedValue(course);
    dbMock.purchase.findUnique.mockResolvedValue({ id: "purchase_1" });

    const res = await POST(makeRequest({ courseId: course.id }));

    expect(res.status).toBe(400);
    expect(stripeMock.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it("creates a Stripe customer on first purchase and returns a checkout url", async () => {
    getAuthUserMock.mockResolvedValue(user);
    dbMock.course.findUnique.mockResolvedValue(course);
    dbMock.purchase.findUnique.mockResolvedValue(null);
    dbMock.stripeCustomer.findUnique.mockResolvedValue(null);
    stripeMock.customers.create.mockResolvedValue({ id: "cus_new" });
    dbMock.stripeCustomer.create.mockResolvedValue({
      userId: user.id,
      stripeCustomerId: "cus_new",
    });
    stripeMock.checkout.sessions.create.mockResolvedValue({
      url: "https://checkout.stripe.com/session_1",
    });

    const res = await POST(makeRequest({ courseId: course.id }));
    const json = await res.json();

    expect(stripeMock.customers.create).toHaveBeenCalledWith({ email: user.email });
    expect(stripeMock.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: "cus_new",
        mode: "payment",
        metadata: { courseId: course.id, userId: user.id },
      })
    );
    expect(json).toEqual({ url: "https://checkout.stripe.com/session_1" });
  });

  it("reuses an existing Stripe customer instead of creating a new one", async () => {
    getAuthUserMock.mockResolvedValue(user);
    dbMock.course.findUnique.mockResolvedValue(course);
    dbMock.purchase.findUnique.mockResolvedValue(null);
    dbMock.stripeCustomer.findUnique.mockResolvedValue({
      userId: user.id,
      stripeCustomerId: "cus_existing",
    });
    stripeMock.checkout.sessions.create.mockResolvedValue({
      url: "https://checkout.stripe.com/session_2",
    });

    await POST(makeRequest({ courseId: course.id }));

    expect(stripeMock.customers.create).not.toHaveBeenCalled();
    expect(stripeMock.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({ customer: "cus_existing" })
    );
  });
});
