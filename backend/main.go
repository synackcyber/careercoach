package main

import (
    "log"
    "goaltracker/config"
    "goaltracker/database"
    "goaltracker/handlers"
    "goaltracker/middleware"
    "github.com/gin-gonic/gin"
    "github.com/gin-contrib/cors"
)

func main() {
	cfg := config.Load()
	
	gin.SetMode(cfg.GinMode)
	
	database.Connect(cfg)
	
	r := gin.New()
	r.Use(gin.Recovery())

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{cfg.FrontendURL},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Light rate limiting across all routes (e.g., 60 req/min ~= 1 rps with burst 30)
	r.Use(middleware.RateLimitMiddleware(30, 1))

    api := r.Group("/api/v1")
    {
        // Public groups
        jobRoles := api.Group("/job-roles")
        {
            jobRoles.GET("", handlers.GetJobRoles)
            jobRoles.GET("/:id", handlers.GetJobRole)
            jobRoles.POST("", handlers.CreateJobRole)
        }

        responsibilities := api.Group("/responsibilities")
        {
            responsibilities.GET("", handlers.GetResponsibilities)
            responsibilities.GET("/:id", handlers.GetResponsibility)
        }

        suggestions := api.Group("/suggestions")
        {
            suggestions.GET("", handlers.GetGoalSuggestions)
            suggestions.GET("/:id", handlers.GetGoalSuggestion)
        }

        progressSuggestions := api.Group("/progress-suggestions")
        {
            progressSuggestions.GET("", handlers.GetProgressSuggestions)
            progressSuggestions.GET("/for-goal/:goal_id", handlers.GetProgressSuggestionsForGoal)
            progressSuggestions.GET("/:id", handlers.GetProgressSuggestion)
        }

        // Protected groups
        authRequired := api.Group("")
        authRequired.Use(middleware.RequireAuth())

        goals := authRequired.Group("/goals")
        {
            goals.GET("", handlers.GetGoals)
            goals.GET("/:id", handlers.GetGoal)
            goals.POST("", handlers.CreateGoal)
            goals.PUT("/:id", handlers.UpdateGoal)
            goals.DELETE("/:id", handlers.DeleteGoal)

            // Progress routes for specific goals
            goals.GET("/:id/progress", handlers.GetProgress)
            goals.POST("/:id/progress", handlers.CreateProgress)
        }

        progress := authRequired.Group("/progress")
        {
            progress.PUT("/:id", handlers.UpdateProgress)
            progress.DELETE("/:id", handlers.DeleteProgress)
        }

        aiGoals := authRequired.Group("/ai")
        {
            aiGoals.POST("/goal-suggestions", handlers.GetAIGoalSuggestions)
        }

        userProfiles := authRequired.Group("/profiles")
        {
            userProfiles.GET("/me", handlers.GetOrCreateMyProfile)
            userProfiles.POST("", handlers.CreateUserProfile)
            userProfiles.GET("/:id", handlers.GetUserProfile)
            userProfiles.PUT("/:id", handlers.UpdateUserProfile)
        }

        // Admin routes removed (ingestion disabled)
    }
	
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})
	
    // Ingestion scheduler removed for now

    log.Printf("Starting server on port %s", cfg.APIPort)
	if err := r.Run(":" + cfg.APIPort); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}