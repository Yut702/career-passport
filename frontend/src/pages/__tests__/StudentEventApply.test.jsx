import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import StudentEventApply from "../StudentEventApply";
import { eventAPI } from "../../lib/api";
import { useWalletConnect } from "../../hooks/useWalletConnect";

// モックの設定
vi.mock("../../lib/api");
vi.mock("../../hooks/useWalletConnect");
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ id: "123" }),
    useNavigate: () => vi.fn(),
  };
});

describe("StudentEventApply", () => {
  const mockAccount = "0x1111111111111111111111111111111111111111";

  beforeEach(() => {
    vi.clearAllMocks();

    // useWalletConnect のモック
    useWalletConnect.mockReturnValue({
      account: mockAccount,
      isConnected: true,
    });

    // eventAPI のモック
    eventAPI.getMyApplications = vi.fn().mockResolvedValue({
      ok: true,
      applications: [],
    });
  });

  it("応募フォームが表示される", async () => {
    render(
      <BrowserRouter>
        <StudentEventApply />
      </BrowserRouter>
    );

    // ローディングが終わるまで待つ
    await waitFor(() => {
      expect(screen.queryByText(/読み込み中/i)).not.toBeInTheDocument();
    });

    // 応募動機の入力欄が表示される
    const motivationInput = screen.getByPlaceholderText(
      /このイベントに応募する理由を記入してください/i
    );
    expect(motivationInput).toBeInTheDocument();

    // 経験・スキルの入力欄が表示される
    const experienceInput =
      screen.getByPlaceholderText(/関連する経験やスキルを記入してください/i);
    expect(experienceInput).toBeInTheDocument();
  });

  it("応募が成功すると成功メッセージが表示される", async () => {
    const user = userEvent.setup();

    // 応募APIのモック
    eventAPI.apply = vi.fn().mockResolvedValue({
      ok: true,
      application: {
        applicationId: "test-id",
        eventId: "event-123",
        walletAddress: mockAccount,
        applicationText: "テスト応募動機",
        appliedAt: new Date().toISOString(),
        status: "pending",
      },
    });

    render(
      <BrowserRouter>
        <StudentEventApply />
      </BrowserRouter>
    );

    // ローディングが終わるまで待つ
    await waitFor(() => {
      expect(screen.queryByText(/読み込み中/i)).not.toBeInTheDocument();
    });

    // フォームに入力
    const motivationInput = screen.getByPlaceholderText(
      /このイベントに応募する理由を記入してください/i
    );
    await user.type(motivationInput, "テスト応募動機");

    const experienceInput =
      screen.getByPlaceholderText(/関連する経験やスキルを記入してください/i);
    await user.type(experienceInput, "テスト経験");

    // 応募ボタンをクリック
    const submitButton = screen.getByRole("button", { name: /応募する/i });
    await user.click(submitButton);

    // 成功メッセージが表示される
    await waitFor(() => {
      expect(screen.getByText(/応募が完了しました/i)).toBeInTheDocument();
    });

    // APIが呼ばれたことを確認（応募動機と経験・スキルが結合される）
    expect(eventAPI.apply).toHaveBeenCalledWith(
      "event-123",
      mockAccount,
      expect.stringContaining("テスト応募動機")
    );
  });

  it("応募に失敗するとエラーメッセージが表示される", async () => {
    const user = userEvent.setup();

    // 応募APIのモック（エラー）
    eventAPI.apply = vi.fn().mockRejectedValue(new Error("応募に失敗しました"));

    render(
      <BrowserRouter>
        <StudentEventApply />
      </BrowserRouter>
    );

    // ローディングが終わるまで待つ
    await waitFor(() => {
      expect(screen.queryByText(/読み込み中/i)).not.toBeInTheDocument();
    });

    // フォームに入力
    const motivationInput = screen.getByPlaceholderText(
      /このイベントに応募する理由を記入してください/i
    );
    await user.type(motivationInput, "テスト応募動機");

    // 応募ボタンをクリック
    const submitButton = screen.getByRole("button", { name: /応募する/i });
    await user.click(submitButton);

    // エラーメッセージが表示される
    await waitFor(() => {
      expect(screen.getByText(/応募に失敗しました/i)).toBeInTheDocument();
    });
  });

  it("ウォレットが接続されていない場合、警告が表示される", () => {
    // ウォレット未接続のモック
    useWalletConnect.mockReturnValue({
      account: null,
      isConnected: false,
    });

    render(
      <BrowserRouter>
        <StudentEventApply />
      </BrowserRouter>
    );

    // ウォレット接続の警告が表示される
    expect(
      screen.getByText(/ウォレットを接続してください/i)
    ).toBeInTheDocument();
  });

  it("応募履歴が表示される", async () => {
    // 応募履歴のモック
    eventAPI.getMyApplications = vi.fn().mockResolvedValue({
      ok: true,
      applications: [
        {
          applicationId: "app-1",
          eventId: "event-123",
          walletAddress: mockAccount,
          applicationText: "過去の応募動機",
          appliedAt: "2025-12-10T10:00:00Z",
          status: "pending",
        },
      ],
    });

    render(
      <BrowserRouter>
        <StudentEventApply />
      </BrowserRouter>
    );

    // ローディングが終わるまで待つ
    await waitFor(() => {
      expect(screen.queryByText(/読み込み中/i)).not.toBeInTheDocument();
    });

    // 応募履歴が表示される
    await waitFor(() => {
      expect(screen.getByText(/このイベントへの応募履歴/i)).toBeInTheDocument();
      expect(screen.getByText(/過去の応募動機/i)).toBeInTheDocument();
    });
  });
});
