package handlers

import (
    "net/http"
    "time"
    "goaltracker/database"
    "goaltracker/models"
    "github.com/gin-gonic/gin"
)

func AdminHealth(c *gin.Context) {
    start := time.Now()
    sql, err := database.DB.DB()
    if err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error": "db"}); return }
    if err := sql.Ping(); err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error": "db_ping"}); return }
    latency := time.Since(start).Milliseconds()
    c.JSON(http.StatusOK, gin.H{"data": gin.H{"db_ms": latency, "time": time.Now().UTC()}})
}

func AdminUsers(c *gin.Context) {
    limit := 50
    var users []models.UserProfile
    if err := database.DB.Limit(limit).Order("created_at DESC").Find(&users).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list users"})
        return
    }
    c.JSON(http.StatusOK, gin.H{"data": users})
}


