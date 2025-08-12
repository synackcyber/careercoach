package models

import (
	"time"
	"gorm.io/gorm"
)

type JobRole struct {
	ID             uint            `json:"id" gorm:"primaryKey"`
	Title          string          `json:"title" gorm:"not null;unique"`
	Description    string          `json:"description"`
	Responsibilities []Responsibility `json:"responsibilities,omitempty" gorm:"foreignKey:JobRoleID"`
	CreatedAt      time.Time       `json:"created_at"`
	UpdatedAt      time.Time       `json:"updated_at"`
}

type Responsibility struct {
	ID          uint     `json:"id" gorm:"primaryKey"`
	JobRoleID   uint     `json:"job_role_id" gorm:"not null;index"`
	JobRole     JobRole  `json:"job_role,omitempty" gorm:"foreignKey:JobRoleID"`
	Title       string   `json:"title" gorm:"not null"`
	Description string   `json:"description"`
	Category    string   `json:"category" gorm:"default:'general'"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type Goal struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
    UserID      string    `json:"-" gorm:"type:uuid;not null;index"`
	Title       string    `json:"title" gorm:"not null"`
	Description string    `json:"description"`
	JobRoleID   *uint     `json:"job_role_id" gorm:"index"`
	JobRole     *JobRole  `json:"job_role,omitempty" gorm:"foreignKey:JobRoleID"`
	Status      string    `json:"status" gorm:"default:'active';check:status IN ('active','completed','paused')"`
	Priority    string    `json:"priority" gorm:"default:'medium';check:priority IN ('low','medium','high')"`
	DueDate     *time.Time `json:"due_date"`
    Tags        string    `json:"tags"` // JSON array of strings
    Metadata    string    `json:"metadata" gorm:"type:jsonb"` // Structured OKR/SMART, initiatives, milestones
	Progress    []Progress `json:"progress,omitempty" gorm:"foreignKey:GoalID"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

// KRSnapshot stores time-series points for a goal's key results for analytics
type KRSnapshot struct {
    ID          uint      `json:"id" gorm:"primaryKey"`
    UserID      string    `json:"-" gorm:"type:uuid;not null;index"`
    GoalID      uint      `json:"goal_id" gorm:"not null;index"`
    KRID        string    `json:"kr_id" gorm:"not null;index"`
    Value       float64   `json:"value"`
    Status      string    `json:"status" gorm:"check:status IN ('on_track','at_risk','off_track')"`
    Confidence  float64   `json:"confidence"`
    CapturedAt  time.Time `json:"captured_at" gorm:"index"`
    CreatedAt   time.Time `json:"created_at"`
}

type Progress struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
    UserID      string    `json:"-" gorm:"type:uuid;not null;index"`
	GoalID      uint      `json:"goal_id" gorm:"not null;index"`
	Goal        Goal      `json:"goal,omitempty" gorm:"foreignKey:GoalID"`
	Description string    `json:"description" gorm:"not null"`
	Percentage  int       `json:"percentage" gorm:"default:0;check:percentage >= 0 AND percentage <= 100"`
	Notes       string    `json:"notes"`
	Outcome     string    `json:"outcome"`
	ActionTaken string    `json:"action_taken"`
	NextSteps   string    `json:"next_steps"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type ProgressSuggestion struct {
	ID               uint           `json:"id" gorm:"primaryKey"`
	GoalSuggestionID uint           `json:"goal_suggestion_id" gorm:"not null;index"`
	GoalSuggestion   GoalSuggestion `json:"goal_suggestion,omitempty" gorm:"foreignKey:GoalSuggestionID"`
	ProgressStage    string         `json:"progress_stage" gorm:"not null"`
	SuggestedOutcome string         `json:"suggested_outcome" gorm:"not null"`
	ActionPrompt     string         `json:"action_prompt"`
	NextStepPrompt   string         `json:"next_step_prompt"`
	PercentageRange  string         `json:"percentage_range"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
}


type UserProfile struct {
	ID                uint   `json:"id" gorm:"primaryKey"`
    UserID            string `json:"-" gorm:"type:uuid;not null;uniqueIndex"`
	CurrentRole       string `json:"current_role"`
	ExperienceLevel   string `json:"experience_level" gorm:"check:experience_level IN ('entry','junior','mid','senior','lead','expert')"`
	Industry          string `json:"industry"`
	CompanySize       string `json:"company_size"`
	LearningStyle     string `json:"learning_style"`
	AvailableHoursWeek int   `json:"available_hours_week"`
	CareerGoals       string `json:"career_goals"`
	CurrentTools      string `json:"current_tools"` // JSON array of current tool IDs
	SkillGaps         string `json:"skill_gaps"`    // JSON array of identified gaps
    ITProfile         string `json:"it_profile" gorm:"type:jsonb"` // Structured IT profile JSON (subdomains, frameworks, certs, platforms, KPIs, etc.)
	TermsAcceptedAt   *time.Time `json:"terms_accepted_at"`
	PrivacyAcceptedAt *time.Time `json:"privacy_accepted_at"`
	PoliciesVersion   string     `json:"policies_version" gorm:"default:'1.0'"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

type AIGoalSuggestion struct {
	ID                    uint        `json:"id" gorm:"primaryKey"`
    UserID               string      `json:"-" gorm:"type:uuid;not null;index"`
	UserProfileID        uint        `json:"user_profile_id" gorm:"not null;index"`
	UserProfile          UserProfile `json:"user_profile,omitempty" gorm:"foreignKey:UserProfileID"`
	AIGeneratedTitle     string      `json:"ai_generated_title" gorm:"not null"`
	AIGeneratedPath      string      `json:"ai_generated_path"`
	PersonalizationContext string   `json:"personalization_context"`
	MarketRelevanceScore float64     `json:"market_relevance_score"`
	DifficultyScore      float64     `json:"difficulty_score"`
	PriorityScore        float64     `json:"priority_score"`
	EstimatedCompletion  int         `json:"estimated_completion_days"`
	AIPromptUsed         string      `json:"ai_prompt_used"`
	AIResponse           string      `json:"ai_response"`
	CreatedAt            time.Time   `json:"created_at"`
	UpdatedAt            time.Time   `json:"updated_at"`
}

type LearningInsight struct {
	ID               uint      `json:"id" gorm:"primaryKey"`
    UserID           string    `json:"-" gorm:"type:uuid;not null;index"`
	UserProfileID   uint      `json:"user_profile_id" gorm:"not null;index"`
	InsightType     string    `json:"insight_type" gorm:"not null"` // "strength", "weakness", "trend", "recommendation"
	InsightText     string    `json:"insight_text" gorm:"not null"`
	Confidence      float64   `json:"confidence"` // AI confidence score
	ActionRequired  bool      `json:"action_required"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

type GoalSuggestion struct {
	ID               uint           `json:"id" gorm:"primaryKey"`
	ResponsibilityID uint           `json:"responsibility_id" gorm:"not null;index"`
	Responsibility   Responsibility `json:"responsibility,omitempty" gorm:"foreignKey:ResponsibilityID"`
	Title            string         `json:"title" gorm:"not null"`
	Description      string         `json:"description"`
	Category         string         `json:"category" gorm:"default:'skill'"`
	Priority         string         `json:"priority" gorm:"default:'medium';check:priority IN ('low','medium','high')"`
	EstimatedDuration string        `json:"estimated_duration"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
}

// Ingestion models removed for now

