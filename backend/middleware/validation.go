package middleware

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// RequestSizeLimiter middleware to limit request body size
func RequestSizeLimiter(maxSize int64) gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		// Always apply MaxBytesReader regardless of Content-Length header
		// This protects against chunked encoding bypass
		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxSize)
		
		// Also check Content-Length if available for early rejection
		if c.Request.ContentLength > 0 && c.Request.ContentLength > maxSize {
			c.AbortWithStatusJSON(http.StatusRequestEntityTooLarge, 
				gin.H{"error": fmt.Sprintf("Request body too large. Maximum size: %d bytes", maxSize)})
			return
		}
		
		c.Next()
	})
}

// ValidateStringLength validates string field lengths
func ValidateStringLength(field, value string, min, max int) error {
	length := len(strings.TrimSpace(value))
	if length < min {
		return fmt.Errorf("%s must be at least %d characters", field, min)
	}
	if length > max {
		return fmt.Errorf("%s must not exceed %d characters", field, max)
	}
	return nil
}

// ValidateJSONSize validates JSON field size
func ValidateJSONSize(field, jsonStr string, maxBytes int) error {
	if len(jsonStr) > maxBytes {
		return fmt.Errorf("%s JSON exceeds maximum size of %d bytes", field, maxBytes)
	}
	return nil
}

// Common validation limits
const (
	MaxTitleLength       = 200
	MaxDescriptionLength = 2000
	MaxJSONFieldSize     = 50000  // 50KB for JSON fields like ITProfile
	MaxRequestSize       = 10 << 20 // 10MB request limit
)

// SanitizeDBError removes sensitive database information from error messages
func SanitizeDBError(err error) string {
	if err == nil {
		return ""
	}
	
	errStr := strings.ToLower(err.Error())
	
	// Common database constraint violations
	if strings.Contains(errStr, "duplicate") || strings.Contains(errStr, "unique") {
		return "Resource already exists"
	}
	if strings.Contains(errStr, "foreign key") {
		return "Invalid reference"
	}
	if strings.Contains(errStr, "not null") {
		return "Required field missing"
	}
	if strings.Contains(errStr, "check constraint") {
		return "Invalid data format"
	}
	
	// Generic database errors
	if strings.Contains(errStr, "database") || strings.Contains(errStr, "sql") {
		return "Database operation failed"
	}
	
	// Connection errors
	if strings.Contains(errStr, "connection") || strings.Contains(errStr, "timeout") {
		return "Service temporarily unavailable"
	}
	
	// For validation errors, allow the original message
	if strings.Contains(errStr, "validation") || strings.Contains(errStr, "invalid") {
		return err.Error()
	}
	
	// Default safe message
	return "Operation failed"
}