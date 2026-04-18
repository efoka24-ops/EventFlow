import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { config } from "../config.js";

export const signToken = (payload) =>
  jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });

export const verifyToken = (token) => jwt.verify(token, config.jwtSecret);

export const hashPassword = async (plain) => bcrypt.hash(plain, 10);

export const comparePassword = async (plain, hash) => bcrypt.compare(plain, hash);
