import { Link } from "react-router-dom";

export default function NFTCard({ nft }) {
  const getRarityGradient = (rarity) => {
    const gradients = {
      common: "from-gray-400 to-gray-600",
      rare: "from-blue-400 to-blue-600",
      epic: "from-purple-400 to-purple-600",
      legendary: "from-yellow-400 via-orange-400 to-red-500",
    };
    return gradients[rarity] || gradients.common;
  };

  const getRarityBadgeColor = (rarity) => {
    const colors = {
      common: "bg-gray-100 text-gray-800 border-gray-300",
      rare: "bg-blue-100 text-blue-800 border-blue-300",
      epic: "bg-purple-100 text-purple-800 border-purple-300",
      legendary: "bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-800 border-orange-300",
    };
    return colors[rarity] || colors.common;
  };

  const getRarityStars = (rarity) => {
    const stars = {
      common: "⭐",
      rare: "⭐⭐",
      epic: "⭐⭐⭐",
      legendary: "⭐⭐⭐⭐",
    };
    return stars[rarity] || stars.common;
  };

  return (
    <Link to={`/student/nft/${nft.id}`}>
      <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-gray-100 hover:border-blue-300 cursor-pointer">
        {/* グラデーション背景 */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${getRarityGradient(nft.rarity)}`}></div>
        
        <div className="p-6">
          <div className="text-center">
            {/* NFT アイコン */}
            <div className={`w-24 h-24 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${getRarityGradient(nft.rarity)} flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform`}>
              <span className="text-5xl">🏆</span>
            </div>
            
            {/* NFT タイトル */}
            <h3 className="font-bold text-xl mb-3 text-gray-900 group-hover:text-blue-600 transition-colors">
              {nft.name}
            </h3>
            
            {/* レアリティバッジ */}
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold border-2 mb-3 ${getRarityBadgeColor(nft.rarity)}`}>
              <span className="mr-1">{getRarityStars(nft.rarity)}</span>
              <span className="uppercase">{nft.rarity}</span>
            </div>
            
            {/* 企業名 */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-gray-600 text-sm font-medium mb-1">認定企業</p>
              <p className="text-gray-800 text-sm">
                {nft.organizations.join(" / ")}
              </p>
            </div>
            
            {/* 発行日 */}
            <div className="mt-3 flex items-center justify-center text-xs text-gray-500">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {new Date(nft.mintedAt).toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "long",
                day: "numeric"
              })}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

