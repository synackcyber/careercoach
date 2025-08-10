package handlers

import (
	"net/http"
	"goaltracker/database"
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