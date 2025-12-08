import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function OrgEventCollaborate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [partners, setPartners] = useState([]);
  const [selectedPartners, setSelectedPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // モックデータ（実際の実装ではAPIから取得）
    const mockEvent = {
      id: parseInt(id),
      title: "サマーインターンシップ 2025",
      description: "エンジニア向けのサマーインターンシップです。",
      startDate: "2025-07-01",
      endDate: "2025-08-31",
    };

    const mockPartners = [
      { id: 1, name: "株式会社パートナーA", industry: "IT" },
      { id: 2, name: "株式会社パートナーB", industry: "コンサルティング" },
      { id: 3, name: "株式会社パートナーC", industry: "金融" },
    ];

    setEvent(mockEvent);
    setPartners(mockPartners);
    setLoading(false);
  }, [id]);

  const handlePartnerToggle = (partnerId) => {
    setSelectedPartners((prev) =>
      prev.includes(partnerId)
        ? prev.filter((id) => id !== partnerId)
        : [...prev, partnerId]
    );
  };

  const handleSubmit = async () => {
    if (selectedPartners.length === 0) {
      alert("共同オファーする企業を選択してください");
      return;
    }

    // 共同オファー処理（実際の実装ではAPIに送信）
    alert("共同オファーを送信しました！");
    navigate("/org/events");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">イベントが見つかりません</p>
      </div>
    );
  }

  return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate("/org/events")}
          className="mb-6 text-purple-600 hover:text-purple-700 flex items-center space-x-2"
        >
          <span>←</span>
          <span>イベント一覧に戻る</span>
        </button>

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              NFT発行イベント共同オファー
            </h1>
            <p className="text-gray-600 mb-4">{event.title}</p>
            <p className="text-gray-700">{event.description}</p>
          </div>

          <div className="mb-8 p-6 bg-purple-50 rounded-xl border border-purple-200">
            <h3 className="font-bold text-gray-900 mb-3">開催期間</h3>
            <p className="text-gray-700">
              {event.startDate} ～ {event.endDate}
            </p>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              共同オファーする企業を選択
            </h3>
            <div className="space-y-3">
              {partners.map((partner) => (
                <label
                  key={partner.id}
                  className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    selectedPartners.includes(partner.id)
                      ? "border-purple-600 bg-purple-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedPartners.includes(partner.id)}
                    onChange={() => handlePartnerToggle(partner.id)}
                    className="mr-4 w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">
                      {partner.name}
                    </div>
                    <div className="text-sm text-gray-600">{partner.industry}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              onClick={() => navigate("/org/events")}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
            >
              共同オファーを送信
            </button>
          </div>
        </div>
      </div>
  );
}

