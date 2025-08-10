package handlers

import (
	"net/http"
	"goaltracker/database"
	"goaltracker/models"
	"github.com/gin-gonic/gin"
)

func GetJobRoles(c *gin.Context) {
	var jobRoles []models.JobRole
	
	if err := database.DB.Find(&jobRoles).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch job roles"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"data": jobRoles})
}

func GetJobRole(c *gin.Context) {
	id := c.Param("id")
	var jobRole models.JobRole
	
	if err := database.DB.First(&jobRole, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Job role not found"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"data": jobRole})
}

func CreateJobRole(c *gin.Context) {
	var jobRole models.JobRole
	
	if err := c.ShouldBindJSON(&jobRole); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	if err := database.DB.Create(&jobRole).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create job role"})
		return
	}
	
	c.JSON(http.StatusCreated, gin.H{"data": jobRole})
}