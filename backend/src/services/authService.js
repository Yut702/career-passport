import { getUserByEmail } from "../models/userModel.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/jwt.js";

export const loginService = async (email, password) => {
  const user = await getUserByEmail(email);
  if (!user) throw new Error("User not found");

  // support both "password" and "passwordHash" stored fields
  const hash = user.passwordHash || user.password;
  const isValid = bcrypt.compareSync(password, hash);
  if (!isValid) throw new Error("Invalid password");

  // if user.id is missing (seed uses email as key), fall back to email
  const token = generateToken(user.id || user.email);

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
