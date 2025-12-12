import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import request from "supertest";
import express from "express";

// DynamoDB関数をモック
const mockCreateApplication = jest.fn();
const mockGetApplicationsByEvent = jest.fn();
const mockGetApplicationsByWallet = jest.fn();
const mockGetApplicationById = jest.fn();
const mockUpdateApplicationStatus = jest.fn();

// モジュールをモック
jest.unstable_mockModule("../../lib/dynamo-events.js", () => ({
  createApplication: mockCreateApplication,
  getApplicationsByEvent: mockGetApplicationsByEvent,
  getApplicationsByWallet: mockGetApplicationsByWallet,
  getApplicationById: mockGetApplicationById,
  updateApplicationStatus: mockUpdateApplicationStatus,
}));

// モック後にeventRoutesをインポート
const { default: eventRoutes } = await import("../eventRoutes.js");

const app = express();
app.use(express.json());
app.use("/api/events", eventRoutes);

describe("Event Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateApplication.mockClear();
    mockGetApplicationsByEvent.mockClear();
    mockGetApplicationsByWallet.mockClear();
    mockGetApplicationById.mockClear();
    mockUpdateApplicationStatus.mockClear();
  });

  it("POST /api/events/:eventId/apply - 応募を作成", async () => {
    const mockApplication = {
      applicationId: "test-app-id",
      eventId: "event-123",
      walletAddress: "0x1111111111111111111111111111111111111111",
      applicationText: "応募動機です",
      appliedAt: new Date().toISOString(),
      status: "pending",
    };

    // 既存の応募がないことをモック
    mockGetApplicationsByWallet.mockResolvedValue([]);
    mockCreateApplication.mockResolvedValue(mockApplication);

    const response = await request(app)
      .post("/api/events/event-123/apply")
      .send({
        walletAddress: "0x1111111111111111111111111111111111111111",
        applicationText: "応募動機です",
      });

    expect(response.status).toBe(201);
    expect(response.body.ok).toBe(true);
    expect(response.body.application).toHaveProperty("applicationId");
    expect(response.body.application.eventId).toBe("event-123");
  });

  it("POST /api/events/:eventId/apply - walletAddressが必須", async () => {
    const response = await request(app)
      .post("/api/events/event-123/apply")
      .send({
        applicationText: "応募動機です",
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("walletAddress is required");
  });

  it("POST /api/events/:eventId/apply - 既に応募済みの場合は409を返す", async () => {
    const existingApplication = {
      applicationId: "existing-app-id",
      eventId: "event-123",
      walletAddress: "0x1111111111111111111111111111111111111111",
    };

    // 既存の応募があることをモック
    mockGetApplicationsByWallet.mockResolvedValue([existingApplication]);

    const response = await request(app)
      .post("/api/events/event-123/apply")
      .send({
        walletAddress: "0x1111111111111111111111111111111111111111",
        applicationText: "応募動機です",
      });

    expect(response.status).toBe(409);
    expect(response.body.error).toBe("Already applied to this event");
  });

  it("GET /api/events/applications - 応募一覧を取得", async () => {
    const mockApplications = [
      {
        applicationId: "app-1",
        eventId: "event-123",
        walletAddress: "0x1111111111111111111111111111111111111111",
        applicationText: "応募動機1",
        appliedAt: new Date().toISOString(),
        status: "pending",
      },
      {
        applicationId: "app-2",
        eventId: "event-456",
        walletAddress: "0x1111111111111111111111111111111111111111",
        applicationText: "応募動機2",
        appliedAt: new Date().toISOString(),
        status: "approved",
      },
    ];

    mockGetApplicationsByWallet.mockResolvedValue(mockApplications);

    const response = await request(app).get(
      "/api/events/applications?walletAddress=0x1111111111111111111111111111111111111111"
    );

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(Array.isArray(response.body.applications)).toBe(true);
    expect(response.body.applications.length).toBe(2);
  });

  it("GET /api/events/applications - walletAddressが必須", async () => {
    const response = await request(app).get("/api/events/applications");

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("walletAddress is required");
  });

  it("GET /api/events/:eventId/applications - イベントの応募一覧を取得", async () => {
    const mockApplications = [
      {
        applicationId: "app-1",
        eventId: "event-123",
        walletAddress: "0x1111111111111111111111111111111111111111",
        applicationText: "応募動機1",
        appliedAt: new Date().toISOString(),
        status: "pending",
      },
    ];

    mockGetApplicationsByEvent.mockResolvedValue(mockApplications);

    const response = await request(app).get(
      "/api/events/event-123/applications"
    );

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(Array.isArray(response.body.applications)).toBe(true);
    expect(response.body.applications.length).toBe(1);
  });

  it("PATCH /api/events/applications/:applicationId/status - 応募ステータスを更新", async () => {
    mockUpdateApplicationStatus.mockResolvedValue();

    const response = await request(app)
      .patch("/api/events/applications/app-123/status")
      .send({
        status: "approved",
      });

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(mockUpdateApplicationStatus).toHaveBeenCalledWith(
      "app-123",
      "approved"
    );
  });

  it("PATCH /api/events/applications/:applicationId/status - 無効なステータスは400を返す", async () => {
    const response = await request(app)
      .patch("/api/events/applications/app-123/status")
      .send({
        status: "invalid-status",
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid status");
  });
});
