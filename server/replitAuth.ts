import type { Express, RequestHandler } from "express";

export async function setupAuth(app: Express) {
  // Remove session-based auth - use simple token-based authentication
  // The app already has a working /api/auth/login endpoint for local auth

}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // Simple authentication check - for now just allow all requests
  // This app uses /api/auth/login for local authentication which returns user data
  // In a real deployment, you would check for authorization headers or tokens
  next();
};
