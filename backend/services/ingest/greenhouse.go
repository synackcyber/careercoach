package ingest

import (
    "context"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "time"
)

type greenhouseProvider struct{ name, base string }

func (g greenhouseProvider) Name() string { return g.name }

func (g greenhouseProvider) FetchOpenings(ctx context.Context) ([]RawPosting, error) {
    req, _ := http.NewRequestWithContext(ctx, http.MethodGet, g.base, nil)
    req.Header.Set("User-Agent", "RealtimeResumeBot/1.0")
    resp, err := http.DefaultClient.Do(req)
    if err != nil { return nil, err }
    defer resp.Body.Close()
    if resp.StatusCode >= 300 { b, _ := io.ReadAll(resp.Body); return nil, fmt.Errorf("greenhouse: %s", string(b)) }
    var data struct{ Jobs []struct{
        ID int `json:"id"`
        Title string `json:"title"`
        UpdatedAt string `json:"updated_at"`
        AbsoluteURL string `json:"absolute_url"`
        Location struct{ Name string `json:"name"` } `json:"location"`
    } `json:"jobs"` }
    if err := json.NewDecoder(resp.Body).Decode(&data); err != nil { return nil, err }
    var out []RawPosting
    for _, j := range data.Jobs {
        var dp *time.Time
        if t, err := time.Parse(time.RFC3339, j.UpdatedAt); err == nil { dp = &t }
        out = append(out, RawPosting{
            SourceName: g.name,
            ExternalID: fmt.Sprint(j.ID),
            Company: g.name,
            Title: j.Title,
            URL: j.AbsoluteURL,
            Location: j.Location.Name,
            DatePosted: dp,
        })
    }
    return out, nil
}

func newGreenhouseProvider(name, baseURL string) JobSourceProvider { return greenhouseProvider{name: name, base: baseURL} }


