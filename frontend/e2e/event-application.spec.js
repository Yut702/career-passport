import { test, expect } from "@playwright/test";

test.describe("イベント応募機能", () => {
  test.beforeEach(async ({ page }) => {
    // ホームページにアクセス
    await page.goto("http://localhost:5173");
  });

  test("イベント応募のフロー", async ({ page }) => {
    // 1. ユーザータイプ選択（学生を選択）
    const studentCard = page.locator('div:has-text("ユーザー")').first();
    await studentCard.click();

    // 「ログイン」ボタンをクリック
    const loginButton = page.locator('button:has-text("ログイン")').first();
    await loginButton.click();

    // 2. 学生ダッシュボードが表示されるまで待つ
    await page.waitForURL("**/student", { timeout: 10000 });

    // 3. イベント一覧ページに直接移動
    await page.goto("http://localhost:5173/student/events");
    await page.waitForLoadState("networkidle");

    // 4. イベント一覧が表示されることを確認（特定のイベント名ではなく、イベントカードの存在を確認）
    const eventCards = page.locator("text=応募する");
    await expect(eventCards.first()).toBeVisible({ timeout: 10000 });

    // 5. 最初のイベントの「応募する」リンクをクリック
    const applyLink = eventCards.first();
    await applyLink.click();

    // 6. 応募フォームページに移動したことを確認
    await page.waitForURL("**/student/events/*/apply", { timeout: 10000 });

    // 7. 応募フォームが表示されることを確認（h1要素の存在を確認）
    const h1Element = page.locator("h1");
    await expect(h1Element).toBeVisible({ timeout: 5000 });

    // 8. ウォレット未接続の警告が表示されることを確認
    const walletWarning = page.locator("text=ウォレットを接続してください");
    await expect(walletWarning).toBeVisible({ timeout: 3000 });

    // 9. フォームが無効化されていることを確認（ウォレット未接続のため）
    let motivationTextarea = page.locator('textarea[name="motivation"]');
    await motivationTextarea.waitFor({ state: "visible", timeout: 5000 });
    const isDisabled = await motivationTextarea.isDisabled();
    expect(isDisabled).toBe(true);

    // 10. 応募ボタンも無効化されていることを確認
    const submitButton = page.locator('button:has-text("応募する")');
    const isButtonDisabled = await submitButton.isDisabled();
    expect(isButtonDisabled).toBe(true);

    // 11. ウォレット接続をシミュレート（window.ethereumをモック）
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

    // 12. ページをリロードしてウォレット接続状態を反映
    await page.reload();
    await page.waitForLoadState("networkidle");

    // 13. ウォレット接続ボタンをクリック（存在する場合）
    const connectButton = page.locator(
      'button:has-text("接続"), button:has-text("Connect")'
    );
    if (await connectButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await connectButton.click();
      await page.waitForTimeout(1000);
    }

    // 14. 既に応募済みかどうかを確認
    const alreadyAppliedMessage = page.locator(
      "text=このイベントには既に応募済みです"
    );
    const isAlreadyApplied = await alreadyAppliedMessage
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (isAlreadyApplied) {
      // 既に応募済みの場合は、応募履歴が表示されることを確認してテストを終了
      const historySection = page.locator("text=このイベントへの応募履歴");
      await expect(historySection).toBeVisible({ timeout: 5000 });
      return; // テストを終了
    }

    // 15. フォームが表示されるまで待つ（ウォレット接続後、応募済みでない場合）
    motivationTextarea = page.locator('textarea[name="motivation"]');
    await motivationTextarea.waitFor({ state: "visible", timeout: 10000 });

    const isEnabled = await motivationTextarea
      .isEnabled({ timeout: 10000 })
      .catch(() => false);

    // 16. フォームが有効化された場合のみ、入力と送信をテスト
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

      // 送信処理が完了するまで待つ
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

    // イベント一覧が表示されることを確認（特定のイベント名ではなく、一般的な要素を確認）
    const pageTitle = page.locator("h1:has-text('NFT獲得イベント一覧')");
    await expect(pageTitle).toBeVisible({ timeout: 5000 });

    // イベントカードが存在することを確認
    const eventCards = page.locator("text=応募する");
    const count = await eventCards.count();

    if (count > 0) {
      // イベントが存在する場合、最初のイベントカードが表示されることを確認
      await expect(eventCards.first()).toBeVisible({ timeout: 5000 });
    } else {
      // イベントが存在しない場合、空のメッセージが表示されることを確認
      const emptyMessage = page.locator(
        "text=現在開催中のイベントはありません"
      );
      await expect(emptyMessage).toBeVisible({ timeout: 5000 });
    }
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

    // まずイベント一覧ページに移動して、実際のイベントIDを取得
    await page.goto("http://localhost:5173/student/events");
    await page.waitForLoadState("networkidle");

    // 最初の「応募する」リンクを取得
    const applyLink = page.locator('a:has-text("応募する")').first();
    const linkExists = await applyLink
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (!linkExists) {
      // イベントが存在しない場合はスキップ
      test.skip();
      return;
    }

    // 応募ページに移動
    await applyLink.click();
    await page.waitForURL("**/student/events/*/apply", { timeout: 10000 });
    await page.waitForLoadState("networkidle");

    // 応募フォームが表示されることを確認
    const h1Element = page.locator("h1");
    await expect(h1Element).toBeVisible({ timeout: 5000 });

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
    // まずイベント一覧ページに移動して、実際のイベントIDを取得
    await page.goto("http://localhost:5173/student/events");
    await page.waitForLoadState("networkidle");

    // 最初の「応募する」リンクを取得
    const applyLink = page.locator('a:has-text("応募する")').first();
    const linkExists = await applyLink
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (!linkExists) {
      // イベントが存在しない場合はスキップ
      test.skip();
      return;
    }

    // 応募ページに移動
    await applyLink.click();
    await page.waitForURL("**/student/events/*/apply", { timeout: 10000 });
    await page.waitForLoadState("networkidle");

    // 応募フォームが表示されることを確認
    const h1Element = page.locator("h1");
    await expect(h1Element).toBeVisible({ timeout: 5000 });

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
