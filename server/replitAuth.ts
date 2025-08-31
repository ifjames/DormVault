import type { Express, RequestHandler } from "express";

export async function setupAuth(app: Express) {
  // Simplified auth setup - no session needed
  // The app uses Firebase authentication on the frontend
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // Simple pass-through for now - Firebase handles auth on the frontend
  // In production, you would verify Firebase tokens here
  next();
};