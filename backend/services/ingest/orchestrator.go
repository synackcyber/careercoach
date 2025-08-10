package ingest

import (
    "context"
    "crypto/sha256"
    "encoding/hex"
    "encoding/json"
    "strings"
    "time"
    "goaltracker/config"
    "goaltracker/database"
    "goaltracker/models"
)

type Status struct {
    StartedAt time.Time `json:"started_at"`
    FinishedAt time.Time `json:"finished_at"`
    Sources int `json:"sources"`
    PostingsFetched int `json:"postings_fetched"`
    PostingsUpserted int `json:"postings_upserted"`
    Deduped int `json:"deduped"`
    Errors []string `json:"errors"`
}

func providersFromConfig() ([]JobSourceProvider, error) {
    cfgs, err := loadSourceConfigs()
    if err != nil { return nil, err }
    var ps []JobSourceProvider
    for _, c := range cfgs {
        switch strings.ToLower(c.Type) {
        case "greenhouse":
            ps = append(ps, newGreenhouseProvider(c.Name, c.BaseURL))
        case "lever":
            ps = append(ps, newLeverProvider(c.Name, c.BaseURL))
        }
    }
    return ps, nil
}

func hashPosting(r RawPosting) string {
    h := sha256.Sum256([]byte(r.SourceName + "|" + r.ExternalID + "|" + r.Title + "|" + r.URL))
    return hex.EncodeToString(h[:])
}

func upsertPosting(r RawPosting) (bool, error) {
    var src models.JobSource
    if err := database.DB.Where("name = ?", r.SourceName).FirstOrCreate(&src, models.JobSource{Name: r.SourceName, Type: "remote", BaseURL: ""}).Error; err != nil {
        return false, err
    }
    var existing models.JobPosting
    h := hashPosting(r)
    if err := database.DB.Where("hash = ?", h).First(&existing).Error; err == nil {
        return false, nil
    }
    p := models.JobPosting{
        SourceID: src.ID,
        ExternalID: r.ExternalID,
        Company: r.Company,
        Title: r.Title,
        URL: r.URL,
        Location: r.Location,
        EmploymentType: r.EmploymentType,
        DescriptionText: r.DescriptionHTML,
        DatePosted: r.DatePosted,
        Hash: h,
        FetchedAt: time.Now().UTC(),
    }
    if err := database.DB.Create(&p).Error; err != nil { return false, err }
    return true, nil
}

func RunOnce(ctx context.Context) (Status, error) {
    cfg := config.Load()
    st := Status{ StartedAt: time.Now().UTC() }
    ps, err := providersFromConfig()
    if err != nil { st.Errors = append(st.Errors, err.Error()); return st, err }
    st.Sources = len(ps)
    for _, p := range ps {
        raws, err := p.FetchOpenings(ctx)
        if err != nil { st.Errors = append(st.Errors, p.Name()+": "+err.Error()); continue }
        st.PostingsFetched += len(raws)
        for _, r := range raws {
            ok, err := upsertPosting(r)
            if err != nil { st.Errors = append(st.Errors, err.Error()); continue }
            if ok { st.PostingsUpserted++ } else { st.Deduped++ }
        }
    }
    st.FinishedAt = time.Now().UTC()
    _ = cfg // reserved for future (robots/rate limit)
    return st, nil
}

func ConfiguredSources() []SourceConfig {
    cfgs, _ := loadSourceConfigs()
    return cfgs
}


