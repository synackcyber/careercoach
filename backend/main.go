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
    // Log requests for debugging; keep in production for now (can be toggled with mode if needed)
    r.Use(gin.Logger())
    r.Use(gin.Recovery())

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{cfg.FrontendURL},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Light rate limiting across all routes (e.g., 120 req/min ~= 2 rps with burst 60)
	r.Use(middleware.RateLimitMiddleware(60, 2))
	
	// Request size limiting for security
	r.Use(middleware.RequestSizeLimiter(middleware.MaxRequestSize))

    api := r.Group("/api/v1")
    {
        // Security endpoints
        api.GET("/csrf-token", middleware.CSRFTokenEndpoint())
        
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
            // Profile-based
            suggestions.GET("/for-profile", handlers.GetProfileBasedSuggestions)
        }

        progressSuggestions := api.Group("/progress-suggestions")
        {
            progressSuggestions.GET("", handlers.GetProgressSuggestions)
            progressSuggestions.GET("/for-goal/:goal_id", handlers.GetProgressSuggestionsForGoal)
            progressSuggestions.GET("/:id", handlers.GetProgressSuggestion)
        }

        // Protected groups with authentication and CSRF protection
        authRequired := api.Group("")
        authRequired.Use(middleware.RequireAuth())
        authRequired.Use(middleware.CSRFProtection())

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
            // SMART-only endpoint (preferred)
            aiGoals.POST("/refine-smart", handlers.RefineSMARTRoute)
            // Legacy OKR+SMART (kept for compatibility if called)
            aiGoals.POST("/refine-okr", handlers.RefineOKRSmart)
            // Milestones
            aiGoals.POST("/milestones", handlers.GenerateMilestonesRoute)
        }

        userProfiles := authRequired.Group("/profiles")
        {
            userProfiles.GET("/me", handlers.GetOrCreateMyProfile)
            userProfiles.POST("", handlers.CreateUserProfile)
            userProfiles.GET("/:id", handlers.GetUserProfile)
            userProfiles.PUT("/:id", handlers.UpdateUserProfile)
        }

        // Admin: system health and users (read-only)
        admin := authRequired.Group("/admin")
        admin.Use(middleware.RequireAdmin())
        {
            admin.GET("/health", handlers.AdminHealth)
            admin.GET("/users", handlers.AdminUsers)
            admin.GET("/ai-status", handlers.AdminAIStatus)
        }
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