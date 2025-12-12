import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useWallet } from "../hooks/useWallet";
import { messageAPI } from "../lib/api";
import { storage } from "../lib/storage";
import { formatAddress } from "../lib/utils";

export default function StudentMessages() {
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get("companyId");
  const navigate = useNavigate();
  const { account, isConnected } = useWallet();
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [showInfoDisclosure, setShowInfoDisclosure] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [newConversationAddress, setNewConversationAddress] = useState("");
  const [disclosedInfo, setDisclosedInfo] = useState({
    name: false,
    email: false,
    university: false,
    major: false,
  });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [approvedCompanies, setApprovedCompanies] = useState([]); // 承認された企業リスト

  // 承認された企業リストを読み込む
  useEffect(() => {
    const companies = storage.getApprovedCompanies();
    setApprovedCompanies(companies);
  }, []);

  // 会話一覧を取得
  useEffect(() => {
    if (!isConnected || !account) {
      setLoading(false);
      return;
    }

    const loadConversations = async () => {
      try {
        const response = await messageAPI.getConversations(account);
        if (response.ok && response.conversations) {
          setConversations(response.conversations);

          // 企業IDが指定されている場合、その企業の会話を選択
          if (companyId) {
            const company = response.conversations.find(
              (conv) =>
                conv.otherAddress.toLowerCase() === companyId.toLowerCase()
            );
            if (company) {
              setSelectedCompany({
                walletAddress: company.otherAddress,
                conversationId: company.conversationId,
              });
            }
          } else if (response.conversations.length > 0) {
            // 最初の会話を選択
            const firstConv = response.conversations[0];
            setSelectedCompany({
              walletAddress: firstConv.otherAddress,
              conversationId: firstConv.conversationId,
            });
          }
        }
      } catch (err) {
        console.error("Error loading conversations:", err);
        setError("会話一覧の取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [isConnected, account, companyId]);

  // 選択された企業のメッセージを取得
  useEffect(() => {
    // 会話IDがない場合（新規会話）はメッセージを取得しない
    if (!selectedCompany?.conversationId) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      try {
        const response = await messageAPI.getMessages(
          selectedCompany.conversationId
        );
        if (response.ok && response.messages) {
          // メッセージをフォーマット（Fromアドレス情報を含む）
          const formattedMessages = response.messages.map((msg) => ({
            id: msg.messageId,
            sender:
              msg.senderAddress.toLowerCase() === account.toLowerCase()
                ? "user"
                : "company",
            senderAddress: msg.senderAddress, // Fromアドレスを保存
            senderInfo: msg.senderInfo || { walletAddress: msg.senderAddress },
            content: msg.content,
            timestamp: new Date(msg.sentAt),
            read: msg.read,
            messageId: msg.messageId,
          }));
          setMessages(formattedMessages);

          // 未読メッセージを既読にする
          formattedMessages
            .filter((msg) => msg.sender === "company" && !msg.read)
            .forEach((msg) => {
              messageAPI.markAsRead(msg.messageId).catch(console.error);
            });
        }
      } catch (err) {
        console.error("Error loading messages:", err);
        setError("メッセージの取得に失敗しました");
      }
    };

    loadMessages();
    // 定期的にメッセージを更新（5秒ごと）
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [selectedCompany, account]);

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
        if (vc.attributes.university)
          info.university = vc.attributes.university;
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
      const disclosureMessage = `【VCからの情報開示】\n${infoToDisclose.join(
        "\n"
      )}`;
      const message = {
        id: messages.length + 1,
        sender: "user",
        content: disclosureMessage,
        timestamp: new Date(),
      };
      setMessages([...messages, message]);
      setShowInfoDisclosure(false);
      setDisclosedInfo({
        name: false,
        email: false,
        university: false,
        major: false,
      });
    } else {
      alert("開示する情報がありません。VC管理ページでVCを追加してください。");
    }
  };

  const handleStartNewConversation = () => {
    if (!newConversationAddress.trim()) {
      setError("企業のウォレットアドレスを入力してください");
      return;
    }

    // アドレスの形式チェック（簡易版）
    if (
      !newConversationAddress.startsWith("0x") ||
      newConversationAddress.length !== 42
    ) {
      setError(
        "有効なウォレットアドレスを入力してください（0xで始まる42文字）"
      );
      return;
    }

    setSelectedCompany({
      walletAddress: newConversationAddress,
      conversationId: null, // 最初のメッセージ送信時に生成される
    });
    setShowNewConversation(false);
    setNewConversationAddress("");
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !account || !isConnected) return;

    // 企業が選択されていない場合、新規会話を開始
    let receiverAddress = selectedCompany?.walletAddress;
    if (!receiverAddress) {
      setError("企業を選択するか、新しい会話を開始してください");
      return;
    }

    setSending(true);
    setError(null);

    try {
      console.log("📤 メッセージ送信:", {
        sender: account,
        receiver: receiverAddress,
        content: newMessage,
      });

      const response = await messageAPI.send(
        account,
        receiverAddress,
        newMessage
      );

      console.log("✅ メッセージ送信成功:", response);

      // 会話IDが設定されていない場合、新しく設定
      if (
        !selectedCompany?.conversationId &&
        response.message?.conversationId
      ) {
        setSelectedCompany({
          ...selectedCompany,
          conversationId: response.message.conversationId,
        });
      }

      // メッセージをローカルに追加（即座に表示）
      const tempMessage = {
        id: `temp-${Date.now()}`,
        sender: "user",
        content: newMessage,
        timestamp: new Date(),
        read: true,
      };
      setMessages([...messages, tempMessage]);
      setNewMessage("");

      // メッセージ一覧を再取得（会話IDがある場合のみ）
      if (selectedCompany?.conversationId) {
        const messagesResponse = await messageAPI.getMessages(
          selectedCompany.conversationId
        );
        if (messagesResponse.ok && messagesResponse.messages) {
          const formattedMessages = messagesResponse.messages.map((msg) => ({
            id: msg.messageId,
            sender:
              msg.senderAddress.toLowerCase() === account.toLowerCase()
                ? "user"
                : "company",
            senderAddress: msg.senderAddress, // Fromアドレスを保存
            senderInfo: msg.senderInfo || { walletAddress: msg.senderAddress },
            content: msg.content,
            timestamp: new Date(msg.sentAt),
            read: msg.read,
            messageId: msg.messageId,
          }));
          setMessages(formattedMessages);
        }
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setError(err.message || "メッセージの送信に失敗しました");
    } finally {
      setSending(false);
    }
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
            {!isConnected && (
              <div className="p-4 text-center text-gray-500">
                ウォレットを接続してください
              </div>
            )}
            {isConnected && (
              <div className="p-2 border-b border-gray-200 space-y-2">
                {/* 承認された企業から選択 */}
                {approvedCompanies.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-600 mb-2 font-medium">
                      📋 承認された企業から選択
                    </p>
                    <select
                      onChange={(e) => {
                        const selected = approvedCompanies.find(
                          (c) => c.walletAddress === e.target.value
                        );
                        if (selected) {
                          setSelectedCompany({
                            walletAddress: selected.walletAddress,
                            conversationId: null,
                          });
                          setShowNewConversation(false);
                        }
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                      defaultValue=""
                    >
                      <option value="">企業を選択...</option>
                      {approvedCompanies.map((company) => (
                        <option
                          key={company.walletAddress}
                          value={company.walletAddress}
                        >
                          {company.companyName} ({company.eventTitle})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <button
                  onClick={() => setShowNewConversation(!showNewConversation)}
                  className="w-full px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                >
                  {showNewConversation ? "キャンセル" : "+ 新しい会話を開始"}
                </button>
                {showNewConversation && (
                  <div className="mt-2 p-3 bg-white rounded-lg border border-gray-200">
                    <input
                      type="text"
                      value={newConversationAddress}
                      onChange={(e) =>
                        setNewConversationAddress(e.target.value)
                      }
                      placeholder="企業のウォレットアドレス（0x...）"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                    <button
                      onClick={handleStartNewConversation}
                      className="mt-2 w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      会話を開始
                    </button>
                  </div>
                )}
              </div>
            )}
            {loading ? (
              <div className="p-4 text-center text-gray-500">読み込み中...</div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                会話がありません。上記の「新しい会話を開始」から始められます。
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {conversations.map((conv) => (
                  <button
                    key={conv.conversationId}
                    onClick={() =>
                      setSelectedCompany({
                        walletAddress: conv.otherAddress,
                        conversationId: conv.conversationId,
                      })
                    }
                    className={`w-full p-4 text-left hover:bg-white transition-colors ${
                      selectedCompany?.conversationId === conv.conversationId
                        ? "bg-white border-r-4 border-blue-600"
                        : ""
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 mb-1">
                          {(() => {
                            const company = approvedCompanies.find(
                              (c) =>
                                c.walletAddress.toLowerCase() ===
                                conv.otherAddress.toLowerCase()
                            );
                            return company
                              ? company.companyName
                              : formatAddress(conv.otherAddress);
                          })()}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span className="font-mono">
                            {formatAddress(conv.otherAddress)}
                          </span>
                          <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                        </div>
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-xs text-gray-500 truncate flex-1 mr-2">
                        {conv.latestMessage?.content || ""}
                      </div>
                      <div className="text-xs text-gray-400">
                        {conv.latestMessage?.sentAt
                          ? new Date(
                              conv.latestMessage.sentAt
                            ).toLocaleTimeString("ja-JP", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* メッセージ表示エリア */}
          <div className="flex-1 flex flex-col">
            {selectedCompany ? (
              <>
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {(() => {
                          const company = approvedCompanies.find(
                            (c) =>
                              c.walletAddress.toLowerCase() ===
                              selectedCompany.walletAddress.toLowerCase()
                          );
                          return company
                            ? company.companyName
                            : formatAddress(selectedCompany.walletAddress);
                        })()}
                      </h3>
                      <div className="flex items-center space-x-3 text-sm text-gray-600">
                        <span className="font-mono text-xs">
                          {selectedCompany.walletAddress}
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
                      <strong>VC（Verifiable Credential）</strong>
                      から必要な情報のみを選択的に開示できます。
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
                        {
                          key: "email",
                          label: "メールアドレス",
                          vcType: "other",
                        },
                        {
                          key: "university",
                          label: "大学名",
                          vcType: "degree",
                        },
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
                            <span
                              className={
                                !hasValue ? "text-gray-400" : "text-gray-700"
                              }
                            >
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
                        disabled={!Object.values(disclosedInfo).some((v) => v)}
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
                    const isDisclosureMessage =
                      message.content.includes("【VCからの情報開示】");
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
                            isDisclosureMessage ? "w-full" : ""
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
                                  .filter(
                                    (line) =>
                                      line.startsWith("名前:") ||
                                      line.startsWith("メール:") ||
                                      line.startsWith("大学:") ||
                                      line.startsWith("専攻:")
                                  )
                                  .map((line, index) => {
                                    const [key, ...valueParts] =
                                      line.split(":");
                                    const value = valueParts
                                      .join(":")
                                      .replace(" (VCから取得)", "")
                                      .trim();
                                    return (
                                      <div
                                        key={index}
                                        className="flex items-center space-x-2 text-sm"
                                      >
                                        <span className="text-gray-600 font-medium w-20">
                                          {key}:
                                        </span>
                                        <span className="text-gray-900 font-semibold">
                                          {value}
                                        </span>
                                      </div>
                                    );
                                  })}
                              </div>
                              <div className="mt-2 text-xs text-indigo-700">
                                ✅
                                この情報はVCから取得され、選択的に開示されました
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
                              {/* Fromアドレスを表示 */}
                              <div
                                className={`text-xs mb-1 font-mono ${
                                  message.sender === "user"
                                    ? "text-blue-100"
                                    : "text-gray-500"
                                }`}
                              >
                                From:{" "}
                                {formatAddress(
                                  message.senderAddress ||
                                    message.senderInfo?.walletAddress ||
                                    ""
                                )}
                              </div>
                              <p className="whitespace-pre-wrap">
                                {message.content}
                              </p>
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

                {error && (
                  <div className="p-2 bg-red-50 border border-red-200 text-red-700 text-sm">
                    {error}
                  </div>
                )}
                <div className="p-4 border-t border-gray-200">
                  {!selectedCompany?.walletAddress && (
                    <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
                      ⚠️ 企業を選択するか、新しい会話を開始してください
                    </div>
                  )}
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (
                          e.key === "Enter" &&
                          !sending &&
                          selectedCompany?.walletAddress
                        ) {
                          handleSendMessage();
                        }
                      }}
                      placeholder={
                        !isConnected
                          ? "ウォレットを接続してください"
                          : !selectedCompany?.walletAddress
                          ? "企業を選択するか、新しい会話を開始してください"
                          : "メッセージを入力..."
                      }
                      disabled={
                        !isConnected ||
                        sending ||
                        !selectedCompany?.walletAddress
                      }
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:opacity-50"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={
                        !isConnected ||
                        sending ||
                        !newMessage.trim() ||
                        !selectedCompany?.walletAddress
                      }
                      className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sending ? "送信中..." : "送信"}
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
