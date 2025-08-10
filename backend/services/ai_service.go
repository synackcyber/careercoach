package services

import (
	"fmt"
	"goaltracker/models"
	"strings"
)

type AIService struct {
	// In production, this would integrate with OpenAI, Claude, or other AI APIs
	// For now, we'll simulate intelligent suggestions
}

type GoalSuggestionRequest struct {
	UserProfile        models.UserProfile        `json:"user_profile"`
	Responsibility     models.Responsibility     `json:"responsibility"`
	MarketTrends       []string                  `json:"market_trends"`
	CompanyContext     string                    `json:"company_context"`
}

type AIGoalResponse struct {
	Title                   string    `json:"title"`
	PersonalizedDescription string    `json:"personalized_description"`
	LearningPath            []string  `json:"learning_path"`
	RealWorldScenarios      []string  `json:"real_world_scenarios"`
	MarketRelevanceScore    float64   `json:"market_relevance_score"`
	DifficultyScore         float64   `json:"difficulty_score"`
	PriorityScore           float64   `json:"priority_score"`
	EstimatedDays           int       `json:"estimated_days"`
	Prerequisites           []string  `json:"prerequisites"`
	SuccessMetrics          []string  `json:"success_metrics"`
	CertificationPath       string    `json:"certification_path"`
	CareerImpact            string    `json:"career_impact"`
}

func NewAIService() *AIService {
	return &AIService{}
}

func (ai *AIService) GeneratePersonalizedGoals(req GoalSuggestionRequest) ([]AIGoalResponse, error) {
	// In production, this would call OpenAI/Claude API with sophisticated prompts
	// For demonstration, we'll generate intelligent suggestions based on user context
	
	responses := []AIGoalResponse{}
	
	// Generate role-based suggestions
	roleBasedGoals := ai.generateRoleBasedGoals(req)
	responses = append(responses, roleBasedGoals...)
	
	return responses, nil
}

func (ai *AIService) generateRoleBasedGoals(req GoalSuggestionRequest) []AIGoalResponse {
	// Generate basic role-based suggestions
	profile := req.UserProfile
	responsibility := req.Responsibility
	
	responses := []AIGoalResponse{}
	
	// Generate a personalized goal based on the responsibility
	response := AIGoalResponse{
		Title: ai.generatePersonalizedTitle(responsibility.Title, profile),
		PersonalizedDescription: ai.generatePersonalizedDescription(responsibility, profile),
		LearningPath: ai.generateBasicLearningPath(responsibility, profile),
		RealWorldScenarios: ai.generateScenarios(responsibility, profile),
		MarketRelevanceScore: ai.calculateMarketRelevance(responsibility.Category, req.MarketTrends),
		DifficultyScore: ai.calculateDifficultyScore(profile.ExperienceLevel),
		PriorityScore: ai.calculatePriorityScore(responsibility.Category),
		EstimatedDays: ai.estimateDays(profile.ExperienceLevel, profile.AvailableHoursWeek),
		Prerequisites: ai.generatePrerequisites(responsibility, profile),
		SuccessMetrics: ai.generateSuccessMetrics(responsibility),
		CertificationPath: ai.suggestCertification(responsibility.Category),
		CareerImpact: ai.generateCareerImpact(responsibility, profile),
	}
	
	responses = append(responses, response)
	return responses
}

func (ai *AIService) generatePersonalizedTitle(responsibilityTitle string, profile models.UserProfile) string {
	switch profile.ExperienceLevel {
	case "entry", "junior":
		return fmt.Sprintf("Foundation: Learn %s for %s Role", responsibilityTitle, profile.CurrentRole)
	case "mid":
		return fmt.Sprintf("Advance: Excel at %s in %s Environment", responsibilityTitle, profile.Industry)
	case "senior", "lead":
		return fmt.Sprintf("Leadership: Master %s for Team Growth", responsibilityTitle)
	case "expert":
		return fmt.Sprintf("Innovation: Pioneer %s Best Practices", responsibilityTitle)
	default:
		return fmt.Sprintf("Improve %s Skills", responsibilityTitle)
	}
}

func (ai *AIService) generatePersonalizedDescription(resp models.Responsibility, profile models.UserProfile) string {
	return fmt.Sprintf("Tailored for %s professionals in %s industry: %s. This path considers your %s experience level and %d hours/week availability.",
		profile.CurrentRole,
		profile.Industry,
		resp.Description,
		profile.ExperienceLevel,
		profile.AvailableHoursWeek)
}

func (ai *AIService) generateBasicLearningPath(resp models.Responsibility, profile models.UserProfile) []string {
	basePath := []string{
		"Research fundamentals and best practices",
		"Complete online course or tutorial",
		"Practice with hands-on exercises",
		"Apply skills to real project",
		"Seek feedback and iterate",
	}
	
	// Customize based on learning style
	switch profile.LearningStyle {
	case "hands-on":
		return []string{
			"Set up practice environment",
			"Start with guided tutorials",
			"Build small projects",
			"Gradually increase complexity",
			"Document learnings",
		}
	case "theoretical":
		return []string{
			"Study documentation and concepts",
			"Read industry whitepapers",
			"Analyze case studies",
			"Take structured course",
			"Apply theoretical knowledge",
		}
	default:
		return basePath
	}
}

func (ai *AIService) generateScenarios(resp models.Responsibility, profile models.UserProfile) []string {
	scenarios := []string{
		fmt.Sprintf("Apply %s skills in %s environment", resp.Title, profile.CompanySize),
		fmt.Sprintf("Lead %s project for %s company", resp.Title, profile.Industry),
	}
	return scenarios
}

func (ai *AIService) calculateMarketRelevance(category string, trends []string) float64 {
	baseScore := 0.6
	
	// Check if category aligns with market trends
	for _, trend := range trends {
		if strings.Contains(strings.ToLower(trend), strings.ToLower(category)) {
			baseScore += 0.2
		}
	}
	
	// Cap at 1.0
	if baseScore > 1.0 {
		baseScore = 1.0
	}
	
	return baseScore
}

func (ai *AIService) calculateDifficultyScore(experienceLevel string) float64 {
	switch experienceLevel {
	case "entry", "junior":
		return 0.3
	case "mid":
		return 0.5
	case "senior", "lead":
		return 0.7
	case "expert":
		return 0.9
	default:
		return 0.5
	}
}

func (ai *AIService) calculatePriorityScore(category string) float64 {
	// Assign priorities based on category
	priorities := map[string]float64{
		"technical":    0.8,
		"security":     0.9,
		"leadership":   0.7,
		"compliance":   0.8,
		"design":       0.6,
		"communication": 0.5,
	}
	
	if score, exists := priorities[category]; exists {
		return score
	}
	return 0.6
}

func (ai *AIService) estimateDays(experienceLevel string, availableHours int) int {
	baseDays := map[string]int{
		"entry":  45,
		"junior": 30,
		"mid":    21,
		"senior": 14,
		"lead":   14,
		"expert": 7,
	}
	
	days := baseDays[experienceLevel]
	if days == 0 {
		days = 30
	}
	
	// Adjust based on available hours
	if availableHours < 5 {
		days = int(float64(days) * 1.5)
	} else if availableHours > 15 {
		days = int(float64(days) * 0.7)
	}
	
	return days
}

func (ai *AIService) generatePrerequisites(resp models.Responsibility, profile models.UserProfile) []string {
	prerequisites := []string{
		"Basic understanding of " + resp.Category,
	}
	
	if profile.ExperienceLevel == "entry" || profile.ExperienceLevel == "junior" {
		prerequisites = append(prerequisites, "Foundational knowledge in "+profile.Industry)
	}
	
	return prerequisites
}

func (ai *AIService) generateSuccessMetrics(resp models.Responsibility) []string {
	return []string{
		fmt.Sprintf("Demonstrate proficiency in %s", resp.Title),
		"Complete practical project",
		"Pass assessment with 80%+ score",
		"Apply skills in real-world scenario",
	}
}

func (ai *AIService) suggestCertification(category string) string {
	certMap := map[string]string{
		"security":     "Security+ or CISSP",
		"technical":    "Industry-specific technical certification",
		"compliance":   "Compliance and audit certification",
		"design":       "UX/UI design certification",
		"leadership":   "Project management certification",
	}
	
	if cert, exists := certMap[category]; exists {
		return cert
	}
	return "Industry-relevant certification available"
}

func (ai *AIService) generateCareerImpact(resp models.Responsibility, profile models.UserProfile) string {
	return fmt.Sprintf("Mastering %s will enhance your value as a %s and position you for advancement in %s industry.",
		resp.Title, profile.CurrentRole, profile.Industry)
}