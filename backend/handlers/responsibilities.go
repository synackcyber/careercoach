package handlers

import (
	"net/http"
	"goaltracker/database"
	"goaltracker/models"
	"github.com/gin-gonic/gin"
)

func GetResponsibilities(c *gin.Context) {
	jobRoleID := c.Query("job_role_id")
	category := c.Query("category")
	
	var responsibilities []models.Responsibility
	query := database.DB.Preload("JobRole")
	
	if jobRoleID != "" {
		query = query.Where("job_role_id = ?", jobRoleID)
	}
	
	if category != "" {
		query = query.Where("category = ?", category)
	}
	
	if err := query.Find(&responsibilities).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch responsibilities"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"data": responsibilities})
}

func GetResponsibility(c *gin.Context) {
	id := c.Param("id")
	var responsibility models.Responsibility
	
	if err := database.DB.Preload("JobRole").First(&responsibility, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Responsibility not found"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"data": responsibility})
}