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
	Progress    []Progress `json:"progress,omitempty" gorm:"foreignKey:GoalID"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
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

// Ingestion models
type JobSource struct {
    ID        uint      `json:"id" gorm:"primaryKey"`
    Name      string    `json:"name" gorm:"uniqueIndex"`
    Type      string    `json:"type"` // greenhouse | lever | jsonld
    BaseURL   string    `json:"base_url"`
    Active    bool      `json:"active"`
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
}

type JobPosting struct {
    ID          uint      `json:"id" gorm:"primaryKey"`
    SourceID    uint      `json:"source_id" gorm:"index;uniqueIndex:uniq_src_ext"`
    Source      JobSource `json:"source" gorm:"foreignKey:SourceID"`
    ExternalID  string    `json:"external_id" gorm:"index;uniqueIndex:uniq_src_ext"`
    Company     string    `json:"company"`
    Title       string    `json:"title"`
    Seniority   string    `json:"seniority"`
    EmploymentType string `json:"employment_type"`
    Location    string    `json:"location"`
    Remote      bool      `json:"remote"`
    URL         string    `json:"url"`
    DescriptionText string `json:"description_text"`
    Responsibilities string `json:"responsibilities"` // JSON array
    Requirements     string `json:"requirements"`     // JSON array
    Qualifications   string `json:"qualifications"`   // JSON array
    SkillsExtracted  string `json:"skills_extracted"` // JSON array
    ToolsExtracted   string `json:"tools_extracted"`  // JSON array
    YearsExperienceMin *int  `json:"years_experience_min"`
    YearsExperienceMax *int  `json:"years_experience_max"`
    EducationRequirements string `json:"education_requirements"`
    DatePosted   *time.Time `json:"date_posted"`
    ValidThrough *time.Time `json:"valid_through"`
    Hash        string    `json:"hash" gorm:"uniqueIndex"`
    FetchedAt   time.Time `json:"fetched_at"`
    CreatedAt   time.Time `json:"created_at"`
    UpdatedAt   time.Time `json:"updated_at"`
}

type Term struct {
    ID              uint      `json:"id" gorm:"primaryKey"`
    Text            string    `json:"text" gorm:"index"`
    NormalizedText  string    `json:"normalized_text" gorm:"index"`
    Type            string    `json:"type"` // responsibility | skill | tool
    CreatedAt       time.Time `json:"created_at"`
    UpdatedAt       time.Time `json:"updated_at"`
}

type PostingTerm struct {
    PostingID uint      `json:"posting_id" gorm:"primaryKey;autoIncrement:false"`
    TermID    uint      `json:"term_id" gorm:"primaryKey;autoIncrement:false"`
    TF        float64   `json:"tf"`
    TFIDF     float64   `json:"tfidf"`
    FirstSeen time.Time `json:"first_seen_at"`
}

type RoleSignal struct {
    ID         uint      `json:"id" gorm:"primaryKey"`
    RoleTitle  string    `json:"role_title" gorm:"index"`
    Seniority  string    `json:"seniority" gorm:"index"`
    TermID     uint      `json:"term_id" gorm:"index"`
    Weight     float64   `json:"weight"`
    Window     string    `json:"window"`
    UpdatedAt  time.Time `json:"updated_at"`
}

