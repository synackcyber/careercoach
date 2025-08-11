package handlers

import (
    "net/http"
    "strconv"
    "goaltracker/database"
    "goaltracker/models"
    "goaltracker/services"
    "goaltracker/middleware"
    "github.com/gin-gonic/gin"
    "strings"
)

type AIGoalRequest struct {
	UserProfile        models.UserProfile `json:"user_profile" binding:"required"`
	ResponsibilityID   uint               `json:"responsibility_id" binding:"required"`
	MarketTrends       []string           `json:"market_trends,omitempty"`
	CompanyContext     string             `json:"company_context,omitempty"`
}

type updateProfilePayload struct {
    CurrentRole        *string `json:"current_role"`
    ExperienceLevel    *string `json:"experience_level"`
    Industry           *string `json:"industry"`
    CompanySize        *string `json:"company_size,omitempty"`
    LearningStyle      *string `json:"learning_style,omitempty"`
    AvailableHoursWeek *int    `json:"available_hours_week,omitempty"`
    CareerGoals        *string `json:"career_goals,omitempty"`
    CurrentTools       *string `json:"current_tools,omitempty"`
    SkillGaps          *string `json:"skill_gaps,omitempty"`
}

var expLevels = map[string]struct{}{ "entry":{}, "junior":{}, "mid":{}, "senior":{}, "lead":{}, "expert":{} }

func GetAIGoalSuggestions(c *gin.Context) {
	var req AIGoalRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	// Get responsibility details
	var responsibility models.Responsibility
	if err := database.DB.First(&responsibility, req.ResponsibilityID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Responsibility not found"})
		return
	}
	
	// Prepare AI service request
	aiReq := services.GoalSuggestionRequest{
		UserProfile:    req.UserProfile,
		Responsibility: responsibility,
		MarketTrends:   req.MarketTrends,
		CompanyContext: req.CompanyContext,
	}
	
	// Generate AI suggestions
    aiService := services.NewAIService()
    suggestions, err := aiService.GeneratePersonalizedGoals(aiReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate AI suggestions"})
		return
	}
    
    // attach user ownership for any persisted AI entities (if/when saved later)
    _ = middleware.GetUserID
	c.JSON(http.StatusOK, gin.H{
		"data": suggestions,
		"user_context": req.UserProfile,
		"ai_powered": true,
	})
}

// GetOrCreateMyProfile fetches the current user's profile, creating a blank one if missing
func GetOrCreateMyProfile(c *gin.Context) {
    userID, _ := middleware.GetUserID(c)

    var profile models.UserProfile
    if err := database.DB.Where("user_id = ?", userID).First(&profile).Error; err != nil {
        profile = models.UserProfile{
            UserID:          userID,
            ExperienceLevel: "mid", // Default to avoid constraint violation
        }
        if err2 := database.DB.Create(&profile).Error; err2 != nil {
            if strings.Contains(strings.ToLower(err2.Error()), "duplicate") || strings.Contains(err2.Error(), "23505") {
                if err3 := database.DB.Where("user_id = ?", userID).First(&profile).Error; err3 == nil {
                    c.JSON(http.StatusOK, gin.H{"data": profile})
                    return
                }
            }
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user profile", "reason": err2.Error()})
            return
        }
    }

    c.JSON(http.StatusOK, gin.H{"data": profile})
}

func CreateUserProfile(c *gin.Context) {
    var p updateProfilePayload
    if err := c.ShouldBindJSON(&p); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    userID, _ := middleware.GetUserID(c)
    profile := models.UserProfile{UserID: userID}
    if p.CurrentRole != nil { profile.CurrentRole = *p.CurrentRole }
    if p.ExperienceLevel != nil {
        if _, ok := expLevels[*p.ExperienceLevel]; !ok {
            c.JSON(http.StatusBadRequest, gin.H{"error":"invalid experience_level"})
            return
        }
        profile.ExperienceLevel = *p.ExperienceLevel
    } else {
        profile.ExperienceLevel = "mid" // Default if not provided
    }
    if p.Industry != nil { profile.Industry = *p.Industry }
    if p.CompanySize != nil { profile.CompanySize = *p.CompanySize }
    if p.LearningStyle != nil { profile.LearningStyle = *p.LearningStyle }
    if p.AvailableHoursWeek != nil { profile.AvailableHoursWeek = *p.AvailableHoursWeek }
    if p.CareerGoals != nil { profile.CareerGoals = *p.CareerGoals }
    if p.CurrentTools != nil { profile.CurrentTools = *p.CurrentTools }
    if p.SkillGaps != nil { profile.SkillGaps = *p.SkillGaps }
    if err := database.DB.Create(&profile).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user profile"})
        return
    }
    c.JSON(http.StatusCreated, gin.H{"data": profile})
}

func GetUserProfile(c *gin.Context) {
	id := c.Param("id")
	var profile models.UserProfile
	
    userID, _ := middleware.GetUserID(c)
    if err := database.DB.Where("user_id = ?", userID).First(&profile, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User profile not found"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"data": profile})
}

func UpdateUserProfile(c *gin.Context) {
    id := c.Param("id")
    var profile models.UserProfile
    userID, _ := middleware.GetUserID(c)
    if err := database.DB.Where("user_id = ?", userID).First(&profile, id).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "User profile not found"})
        return
    }
    var p updateProfilePayload
    if err := c.ShouldBindJSON(&p); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    if p.CurrentRole != nil { profile.CurrentRole = *p.CurrentRole }
    if p.ExperienceLevel != nil {
        if _, ok := expLevels[*p.ExperienceLevel]; !ok {
            c.JSON(http.StatusBadRequest, gin.H{"error":"invalid experience_level"})
            return
        }
        profile.ExperienceLevel = *p.ExperienceLevel
    }
    if p.Industry != nil { profile.Industry = *p.Industry }
    if p.CompanySize != nil { profile.CompanySize = *p.CompanySize }
    if p.LearningStyle != nil { profile.LearningStyle = *p.LearningStyle }
    if p.AvailableHoursWeek != nil { profile.AvailableHoursWeek = *p.AvailableHoursWeek }
    if p.CareerGoals != nil { profile.CareerGoals = *p.CareerGoals }
    if p.CurrentTools != nil { profile.CurrentTools = *p.CurrentTools }
    if p.SkillGaps != nil { profile.SkillGaps = *p.SkillGaps }
    profile.UserID = userID
    if err := database.DB.Save(&profile).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user profile"})
        return
    }
    c.JSON(http.StatusOK, gin.H{"data": profile})
}

func GetAIInsights(c *gin.Context) {
	profileIdStr := c.Query("profile_id")
	if profileIdStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "profile_id is required"})
		return
	}
	
	profileId, err := strconv.ParseUint(profileIdStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid profile_id"})
		return
	}
	
	var insights []models.LearningInsight
    userID, _ := middleware.GetUserID(c)
    query := database.DB.Where("user_id = ? AND user_profile_id = ?", userID, profileId)
	
	// Filter by insight type if provided
	if insightType := c.Query("type"); insightType != "" {
		query = query.Where("insight_type = ?", insightType)
	}
	
	if err := query.Order("confidence DESC, created_at DESC").Find(&insights).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch insights"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"data": insights})
}

// Generate market-aware suggestions
func GetMarketAwareGoals(c *gin.Context) {
	responsibilityIdStr := c.Param("responsibility_id")
	responsibilityId, err := strconv.ParseUint(responsibilityIdStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid responsibility_id"})
		return
	}
	
	// Get current market trends (in production, this would come from external APIs)
	currentTrends := []string{
		"AI/ML Engineering", 
		"Kubernetes Orchestration", 
		"Zero Trust Security",
		"Infrastructure as Code",
		"Cloud-Native Development",
		"DevSecOps",
		"Microservices Architecture",
	}
	
	// Get responsibility details
	var responsibility models.Responsibility
	if err := database.DB.First(&responsibility, responsibilityId).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Responsibility not found"})
		return
	}
	
	// Generate AI-enhanced suggestions
	aiService := services.NewAIService()
	req := services.GoalSuggestionRequest{
		UserProfile:    models.UserProfile{},
		Responsibility: responsibility,
		MarketTrends:   currentTrends,
		CompanyContext: "",
	}
	
	aiSuggestions, err := aiService.GeneratePersonalizedGoals(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate AI suggestions"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"data": aiSuggestions,
		"market_trends": currentTrends,
		"responsibility": responsibility,
		"ai_enhanced": true,
		"personalized": true,
	})
}

// Analyze user progress and provide AI insights
func GenerateProgressInsights(c *gin.Context) {
	goalIdStr := c.Param("goal_id")
	goalId, err := strconv.ParseUint(goalIdStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid goal_id"})
		return
	}
	
	// Get goal and progress data
	var goal models.Goal
	if err := database.DB.Preload("Progress").First(&goal, goalId).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Goal not found"})
		return
	}
	
	// Analyze progress patterns (in production, this would use sophisticated ML)
	insights := []models.LearningInsight{}
	
	if len(goal.Progress) > 0 {
		// Calculate progress velocity
		latestProgress := goal.Progress[len(goal.Progress)-1]
		
		if latestProgress.Percentage >= 75 {
			insights = append(insights, models.LearningInsight{
				InsightType:    "strength",
				InsightText:    "Excellent progress! You're on track to complete this goal ahead of schedule. Consider taking on a more advanced challenge.",
				Confidence:     0.9,
				ActionRequired: false,
			})
		} else if latestProgress.Percentage < 25 {
			insights = append(insights, models.LearningInsight{
				InsightType:    "recommendation",
				InsightText:    "Consider breaking this goal into smaller milestones. Focus on hands-on practice to build momentum.",
				Confidence:     0.8,
				ActionRequired: true,
			})
		}
	}
	
	// Add market-based insights
	insights = append(insights, models.LearningInsight{
		InsightType:    "trend",
		InsightText:    "This skill is currently in high demand. Completing this goal could increase your market value by 15-25%.",
		Confidence:     0.85,
		ActionRequired: false,
	})
	
	c.JSON(http.StatusOK, gin.H{
		"goal": goal,
		"insights": insights,
		"ai_generated": true,
	})
}