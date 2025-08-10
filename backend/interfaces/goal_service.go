package interfaces

import "goaltracker/models"

// GoalService defines the contract for goal-related operations
type GoalService interface {
	CreateGoal(goal *models.Goal) error
	GetGoalByID(id uint) (*models.Goal, error)
	GetGoalsByUser(userID uint) ([]models.Goal, error)
	UpdateGoal(goal *models.Goal) error
	DeleteGoal(id uint) error
	GetGoalsWithProgress(userID uint) ([]models.Goal, error)
}

// ProgressService defines the contract for progress tracking
type ProgressService interface {
	CreateProgress(progress *models.Progress) error
	GetProgressByGoal(goalID uint) ([]models.Progress, error)
	UpdateProgress(progress *models.Progress) error
	DeleteProgress(id uint) error
	GetLatestProgress(goalID uint) (*models.Progress, error)
}

// SuggestionService defines the contract for goal suggestions
type SuggestionService interface {
	GetSuggestionsByResponsibility(responsibilityID uint) ([]models.GoalSuggestion, error)
	GetAISuggestions(userProfile models.UserProfile, responsibility models.Responsibility) ([]models.AIGoalSuggestion, error)
	GetProgressSuggestions(goalID uint) ([]models.ProgressSuggestion, error)
}