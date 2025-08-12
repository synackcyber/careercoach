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
	Tags                    []string  `json:"tags"`
}

// --- OKR/SMART refinement structures ---
type OKRTimeframe struct {
    Start   string `json:"start,omitempty"`
    End     string `json:"end,omitempty"`
    Quarter string `json:"quarter,omitempty"`
}

type OKRKeyResult struct {
    ID           string  `json:"id,omitempty"`
    Name         string  `json:"name,omitempty"`
    MetricType   string  `json:"metric_type,omitempty"`
    Unit         string  `json:"unit,omitempty"`
    Direction    string  `json:"direction,omitempty"`
    Baseline     *float64 `json:"baseline,omitempty"`
    Target       *float64 `json:"target,omitempty"`
    UpdateCadence string `json:"update_cadence,omitempty"`
}

type OKRSmart struct {
    Specific         string   `json:"specific,omitempty"`
    Achievable       string   `json:"achievable,omitempty"`
    Relevant         string   `json:"relevant,omitempty"`
    TimeBound struct {
        DueDate       string `json:"due_date,omitempty"`
        ReviewCadence string `json:"review_cadence,omitempty"`
    } `json:"time_bound"`
    MeasurableKRIDs  []string `json:"measurable_kr_ids,omitempty"`
}

type OKRSmartDraft struct {
    MetadataSchema string          `json:"metadata_schema,omitempty"`
    Objective      string          `json:"objective,omitempty"`
    Timeframe      OKRTimeframe    `json:"timeframe"`
    Owners         []string        `json:"owners,omitempty"`
    Smart          OKRSmart        `json:"smart"`
}

type RefineOKRRequest struct {
    Title       string         `json:"title"`
    Description string         `json:"description"`
    DueDate     string         `json:"due_date"`
    Draft       OKRSmartDraft  `json:"draft"`
}

func (ai *AIService) RefineOKR(req RefineOKRRequest) (OKRSmartDraft, error) {
    // For now, use lightweight heuristics to "refine" the draft deterministically.
    // If provider is openai later, we can upgrade this to an LLM call.
    d := req.Draft
    if d.MetadataSchema == "" { d.MetadataSchema = "v1" }

    // Omit auto-creating Key Results to keep flow frictionless; SMART only

    if d.Objective == "" { d.Objective = req.Title }
    if d.Smart.Specific == "" && req.Title != "" { d.Smart.Specific = "Deliver: " + req.Title }
    if d.Smart.Achievable == "" { d.Smart.Achievable = "Scoped to available resources and timeline" }
    if d.Smart.Relevant == "" { d.Smart.Relevant = "Supports current priorities" }

    if d.Smart.TimeBound.ReviewCadence == "" { d.Smart.TimeBound.ReviewCadence = "weekly" }
    if d.Timeframe.End == "" && req.DueDate != "" { d.Timeframe.End = req.DueDate }
    if d.Smart.TimeBound.DueDate == "" && req.DueDate != "" { d.Smart.TimeBound.DueDate = req.DueDate }

    // Compute quarter from due date if not present
    if d.Timeframe.Quarter == "" && d.Timeframe.End != "" {
        // expecting YYYY-MM-DD
        parts := strings.Split(d.Timeframe.End, "-")
        if len(parts) >= 2 {
            month := parts[1]
            switch month {
            case "01","02","03": d.Timeframe.Quarter = "Q1"
            case "04","05","06": d.Timeframe.Quarter = "Q2"
            case "07","08","09": d.Timeframe.Quarter = "Q3"
            case "10","11","12": d.Timeframe.Quarter = "Q4"
            }
        }
    }

    return d, nil
}

// SMART-only refinement request
type RefineSMARTRequest struct {
    Title       string   `json:"title"`
    Description string   `json:"description"`
    DueDate     string   `json:"due_date"`
    Draft       OKRSmart `json:"draft"`
}

// RefineSMART returns only SMART fields using the same heuristics
func (ai *AIService) RefineSMART(req RefineSMARTRequest) (OKRSmart, error) {
    d := req.Draft
    text := strings.ToLower(strings.TrimSpace(req.Title + "\n" + req.Description))
    if d.Specific == "" && req.Title != "" { d.Specific = "Deliver: " + req.Title }
    if d.Achievable == "" { d.Achievable = "Scoped to available resources and timeline" }
    if d.Relevant == "" { d.Relevant = "Supports current priorities" }
    if d.TimeBound.ReviewCadence == "" { d.TimeBound.ReviewCadence = "weekly" }
    if d.TimeBound.DueDate == "" && req.DueDate != "" { d.TimeBound.DueDate = req.DueDate }
    // Optional: infer cadence from text
    if strings.Contains(text, "biweekly") { d.TimeBound.ReviewCadence = "biweekly" }
    return d, nil
}

// ---- Milestones generation ----
type Milestone struct {
    Label   string `json:"label"`
    DueDate string `json:"due_date"`
}

type GenerateMilestonesRequest struct {
    Title       string `json:"title"`
    Description string `json:"description"`
    DueDate     string `json:"due_date"`
    Count       int    `json:"count"`
}

func (ai *AIService) GenerateMilestones(req GenerateMilestonesRequest) ([]Milestone, error) {
    // Heuristic phases
    phases := []string{"Define scope", "Draft solution", "Implement", "Review & QA", "Deliver"}
    if req.Count > 0 && req.Count < len(phases) {
        phases = phases[:req.Count]
    }
    // Date spacing
    // If due date provided (YYYY-MM-DD), spread evenly; else use +7d increments from today
    var result []Milestone
    if req.DueDate != "" && len(phases) > 0 {
        // parse YYYY-MM-DD (best-effort)
        end := req.DueDate
        // simple splitting; no timezone math to keep dependencies minimal
        // create offsets by fraction of phases
        for i, p := range phases {
            // naive: keep same due date for last, earlier ones step back by 7 days each
            d := end
            if i < len(phases)-1 {
                // not precise arithmetic; client can edit
                // label due date left blank to encourage edits
                d = ""
            }
            result = append(result, Milestone{Label: p, DueDate: d})
        }
    } else {
        for _, p := range phases {
            result = append(result, Milestone{Label: p, DueDate: ""})
        }
    }
    // Light tailoring based on title keywords
    t := strings.ToLower(req.Title + " " + req.Description)
    if strings.Contains(t, "latency") || strings.Contains(t, "reliability") || strings.Contains(t, "slo") {
        result[0].Label = "Define SLOs/SLIs"
        if len(result) > 2 { result[2].Label = "Add alerts & dashboards" }
    }
    if strings.Contains(t, "kubernetes") || strings.Contains(t, "deploy") {
        if len(result) > 1 { result[1].Label = "Create env & IaC baseline" }
        if len(result) > 3 { result[3].Label = "Blue/green or canary rollout" }
    }
    return result, nil
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

// ComputeAIHealth inspects recent stats and env to produce a simple health signal.
// up: provider=openai, key present, success in last 15m
// degraded: provider=openai, key present, but only fallbacks recently (or no recent calls)
// down: provider=openai, key missing
// local: provider=local (treated as up-local)
func ComputeAIHealth() (status string, lastSuccess *time.Time, fallbackRate float64, reason string) {
    provider := CurrentAIProvider()
    if provider != "openai" {
        return "up-local", nil, 0, "using local generator"
    }
    if os.Getenv("OPENAI_API_KEY") == "" {
        return "down", nil, 1, "missing OPENAI_API_KEY"
    }
    // analyze last 100 stats
    items := aiStats.Items
    var successes, total int
    var last *time.Time
    cutoff := time.Now().Add(-15 * time.Minute)
    for _, s := range items {
        total++
        if s.Success {
            if last == nil || s.Timestamp.After(*last) { t := s.Timestamp; last = &t }
        }
    }
    // compute fallback rate as 1 - success rate
    for _, s := range items { if s.Success { successes++ } }
    if total > 0 {
        fallbackRate = 1 - float64(successes)/float64(total)
    }
    if last != nil && last.After(cutoff) {
        return "up", last, fallbackRate, "recent success"
    }
    return "degraded", last, fallbackRate, "no recent success (last 15m)"
}

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
    // 1) IT profile rule-based triggers
    triggered := ai.generateITTriggeredGoals(req)
    responses = append(responses, triggered...)
    // 2) Role-based default
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
		Tags: ai.generateTags(responsibility, profile),
	}
	
	responses = append(responses, response)
	return responses
}

// --- IT-profile rule engine ---
type itProfilePayload struct {
    Role struct {
        Current string `json:"current"`
        Level   string `json:"level"`
        Track   string `json:"track"`
        Target  string `json:"target"`
    } `json:"role"`
    Subdomains     []string `json:"subdomains"`
    Frameworks     []struct { Name string `json:"name"`; Level string `json:"level"` } `json:"frameworks"`
    Certifications []struct { Name string `json:"name"`; Status string `json:"status"`; Expires string `json:"expires"`; PlannedBy string `json:"planned_by"` } `json:"certifications"`
    Platforms      []struct { Name string `json:"name"`; Depth string `json:"depth"`; LastUsed string `json:"last_used"` } `json:"platforms"`
    Environment    struct { Clusters int `json:"clusters"`; Regions []string `json:"regions"`; UsersSupported int `json:"users_supported"`; UptimeSLOPercent float64 `json:"uptime_slo_percent"`; P95LatencyMs int `json:"p95_latency_ms"` } `json:"environment"`
    KPIs           []string `json:"kpis"`
    Jurisdictions  []string `json:"jurisdictions"`
    Upskilling     struct { HoursPerWeek int `json:"hours_per_week"`; Format []string `json:"format"` } `json:"upskilling"`
    Evidence       []struct { Title string `json:"title"`; Link string `json:"link"` } `json:"evidence"`
}

func (ai *AIService) generateITTriggeredGoals(req GoalSuggestionRequest) []AIGoalResponse {
    profile := req.UserProfile
    var it itProfilePayload
    // ITProfile stored as JSON string
    if strings.TrimSpace(profile.ITProfile) != "" {
        _ = json.Unmarshal([]byte(profile.ITProfile), &it)
    }

    goals := []AIGoalResponse{}

    hasSub := func(name string) bool {
        for _, s := range it.Subdomains { if strings.EqualFold(s, name) { return true } }
        return false
    }
    levelOf := func(name string) string {
        for _, f := range it.Frameworks { if strings.EqualFold(f.Name, name) { return f.Level } }
        return ""
    }
    hasPlatform := func(name string) bool {
        for _, p := range it.Platforms { if strings.EqualFold(p.Name, name) { return true } }
        return false
    }

    // DevOps/SRE triggers
    if hasSub("DevOps/SRE") || hasPlatform("Kubernetes") || hasPlatform("Terraform") {
        if strings.EqualFold(levelOf("SRE"), "") || strings.EqualFold(levelOf("SRE"), "Awareness") || strings.EqualFold(levelOf("SRE"), "Working") {
            goals = append(goals, AIGoalResponse{
                Title: "Define SLOs/SLIs and Error Budgets",
                PersonalizedDescription: "Introduce reliability targets (SLOs/SLIs) and error budget policies aligned to team objectives.",
                LearningPath: []string{"Inventory services", "Define SLIs", "Set SLOs", "Publish error budget policy", "Dashboards/alerts"},
                RealWorldScenarios: []string{"Apply to a critical user-facing API", "Review incidents vs error budget"},
                MarketRelevanceScore: 0.85,
                DifficultyScore: ai.calculateDifficultyScore(profile.ExperienceLevel),
                PriorityScore: 0.8,
                EstimatedDays: 21,
                Prerequisites: []string{"Basic observability setup"},
                SuccessMetrics: []string{"Signed-off SLO doc", "SLIs in dashboards", "Error budget tracked"},
                CertificationPath: "",
                CareerImpact: "Establishes core SRE practice and measurable reliability outcomes.",
                Tags: []string{"SRE","SLI","SLO","Error Budget"},
            })
        }
        if !hasPlatform("ArgoCD") && (hasPlatform("Kubernetes") || hasPlatform("GitHub Actions") || hasPlatform("GitLab CI") || hasPlatform("Jenkins")) {
            goals = append(goals, AIGoalResponse{
                Title: "Implement Progressive Delivery with Automated Rollback",
                PersonalizedDescription: "Adopt canary/blue-green deploys and automatic rollback on SLO violations.",
                LearningPath: []string{"Pick strategy", "Configure pipelines", "Add health checks", "Guard with SLOs"},
                RealWorldScenarios: []string{"Canary a high-traffic service", "Rollback on failed health metrics"},
                MarketRelevanceScore: 0.82,
                DifficultyScore: ai.calculateDifficultyScore(profile.ExperienceLevel),
                PriorityScore: 0.78,
                EstimatedDays: 30,
                Prerequisites: []string{"CI/CD in place", "K8s or similar orchestrator"},
                SuccessMetrics: []string{"<15% change failure rate", "Automated rollback success"},
                CertificationPath: "",
                CareerImpact: "Improves release safety and velocity.",
                Tags: []string{"DevOps","Progressive Delivery","Canary","Blue-Green"},
            })
        }
    }

    // Cloud triggers
    if hasSub("Cloud") || hasPlatform("AWS") || hasPlatform("Azure") || hasPlatform("GCP") {
        wa := levelOf("AWS Well-Architected")
        if wa == "" || strings.EqualFold(wa, "Awareness") || strings.EqualFold(wa, "Working") {
            goals = append(goals, AIGoalResponse{
                Title: "Run a Well-Architected Review and Create Remediation Backlog",
                PersonalizedDescription: "Evaluate current workloads against framework pillars and prioritize remediations.",
                LearningPath: []string{"Select workload", "Assess pillars", "Identify risks", "Create backlog"},
                RealWorldScenarios: []string{"Assess production workload", "Present findings to stakeholders"},
                MarketRelevanceScore: 0.8,
                DifficultyScore: ai.calculateDifficultyScore(profile.ExperienceLevel),
                PriorityScore: 0.75,
                EstimatedDays: 14,
                Prerequisites: []string{"Access to workload details"},
                SuccessMetrics: []string{"Documented review", "Backlog with owners and SLAs"},
                CertificationPath: "",
                CareerImpact: "Strengthens cloud architecture practices and risk management.",
                Tags: []string{"Cloud","Well-Architected"},
            })
        }
        goals = append(goals, AIGoalResponse{
            Title: "Establish Landing Zone and Guardrails",
            PersonalizedDescription: "Set up multi-account structure, org policies/guardrails, and tagging standards.",
            LearningPath: []string{"Design account structure", "Define SCP/policies", "Baseline tagging", "Automate provisioning"},
            RealWorldScenarios: []string{"Implement org policies", "Tag compliance dashboard"},
            MarketRelevanceScore: 0.82,
            DifficultyScore: ai.calculateDifficultyScore(profile.ExperienceLevel),
            PriorityScore: 0.8,
            EstimatedDays: 30,
            Prerequisites: []string{"Basic IAM and IaC knowledge"},
            SuccessMetrics: []string{"Accounts under org", "+90% tag compliance"},
            CertificationPath: "",
            CareerImpact: "Improves scalability, security, and cost visibility.",
            Tags: []string{"Cloud","Landing Zone","Guardrails"},
        })
    }

    // Security triggers
    if hasSub("Security") || strings.EqualFold(levelOf("ISO 27001"), "Awareness") || strings.EqualFold(levelOf("CIS Benchmarks"), "Working") {
        goals = append(goals, AIGoalResponse{
            Title: "Baseline CIS Hardening and Continuous Scanning",
            PersonalizedDescription: "Apply CIS benchmarks and set up periodic scans to maintain posture.",
            LearningPath: []string{"Pick scope", "Harden baseline", "Automate scans", "Track deviations"},
            RealWorldScenarios: []string{"Harden a critical service", "Report compliance weekly"},
            MarketRelevanceScore: 0.83,
            DifficultyScore: ai.calculateDifficultyScore(profile.ExperienceLevel),
            PriorityScore: 0.8,
            EstimatedDays: 21,
            Prerequisites: []string{"Access to systems and config management"},
            SuccessMetrics: []string{">90% CIS compliance", "Zero critical misconfigs"},
            CertificationPath: "",
            CareerImpact: "Elevates security baseline and audit readiness.",
            Tags: []string{"Security","CIS","Hardening"},
        })
        goals = append(goals, AIGoalResponse{
            Title: "IAM Least-Privilege Review and Access Recertification",
            PersonalizedDescription: "Reduce over-privilege and institute periodic access reviews.",
            LearningPath: []string{"Inventory roles", "Apply least-privilege", "Recertification cadence"},
            RealWorldScenarios: []string{"Tighten admin roles", "Quarterly reviews"},
            MarketRelevanceScore: 0.81,
            DifficultyScore: ai.calculateDifficultyScore(profile.ExperienceLevel),
            PriorityScore: 0.78,
            EstimatedDays: 21,
            Prerequisites: []string{"Directory/IdP access"},
            SuccessMetrics: []string{"Reduced admin privileges", "Completed recertification"},
            CertificationPath: "",
            CareerImpact: "Improves security posture and compliance.",
            Tags: []string{"Security","IAM","Least-Privilege"},
        })
    }

    // ITSM triggers
    if hasSub("ITSM") || strings.EqualFold(levelOf("ITIL 4"), "Awareness") || strings.EqualFold(levelOf("ITIL 4"), "Working") {
        goals = append(goals, AIGoalResponse{
            Title: "Implement Incident/Problem/Change with SLAs",
            PersonalizedDescription: "Stand up core ITSM processes with clear SLAs and CAB policy.",
            LearningPath: []string{"Define workflows", "Configure tool", "Publish SLAs", "Run CAB"},
            RealWorldScenarios: []string{"Go-live with SLAs", "Monthly CAB"},
            MarketRelevanceScore: 0.78,
            DifficultyScore: ai.calculateDifficultyScore(profile.ExperienceLevel),
            PriorityScore: 0.72,
            EstimatedDays: 28,
            Prerequisites: []string{"ITSM tool access"},
            SuccessMetrics: []string{"MTTR trend down", "Change failure rate < 15%"},
            CertificationPath: "",
            CareerImpact: "Improves service reliability and governance.",
            Tags: []string{"ITSM","ITIL","SLA"},
        })
    }

    return goals
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

func (ai *AIService) generateTags(resp models.Responsibility, profile models.UserProfile) []string {
	tags := []string{}
	
	// Add industry tag
	if profile.Industry != "" {
		tags = append(tags, profile.Industry)
	}
	
	// Add role tag
	if profile.CurrentRole != "" {
		tags = append(tags, profile.CurrentRole)
	}
	
	// Add category tag
	if resp.Category != "" {
		tags = append(tags, resp.Category)
	}
	
	// Add experience level tag
	if profile.ExperienceLevel != "" {
		tags = append(tags, profile.ExperienceLevel)
	}
	
	return tags
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
        return nil, sanitizeError(err)
    }
    defer resp.Body.Close()
    if resp.StatusCode < 200 || resp.StatusCode >= 300 {
        b, _ := io.ReadAll(resp.Body)
        apiErr := fmt.Errorf("openai api error: %s", string(b))
        return nil, sanitizeError(apiErr)
    }

    var parsed struct {
        Choices []struct {
            Message struct {
                Content string `json:"content"`
            } `json:"message"`
        } `json:"choices"`
    }
    if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
        return nil, sanitizeError(err)
    }
    if len(parsed.Choices) == 0 {
        return nil, sanitizeError(fmt.Errorf("no choices"))
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
        return nil, sanitizeError(err)
    }
    if len(j.Goals) == 0 {
        return nil, sanitizeError(fmt.Errorf("empty goals"))
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
            Tags:                    append(g.Tags, ai.generateTags(req.Responsibility, req.UserProfile)...),
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

// sanitizeError removes sensitive information from error messages
func sanitizeError(err error) error {
    if err == nil {
        return nil
    }
    errStr := err.Error()
    
    // Remove any potential API keys (sk-...)
    if strings.Contains(errStr, "sk-") {
        return fmt.Errorf("external API authentication error")
    }
    
    // Remove bearer tokens
    if strings.Contains(strings.ToLower(errStr), "bearer") {
        return fmt.Errorf("external API authorization error")
    }
    
    // Remove full error response bodies that might contain sensitive info
    if len(errStr) > 500 {
        return fmt.Errorf("external API error (response too large)")
    }
    
    return fmt.Errorf("external API error")
}