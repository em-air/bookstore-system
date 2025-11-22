import "dotenv/config";
import express from "express";
import type { Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
// Inline log to avoid module resolution issues in Vercel
function log(message: string, source = 'express') {
  const formattedTime = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

const app = express();

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
// Custom lightweight JSON parser (addresses Vercel body parsing issues for POST/PATCH)
app.use((req: Request, res: Response, next: NextFunction) => {
  const contentType = req.headers['content-type'] || '';
  if ((req.method === 'POST' || req.method === 'PATCH' || req.method === 'PUT') && contentType.includes('application/json')) {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      if (data.length === 0) {
        req.body = {};
        return next();
      }
      try {
        req.body = JSON.parse(data);
        next();
      } catch (e) {
        return res.status(400).json({ message: 'Invalid JSON' });
      }
    });
  } else {
    next();
  }
});
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Initialize routes
registerRoutes(app);

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({ message });
  if (process.env.NODE_ENV !== "production") {
    throw err;
  }
});

// Only run dev server locally; production (Vercel) just exports app for serverless
if (process.env.NODE_ENV !== "production") {
  const { createServer } = await import("http");
  const server = createServer(app);
  try {
    const { setupVite } = await import("./vite.js");
    await setupVite(app, server);
  } catch (e) {
    log(`Vite dev middleware failed: ${(e as Error).message}`, 'dev');
  }
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen(port, "127.0.0.1", () => {
    log(`serving on port ${port}`);
    console.log(`🚀 Server running at http://localhost:${port}`);
  });
}

// Export for Vercel serverless
export default app;
