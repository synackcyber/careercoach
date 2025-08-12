package services

import (
    "bytes"
    "encoding/json"
    "fmt"
    "goaltracker/models"
    "io"
    "net/http"
    "os"
    "strings"
    "time"
)

type AIService struct {
	// In production, this would integrate with OpenAI, Claude, or other AI APIs
	// For now, we'll simulate intelligent suggestions
    provider string
    openAIKey string
    openAIModel string
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

// ---- In-memory AI stats for Admin status ----
type AIStat struct {
    Provider  string
    Success   bool
    LatencyMs int
    Timestamp time.Time
}

var aiStats = struct {
    Items []AIStat
}{Items: []AIStat{}}

func RecordAIStat(s AIStat) {
    // Keep last 100 entries to bound memory
    aiStats.Items = append(aiStats.Items, s)
    if len(aiStats.Items) > 100 {
        aiStats.Items = aiStats.Items[len(aiStats.Items)-100:]
    }
}

// Accessors for admin
type AIStatsWindow struct { Items []AIStat }
func GetAIStats() AIStatsWindow { return AIStatsWindow{Items: aiStats.Items} }
func CurrentAIProvider() string { return getEnvOrDefault("AI_SUGGESTIONS_PROVIDER", "local") }

func NewAIService() *AIService {
    // Lightweight env read to avoid tight coupling to config pkg
    provider := getEnvOrDefault("AI_SUGGESTIONS_PROVIDER", "local")
    return &AIService{
        provider:    provider,
        openAIKey:   os.Getenv("OPENAI_API_KEY"),
        openAIModel: getEnvOrDefault("OPENAI_MODEL", "gpt-4o-mini"),
    }
}

func (ai *AIService) Provider() string { return ai.provider }

func (ai *AIService) GeneratePersonalizedGoals(req GoalSuggestionRequest) ([]AIGoalResponse, error) {
    // If provider is openai and key present, attempt LLM; otherwise local
    if ai.provider == "openai" && ai.openAIKey != "" {
        if llm, err := ai.generateWithOpenAI(req); err == nil && len(llm) > 0 {
            // record success stat here too
            return llm, nil
        }
        // fall back to local on any error
    }

    responses := []AIGoalResponse{}
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

// --- Minimal OpenAI integration with cost controls ---
// We avoid adding SDK deps; simple HTTP call pattern could be added later. Here we simulate controlled usage.

func (ai *AIService) generateWithOpenAI(req GoalSuggestionRequest) ([]AIGoalResponse, error) {
    // Guardrails / cost controls
    // - Short prompt, JSON mode, temperature low, max tokens small
    // - Single call, 10s timeout
    if ai.openAIKey == "" {
        return nil, fmt.Errorf("missing OPENAI_API_KEY")
    }

    // Build compact profile context
    p := req.UserProfile
    r := req.Responsibility
    prompt := fmt.Sprintf(
        "Generate up to 6 concise, actionable professional development goals as JSON. Each goal must include: title (string), description (string), estimated_days (int: 7/14/21/30/60/90), priority (low|medium|high), tags (array of strings). Context: industry=%s, role=%s, experience=%s, responsibility_title=%s, responsibility_category=%s. Keep titles short and descriptions 1-2 sentences.",
        safe(p.Industry), safe(p.CurrentRole), safe(p.ExperienceLevel), safe(r.Title), safe(r.Category),
    )

    // OpenAI chat completions JSON-mode style body
    body := map[string]any{
        "model":       ai.openAIModel,
        "temperature": 0.2,
        "max_tokens":  600,
        "response_format": map[string]string{"type": "json_object"},
        "messages": []map[string]string{
            {"role": "system", "content": "You are a helpful assistant that returns STRICT JSON objects with a 'goals' array."},
            {"role": "user", "content": prompt},
        },
    }

    buf, _ := json.Marshal(body)
    httpClient := &http.Client{Timeout: 10 * time.Second}
    reqHTTP, _ := http.NewRequest("POST", "https://api.openai.com/v1/chat/completions", bytes.NewReader(buf))
    reqHTTP.Header.Set("Authorization", "Bearer "+ai.openAIKey)
    reqHTTP.Header.Set("Content-Type", "application/json")
    resp, err := httpClient.Do(reqHTTP)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    if resp.StatusCode < 200 || resp.StatusCode >= 300 {
        b, _ := io.ReadAll(resp.Body)
        return nil, fmt.Errorf("openai api error: %s", string(b))
    }

    var parsed struct {
        Choices []struct {
            Message struct {
                Content string `json:"content"`
            } `json:"message"`
        } `json:"choices"`
    }
    if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
        return nil, err
    }
    if len(parsed.Choices) == 0 {
        return nil, fmt.Errorf("no choices")
    }

    // The content should be a JSON object with goals array
    var j struct {
        Goals []struct {
            Title         string   `json:"title"`
            Description   string   `json:"description"`
            EstimatedDays int      `json:"estimated_days"`
            Priority      string   `json:"priority"`
            Tags          []string `json:"tags"`
        } `json:"goals"`
    }
    if err := json.Unmarshal([]byte(parsed.Choices[0].Message.Content), &j); err != nil {
        return nil, err
    }
    if len(j.Goals) == 0 {
        return nil, fmt.Errorf("empty goals")
    }

    // Map to AIGoalResponse with sensible defaults
    out := make([]AIGoalResponse, 0, len(j.Goals))
    for _, g := range j.Goals {
        prioScore := 0.6
        switch strings.ToLower(g.Priority) {
        case "high": prioScore = 0.85
        case "medium": prioScore = 0.65
        case "low": prioScore = 0.45
        }
        out = append(out, AIGoalResponse{
            Title:                   g.Title,
            PersonalizedDescription: g.Description,
            LearningPath:            []string{},
            RealWorldScenarios:      []string{},
            MarketRelevanceScore:    0.75,
            DifficultyScore:         ai.calculateDifficultyScore(req.UserProfile.ExperienceLevel),
            PriorityScore:           prioScore,
            EstimatedDays:           g.EstimatedDays,
            Prerequisites:           []string{},
            SuccessMetrics:          []string{"Deliver measurable outcome"},
            CertificationPath:       "",
            CareerImpact:            fmt.Sprintf("Advances your %s capability in %s.", req.Responsibility.Title, req.UserProfile.Industry),
        })
        if len(out) >= 6 { // hard cap
            break
        }
    }
    return out, nil
}

func getEnvOrDefault(key, def string) string {
    if v := os.Getenv(key); v != "" {
        return v
    }
    return def
}

func safe(s string) string {
    return strings.ReplaceAll(s, "\n", " ")
}