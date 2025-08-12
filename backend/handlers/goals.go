package handlers

import (
    "net/http"
    "time"
    "encoding/json"
    "strings"
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
    var payload map[string]interface{}
    if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}
    
    // Map known fields with validation
    var goal models.Goal
    if v, ok := payload["title"].(string); ok { 
        if err := middleware.ValidateStringLength("title", v, 1, middleware.MaxTitleLength); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }
        goal.Title = v 
    } else {
        c.JSON(http.StatusBadRequest, gin.H{"error": "title is required"})
        return
    }
    
    if v, ok := payload["description"].(string); ok { 
        if err := middleware.ValidateStringLength("description", v, 0, middleware.MaxDescriptionLength); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }
        goal.Description = v 
    }
    if v, ok := payload["priority"].(string); ok { goal.Priority = v }
    if v, ok := payload["status"].(string); ok { goal.Status = v }
    // due_date can be ISO string
    if v, ok := payload["due_date"].(string); ok && v != "" {
        if t, err := time.Parse(time.RFC3339, v); err == nil {
            goal.DueDate = &t
        }
    }
    // tags: expect []string -> store as JSON string
    if tagsRaw, ok := payload["tags"]; ok && tagsRaw != nil {
        if b, err := json.Marshal(tagsRaw); err == nil {
            goal.Tags = string(b)
        }
    }
    // metadata: optional object -> store as JSONB string
    var metaRaw interface{}
    if mr, ok := payload["metadata"]; ok && mr != nil { metaRaw = mr }
    if metaRaw != nil {
        if b, err := json.Marshal(metaRaw); err == nil { goal.Metadata = string(b) }
    }
    // optional job_role_id
    if v, ok := payload["job_role_id"].(float64); ok { // JSON numbers are float64
        id := uint(v)
        goal.JobRoleID = &id
    }

    userID, _ := middleware.GetUserID(c)
    goal.UserID = userID
    if err := database.DB.Create(&goal).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create goal"})
		return
	}
	
    // If metadata contains milestones, seed initial progress entries as planned milestones (non-blocking)
    if metaRaw != nil {
        type milestone struct { Label string `json:"label"`; DueDate string `json:"due_date"` }
        var milestones []milestone
        if b, err := json.Marshal(metaRaw); err == nil {
            var meta map[string]interface{}
            if err := json.Unmarshal(b, &meta); err == nil {
                if ms, ok := meta["milestones"]; ok && ms != nil {
                    if mb, err := json.Marshal(ms); err == nil {
                        _ = json.Unmarshal(mb, &milestones)
                    }
                }
            }
        }
        for _, m := range milestones {
            p := models.Progress{
                UserID:     userID,
                GoalID:     goal.ID,
                Description: m.Label,
                Percentage:  0,
                Notes:       "Planned milestone",
                NextSteps:   strings.TrimSpace(m.Label + func() string { if m.DueDate != "" { return " (due: " + m.DueDate + ")" }; return "" }()),
            }
            // Ignore any error to avoid failing the goal creation
            _ = database.DB.Create(&p).Error
        }
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
	
    var payload map[string]interface{}
    if err := c.ShouldBindJSON(&payload); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    if v, ok := payload["title"].(string); ok { goal.Title = v }
    if v, ok := payload["description"].(string); ok { goal.Description = v }
    if v, ok := payload["priority"].(string); ok { goal.Priority = v }
    if v, ok := payload["status"].(string); ok { goal.Status = v }
    if v, ok := payload["due_date"].(string); ok {
        if v == "" { goal.DueDate = nil } else if t, err := time.Parse(time.RFC3339, v); err == nil { goal.DueDate = &t }
    }
    if tagsRaw, ok := payload["tags"]; ok {
        if tagsRaw == nil { goal.Tags = "" } else if b, err := json.Marshal(tagsRaw); err == nil { goal.Tags = string(b) }
    }
    if metaRaw, ok := payload["metadata"]; ok {
        if metaRaw == nil { goal.Metadata = "" } else if b, err := json.Marshal(metaRaw); err == nil { goal.Metadata = string(b) }
    }
    if v, ok := payload["job_role_id"].(float64); ok { id := uint(v); goal.JobRoleID = &id }
	
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