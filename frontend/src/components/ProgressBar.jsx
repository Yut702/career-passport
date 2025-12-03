export default function ProgressBar({ current, total, label }) {
  const percentage = Math.min((current / total) * 100, 100);
  const isComplete = current >= total;

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-semibold text-gray-700">{label}</span>
          <span className={`text-sm font-bold ${isComplete ? "text-green-600" : "text-gray-600"}`}>
            {current}/{total} ({Math.round(percentage)}%)
          </span>
        </div>
      )}
      <div className="relative w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
        <div
          className={`h-4 rounded-full transition-all duration-500 ease-out ${
            isComplete
              ? "bg-gradient-to-r from-green-400 to-emerald-500"
              : "bg-gradient-to-r from-blue-400 to-purple-500"
          }`}
          style={{ width: `${percentage}%` }}
        >
          {/* アニメーション効果 */}
          {!isComplete && (
            <div className="absolute inset-0 bg-white opacity-30 animate-pulse"></div>
          )}
        </div>
        {/* 完了時のチェックマーク */}
        {isComplete && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

