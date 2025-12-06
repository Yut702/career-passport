import axios from "axios";

const BASE = "http://localhost:3000/api/usr";

// 汎用 POST 関数
export async function post(path, data, token = null) {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await axios.post(`${BASE}${path}`, data, { headers });
    return res.data;
  } catch (err) {
    // axios の場合は err.response.data にサーバーのエラーが入る
    if (err.response && err.response.data) {
      return { error: err.response.data.error || "Request failed" };
    }
    return { error: err.message };
  }
}

export async function get(path, token = null) {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await axios.get(`${BASE}${path}`, { headers });
    return res.data;
  } catch (err) {
    if (err.response && err.response.data) {
      return { error: err.response.data.error || "Request failed" };
    }
    return { error: err.message };
  }
}
