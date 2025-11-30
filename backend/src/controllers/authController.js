import { loginService } from "../services/authService.js";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await loginService(email, password);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: err.message });
  }
};
