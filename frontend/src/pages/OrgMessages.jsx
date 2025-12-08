import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export default function OrgMessages() {
  const [searchParams] = useSearchParams();
  const candidateId = searchParams.get("candidateId");
  const [messages, setMessages] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  // ウォレットアドレスを短縮表示する関数
  const formatAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const [candidates] = useState([
    { 
      id: 1, 
      walletAddress: "0x1111111111111111111111111111111111111111",
      nftCount: 3,
      disclosedInfo: { university: "東京大学", major: "情報工学" }, // メッセージで開示された情報のみ
      lastMessageTime: new Date(Date.now() - 3600000),
    },
    { 
      id: 2, 
      walletAddress: "0x2222222222222222222222222222222222222222",
      nftCount: 5,
      disclosedInfo: { university: "京都大学" },
      lastMessageTime: new Date(Date.now() - 7200000),
    },
    { 
      id: 3, 
      walletAddress: "0x3333333333333333333333333333333333333333",
      nftCount: 2,
      disclosedInfo: {},
      lastMessageTime: new Date(Date.now() - 10800000),
    },
  ]);

  useEffect(() => {
    if (candidateId) {
      const candidate = candidates.find(
        (c) => c.id === parseInt(candidateId)
      );
      setSelectedCandidate(candidate);
    } else if (candidates.length > 0) {
      setSelectedCandidate(candidates[0]);
    }
  }, [candidateId, candidates]);

  useEffect(() => {
    if (selectedCandidate) {
      // モックデータ（実際の実装ではAPIから取得）
      // 開示された情報がある場合は、それを含むメッセージを表示
      const hasDisclosedInfo = Object.keys(selectedCandidate.disclosedInfo).length > 0;
      const disclosureMessage = hasDisclosedInfo
        ? `【VCからの情報開示】\n${Object.entries(selectedCandidate.disclosedInfo)
            .map(([key, value]) => {
              const label = key === "university" ? "大学" : key === "major" ? "専攻" : key;
              return `${label}: ${value} (VCから取得)`;
            })
            .join("\n")}`
        : null;

      const mockMessages = [
        {
          id: 1,
          sender: "candidate",
          content: "こんにちは。インターンシップに興味があります。",
          timestamp: new Date(Date.now() - 3600000),
        },
        ...(disclosureMessage
          ? [
              {
                id: 2,
                sender: "candidate",
                content: disclosureMessage,
                timestamp: new Date(Date.now() - 3000000),
              },
            ]
          : []),
        {
          id: 3,
          sender: "org",
          content: "ありがとうございます。詳細をお送りします。",
          timestamp: new Date(Date.now() - 1800000),
        },
      ];
      setMessages(mockMessages);
    }
  }, [selectedCandidate]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message = {
      id: messages.length + 1,
      sender: "org",
      content: newMessage,
      timestamp: new Date(),
    };
    setMessages([...messages, message]);
    setNewMessage("");
  };

  return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="flex h-[600px]">
            {/* 候補者リスト */}
            <div className="w-1/3 border-r border-gray-200 overflow-y-auto bg-gray-50">
              <div className="p-4 border-b border-gray-200 bg-white">
                <h2 className="text-lg font-bold text-gray-900">メッセージ</h2>
                <p className="text-xs text-gray-500 mt-1">
                  Web3設計：個人情報は表示されません
                </p>
              </div>
              <div className="divide-y divide-gray-200">
                {candidates.map((candidate) => (
                  <button
                    key={candidate.id}
                    onClick={() => setSelectedCandidate(candidate)}
                    className={`w-full p-4 text-left hover:bg-white transition-colors ${
                      selectedCandidate?.id === candidate.id
                        ? "bg-white border-r-4 border-purple-600"
                        : ""
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-mono text-sm text-gray-900 mb-1 font-medium">
                          {formatAddress(candidate.walletAddress)}
                        </div>
                        {Object.keys(candidate.disclosedInfo).length > 0 && (
                          <div className="text-xs text-gray-600 mt-1">
                            {Object.entries(candidate.disclosedInfo).map(([key, value]) => (
                              <span key={key} className="mr-2">
                                {key === "university" ? `大学: ${value}` : 
                                 key === "major" ? `専攻: ${value}` : 
                                 `${key}: ${value}`}
                              </span>
                            ))}
                          </div>
                        )}
                        {Object.keys(candidate.disclosedInfo).length === 0 && (
                          <div className="text-xs text-gray-400 mt-1 italic">
                            情報未開示
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>🏆 NFT: {candidate.nftCount}</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        {candidate.lastMessageTime.toLocaleTimeString("ja-JP", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* メッセージ表示エリア */}
            <div className="flex-1 flex flex-col">
              {selectedCandidate ? (
                <>
                  <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
                    <div className="mb-2">
                      <h3 className="text-lg font-bold text-gray-900 mb-1 font-mono">
                        {formatAddress(selectedCandidate.walletAddress)}
                      </h3>
                      <div className="flex items-center space-x-3 text-sm text-gray-600">
                        <span className="flex items-center space-x-1">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          <span className="text-xs">オンライン</span>
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center space-x-4 text-xs">
                        <div className="flex items-center space-x-1 text-gray-600">
                          <span>🏆</span>
                          <span>NFT証明書: {selectedCandidate.nftCount}枚</span>
                        </div>
                      </div>
                      {Object.keys(selectedCandidate.disclosedInfo).length > 0 && (
                        <div className="bg-white/60 rounded-lg p-2 border border-purple-200">
                          <div className="text-xs font-medium text-purple-900 mb-1">
                            📋 開示された情報（メッセージ内で選択的に開示）:
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(selectedCandidate.disclosedInfo).map(([key, value]) => (
                              <span
                                key={key}
                                className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs"
                              >
                                {key === "university" ? `大学: ${value}` : 
                                 key === "major" ? `専攻: ${value}` : 
                                 `${key}: ${value}`}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {Object.keys(selectedCandidate.disclosedInfo).length === 0 && (
                        <div className="bg-yellow-50 rounded-lg p-2 border border-yellow-200">
                          <div className="text-xs text-yellow-800">
                            ⚠️ この候補者はまだ情報を開示していません。メッセージで追加情報を依頼できます。
                          </div>
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-2">
                        ※ NFT証明書はブロックチェーン上で公開情報として確認可能
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {messages.map((message) => {
                      const isDisclosureMessage = message.content.includes("【VCからの情報開示】");
                      return (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.sender === "org"
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md ${
                              isDisclosureMessage
                                ? "w-full"
                                : ""
                            }`}
                          >
                            {isDisclosureMessage ? (
                              <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-4">
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="text-lg">🔐</span>
                                  <span className="text-sm font-bold text-indigo-900">
                                    VCからの情報開示
                                  </span>
                                </div>
                                <div className="bg-white rounded-lg p-3 space-y-2">
                                  {message.content
                                    .split("\n")
                                    .filter((line) => line.startsWith("名前:") || line.startsWith("メール:") || line.startsWith("大学:") || line.startsWith("専攻:"))
                                    .map((line, index) => {
                                      const [key, ...valueParts] = line.split(":");
                                      const value = valueParts.join(":").replace(" (VCから取得)", "").trim();
                                      return (
                                        <div key={index} className="flex items-center space-x-2 text-sm">
                                          <span className="text-gray-600 font-medium w-20">{key}:</span>
                                          <span className="text-gray-900 font-semibold">{value}</span>
                                        </div>
                                      );
                                    })}
                                </div>
                                <div className="mt-2 text-xs text-indigo-700">
                                  ✅ この情報は候補者がVCから選択的に開示したものです
                                </div>
                                <p className="text-xs text-indigo-600 mt-2">
                                  {message.timestamp.toLocaleTimeString("ja-JP", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                            ) : (
                              <div
                                className={`px-4 py-2 rounded-xl ${
                                  message.sender === "org"
                                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                                    : "bg-white text-gray-900 border border-gray-200"
                                }`}
                              >
                                <p className="whitespace-pre-wrap">{message.content}</p>
                                <p
                                  className={`text-xs mt-1 ${
                                    message.sender === "org"
                                      ? "text-purple-100"
                                      : "text-gray-500"
                                  }`}
                                >
                                  {message.timestamp.toLocaleTimeString("ja-JP", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-4 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") handleSendMessage();
                        }}
                        placeholder="メッセージを入力..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                      />
                      <button
                        onClick={handleSendMessage}
                        className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                      >
                        送信
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">💬</div>
                    <p className="text-gray-500">候補者を選択してください</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
  );
}

