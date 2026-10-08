import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../prisma";
import { signToken } from "../auth";
import { serializeUser } from "../serialize";
import type { LoginRequest, Role } from "@sfu/shared";

export const authRouter = Router();

// Development identity adapter. A production deployment should replace this
// route with the university's OAuth/OIDC provider while preserving the response
// contract used by the clients. DUP logins exercise the device-conflict flow.
authRouter.post("/login", async (req, res) => {
  const { login, password } = req.body as LoginRequest;
  if (!login || !password) {
    return res.status(400).json({ error: "Login and password required" });
  }

  if (login.toUpperCase().includes("DUP")) {
    return res.status(409).json({ error: "account_linked" });
  }

  const user = await prisma.user.findUnique({ where: { login } });
  if (!user) return res.status(401).json({ error: "invalid_credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "invalid_credentials" });

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  const token = signToken({ sub: user.id, role: user.role as Role });
  res.json({ token, user: serializeUser(user) });
});
