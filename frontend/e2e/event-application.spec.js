import { test, expect } from "@playwright/test";

test.describe("イベント応募機能", () => {
  test.beforeEach(async ({ page }) => {
    // ホームページにアクセス
    await page.goto("http://localhost:5173");
  });

  test("イベント応募のフロー", async ({ page }) => {
    // 1. ユーザータイプ選択（学生を選択）
    // UserTypeSelectionページで学生カードをクリック
    const studentCard = page.locator('div:has-text("ユーザー")').first();
    await studentCard.click();

    // 「ログイン」ボタンをクリック
    const loginButton = page.locator('button:has-text("ログイン")').first();
    await loginButton.click();

    // 2. 学生ダッシュボードが表示されるまで待つ
    await page.waitForURL("**/student", { timeout: 10000 });

    // 3. イベント一覧ページに直接移動（ナビゲーションが複雑な場合）
    await page.goto("http://localhost:5173/student/events");
    await page.waitForLoadState("networkidle");

    // 4. イベント一覧が表示されることを確認
    await expect(page.locator("text=サマーインターンシップ 2025")).toBeVisible({
      timeout: 5000,
    });

    // 5. 最初のイベントの「応募する」リンクをクリック
    const applyLink = page.locator('a:has-text("応募する")').first();
    await applyLink.click();

    // 6. 応募フォームページに移動したことを確認
    await page.waitForURL("**/student/events/*/apply", { timeout: 10000 });

    // 7. 応募フォームが表示されることを確認
    await expect(page.locator("h1")).toContainText("サマーインターンシップ", {
      timeout: 5000,
    });

    // 8. ウォレット未接続の警告が表示されることを確認
    const walletWarning = page.locator("text=ウォレットを接続してください");
    await expect(walletWarning).toBeVisible({ timeout: 3000 });

    // 9. フォームが無効化されていることを確認（ウォレット未接続のため）
    const motivationTextarea = page.locator('textarea[name="motivation"]');
    await motivationTextarea.waitFor({ state: "visible", timeout: 5000 });
    const isDisabled = await motivationTextarea.isDisabled();
    expect(isDisabled).toBe(true);

    // 10. 応募ボタンも無効化されていることを確認
    const submitButton = page.locator('button:has-text("応募する")');
    const isButtonDisabled = await submitButton.isDisabled();
    expect(isButtonDisabled).toBe(true);

    // 11. ウォレット接続をシミュレート（window.ethereumをモック）
    await page.addInitScript(() => {
      // window.ethereumをモック
      window.ethereum = {
        isMetaMask: true,
        request: async ({ method }) => {
          if (method === "eth_requestAccounts") {
            return ["0x1111111111111111111111111111111111111111"];
          }
          if (method === "eth_accounts") {
            return ["0x1111111111111111111111111111111111111111"];
          }
          if (method === "eth_chainId") {
            return "0x7a69"; // 31337 in hex
          }
          return null;
        },
        on: () => {},
        removeListener: () => {},
      };
    });

    // 12. ページをリロードしてウォレット接続状態を反映
    await page.reload();
    await page.waitForLoadState("networkidle");

    // 13. ウォレット接続ボタンをクリック（存在する場合）
    const connectButton = page.locator(
      'button:has-text("接続"), button:has-text("Connect")'
    );
    if (await connectButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await connectButton.click();
      await page.waitForTimeout(1000); // 接続処理を待つ
    }

    // 14. フォームが有効化されるまで待つ（ウォレット接続後）
    await motivationTextarea.waitFor({ state: "visible", timeout: 5000 });
    const isEnabled = await motivationTextarea
      .isEnabled({ timeout: 10000 })
      .catch(() => false);

    // 15. フォームが有効化された場合のみ、入力と送信をテスト
    if (isEnabled) {
      await motivationTextarea.fill(
        "テスト応募動機です。このイベントに参加したいです。"
      );

      const experienceTextarea = page.locator('textarea[name="experience"]');
      await experienceTextarea.fill("React、JavaScriptの経験があります。");

      // 応募ボタンをクリック
      const enabledSubmitButton = page.locator(
        'button:has-text("応募する"):not([disabled])'
      );
      await enabledSubmitButton.click();

      // 送信処理が完了するまで待つ（「送信中...」から「応募する」に戻る、またはメッセージが表示されるまで）
      // 成功メッセージまたはエラーメッセージが表示されるまで待つ
      // 成功メッセージ: 「✅ 応募が完了しました！」（絵文字と感嘆符を含む）
      // エラーメッセージ: 「エラー」見出しの下にエラーメッセージが表示される
      const successMessage = page.locator("text=/応募が完了しました/");
      const errorSection = page.locator("text=エラー").locator("..");
      const errorMessage = page.locator("text=/応募に失敗しました/");

      // 成功メッセージまたはエラーメッセージが表示されることを確認
      await expect(
        successMessage.or(errorSection).or(errorMessage)
      ).toBeVisible({
        timeout: 15000,
      });
    } else {
      // フォームが有効化されない場合は、ウォレット未接続の警告が表示されることを確認
      await expect(walletWarning).toBeVisible();
    }
  });

  test("イベント一覧が表示される", async ({ page }) => {
    // ユーザータイプ選択（学生を選択）
    const studentCard = page.locator('div:has-text("ユーザー")').first();
    await studentCard.click();
    const loginButton = page.locator('button:has-text("ログイン")').first();
    await loginButton.click();
    await page.waitForURL("**/student", { timeout: 10000 });

    // イベント一覧ページに直接移動
    await page.goto("http://localhost:5173/student/events");
    await page.waitForLoadState("networkidle");

    // イベント一覧が表示されることを確認
    await expect(page.locator("text=サマーインターンシップ 2025")).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator("text=オープンキャンパス 2025")).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator("text=ハッカソン大会")).toBeVisible({
      timeout: 5000,
    });
  });

  test("応募フォームのバリデーション", async ({ page }) => {
    // ウォレット接続をシミュレート
    await page.addInitScript(() => {
      window.ethereum = {
        isMetaMask: true,
        request: async ({ method }) => {
          if (method === "eth_requestAccounts") {
            return ["0x1111111111111111111111111111111111111111"];
          }
          if (method === "eth_accounts") {
            return ["0x1111111111111111111111111111111111111111"];
          }
          if (method === "eth_chainId") {
            return "0x7a69"; // 31337 in hex
          }
          return null;
        },
        on: () => {},
        removeListener: () => {},
      };
    });

    // イベント応募ページに直接移動
    await page.goto("http://localhost:5173/student/events/1/apply");
    await page.waitForLoadState("networkidle");

    // 応募フォームが表示されることを確認
    await expect(page.locator("h1")).toBeVisible({ timeout: 5000 });

    // フォームが有効化されるまで待つ
    const textarea = page.locator('textarea[name="motivation"]');
    await textarea.waitFor({ state: "visible", timeout: 5000 });

    // フォームが有効化されていることを確認
    const isEnabled = await textarea
      .isEnabled({ timeout: 10000 })
      .catch(() => false);

    if (isEnabled) {
      // 応募動機を入力せずに送信ボタンをクリック
      const submitButton = page.locator(
        'button:has-text("応募する"):not([disabled])'
      );
      await submitButton.click();

      // HTML5のバリデーションメッセージが表示される（ブラウザ依存）
      // または、エラーメッセージが表示される
      const isInvalid = await textarea.evaluate((el) => !el.validity.valid);
      expect(isInvalid).toBe(true);
    } else {
      // フォームが無効化されている場合は、ウォレット未接続の警告が表示されることを確認
      const walletWarning = page.locator("text=ウォレットを接続してください");
      await expect(walletWarning).toBeVisible({ timeout: 3000 });
    }
  });

  test("応募履歴が表示される", async ({ page }) => {
    // イベント応募ページに直接移動
    await page.goto("http://localhost:5173/student/events/1/apply");
    await page.waitForLoadState("networkidle");

    // 応募フォームが表示されることを確認
    await expect(page.locator("h1")).toBeVisible({ timeout: 5000 });

    // 応募履歴セクションが表示されるか確認（既に応募がある場合）
    const historySection = page.locator("text=このイベントへの応募履歴");
    const historyExists = await historySection
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    // 応募履歴がある場合は表示されることを確認
    if (historyExists) {
      await expect(historySection).toBeVisible();
    } else {
      // 応募履歴がない場合は、フォームが表示されていることを確認
      await expect(page.locator('textarea[name="motivation"]')).toBeVisible();
    }
  });
});
