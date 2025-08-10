package handlers

import (
	"net/http"
	"goaltracker/database"
	"goaltracker/models"
	"github.com/gin-gonic/gin"
)

func GetProgressSuggestions(c *gin.Context) {
	var suggestions []models.ProgressSuggestion
	
	query := database.DB.Preload("GoalSuggestion").Preload("GoalSuggestion.Responsibility")
	
	// Filter by goal_suggestion_id if provided
	if goalSuggestionID := c.Query("goal_suggestion_id"); goalSuggestionID != "" {
		query = query.Where("goal_suggestion_id = ?", goalSuggestionID)
	}
	
	// Filter by progress stage if provided
	if stage := c.Query("progress_stage"); stage != "" {
		query = query.Where("progress_stage = ?", stage)
	}
	
	// Filter by percentage range if provided
	if percentageRange := c.Query("percentage_range"); percentageRange != "" {
		query = query.Where("percentage_range = ?", percentageRange)
	}
	
	if err := query.Find(&suggestions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch progress suggestions"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"data": suggestions})
}

func GetProgressSuggestion(c *gin.Context) {
	id := c.Param("id")
	var suggestion models.ProgressSuggestion
	
	if err := database.DB.Preload("GoalSuggestion").Preload("GoalSuggestion.Responsibility").First(&suggestion, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Progress suggestion not found"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"data": suggestion})
}

// Get progress suggestions for a specific goal based on current percentage
func GetProgressSuggestionsForGoal(c *gin.Context) {
	goalID := c.Param("goal_id")
	currentPercentage := c.DefaultQuery("current_percentage", "0")
	
	// First, get the goal to find its original suggestion
	var goal models.Goal
	if err := database.DB.First(&goal, goalID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Goal not found"})
		return
	}
	
	// For now, we'll use a simple approach - try to find progress suggestions
	// based on common goal patterns. In a more sophisticated system, we might
	// link goals to their original goal suggestions.
	var suggestions []models.ProgressSuggestion
	
	// Determine percentage range
	percentage := 0
	if currentPercentage != "0" {
		// Convert string to int (basic conversion)
		switch {
		case currentPercentage <= "25":
			percentage = 25
		case currentPercentage <= "50":
			percentage = 50
		case currentPercentage <= "75":
			percentage = 75
		default:
			percentage = 100
		}
	}
	
	// Find suggestions based on percentage range
	percentageRanges := []string{}
	switch {
	case percentage <= 25:
		percentageRanges = []string{"0-25"}
	case percentage <= 50:
		percentageRanges = []string{"26-50", "0-25"}
	case percentage <= 75:
		percentageRanges = []string{"51-75", "26-50"}
	default:
		percentageRanges = []string{"76-100", "51-75"}
	}
	
	query := database.DB.Preload("GoalSuggestion").Preload("GoalSuggestion.Responsibility")
	query = query.Where("percentage_range IN ?", percentageRanges)
	
	if err := query.Limit(10).Find(&suggestions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch progress suggestions"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"data": suggestions,
		"current_percentage": currentPercentage,
		"suggested_range": percentageRanges[0],
	})
}