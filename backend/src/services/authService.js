import { getUserByEmail } from "../models/userModel.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/jwt.js";

export const loginService = async (email, password) => {
  const user = await getUserByEmail(email);
  if (!user) throw new Error("User not found");

  const isValid = bcrypt.compareSync(password, user.password);
  if (!isValid) throw new Error("Invalid password");

  const token = generateToken(user.id);

  return {
    message: "Login successful",
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  };
};
