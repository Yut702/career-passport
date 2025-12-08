import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function StudentEventApply() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [formData, setFormData] = useState({
    motivation: "",
    experience: "",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // モックデータ（実際の実装ではAPIから取得）
    const mockEvent = {
      id: parseInt(id),
      title: "サマーインターンシップ 2025",
      organization: "株式会社テック",
      description: "エンジニア向けのサマーインターンシップです。",
      startDate: "2025-07-01",
      endDate: "2025-08-31",
      requirements: [
        "プログラミング経験があること",
        "チームワークを大切にできること",
        "積極的な姿勢",
      ],
    };
    setEvent(mockEvent);
    setLoading(false);
  }, [id]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // 応募処理（実際の実装ではAPIに送信）
    await new Promise((resolve) => setTimeout(resolve, 1000));

    alert("応募が完了しました！");
    navigate("/student/events");
    setSubmitting(false);
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
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate("/student/events")}
          className="mb-6 text-blue-600 hover:text-blue-700 flex items-center space-x-2"
        >
          <span>←</span>
          <span>イベント一覧に戻る</span>
        </button>

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {event.title}
            </h1>
            <p className="text-gray-600 mb-4">{event.organization}</p>
            <p className="text-gray-700">{event.description}</p>
          </div>

          <div className="mb-8 p-6 bg-blue-50 rounded-xl border border-blue-200">
            <h3 className="font-bold text-gray-900 mb-3">開催期間</h3>
            <p className="text-gray-700">
              {event.startDate} ～ {event.endDate}
            </p>
          </div>

          <div className="mb-8">
            <h3 className="font-bold text-gray-900 mb-3">応募条件</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              {event.requirements.map((req, index) => (
                <li key={index}>{req}</li>
              ))}
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                応募動機 <span className="text-red-500">*</span>
              </label>
              <textarea
                name="motivation"
                value={formData.motivation}
                onChange={handleChange}
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="このイベントに応募する理由を記入してください"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                経験・スキル
              </label>
              <textarea
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="関連する経験やスキルを記入してください"
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={() => navigate("/student/events")}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "送信中..." : "応募する"}
              </button>
            </div>
          </form>
        </div>
      </div>
  );
}

