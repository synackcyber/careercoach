package handlers

import (
    "encoding/json"
    "net/http"
    "sort"
    "strings"

    "goaltracker/database"
    "goaltracker/middleware"
    "goaltracker/models"

    "github.com/gin-gonic/gin"
)

func GetGoalSuggestions(c *gin.Context) {
	responsibilityID := c.Query("responsibility_id")
	category := c.Query("category")
	
	var suggestions []models.GoalSuggestion
	query := database.DB.Preload("Responsibility").Preload("Responsibility.JobRole")
	
	if responsibilityID != "" {
		query = query.Where("responsibility_id = ?", responsibilityID)
	}
	
	if category != "" {
		query = query.Where("category = ?", category)
	}
	
	if err := query.Find(&suggestions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch goal suggestions"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"data": suggestions})
}

func GetGoalSuggestion(c *gin.Context) {
	id := c.Param("id")
	var suggestion models.GoalSuggestion
	
	if err := database.DB.Preload("Responsibility").Preload("Responsibility.JobRole").First(&suggestion, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Goal suggestion not found"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"data": suggestion})
}

// Profile-based suggestions using stored profile & IT profile
func GetProfileBasedSuggestions(c *gin.Context) {
    uid, err := middleware.GetUserID(c)
    if err != nil { c.JSON(http.StatusUnauthorized, gin.H{"error":"unauthorized"}); return }
    // Load profile
    var profile models.UserProfile
    if err := database.DB.Where("user_id = ?", uid).First(&profile).Error; err != nil {
        c.JSON(http.StatusOK, gin.H{"data": []models.GoalSuggestion{}})
        return
    }

    // Parse IT profile JSON for richer signals
    type ITFramework struct { Name string `json:"name"`; Level string `json:"level"` }
    type ITPlatform struct { Name string `json:"name"`; Depth string `json:"depth"`; LastUsed string `json:"last_used"` }
    type ITRole struct { Current string `json:"current"`; Level string `json:"level"`; Track string `json:"track"`; Target string `json:"target"` }
    type ITProfile struct {
        Role        ITRole        `json:"role"`
        Subdomains  []string      `json:"subdomains"`
        Frameworks  []ITFramework `json:"frameworks"`
        Certifications []struct{ Name string `json:"name"` } `json:"certifications"`
        Platforms   []ITPlatform  `json:"platforms"`
        Evidence    []struct{ Title string `json:"title"` } `json:"evidence"`
    }
    var itp ITProfile
    _ = json.Unmarshal([]byte(profile.ITProfile), &itp)

    // Build a keyword map with weights
    type kw struct { token string; weight int }
    var keywords []kw
    // role and profile basics
    for _, w := range strings.Fields(strings.ToLower(profile.CurrentRole)) { if len(w) > 2 { keywords = append(keywords, kw{w, 1}) } }
    if itp.Role.Current != "" { for _, w := range strings.Fields(strings.ToLower(itp.Role.Current)) { if len(w) > 2 { keywords = append(keywords, kw{w, 1}) } } }
    // subdomains (higher weight)
    for _, s := range itp.Subdomains { t := strings.ToLower(strings.TrimSpace(s)); if t != "" { keywords = append(keywords, kw{t, 2}) } }
    // frameworks (highest weight)
    for _, f := range itp.Frameworks { t := strings.ToLower(strings.TrimSpace(f.Name)); if t != "" { keywords = append(keywords, kw{t, 3}) } }
    // platforms (medium weight)
    for _, p := range itp.Platforms { t := strings.ToLower(strings.TrimSpace(p.Name)); if t != "" { keywords = append(keywords, kw{t, 2}) } }

    // Fetch static suggestions and score them
    var suggestions []models.GoalSuggestion
    if err := database.DB.Preload("Responsibility").Preload("Responsibility.JobRole").Find(&suggestions).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error":"failed"}); return
    }

    type scored struct { item models.GoalSuggestion; score int }
    scoredList := make([]scored, 0, len(suggestions))
    for _, s := range suggestions {
        text := strings.ToLower(s.Title + " " + s.Description + " " + s.Category)
        if s.Responsibility.Title != "" { text += " " + strings.ToLower(s.Responsibility.Title) }
        if s.Responsibility.Category != "" { text += " " + strings.ToLower(s.Responsibility.Category) }

        score := 0
        // priority weight
        switch strings.ToLower(s.Priority) {
        case "high":
            score += 2
        case "medium":
            score += 1
        }
        // keyword matches
        for _, k := range keywords {
            if k.token == "" { continue }
            if strings.Contains(text, k.token) {
                score += k.weight
            }
        }
        // light role/industry bias
        if profile.Industry != "" && strings.Contains(text, strings.ToLower(profile.Industry)) { score++ }
        if profile.CurrentRole != "" && strings.Contains(text, strings.ToLower(profile.CurrentRole)) { score++ }

        // keep items with non-zero scores or high priority as fallbacks
        if score > 0 || strings.ToLower(s.Priority) == "high" {
            scoredList = append(scoredList, scored{item: s, score: score})
        }
    }

    // sort by score desc
    sort.Slice(scoredList, func(i, j int) bool { return scoredList[i].score > scoredList[j].score })

    // cap results
    max := 12
    if len(scoredList) < max { max = len(scoredList) }
    out := make([]models.GoalSuggestion, 0, max)
    for i := 0; i < max; i++ { out = append(out, scoredList[i].item) }

    c.JSON(http.StatusOK, gin.H{"data": out})
}