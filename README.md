# Goal Tracker - Career Development Platform

A comprehensive career development platform that helps professionals set, track, and achieve their career goals with AI-powered insights and market-aware guidance.

## Features

- **Goal Management**: Create, track, and manage career goals with progress tracking
- **AI-Powered Insights**: Get personalized goal suggestions and career insights
- **Market Awareness**: Understand industry trends and align goals with market demands
- **Progress Tracking**: Monitor your advancement with detailed progress logs
- **Responsibility Mapping**: Connect goals to specific job responsibilities
- **Timeline Views**: Visualize your career journey with multiple timeline formats

## Tech Stack

- **Backend**: Go with Gin framework, GORM ORM
- **Database**: Supabase PostgreSQL with Row Level Security (RLS)
- **Frontend**: React with Tailwind CSS
- **Authentication**: Supabase Auth (JWT-based)
- **Containerization**: Docker Compose
- **AI Integration**: OpenAI API for intelligent insights

## Quick Start

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd RealtimeResume
   ```

2. **Create your environment file**:
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` with your Supabase credentials:
   ```env
   # API Configuration
   API_PORT=8080
   FRONTEND_URL=http://localhost:3000
   GIN_MODE=release

   # Supabase Database Configuration
   DB_HOST=db.<YOUR_PROJECT_REF>.supabase.co
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=<YOUR_SUPABASE_DB_PASSWORD>
   DB_NAME=postgres
   DB_SSLMODE=require

   # OIDC / Supabase Auth Configuration
   OIDC_ISSUER_URL=https://<YOUR_PROJECT_REF>.supabase.co/auth/v1
   OIDC_AUDIENCE=authenticated
   JWKS_URL=https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/jwks

   # Frontend Configuration (Public - will be injected at build time)
   REACT_APP_API_URL=http://localhost:8080/api/v1
   REACT_APP_SUPABASE_URL=https://<YOUR_PROJECT_REF>.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=<YOUR_SUPABASE_ANON_KEY>
   REACT_APP_AUTH_PROVIDER=supabase
   ```

3. **Configure Supabase Dashboard**:
   - Go to "Authentication" → "Settings"
   - Enable "Email OTP" (for magic links) and "Email" (for email/password)
   - Add `http://localhost:3000` to "Site URL" and "Redirect URLs"

4. **Start the application**:
   ```bash
   docker-compose up --build
   ```

5. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080

## Architecture

### Single Environment File
The application uses a single `.env` file at the repository root that contains all configuration for both frontend and backend:

- **Backend**: Reads all variables directly from the `.env` file
- **Frontend**: Receives only safe, public variables (REACT_APP_*) through Docker build args
- **Security**: Sensitive variables (DB credentials, OIDC secrets) are never exposed to the browser

### Authentication Flow
- **Frontend**: Supabase Auth handles sign-in/sign-up (magic link + email/password)
- **Backend**: JWT middleware validates tokens against Supabase JWKS
- **Data Scoping**: All user data is filtered by `user_id` from JWT claims
- **Database Security**: Row Level Security (RLS) enforces per-user data isolation

### Database Schema
- **User Isolation**: All user-owned models include `UserID` field
- **RLS Policies**: PostgreSQL RLS using `auth.uid()` for Supabase-native security
- **Relationships**: Goals, Progress, UserProfiles, and AI suggestions are scoped per user

## API Endpoints

### Public Routes
- `GET /api/v1/job-roles` - List available job roles
- `GET /api/v1/responsibilities` - List job responsibilities
- `GET /api/v1/suggestions` - Get goal suggestions
- `GET /api/v1/progress-suggestions` - Get progress suggestions

### Protected Routes (Require JWT)
- `GET /api/v1/goals` - List user's goals
- `POST /api/v1/goals` - Create a new goal
- `PUT /api/v1/goals/:id` - Update a goal
- `DELETE /api/v1/goals/:id` - Delete a goal
- `GET /api/v1/goals/:id/progress` - Get progress for a goal
- `POST /api/v1/goals/:id/progress` - Add progress to a goal
- `POST /api/v1/ai/goal-suggestions` - Get AI-powered goal suggestions
- `GET /api/v1/ai/insights` - Get AI career insights
- `GET /api/v1/ai/market-aware-goals/:responsibility_id` - Get market-aware goals
- `POST /api/v1/profiles` - Create user profile
- `GET /api/v1/profiles/:id` - Get user profile
- `PUT /api/v1/profiles/:id` - Update user profile

## Development

### Prerequisites
- Docker and Docker Compose
- Supabase account and project

### Local Development
1. Copy `.env.example` to `.env` and fill in your credentials
2. Run `docker-compose up --build`
3. Make changes to code - containers will auto-reload
4. Access logs with `docker-compose logs -f [service]`

### Adding New Features
- **Backend**: Add handlers in `backend/handlers/`, models in `backend/models/`
- **Frontend**: Add components in `frontend/src/components/`, pages in `frontend/src/pages/`
- **Database**: Models auto-migrate on startup via GORM

## Security Features

- **JWT Validation**: All protected endpoints validate Supabase JWT tokens
- **User Scoping**: Database queries filter by authenticated user ID
- **Row Level Security**: PostgreSQL RLS provides additional database-level protection
- **CORS Protection**: Configured to only allow frontend origin
- **Environment Isolation**: Sensitive variables never reach the browser

## Future Phases

- **Phase 2**: Supabase + authentication ✅ (Implemented)
- **Phase 3**: Multi-tenancy for organizations
- **Phase 4**: Team collaboration features
- **Phase 5**: Advanced AI insights and market analysis

## Troubleshooting

### Common Issues
1. **Database Connection**: Ensure Supabase credentials are correct in `.env`
2. **Authentication**: Check Supabase Dashboard settings for redirect URLs
3. **CORS Errors**: Verify `FRONTEND_URL` matches your frontend address
4. **Build Failures**: Ensure all required environment variables are set

### Logs
- Backend: `docker-compose logs backend`
- Frontend: `docker-compose logs frontend`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with Docker Compose
5. Submit a pull request

## License

[Your License Here]
