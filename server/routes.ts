import type { Express } from "express";
import { createServer, type Server } from "http";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
  // For a simple drawing application, we mainly need to serve static files
  // Any additional API routes would go here if needed in the future
  
  // This is a simple API route to test connectivity
  app.get('/api/status', (req, res) => {
    res.json({ status: 'ok', message: 'CAD Drawing Tool API is running' });
  });
  
  const httpServer = createServer(app);
  
  return httpServer;
}
