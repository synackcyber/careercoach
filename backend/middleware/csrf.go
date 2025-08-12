package middleware

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

const (
	csrfTokenHeader = "X-CSRF-Token"
	csrfCookieName  = "csrf_token"
)

// CSRFProtection implements CSRF protection using the Double Submit Cookie pattern
func CSRFProtection() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Skip CSRF for safe methods (GET, HEAD, OPTIONS)
		if c.Request.Method == "GET" || c.Request.Method == "HEAD" || c.Request.Method == "OPTIONS" {
			c.Next()
			return
		}

		// Get CSRF token from cookie
		cookieToken, err := c.Cookie(csrfCookieName)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "CSRF token missing"})
			return
		}

		// Get CSRF token from header
		headerToken := c.GetHeader(csrfTokenHeader)
		if headerToken == "" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "CSRF token required in header"})
			return
		}

		// Verify tokens match
		if !secureCompare(cookieToken, headerToken) {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "CSRF token mismatch"})
			return
		}

		c.Next()
	}
}

// CSRFTokenEndpoint provides CSRF tokens to clients
func CSRFTokenEndpoint() gin.HandlerFunc {
	return func(c *gin.Context) {
		token, err := generateCSRFToken()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate CSRF token"})
			return
		}

		// Set secure cookie
		c.SetSameSite(http.SameSiteStrictMode)
		c.SetCookie(
			csrfCookieName,
			token,
			3600, // 1 hour
			"/",
			"",
			false, // Set to true in production with HTTPS
			true,  // HttpOnly
		)

		c.JSON(http.StatusOK, gin.H{
			"csrf_token": token,
		})
	}
}

// generateCSRFToken generates a cryptographically secure random token
func generateCSRFToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

// secureCompare performs constant-time comparison to prevent timing attacks
func secureCompare(a, b string) bool {
	if len(a) != len(b) {
		return false
	}
	
	result := 0
	for i := 0; i < len(a); i++ {
		result |= int(a[i]) ^ int(b[i])
	}
	
	return result == 0
}

// Optional: Extract CSRF protection for specific endpoints that need it
func RequireCSRF() gin.HandlerFunc {
	return CSRFProtection()
}