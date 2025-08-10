package ingest

import (
    "context"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
)

type leverProvider struct{ name, base string }

func (l leverProvider) Name() string { return l.name }

func (l leverProvider) FetchOpenings(ctx context.Context) ([]RawPosting, error) {
    req, _ := http.NewRequestWithContext(ctx, http.MethodGet, l.base, nil)
    req.Header.Set("User-Agent", "RealtimeResumeBot/1.0")
    resp, err := http.DefaultClient.Do(req)
    if err != nil { return nil, err }
    defer resp.Body.Close()
    if resp.StatusCode >= 300 { b, _ := io.ReadAll(resp.Body); return nil, fmt.Errorf("lever: %s", string(b)) }
    var data []struct{
        ID string `json:"id"`
        Text string `json:"text"`
        Title string `json:"title"`
        HostedURL string `json:"hostedUrl"`
        Categories struct { Location string `json:"location"` } `json:"categories"`
    }
    if err := json.NewDecoder(resp.Body).Decode(&data); err != nil { return nil, err }
    out := make([]RawPosting, 0, len(data))
    for _, j := range data {
        out = append(out, RawPosting{
            SourceName: l.name,
            ExternalID: j.ID,
            Company: l.name,
            Title: j.Title,
            URL: j.HostedURL,
            Location: j.Categories.Location,
            DescriptionHTML: j.Text,
        })
    }
    return out, nil
}

func newLeverProvider(name, baseURL string) JobSourceProvider { return leverProvider{name: name, base: baseURL} }


