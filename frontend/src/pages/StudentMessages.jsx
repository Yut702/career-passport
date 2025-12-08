import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function StudentMessages() {
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get("companyId");
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [showInfoDisclosure, setShowInfoDisclosure] = useState(false);
  const [disclosedInfo, setDisclosedInfo] = useState({
    name: false,
    email: false,
    university: false,
    major: false,
  });
  // ウォレットアドレスを短縮表示する関数
  const formatAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const [companies] = useState([
    { 
      id: 1, 
      name: "株式会社テック",
      walletAddress: "0x1234567890123456789012345678901234567890",
      nftCount: 3,
      lastMessageTime: new Date(Date.now() - 3600000),
    },
    { 
      id: 2, 
      name: "株式会社イノベーション",
      walletAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
      nftCount: 5,
      lastMessageTime: new Date(Date.now() - 7200000),
    },
    { 
      id: 3, 
      name: "株式会社スタートアップ",
      walletAddress: "0x9876543210987654321098765432109876543210",
      nftCount: 2,
      lastMessageTime: new Date(Date.now() - 10800000),
    },
  ]);

  useEffect(() => {
    if (companyId) {
      const company = companies.find((c) => c.id === parseInt(companyId));
      setSelectedCompany(company);
    } else if (companies.length > 0) {
      setSelectedCompany(companies[0]);
    }
  }, [companyId, companies]);

  useEffect(() => {
    if (selectedCompany) {
      // モックデータ（実際の実装ではAPIから取得）
      const mockMessages = [
        {
          id: 1,
          sender: "user",
          content: "こんにちは。インターンシップに興味があります。",
          timestamp: new Date(Date.now() - 3600000),
        },
        {
          id: 2,
          sender: "company",
          content: "ありがとうございます。詳細をお送りします。",
          timestamp: new Date(Date.now() - 1800000),
        },
      ];
      setMessages(mockMessages);
    }
  }, [selectedCompany]);

  // ローカルストレージからVCを読み込む
  const getVCs = () => {
    const saved = localStorage.getItem("studentVCs");
    return saved ? JSON.parse(saved) : [];
  };

  // VCから情報を抽出（ZKPで選択的に開示）
  const extractInfoFromVCs = () => {
    const vcs = getVCs();
    const info = {
      name: null,
      email: null,
      university: null,
      major: null,
    };

    vcs.forEach((vc) => {
      if (vc.type === "myNumber" && vc.attributes) {
        if (vc.attributes.name) info.name = vc.attributes.name;
      }
      if (vc.type === "degree" && vc.attributes) {
        if (vc.attributes.university) info.university = vc.attributes.university;
        if (vc.attributes.major) info.major = vc.attributes.major;
      }
    });

    return info;
  };

  const handleToggleInfoDisclosure = () => {
    setShowInfoDisclosure(!showInfoDisclosure);
  };

  const handleDiscloseInfo = () => {
    const vcInfo = extractInfoFromVCs();
    const infoToDisclose = [];
    
    if (disclosedInfo.name && vcInfo.name) {
      infoToDisclose.push(`名前: ${vcInfo.name} (VCから取得)`);
    }
    if (disclosedInfo.email && vcInfo.email) {
      infoToDisclose.push(`メール: ${vcInfo.email} (VCから取得)`);
    }
    if (disclosedInfo.university && vcInfo.university) {
      infoToDisclose.push(`大学: ${vcInfo.university} (VCから取得)`);
    }
    if (disclosedInfo.major && vcInfo.major) {
      infoToDisclose.push(`専攻: ${vcInfo.major} (VCから取得)`);
    }

    if (infoToDisclose.length > 0) {
      const disclosureMessage = `【VCからの情報開示】\n${infoToDisclose.join("\n")}`;
      const message = {
        id: messages.length + 1,
        sender: "user",
        content: disclosureMessage,
        timestamp: new Date(),
      };
      setMessages([...messages, message]);
      setShowInfoDisclosure(false);
      setDisclosedInfo({ name: false, email: false, university: false, major: false });
    } else {
      alert("開示する情報がありません。VC管理ページでVCを追加してください。");
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message = {
      id: messages.length + 1,
      sender: "user",
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
            {/* 企業リスト */}
            <div className="w-1/3 border-r border-gray-200 overflow-y-auto bg-gray-50">
              <div className="p-4 border-b border-gray-200 bg-white">
                <h2 className="text-lg font-bold text-gray-900">メッセージ</h2>
                <p className="text-xs text-gray-500 mt-1">
                  Web3設計：個人情報は表示されません
                </p>
              </div>
              <div className="divide-y divide-gray-200">
                {companies.map((company) => (
                  <button
                    key={company.id}
                    onClick={() => setSelectedCompany(company)}
                    className={`w-full p-4 text-left hover:bg-white transition-colors ${
                      selectedCompany?.id === company.id
                        ? "bg-white border-r-4 border-blue-600"
                        : ""
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 mb-1">
                          {company.name}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span className="font-mono">
                            {formatAddress(company.walletAddress)}
                          </span>
                          <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>🏆 NFT: {company.nftCount}</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        {company.lastMessageTime.toLocaleTimeString("ja-JP", {
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
              {selectedCompany ? (
                <>
                  <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                          {selectedCompany.name}
                        </h3>
                        <div className="flex items-center space-x-3 text-sm text-gray-600">
                          <span className="font-mono text-xs">
                            {formatAddress(selectedCompany.walletAddress)}
                          </span>
                          <span className="flex items-center space-x-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            <span className="text-xs">オンライン</span>
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={handleToggleInfoDisclosure}
                        className="px-4 py-2 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors font-medium flex items-center space-x-2"
                      >
                        <span>🔐</span>
                        <span>情報を開示</span>
                      </button>
                    </div>
                    <div className="mt-3 flex items-center space-x-4 text-xs">
                      <div className="flex items-center space-x-1 text-gray-600">
                        <span>🏆</span>
                        <span>NFT証明書: {selectedCompany.nftCount}枚</span>
                      </div>
                      <div className="text-gray-500">
                        ※ NFT証明書はブロックチェーン上で公開情報として確認可能
                      </div>
                    </div>
                  </div>

                  {/* 情報開示ダイアログ */}
                  {showInfoDisclosure && (
                    <div className="p-4 bg-indigo-50 border-b border-indigo-200">
                      <h4 className="font-bold text-indigo-900 mb-2 text-sm">
                        🔐 VCから情報を選択的に開示（Web3設計）
                      </h4>
                      <p className="text-xs text-indigo-700 mb-2">
                        <strong>VC（Verifiable Credential）</strong>から必要な情報のみを選択的に開示できます。
                      </p>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                        <p className="text-xs text-blue-800 font-semibold mb-1">
                          ⚠️ プライバシー保護
                        </p>
                        <ul className="text-xs text-blue-800 list-disc list-inside ml-2 space-y-1">
                          <li>運営側には送信されません</li>
                          <li>企業との直接的なメッセージ交換のみ</li>
                          <li>必要な情報のみを選択して開示可能</li>
                        </ul>
                      </div>
                      <div className="space-y-2 mb-3">
                        {[
                          { key: "name", label: "お名前", vcType: "myNumber" },
                          { key: "email", label: "メールアドレス", vcType: "other" },
                          { key: "university", label: "大学名", vcType: "degree" },
                          { key: "major", label: "専攻", vcType: "degree" },
                        ].map((item) => {
                          const vcInfo = extractInfoFromVCs();
                          const hasValue = vcInfo[item.key];
                          return (
                            <label
                              key={item.key}
                              className={`flex items-center space-x-2 text-sm ${
                                !hasValue ? "opacity-50" : ""
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={disclosedInfo[item.key]}
                                onChange={(e) =>
                                  setDisclosedInfo({
                                    ...disclosedInfo,
                                    [item.key]: e.target.checked,
                                  })
                                }
                                disabled={!hasValue}
                                className="rounded"
                              />
                              <span className={!hasValue ? "text-gray-400" : "text-gray-700"}>
                                {item.label}
                                {!hasValue && `（VC未登録）`}
                                {hasValue && `（VCから取得可能）`}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                      {getVCs().length === 0 && (
                        <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-xs text-yellow-800 mb-2">
                            VCが登録されていません。
                          </p>
                          <button
                            onClick={() => navigate("/student/settings")}
                            className="text-xs text-yellow-700 underline hover:text-yellow-900"
                          >
                            VC管理ページでVCを追加する
                          </button>
                        </div>
                      )}
                      <div className="flex space-x-2">
                        <button
                          onClick={handleDiscloseInfo}
                          disabled={
                            !Object.values(disclosedInfo).some((v) => v)
                          }
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          選択した情報を開示
                        </button>
                        <button
                          onClick={() => {
                            setShowInfoDisclosure(false);
                            setDisclosedInfo({
                              name: false,
                              email: false,
                              university: false,
                              major: false,
                            });
                          }}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                        >
                          キャンセル
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {messages.map((message) => {
                      const isDisclosureMessage = message.content.includes("【VCからの情報開示】");
                      return (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.sender === "user"
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
                                  ✅ この情報はVCから取得され、選択的に開示されました
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
                                  message.sender === "user"
                                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                                    : "bg-white text-gray-900 border border-gray-200"
                                }`}
                              >
                                <p className="whitespace-pre-wrap">{message.content}</p>
                                <p
                                  className={`text-xs mt-1 ${
                                    message.sender === "user"
                                      ? "text-blue-100"
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
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                      <button
                        onClick={handleSendMessage}
                        className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
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
                    <p className="text-gray-500">企業を選択してください</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
  );
}

