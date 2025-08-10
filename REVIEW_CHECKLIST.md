# Code Review Anti-Monolith Checklist

## Backend
- [ ] Handler function under 100 lines?
- [ ] Using services instead of direct DB access?
- [ ] Single responsibility for new functions?
- [ ] Interfaces defined for new services?
- [ ] No cross-domain direct dependencies?

## Frontend  
- [ ] Component under 200 lines?
- [ ] Feature imports through index.js only?
- [ ] No prop drilling (using hooks/context)?
- [ ] Component has single responsibility?
- [ ] Shared utilities in shared/ folder?

## General
- [ ] New feature has clear domain boundary?
- [ ] Configuration externalized?
- [ ] Tests focus on behavior, not implementation?
- [ ] Documentation updated for architectural changes?

## Red Flags 🚨
- Large files (>300 lines)
- Circular dependencies
- God objects/components
- Direct database queries in handlers
- Cross-feature direct imports