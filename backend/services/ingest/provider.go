package ingest

import (
    "context"
    "encoding/json"
    "time"
    "goaltracker/config"
)

type RawPosting struct {
    SourceName string
    ExternalID string
    Company    string
    Title      string
    URL        string
    Location   string
    Remote     bool
    EmploymentType string
    DatePosted *time.Time
    DescriptionHTML string
}

type JobSourceProvider interface {
    FetchOpenings(ctx context.Context) ([]RawPosting, error)
    Name() string
}

type SourceConfig struct {
    Name    string `json:"name"`
    Type    string `json:"type"`
    BaseURL string `json:"base_url"`
}

func loadSourceConfigs() ([]SourceConfig, error) {
    cfg := config.Load()
    var items []SourceConfig
    if err := json.Unmarshal([]byte(cfg.IngestSourcesJSON), &items); err != nil {
        return nil, err
    }
    return items, nil
}


