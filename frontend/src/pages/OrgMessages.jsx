import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useWalletConnect } from "../hooks/useWalletConnect";
import { messageAPI, matchAPI } from "../lib/api";
import { storage } from "../lib/storage";
import { formatAddress } from "../lib/utils";

export default function OrgMessages() {
  const [searchParams] = useSearchParams();
  const candidateId = searchParams.get("candidateId");
  const { account, isConnected } = useWalletConnect();
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [newConversationAddress, setNewConversationAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [applicants, setApplicants] = useState([]); // 応募者リスト（マッチング済みのみ）

  // マッチングしている応募者リストを読み込む
  useEffect(() => {
    const loadMatchedApplicants = async () => {
      if (!isConnected || !account) {
        setApplicants([]);
        return;
      }

      try {
        // マッチング情報を取得
        const matchesResponse = await matchAPI.getOrgMatches(account);
        console.log("📊 マッチング情報取得結果:", {
          ok: matchesResponse.ok,
          matchesCount: matchesResponse.matches?.length || 0,
          matches: matchesResponse.matches,
        });

        if (matchesResponse.ok && matchesResponse.matches) {
          // アクティブなマッチングの学生アドレスを抽出
          const matchedStudentAddresses = new Set(
            matchesResponse.matches
              .filter((m) => m.status === "active")
              .map((m) => m.studentAddress.toLowerCase())
          );

          console.log(
            "✅ マッチングしている学生アドレス:",
            Array.from(matchedStudentAddresses)
          );

          // 応募者リストから、マッチングしている学生だけをフィルタリング
          const allApplicants = storage.getApplicants();
          console.log("📋 応募者リスト:", allApplicants.length, "件");

          const matchedApplicants = allApplicants.filter((applicant) =>
            matchedStudentAddresses.has(applicant.walletAddress.toLowerCase())
          );

          console.log(
            "🎯 フィルタリング後の応募者数:",
            matchedApplicants.length,
            "件"
          );

          // 重複を除去: walletAddressとeventIdの組み合わせでユニークにする
          const uniqueApplicants = Array.from(
            new Map(
              matchedApplicants.map((applicant) => [
                `${applicant.walletAddress}-${applicant.eventId}`,
                applicant,
              ])
            ).values()
          );

          setApplicants(uniqueApplicants);
        } else {
          console.warn(
            "⚠️ マッチング情報が取得できませんでした:",
            matchesResponse
          );
          setApplicants([]);
        }
      } catch (err) {
        console.error("❌ マッチング情報の取得エラー:", err);
        setApplicants([]);
      }
    };

    loadMatchedApplicants();
  }, [isConnected, account]);

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

          // 候補者IDが指定されている場合、その候補者の会話を選択
          if (candidateId) {
            const candidate = response.conversations.find(
              (conv) =>
                conv.otherAddress.toLowerCase() === candidateId.toLowerCase()
            );
            if (candidate) {
              // 既存の会話がある場合
              setSelectedCandidate({
                walletAddress: candidate.otherAddress,
                conversationId: candidate.conversationId,
                otherInfo: candidate.otherInfo,
              });
            } else {
              // 既存の会話がない場合、新規会話として候補者アドレスを設定
              setSelectedCandidate({
                walletAddress: candidateId,
                conversationId: null, // 最初のメッセージ送信時に生成される
                otherInfo: { walletAddress: candidateId },
              });
            }
          } else if (response.conversations.length > 0) {
            // 最初の会話を選択
            const firstConv = response.conversations[0];
            setSelectedCandidate({
              walletAddress: firstConv.otherAddress,
              conversationId: firstConv.conversationId,
              otherInfo: firstConv.otherInfo,
            });
          }
        } else if (candidateId) {
          // 会話一覧が取得できなかったが、candidateIdが指定されている場合
          // 新規会話として候補者アドレスを設定
          setSelectedCandidate({
            walletAddress: candidateId,
            conversationId: null,
            otherInfo: { walletAddress: candidateId },
          });
        }
      } catch (err) {
        console.error("Error loading conversations:", err);
        setError("会話一覧の取得に失敗しました");
        // エラーでもcandidateIdが指定されている場合は新規会話として設定
        if (candidateId) {
          setSelectedCandidate({
            walletAddress: candidateId,
            conversationId: null,
            otherInfo: { walletAddress: candidateId },
          });
        }
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [isConnected, account, candidateId]);

  // 選択された候補者のメッセージを取得
  useEffect(() => {
    if (!selectedCandidate?.conversationId) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      if (!account) return;
      try {
        const response = await messageAPI.getMessages(
          selectedCandidate.conversationId,
          account
        );
        if (response.ok && response.messages) {
          // メッセージをフォーマット（Fromアドレス情報を含む）
          const formattedMessages = response.messages.map((msg) => ({
            id: msg.messageId,
            sender:
              msg.senderAddress.toLowerCase() === account.toLowerCase()
                ? "org"
                : "candidate",
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
            .filter((msg) => msg.sender === "candidate" && !msg.read)
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
    // 定期的にメッセージを更新（3秒ごと）
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [selectedCandidate?.conversationId, account]);

  const handleStartNewConversation = () => {
    if (!newConversationAddress.trim()) {
      setError("応募者のウォレットアドレスを入力してください");
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

    setSelectedCandidate({
      walletAddress: newConversationAddress,
      conversationId: null, // 最初のメッセージ送信時に生成される
      otherInfo: { walletAddress: newConversationAddress },
    });
    setShowNewConversation(false);
    setNewConversationAddress("");
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !account || !isConnected) return;

    const receiverAddress = selectedCandidate?.walletAddress;
    if (!receiverAddress) {
      setError("候補者を選択するか、新しい会話を開始してください");
      return;
    }

    setSending(true);
    setError(null);

    try {
      const response = await messageAPI.send(
        account,
        receiverAddress,
        newMessage
      );

      // 会話IDを取得（新規会話の場合は生成される）
      const conversationId = response.message?.conversationId;

      // 会話IDが設定されていない場合、新しく設定
      if (!selectedCandidate?.conversationId && conversationId) {
        setSelectedCandidate({
          ...selectedCandidate,
          conversationId: conversationId,
        });
      }

      // 会話IDを更新
      const finalConversationId =
        conversationId || selectedCandidate?.conversationId;
      if (finalConversationId && !selectedCandidate?.conversationId) {
        setSelectedCandidate({
          ...selectedCandidate,
          conversationId: finalConversationId,
        });
      }

      setNewMessage("");

      // メッセージ一覧を再取得（会話IDがある場合のみ）
      if (finalConversationId && account) {
        // データベースへの反映を待ってから再取得
        setTimeout(async () => {
          try {
            const messagesResponse = await messageAPI.getMessages(
              finalConversationId,
              account
            );
            if (messagesResponse.ok && messagesResponse.messages) {
              const formattedMessages = messagesResponse.messages.map(
                (msg) => ({
                  id: msg.messageId,
                  sender:
                    msg.senderAddress.toLowerCase() === account.toLowerCase()
                      ? "org"
                      : "candidate",
                  senderAddress: msg.senderAddress,
                  senderInfo: msg.senderInfo || {
                    walletAddress: msg.senderAddress,
                  },
                  content: msg.content,
                  timestamp: new Date(msg.sentAt),
                  read: msg.read,
                  messageId: msg.messageId,
                })
              );
              setMessages(formattedMessages);
            }
          } catch (err) {
            console.error("Error reloading messages:", err);
          }
        }, 300);
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
          {/* 候補者リスト */}
          <div className="w-1/3 border-r border-gray-200 overflow-y-auto bg-gray-50">
            <div className="p-4 border-b border-gray-200 bg-white">
              <h2 className="text-lg font-bold text-gray-900">メッセージ</h2>
              <p className="text-xs text-gray-500 mt-1">
                Web3設計：個人情報は表示されません
              </p>
            </div>
            {isConnected && (
              <div className="p-2 border-b border-gray-200 space-y-2">
                {/* 新しい会話を開始 */}
                <button
                  onClick={() => setShowNewConversation(!showNewConversation)}
                  className="w-full px-3 py-2 text-sm bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors font-medium"
                >
                  {showNewConversation ? "キャンセル" : "+ 新しい会話を開始"}
                </button>
                {showNewConversation && (
                  <div className="mt-2 p-3 bg-white rounded-lg border border-gray-200 space-y-2">
                    {/* 応募者から選択（補助的） */}
                    {applicants.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-600 mb-1 font-medium">
                          📋 応募者から選択（任意）
                        </p>
                        <select
                          onChange={(e) => {
                            const selected = applicants.find(
                              (a) => a.walletAddress === e.target.value
                            );
                            if (selected) {
                              setNewConversationAddress(selected.walletAddress);
                            }
                          }}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white"
                          defaultValue=""
                        >
                          <option value="">応募者を選択...</option>
                          {applicants
                            .filter(
                              (applicant, index, self) =>
                                index ===
                                self.findIndex(
                                  (a) =>
                                    a.walletAddress.toLowerCase() ===
                                      applicant.walletAddress.toLowerCase() &&
                                    a.eventId === applicant.eventId
                                )
                            )
                            .map((applicant) => (
                              <option
                                key={`${applicant.walletAddress}-${applicant.eventId}`}
                                value={applicant.walletAddress}
                              >
                                {applicant.eventTitle} -{" "}
                                {formatAddress(applicant.walletAddress)}
                              </option>
                            ))}
                        </select>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-600 mb-1 font-medium">
                        応募者のウォレットアドレス
                      </p>
                      <input
                        type="text"
                        value={newConversationAddress}
                        onChange={(e) =>
                          setNewConversationAddress(e.target.value)
                        }
                        placeholder="0x..."
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <button
                      onClick={handleStartNewConversation}
                      className="w-full px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                    >
                      会話を開始
                    </button>
                  </div>
                )}
              </div>
            )}
            {!isConnected && (
              <div className="p-4 text-center text-gray-500">
                ウォレットを接続してください
              </div>
            )}
            {loading ? (
              <div className="p-4 text-center text-gray-500">読み込み中...</div>
            ) : (
              <>
                {/* 会話一覧（優先表示） */}
                {conversations.length > 0 && (
                  <div className="divide-y divide-gray-200">
                    {conversations.map((conv) => (
                      <button
                        key={conv.conversationId}
                        onClick={() =>
                          setSelectedCandidate({
                            walletAddress: conv.otherAddress,
                            conversationId: conv.conversationId,
                            otherInfo: conv.otherInfo,
                          })
                        }
                        className={`w-full p-4 text-left hover:bg-white transition-colors ${
                          selectedCandidate?.conversationId ===
                          conv.conversationId
                            ? "bg-white border-r-4 border-purple-600"
                            : ""
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 mb-1">
                              {(() => {
                                const applicant = applicants.find(
                                  (a) =>
                                    a.walletAddress.toLowerCase() ===
                                    conv.otherAddress.toLowerCase()
                                );
                                return applicant
                                  ? `${applicant.eventTitle} - ${formatAddress(
                                      conv.otherAddress
                                    )}`
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
                            <span className="bg-purple-600 text-white text-xs rounded-full px-2 py-1">
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
                {/* 会話がない場合のメッセージ */}
                {conversations.length === 0 && (
                  <div className="p-4 text-center text-gray-500">
                    会話がありません。上記の「新しい会話を開始」から始められます。
                  </div>
                )}
              </>
            )}
          </div>

          {/* メッセージ表示エリア */}
          <div className="flex-1 flex flex-col">
            {selectedCandidate ? (
              <>
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {formatAddress(selectedCandidate.walletAddress)}
                      </h3>
                      <div className="flex items-center space-x-3 text-sm text-gray-600">
                        <span className="font-mono text-xs">
                          {selectedCandidate.walletAddress}
                        </span>
                        <span className="flex items-center space-x-1">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          <span className="text-xs">オンライン</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center space-x-4 text-xs">
                    <div className="text-gray-500">
                      ※ NFT証明書はブロックチェーン上で公開情報として確認可能
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                  {messages.map((message) => {
                    const isDisclosureMessage =
                      message.content.includes("【VCからの情報開示】");
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
                                この情報は候補者がVCから選択的に開示したものです
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
                              {/* Fromアドレスを表示 */}
                              <div
                                className={`text-xs mb-1 font-mono ${
                                  message.sender === "org"
                                    ? "text-purple-100"
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

                {error && (
                  <div className="p-2 bg-red-50 border border-red-200 text-red-700 text-sm">
                    {error}
                  </div>
                )}
                <div className="p-4 border-t border-gray-200">
                  {!selectedCandidate?.walletAddress && (
                    <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
                      ⚠️ 候補者を選択するか、新しい会話を開始してください
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
                          selectedCandidate?.walletAddress
                        ) {
                          handleSendMessage();
                        }
                      }}
                      placeholder={
                        !isConnected
                          ? "ウォレットを接続してください"
                          : !selectedCandidate?.walletAddress
                          ? "候補者を選択するか、新しい会話を開始してください"
                          : "メッセージを入力..."
                      }
                      disabled={
                        !isConnected ||
                        sending ||
                        !selectedCandidate?.walletAddress
                      }
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none disabled:opacity-50"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={
                        !isConnected ||
                        sending ||
                        !newMessage.trim() ||
                        !selectedCandidate?.walletAddress
                      }
                      className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
