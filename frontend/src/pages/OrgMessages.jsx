import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useWallet } from "../hooks/useWallet";
import { messageAPI } from "../lib/api";
import { storage } from "../lib/storage";
import { formatAddress } from "../lib/utils";

export default function OrgMessages() {
  const [searchParams] = useSearchParams();
  const candidateId = searchParams.get("candidateId");
  const { account, isConnected } = useWallet();
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [applicants, setApplicants] = useState([]); // 応募者リスト

  // 応募者リストを読み込む
  useEffect(() => {
    const applicantList = storage.getApplicants();
    setApplicants(applicantList);
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

          // 候補者IDが指定されている場合、その候補者の会話を選択
          if (candidateId) {
            const candidate = response.conversations.find(
              (conv) =>
                conv.otherAddress.toLowerCase() === candidateId.toLowerCase()
            );
            if (candidate) {
              setSelectedCandidate({
                walletAddress: candidate.otherAddress,
                conversationId: candidate.conversationId,
                otherInfo: candidate.otherInfo,
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
        }
      } catch (err) {
        console.error("Error loading conversations:", err);
        setError("会話一覧の取得に失敗しました");
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
      try {
        const response = await messageAPI.getMessages(
          selectedCandidate.conversationId
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
    // 定期的にメッセージを更新（5秒ごと）
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [selectedCandidate, account]);

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

      // 会話IDが設定されていない場合、新しく設定
      if (
        !selectedCandidate?.conversationId &&
        response.message?.conversationId
      ) {
        setSelectedCandidate({
          ...selectedCandidate,
          conversationId: response.message.conversationId,
        });
      }

      // メッセージをローカルに追加（即座に表示）
      const tempMessage = {
        id: `temp-${Date.now()}`,
        sender: "org",
        senderAddress: account,
        senderInfo: { walletAddress: account },
        content: newMessage,
        timestamp: new Date(),
        read: true,
      };
      setMessages([...messages, tempMessage]);
      setNewMessage("");

      // メッセージ一覧を再取得（会話IDがある場合のみ）
      if (selectedCandidate?.conversationId) {
        const messagesResponse = await messageAPI.getMessages(
          selectedCandidate.conversationId
        );
        if (messagesResponse.ok && messagesResponse.messages) {
          const formattedMessages = messagesResponse.messages.map((msg) => ({
            id: msg.messageId,
            sender:
              msg.senderAddress.toLowerCase() === account.toLowerCase()
                ? "org"
                : "candidate",
            senderAddress: msg.senderAddress,
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
          {/* 候補者リスト */}
          <div className="w-1/3 border-r border-gray-200 overflow-y-auto bg-gray-50">
            <div className="p-4 border-b border-gray-200 bg-white">
              <h2 className="text-lg font-bold text-gray-900">メッセージ</h2>
              <p className="text-xs text-gray-500 mt-1">
                Web3設計：個人情報は表示されません
              </p>
            </div>
            {isConnected && applicants.length > 0 && (
              <div className="p-2 border-b border-gray-200">
                <p className="text-xs text-gray-600 mb-2 font-medium">
                  📋 応募者から選択
                </p>
                <select
                  onChange={(e) => {
                    const selected = applicants.find(
                      (a) => a.walletAddress === e.target.value
                    );
                    if (selected) {
                      setSelectedCandidate({
                        walletAddress: selected.walletAddress,
                        conversationId: null,
                        otherInfo: { walletAddress: selected.walletAddress },
                      });
                    }
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white"
                  defaultValue=""
                >
                  <option value="">応募者を選択...</option>
                  {applicants.map((applicant) => (
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
            {!isConnected && (
              <div className="p-4 text-center text-gray-500">
                ウォレットを接続してください
              </div>
            )}
            {loading ? (
              <div className="p-4 text-center text-gray-500">読み込み中...</div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                会話がありません
              </div>
            ) : (
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
                      selectedCandidate?.conversationId === conv.conversationId
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
