/**
 * NFT目標表示カードコンポーネント
 *
 * ユーザーがNFT証明書を取得するために必要なスタンプの目標を表示します。
 * - Common NFT: 各企業ごとに、あと何個のスタンプが必要かを表示
 * - Rare NFT: あと何種類のカテゴリが必要かを表示
 */
export default function NFTGoalCard({ goals }) {
  if (!goals || goals.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl shadow-lg p-6 border-2 border-purple-200">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
          <span className="text-2xl">🎯</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">NFT取得目標</h2>
      </div>

      <div className="space-y-4">
        {/* Common NFT目標 */}
        {goals
          .filter((goal) => goal.type === "common")
          .map((goal, index) => (
            <div
              key={`common-${index}`}
              className="bg-white rounded-xl p-4 border border-purple-200 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-lg">🏅</span>
                    <span className="font-bold text-gray-900">
                      {goal.organization} の Common NFT
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    現在: {goal.currentStamps}個 / 必要: {goal.requiredStamps}個
                  </div>
                  {goal.remainingStamps > 0 ? (
                    <div className="mt-2 text-sm font-semibold text-purple-600">
                      あと{" "}
                      <span className="text-lg">{goal.remainingStamps}</span>{" "}
                      個のスタンプが必要です
                    </div>
                  ) : (
                    <div className="mt-2 text-sm font-semibold text-green-600">
                      ✅ NFT発行可能です！
                    </div>
                  )}
                </div>
                {/* 発行ボタンは削除（企業側のみが発行するため） */}
              </div>
              {/* プログレスバー */}
              <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      (goal.currentStamps / goal.requiredStamps) * 100,
                      100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>
          ))}

        {/* Rare NFT目標 */}
        {goals
          .filter((goal) => goal.type === "rare")
          .map((goal, index) => (
            <div
              key={`rare-${index}`}
              className="bg-white rounded-xl p-4 border border-yellow-200 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-lg">🌟</span>
                    <span className="font-bold text-gray-900">Rare NFT</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    現在: {goal.currentCategories}種類 / 必要:{" "}
                    {goal.requiredCategories}
                    種類
                  </div>
                  {goal.remainingCategories > 0 ? (
                    <div className="mt-2 text-sm font-semibold text-yellow-600">
                      あと{" "}
                      <span className="text-lg">
                        {goal.remainingCategories}
                      </span>{" "}
                      種類のカテゴリが必要です
                    </div>
                  ) : (
                    <div className="mt-2 text-sm font-semibold text-green-600">
                      ✅ Rare NFT発行可能です！
                    </div>
                  )}
                  {goal.currentCategories > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      現在のカテゴリ: {goal.categories.join(", ")}
                    </div>
                  )}
                </div>
                {/* 発行ボタンは削除（企業側のみが発行するため） */}
              </div>
              {/* プログレスバー */}
              <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      (goal.currentCategories / goal.requiredCategories) * 100,
                      100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
