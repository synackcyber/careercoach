package handlers

import (
    "net/http"
    "goaltracker/database"
    "goaltracker/models"
    "goaltracker/middleware"
    "github.com/gin-gonic/gin"
)

func GetGoals(c *gin.Context) {
	var goals []models.Goal
	
    userID, _ := middleware.GetUserID(c)
    query := database.DB.Where("user_id = ?", userID).Preload("JobRole").Preload("Progress")
	
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}
	
	if priority := c.Query("priority"); priority != "" {
		query = query.Where("priority = ?", priority)
	}
	
	if err := query.Find(&goals).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch goals"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"data": goals})
}

func GetGoal(c *gin.Context) {
	id := c.Param("id")
	var goal models.Goal
	
    userID, _ := middleware.GetUserID(c)
    if err := database.DB.Preload("JobRole").Preload("Progress").Where("user_id = ?", userID).First(&goal, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Goal not found"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"data": goal})
}

func CreateGoal(c *gin.Context) {
	var goal models.Goal
	
    if err := c.ShouldBindJSON(&goal); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
    userID, _ := middleware.GetUserID(c)
    goal.UserID = userID
    if err := database.DB.Create(&goal).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create goal"})
		return
	}
	
	database.DB.Preload("JobRole").Preload("Progress").First(&goal, goal.ID)
	
	c.JSON(http.StatusCreated, gin.H{"data": goal})
}

func UpdateGoal(c *gin.Context) {
	id := c.Param("id")
	var goal models.Goal
	
    userID, _ := middleware.GetUserID(c)
    if err := database.DB.Where("user_id = ?", userID).First(&goal, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Goal not found"})
		return
	}
	
	if err := c.ShouldBindJSON(&goal); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
    // ensure the record stays bound to the same user
    goal.UserID = userID
    if err := database.DB.Save(&goal).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update goal"})
		return
	}
	
	database.DB.Preload("JobRole").Preload("Progress").First(&goal, goal.ID)
	
	c.JSON(http.StatusOK, gin.H{"data": goal})
}

func DeleteGoal(c *gin.Context) {
    id := c.Param("id")
    userID, _ := middleware.GetUserID(c)
    if err := database.DB.Where("user_id = ?", userID).Delete(&models.Goal{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete goal"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "Goal deleted successfully"})
}