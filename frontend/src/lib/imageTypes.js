/**
 * 画像タイプのマッピング
 *
 * スタンプとNFTの画像タイプに基づいて、絵文字とグラデーションを決定します。
 * 画像タイプが0または未設定の場合は、カテゴリやレアリティに基づいて自動決定します。
 */

/**
 * スタンプの画像タイプに基づいて絵文字を取得
 * @param {number} imageType - 画像タイプ（0の場合はカテゴリに基づいて自動決定）
 * @param {string} category - カテゴリ（imageTypeが0の場合に使用）
 * @returns {string} 絵文字
 */
export function getStampEmoji(imageType, category) {
  // 画像タイプが指定されている場合はそれを使用
  if (imageType && imageType > 0) {
    const emojiMap = {
      1: "💰", // finance
      2: "📊", // marketing
      3: "💼", // business
      4: "💻", // programming
      5: "🎨", // design
      6: "📞", // sales
      7: "💡", // consulting
      8: "👥", // hr
      9: "📈", // accounting
      10: "⚖️", // legal
      11: "🔧", // engineering
      12: "🔬", // research
      13: "📚", // education
    };
    return emojiMap[imageType] || "🎫";
  }

  // 画像タイプが0または未設定の場合は、カテゴリに基づいて自動決定
  const categoryEmojis = {
    finance: "💰",
    marketing: "📊",
    business: "💼",
    programming: "💻",
    design: "🎨",
    sales: "📞",
    consulting: "💡",
    hr: "👥",
    accounting: "📈",
    legal: "⚖️",
    engineering: "🔧",
    research: "🔬",
    education: "📚",
  };
  return categoryEmojis[category] || "🎫";
}

/**
 * スタンプの画像タイプに基づいてグラデーションを取得
 * @param {number} imageType - 画像タイプ（0の場合はカテゴリに基づいて自動決定）
 * @param {string} category - カテゴリ（imageTypeが0の場合に使用）
 * @returns {string} グラデーションクラス
 */
export function getStampGradient(imageType, category) {
  // 画像タイプが指定されている場合はそれを使用
  if (imageType && imageType > 0) {
    const gradientMap = {
      1: "from-yellow-400 to-yellow-600", // finance
      2: "from-pink-400 to-pink-600", // marketing
      3: "from-blue-400 to-blue-600", // business
      4: "from-green-400 to-green-600", // programming
      5: "from-purple-400 to-purple-600", // design
      6: "from-orange-400 to-orange-600", // sales
      7: "from-indigo-400 to-indigo-600", // consulting
      8: "from-cyan-400 to-cyan-600", // hr
      9: "from-emerald-400 to-emerald-600", // accounting
      10: "from-slate-400 to-slate-600", // legal
      11: "from-teal-400 to-teal-600", // engineering
      12: "from-violet-400 to-violet-600", // research
      13: "from-amber-400 to-amber-600", // education
    };
    return gradientMap[imageType] || "from-gray-400 to-gray-600";
  }

  // 画像タイプが0または未設定の場合は、カテゴリに基づいて自動決定
  const categoryGradients = {
    finance: "from-yellow-400 to-yellow-600",
    marketing: "from-pink-400 to-pink-600",
    business: "from-blue-400 to-blue-600",
    programming: "from-green-400 to-green-600",
    design: "from-purple-400 to-purple-600",
    sales: "from-orange-400 to-orange-600",
    consulting: "from-indigo-400 to-indigo-600",
    hr: "from-cyan-400 to-cyan-600",
    accounting: "from-emerald-400 to-emerald-600",
    legal: "from-slate-400 to-slate-600",
    engineering: "from-teal-400 to-teal-600",
    research: "from-violet-400 to-violet-600",
    education: "from-amber-400 to-amber-600",
  };
  return categoryGradients[category] || "from-gray-400 to-gray-600";
}

/**
 * NFTの画像タイプに基づいて絵文字を取得
 * @param {number} imageType - 画像タイプ（0の場合はレアリティに基づいて自動決定）
 * @param {string} rarity - レアリティ（imageTypeが0の場合に使用）
 * @returns {string} 絵文字
 */
export function getNFTEmoji(imageType) {
  // 画像タイプが指定されている場合はそれを使用
  if (imageType && imageType > 0) {
    const emojiMap = {
      10: "🏆", // Common
      20: "🏆", // Rare
      30: "🏆", // Epic
      40: "🏆", // Legendary
      // カスタム画像タイプとして追加可能
    };
    return emojiMap[imageType] || "🏆";
  }

  // 画像タイプが0または未設定の場合は、デフォルト
  return "🏆"; // 現在はすべて🏆
}

/**
 * NFTの画像タイプに基づいてグラデーションを取得
 * @param {number} imageType - 画像タイプ（0の場合はレアリティに基づいて自動決定）
 * @param {string} rarity - レアリティ（imageTypeが0の場合に使用）
 * @returns {string} グラデーションクラス
 */
export function getNFTGradient(imageType, rarity) {
  // 画像タイプが指定されている場合はそれを使用
  if (imageType && imageType > 0) {
    const gradientMap = {
      10: "from-gray-400 to-gray-600", // Common
      20: "from-blue-400 to-blue-600", // Rare
      30: "from-purple-400 to-purple-600", // Epic
      40: "from-yellow-400 via-orange-400 to-red-500", // Legendary
      // カスタムグラデーションとして追加可能
    };
    return gradientMap[imageType] || "from-gray-400 to-gray-600";
  }

  // 画像タイプが0または未設定の場合は、レアリティに基づいて自動決定
  const rarityGradients = {
    common: "from-gray-400 to-gray-600",
    rare: "from-blue-400 to-blue-600",
    epic: "from-purple-400 to-purple-600",
    legendary: "from-yellow-400 via-orange-400 to-red-500",
  };
  return rarityGradients[rarity?.toLowerCase()] || "from-gray-400 to-gray-600";
}

/**
 * NFTの画像タイプに基づいてバッジカラーを取得
 * @param {number} imageType - 画像タイプ（0の場合はレアリティに基づいて自動決定）
 * @param {string} rarity - レアリティ（imageTypeが0の場合に使用）
 * @returns {string} バッジカラークラス
 */
export function getNFTBadgeColor(imageType, rarity) {
  // 画像タイプが指定されている場合はそれを使用
  if (imageType && imageType > 0) {
    const badgeMap = {
      10: "bg-gray-100 text-gray-800 border-gray-300", // Common
      20: "bg-blue-100 text-blue-800 border-blue-300", // Rare
      30: "bg-purple-100 text-purple-800 border-purple-300", // Epic
      40: "bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-800 border-orange-300", // Legendary
    };
    return badgeMap[imageType] || "bg-gray-100 text-gray-800 border-gray-300";
  }

  // 画像タイプが0または未設定の場合は、レアリティに基づいて自動決定
  const rarityBadges = {
    common: "bg-gray-100 text-gray-800 border-gray-300",
    rare: "bg-blue-100 text-blue-800 border-blue-300",
    epic: "bg-purple-100 text-purple-800 border-purple-300",
    legendary:
      "bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-800 border-orange-300",
  };
  return (
    rarityBadges[rarity?.toLowerCase()] ||
    "bg-gray-100 text-gray-800 border-gray-300"
  );
}
