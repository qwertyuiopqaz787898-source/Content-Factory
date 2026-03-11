import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database("content.db");

// Initialize DB
db.exec(`
  CREATE TABLE IF NOT EXISTS drafts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic TEXT,
    ideas TEXT,
    selectedIdea TEXT,
    script TEXT,
    thumbnailPrompt TEXT,
    thumbnailUrl TEXT,
    assets TEXT,
    metadata TEXT,
    step INTEGER,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // API routes
  app.get("/api/drafts", (req, res) => {
    const drafts = db.prepare("SELECT * FROM drafts ORDER BY updated_at DESC").all();
    res.json(drafts);
  });

  app.post("/api/drafts", (req, res) => {
    const { topic, ideas, selectedIdea, script, thumbnailPrompt, thumbnailUrl, assets, metadata, step } = req.body;
    const stmt = db.prepare(`
      INSERT INTO drafts (topic, ideas, selectedIdea, script, thumbnailPrompt, thumbnailUrl, assets, metadata, step)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(topic, JSON.stringify(ideas), selectedIdea, script, thumbnailPrompt, thumbnailUrl, assets, metadata, step);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/drafts/:id", (req, res) => {
    const { id } = req.params;
    const { topic, ideas, selectedIdea, script, thumbnailPrompt, thumbnailUrl, assets, metadata, step } = req.body;
    const stmt = db.prepare(`
      UPDATE drafts SET topic=?, ideas=?, selectedIdea=?, script=?, thumbnailPrompt=?, thumbnailUrl=?, assets=?, metadata=?, step=?, updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `);
    stmt.run(topic, JSON.stringify(ideas), selectedIdea, script, thumbnailPrompt, thumbnailUrl, assets, metadata, step, id);
    res.json({ success: true });
  });

  app.delete("/api/drafts/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM drafts WHERE id=?").run(id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
