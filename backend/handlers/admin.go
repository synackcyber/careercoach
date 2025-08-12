package handlers

import (
    "net/http"
    "time"
    "goaltracker/database"
    "goaltracker/models"
    "goaltracker/services"
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

// AdminAIStatus returns recent AI generation stats and current provider config.
func AdminAIStatus(c *gin.Context) {
    stats := services.GetAIStats()
    var total, success int
    var avgLatency int
    for _, s := range stats.Items {
        total++
        if s.Success { success++ }
        avgLatency += s.LatencyMs
    }
    if total > 0 { avgLatency = avgLatency / total }

    var since *time.Time
    if total > 0 {
        t := stats.Items[0].Timestamp
        since = &t
    }

    c.JSON(http.StatusOK, gin.H{
        "data": gin.H{
            "provider": services.CurrentAIProvider(),
            "total_calls": total,
            "success_calls": success,
            "avg_latency_ms": avgLatency,
            "window": "last_100",
            "sample_since": since,
        },
    })
}


