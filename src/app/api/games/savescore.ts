import type { NextApiRequest, NextApiResponse } from "next";
import admin from "../../../firebaseAdmin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const session = req.cookies.session || "";
  if (!session) return res.status(401).json({ error: "Not authenticated" });

  try {
    const decoded = await admin.auth().verifySessionCookie(session, true);
    const uid = decoded.uid;
    const { game, score } = req.body as { game: string; score: number };

    if (!game || typeof score !== "number") return res.status(400).json({ error: "Missing fields" });

    // Write to a leaderboards node and user's saves node
    const db = admin.database(); // Realtime DB
    const timestamp = Date.now();

    // push to leaderboards/<game> (public)
    const leaderRef = db.ref(`leaderboards/${game}`);
    await leaderRef.push({ uid, score, createdAt: timestamp });

    // save latest user score
    const userRef = db.ref(`users/${uid}/saves/${game}`);
    await userRef.set({ score, updatedAt: timestamp });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("save-score error:", err);
    return res.status(401).json({ error: "Invalid session" });
  }
}
