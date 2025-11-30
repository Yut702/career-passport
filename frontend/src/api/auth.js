import axios from "axios";

const BASE = "http://localhost:3000/api/auth";

export const loginRequest = (email, password) =>
  axios.post(`${BASE}/login`, { email, password });
