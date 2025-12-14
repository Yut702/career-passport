/**
 * スタンプ取得通知コンポーネント
 *
 * スタンプを取得した時に表示される通知です。
 */
export default function StampNotification({
  show,
  stampName,
  organization,
  onClose,
  onViewStamps,
}) {
  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-2xl p-6 max-w-md border-2 border-green-300">
        <div className="flex items-start space-x-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-4xl">🎉</span>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-2">
              スタンプを取得しました！
            </h3>
            <p className="text-green-50 mb-1">
              <span className="font-semibold">{stampName}</span>
            </p>
            <p className="text-green-100 text-sm mb-4">
              {organization} から発行されました
            </p>
            <div className="flex space-x-2">
              <button
                onClick={onViewStamps}
                className="px-4 py-2 bg-white text-green-600 rounded-lg font-semibold hover:bg-green-50 transition-colors"
              >
                スタンプを見る
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-white/20 text-white rounded-lg font-semibold hover:bg-white/30 transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

