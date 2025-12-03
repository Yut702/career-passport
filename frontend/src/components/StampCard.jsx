export default function StampCard({ stamp }) {
  const getCategoryEmoji = (category) => {
    const emojis = {
      finance: "💰",
      marketing: "📊",
      business: "💼",
      programming: "💻",
      design: "🎨",
    };
    return emojis[category] || "🎫";
  };

  const getCategoryColor = (category) => {
    const colors = {
      finance: "from-yellow-400 to-yellow-600",
      marketing: "from-pink-400 to-pink-600",
      business: "from-blue-400 to-blue-600",
      programming: "from-green-400 to-green-600",
      design: "from-purple-400 to-purple-600",
    };
    return colors[category] || "from-gray-400 to-gray-600";
  };

  return (
    <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100">
      {/* グラデーション背景 */}
      <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${getCategoryColor(stamp.category)}`}></div>
      
      <div className="p-6">
        <div className="flex items-start space-x-4">
          {/* アイコン */}
          <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${getCategoryColor(stamp.category)} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
            <span className="text-3xl">{getCategoryEmoji(stamp.category)}</span>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
              {stamp.name}
            </h3>
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-sm font-semibold text-gray-700">{stamp.organization}</span>
            </div>
            <div className="flex items-center text-xs text-gray-500">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {new Date(stamp.issuedAt).toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "long",
                day: "numeric"
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

