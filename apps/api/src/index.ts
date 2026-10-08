import http from "http";
import path from "path";
import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth";
import { meRouter } from "./routes/me";
import { listingsRouter } from "./routes/listings";
import { dormsRouter } from "./routes/dorms";
import { adminRouter } from "./routes/admin";
import { ticketsRouter } from "./routes/tickets";
import { appealsRouter } from "./routes/appeals";
import { paymentsRouter } from "./routes/payments";
import { eventsRouter } from "./routes/events";
import { notificationsRouter } from "./routes/notifications";
import { chatRouter } from "./routes/chat";
import { broadcastsRouter } from "./routes/broadcasts";
import { lostFoundRouter } from "./routes/lostfound";
import { contactRouter } from "./routes/contact";
import { roomChecksRouter } from "./routes/roomchecks";
import { uploadsRouter } from "./routes/uploads";
import { leadershipRouter } from "./routes/leadership";
import { academicsRouter } from "./routes/academics";
import { facilitiesRouter } from "./routes/facilities";
import { canteenRouter } from "./routes/canteen";
import { roommatesRouter } from "./routes/roommates";
import { materialsRouter } from "./routes/materials";
import { initSockets } from "./sockets";
import { corsOrigin } from "./config";

import helmet from "helmet";
import { rateLimit } from "express-rate-limit";

const app = express();
app.use(helmet()); // Secure HTTP headers

// Limit requests from same IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
});
app.use(limiter);

const corsOptions = {
  origin: corsOrigin,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRouter);
app.use("/api/me", meRouter);
app.use("/api/listings", listingsRouter);
app.use("/api/dorms", dormsRouter);
app.use("/api/admin", adminRouter);
app.use("/api/tickets", ticketsRouter);
app.use("/api/appeals", appealsRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/events", eventsRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/chat", chatRouter);
app.use("/api/broadcasts", broadcastsRouter);
app.use("/api/lostfound", lostFoundRouter);
app.use("/api/contact", contactRouter);
app.use("/api/roomchecks", roomChecksRouter);
app.use("/api/uploads", uploadsRouter);
app.use("/api/leadership", leadershipRouter);
app.use("/api/academics", academicsRouter);
app.use("/api/facilities", facilitiesRouter);
app.use("/api/canteen", canteenRouter);
app.use("/api/roommate-requests", roommatesRouter);
app.use("/api/material-logs", materialsRouter);

app.use((req, res) => {
  res.status(404).json({ error: "not_found" });
});

// multer errors (bad mimetype, file too large) land here instead of crashing the process
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(400).json({ error: err.message || "upload_failed" });
});

const PORT = Number(process.env.PORT) || 4000;
const httpServer = http.createServer(app);
initSockets(httpServer);

httpServer.listen(PORT, () => {
  console.log(`SFU Dorm API (+ realtime) listening on http://localhost:${PORT}`);
});
