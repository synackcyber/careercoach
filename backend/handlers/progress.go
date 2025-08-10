package handlers

import (
    "net/http"
    "strconv"
    "goaltracker/database"
    "goaltracker/models"
    "goaltracker/middleware"
    "github.com/gin-gonic/gin"
)

func GetProgress(c *gin.Context) {
	goalID := c.Param("id")
	var progress []models.Progress
	
    userID, _ := middleware.GetUserID(c)
    if err := database.DB.Where("user_id = ? AND goal_id = ?", userID, goalID).Order("created_at DESC").Find(&progress).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch progress"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"data": progress})
}

func CreateProgress(c *gin.Context) {
	goalID := c.Param("id")
	var progress models.Progress
	
	if err := c.ShouldBindJSON(&progress); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	goalIDUint, err := strconv.ParseUint(goalID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid goal ID"})
		return
	}
	
    progress.GoalID = uint(goalIDUint)
    userID, _ := middleware.GetUserID(c)
    progress.UserID = userID
	
	var goal models.Goal
    if err := database.DB.Where("user_id = ?", userID).First(&goal, goalID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Goal not found"})
		return
	}
	
	if err := database.DB.Create(&progress).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create progress"})
		return
	}
	
	c.JSON(http.StatusCreated, gin.H{"data": progress})
}

func UpdateProgress(c *gin.Context) {
	id := c.Param("id")
	var progress models.Progress
	
    userID, _ := middleware.GetUserID(c)
    if err := database.DB.Where("user_id = ?", userID).First(&progress, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Progress not found"})
		return
	}
	
	if err := c.ShouldBindJSON(&progress); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
    // enforce ownership
    progress.UserID = userID
    if err := database.DB.Save(&progress).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update progress"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"data": progress})
}

func DeleteProgress(c *gin.Context) {
	id := c.Param("id")
	
    userID, _ := middleware.GetUserID(c)
    if err := database.DB.Where("user_id = ?", userID).Delete(&models.Progress{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete progress"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "Progress deleted successfully"})
}