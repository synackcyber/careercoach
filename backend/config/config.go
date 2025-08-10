package config

import (
	"fmt"
	"os"
	"github.com/joho/godotenv"
)

type Config struct {
	DBHost      string
	DBPort      string
	DBUser      string
	DBPassword  string
	DBName      string
    DBSSLMode   string
	// Add direct connection string support
	DBConnectionString  string
	APIPort     string
	FrontendURL string
	GinMode     string

    // OIDC/Supabase Auth
    OIDCIssuerURL string
    OIDCAudience  string
    JWKSURL       string
    SupabaseAnonKey string
    SupabaseJWTSecret string
}

func Load() *Config {
	godotenv.Load()

	config := &Config{
		DBHost:      getEnvOrDefault("DB_HOST", "localhost"),
		DBPort:      getEnvOrDefault("DB_PORT", "5432"),
		DBUser:      getEnvOrDefault("DB_USER", "postgres"),
		DBPassword:  getEnvOrDefault("DB_PASSWORD", "password"),
		DBName:      getEnvOrDefault("DB_NAME", "goaltracker"),
        DBSSLMode:   getEnvOrDefault("DB_SSLMODE", "disable"),
		DBConnectionString: getEnvOrDefault("DATABASE_URL", ""),
		APIPort:     getEnvOrDefault("API_PORT", "8080"),
		FrontendURL: getEnvOrDefault("FRONTEND_URL", "http://localhost:3000"),
		GinMode:     getEnvOrDefault("GIN_MODE", "debug"),

        OIDCIssuerURL: getEnvOrDefault("OIDC_ISSUER_URL", ""),
        OIDCAudience:  getEnvOrDefault("OIDC_AUDIENCE", "authenticated"),
        JWKSURL:       getEnvOrDefault("JWKS_URL", ""),
        SupabaseAnonKey: getEnvOrDefault("SUPABASE_ANON_KEY", ""),
        SupabaseJWTSecret: getEnvOrDefault("SUPABASE_JWT_SECRET", ""),
	}
	
	// Safe debug logging
	fmt.Printf("Config loaded - DBHost: %s, GinMode: %s\n", config.DBHost, config.GinMode)
	
	return config
}

func (c *Config) DatabaseURL() string {
    // If a direct database URL is provided, use it (preferred for Supabase)
    if c.DBConnectionString != "" {
        fmt.Printf("Using direct DATABASE_URL (value not logged)\n")
        return c.DBConnectionString
    }
    
    // Otherwise, construct from individual parameters
    fmt.Printf("Using constructed DB URL with host=%s (full value not logged)\n", c.DBHost)
    constructedURL := fmt.Sprintf("postgresql://%s:%s@%s:%s/%s?sslmode=%s",
        c.DBUser, c.DBPassword, c.DBHost, c.DBPort, c.DBName, c.DBSSLMode)
    return constructedURL
}

func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
