# RealtimeResume Architecture

## Domain Boundaries

### Core Domains
1. **Goal Management** - CRUD operations, lifecycle management
2. **Progress Tracking** - Progress updates, metrics, analytics  
3. **Job Context** - Roles, responsibilities, career framework
4. **AI Suggestions** - Goal recommendations, personalization
5. **User Management** - Authentication, profiles, preferences

## Anti-Monolith Rules

### Backend
- **No Cross-Domain Direct DB Access** - Use services/interfaces
- **Single Responsibility** - Each handler does ONE thing
- **Interface Segregation** - Small, focused interfaces
- **Dependency Inversion** - Depend on abstractions, not concretions

### Frontend  
- **Feature Isolation** - Features don't directly import from each other
- **Shared State Management** - Use context/hooks for cross-feature state
- **Component Boundaries** - Components belong to specific features
- **API Boundaries** - Each feature has its own API service layer

### Database
- **Domain-Specific Tables** - Clear ownership
- **Minimal Joins** - Avoid complex cross-domain queries
- **Migration Isolation** - Feature-specific migration files

## Growth Strategy
1. Start with focused domains
2. Extract services when they get complex (>500 lines)
3. Consider microservices only when team/deployment demands it
4. Maintain clear interfaces between domains