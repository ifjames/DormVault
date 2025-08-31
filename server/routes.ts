import type { Express } from "express";
import { createServer, type Server } from "http";

export async function registerRoutes(app: Express): Promise<Server> {
  // Since you're using Firebase, all API routes just return a message to use Firebase
  // This keeps the server simple and focused on serving the frontend
  
  app.get('/api/*', (req, res) => {
    res.json({ 
      message: "All data operations are handled via Firebase on the frontend",
      firebase: true,
      endpoint: req.path
    });
  });

  app.post('/api/*', (req, res) => {
    res.json({ 
      message: "All data operations are handled via Firebase on the frontend",
      firebase: true,
      endpoint: req.path
    });
  });

  app.put('/api/*', (req, res) => {
    res.json({ 
      message: "All data operations are handled via Firebase on the frontend", 
      firebase: true,
      endpoint: req.path
    });
  });

  app.delete('/api/*', (req, res) => {
    res.json({ 
      message: "All data operations are handled via Firebase on the frontend",
      firebase: true,
      endpoint: req.path
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
