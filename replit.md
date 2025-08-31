# Overview

DormMaster is a web-based Dormitory Management System designed to streamline the management of dormitory operations. The system provides essential features for tracking electricity bills, managing rent payments, and analyzing dormitory metrics. Built as a full-stack application, it offers a modern user interface for administrators to efficiently manage dormer information, calculate electricity costs, track payments, and generate analytics reports.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client-side application is built with React and TypeScript, utilizing a modern component-based architecture. The UI leverages Shadcn/UI components built on top of Radix UI primitives, providing a consistent and accessible design system. The frontend uses Wouter for client-side routing and TanStack Query for efficient state management and API caching. Styling is handled through Tailwind CSS with custom CSS variables for theming support (light/dark modes).

## Backend Architecture
The server is implemented using Express.js with TypeScript, following a RESTful API design pattern. The application uses a modular route structure with dedicated handlers for different resource types (dormers, bills, payments, analytics). Middleware is implemented for authentication, logging, and error handling. The server integrates with Replit's authentication system for secure user management.

## Database Layer
The application uses PostgreSQL as the primary database, accessed through Drizzle ORM for type-safe database operations. The database schema includes tables for users, dormers, bills, bill shares, payments, and sessions. Drizzle provides schema validation and migrations, ensuring data integrity and enabling smooth database evolution.

## Authentication System
Authentication is handled through Replit's OpenID Connect (OIDC) integration using Passport.js. The system maintains user sessions using PostgreSQL-backed session storage with connect-pg-simple. Authentication middleware protects API routes and manages user access control throughout the application.

## State Management
The frontend uses TanStack Query for server state management, providing automatic caching, background updates, and optimistic updates. Client-side state is managed through React hooks and context providers, particularly for theme management and user authentication state.

## Development Architecture
The project uses Vite as the build tool and development server, providing fast hot module replacement and optimized production builds. TypeScript is configured with strict type checking across the entire codebase. The application supports both development and production modes with environment-specific configurations.

# External Dependencies

## Database Services
- **Neon Database**: PostgreSQL-compatible serverless database platform
- **Drizzle ORM**: Type-safe database toolkit for schema management and queries

## Authentication Services
- **Replit Auth**: OpenID Connect authentication provider
- **Passport.js**: Authentication middleware for Express

## UI Component Libraries
- **Radix UI**: Headless UI primitives for accessible components
- **Shadcn/UI**: Pre-built component library based on Radix UI
- **Lucide React**: Icon library for consistent iconography

## Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Static type checking and enhanced developer experience
- **Tailwind CSS**: Utility-first CSS framework for styling

## Runtime Libraries
- **React Query/TanStack Query**: Server state management and caching
- **React Hook Form**: Form handling and validation
- **Zod**: Schema validation library
- **Date-fns**: Date manipulation utilities

## Session Management
- **Express Session**: Session handling middleware
- **Connect-PG-Simple**: PostgreSQL session store adapter