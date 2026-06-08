import jwt from "jsonwebtoken";
import { headers } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export function generateToken(payload: any) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });
}

export async function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch (error) {
    return null;
  }
}

export async function getAuthUser() {
  const headersList = await headers();
  const authHeader = headersList.get("authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];
  return verifyToken(token);
}

export async function isAdmin() {
  const user = await getAuthUser();
  return user && (user.role === "ADMIN" || user.role === "OWNER");
}

export async function isStaff() {
  const user = await getAuthUser();
  return user && (user.role === "STAFF" || user.role === "ADMIN" || user.role === "OWNER");
}

export async function isRider() {
  const user = await getAuthUser();
  return user && (user.role === "RIDER" || user.role === "ADMIN" || user.role === "OWNER");
}
