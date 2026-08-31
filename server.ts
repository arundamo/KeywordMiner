import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
  });

  // Autocomplete proxy endpoint to bypass CORS and guarantee fast reliable queries
  app.get("/api/suggest", async (req, res) => {
    const platform = (req.query.platform as string) || "google";
    const query = (req.query.query as string) || "";
    const gl = (req.query.gl as string) || "us";
    const hl = (req.query.hl as string) || "en";
    const mkt = (req.query.mkt as string) || "1";

    if (!query.trim()) {
      res.json({ query: "", suggestions: [] });
      return;
    }

    try {
      let targetUrl = "";
      const headers: Record<string, string> = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "*/*",
        "Accept-Language": `${hl}-${gl.toUpperCase()},${hl};q=0.9,en;q=0.8`,
      };

      if (platform === "youtube") {
        targetUrl = `https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q=${encodeURIComponent(query)}&gl=${gl}&hl=${hl}`;
      } else if (platform === "amazon") {
        targetUrl = `https://completion.amazon.com/search/search-keywords?mkt=${mkt}&search-alias=aps&q=${encodeURIComponent(query)}`;
      } else {
        // Default Google
        targetUrl = `https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(query)}&gl=${gl}&hl=${hl}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const response = await fetch(targetUrl, {
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Upstream returned ${response.status}`);
      }

      const text = await response.text();
      let suggestions: string[] = [];

      try {
        const data = JSON.parse(text);
        if (Array.isArray(data)) {
          if (Array.isArray(data[1])) {
            suggestions = data[1].map((item: any) => {
              if (typeof item === "string") return item;
              if (Array.isArray(item) && typeof item[0] === "string") return item[0];
              if (item && typeof item.value === "string") return item.value;
              return String(item);
            });
          }
        } else if (data && Array.isArray(data.suggestions)) {
          suggestions = data.suggestions.map((item: any) =>
            typeof item === "string" ? item : item?.value || item?.keyword || ""
          );
        }
      } catch (parseErr) {
        // In case response is JSONP e.g., window.google.ac.h([...])
        const match = text.match(/\[.*\]/s);
        if (match) {
          try {
            const data = JSON.parse(match[0]);
            if (Array.isArray(data[1])) {
              suggestions = data[1].map((item: any) =>
                typeof item === "string" ? item : Array.isArray(item) ? item[0] : String(item)
              );
            }
          } catch {}
        }
      }

      // Filter and clean suggestions
      const cleaned = Array.from(
        new Set(
          suggestions
            .map((s) => s.trim())
            .filter((s) => s.length > 0)
        )
      );

      res.json({
        query,
        platform,
        suggestions: cleaned,
      });
    } catch (err: any) {
      // Return safe empty suggestions on network or timeout error without crashing
      res.json({
        query,
        platform,
        suggestions: [],
        error: err?.message || "Failed to fetch suggestions",
      });
    }
  });

  // Batch query endpoint for high-speed deep mining
  app.post("/api/suggest-batch", async (req, res) => {
    const { queries, platform = "google", gl = "us", hl = "en", mkt = "1" } = req.body;
    if (!Array.isArray(queries) || queries.length === 0) {
      res.json({ results: [] });
      return;
    }

    const limitedQueries = queries.slice(0, 30);
    const results = await Promise.all(
      limitedQueries.map(async (query: string) => {
        try {
          let targetUrl = "";
          if (platform === "youtube") {
            targetUrl = `https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q=${encodeURIComponent(query)}&gl=${gl}&hl=${hl}`;
          } else if (platform === "amazon") {
            targetUrl = `https://completion.amazon.com/search/search-keywords?mkt=${mkt}&search-alias=aps&q=${encodeURIComponent(query)}`;
          } else {
            targetUrl = `https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(query)}&gl=${gl}&hl=${hl}`;
          }

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3500);

          const response = await fetch(targetUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            },
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (!response.ok) return { query, suggestions: [] };
          const text = await response.text();
          let suggestions: string[] = [];

          try {
            const data = JSON.parse(text);
            if (Array.isArray(data) && Array.isArray(data[1])) {
              suggestions = data[1].map((item: any) =>
                typeof item === "string" ? item : Array.isArray(item) ? item[0] : String(item)
              );
            } else if (data?.suggestions && Array.isArray(data.suggestions)) {
              suggestions = data.suggestions.map((item: any) =>
                typeof item === "string" ? item : item?.value || ""
              );
            }
          } catch {
            const match = text.match(/\[.*\]/s);
            if (match) {
              try {
                const data = JSON.parse(match[0]);
                if (Array.isArray(data[1])) {
                  suggestions = data[1].map((item: any) =>
                    typeof item === "string" ? item : Array.isArray(item) ? item[0] : String(item)
                  );
                }
              } catch {}
            }
          }

          return {
            query,
            suggestions: Array.from(new Set(suggestions.map((s) => s.trim()).filter(Boolean))),
          };
        } catch {
          return { query, suggestions: [] };
        }
      })
    );

    res.json({ results });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Keyword Miner Server running on http://localhost:${PORT}`);
  });
}

startServer();
