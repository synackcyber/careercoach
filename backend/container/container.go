package container

import (
	"goaltracker/config"
	"goaltracker/interfaces"
	"goaltracker/services"
	"gorm.io/gorm"
)

// Container holds all application dependencies
type Container struct {
	Config          *config.Config
	DB              *gorm.DB
	GoalService     interfaces.GoalService
	ProgressService interfaces.ProgressService
	SuggestionService interfaces.SuggestionService
	AIService       *services.AIService
}

// NewContainer creates a new dependency injection container
func NewContainer(cfg *config.Config, db *gorm.DB) *Container {
	// Initialize services
	aiService := services.NewAIService()
	
	return &Container{
		Config:          cfg,
		DB:              db,
		AIService:       aiService,
		// TODO: Wire up concrete implementations of interfaces
		// GoalService:     goalservice.New(db),
		// ProgressService: progressservice.New(db),
		// SuggestionService: suggestionservice.New(db, aiService),
	}
}

// GetGoalService returns the goal service (for future interface implementation)
func (c *Container) GetGoalService() interfaces.GoalService {
	return c.GoalService
}

// GetProgressService returns the progress service
func (c *Container) GetProgressService() interfaces.ProgressService {
	return c.ProgressService
}

// GetSuggestionService returns the suggestion service
func (c *Container) GetSuggestionService() interfaces.SuggestionService {
	return c.SuggestionService
}