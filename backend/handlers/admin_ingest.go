package handlers

import (
    "net/http"
    "time"
    "goaltracker/services/ingest"
    "github.com/gin-gonic/gin"
)

var lastStatus ingest.Status

func AdminIngestRun(c *gin.Context) {
    status, err := ingest.RunOnce(c.Request.Context())
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    lastStatus = status
    c.JSON(http.StatusOK, gin.H{"data": status})
}

func AdminIngestStatus(c *gin.Context) {
    c.JSON(http.StatusOK, gin.H{"data": lastStatus})
}

func AdminIngestSources(c *gin.Context) {
    srcs := ingest.ConfiguredSources()
    c.JSON(http.StatusOK, gin.H{"data": srcs, "at": time.Now().UTC()})
}


