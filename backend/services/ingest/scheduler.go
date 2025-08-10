package ingest

import (
    "context"
    "log"
    "goaltracker/config"
    cron "github.com/robfig/cron/v3"
)

var c *cron.Cron

func StartScheduler() {
    cfg := config.Load()
    if !cfg.IngestEnabled { return }

    if c != nil { return }
    c = cron.New(cron.WithParser(cron.NewParser(cron.Minute | cron.Hour | cron.Dom | cron.Month | cron.Dow)))
    _, err := c.AddFunc(cfg.IngestCron, func() {
        st, err := RunOnce(context.Background())
        if err != nil { log.Printf("ingest run error: %v", err) }
        log.Printf("ingest run: fetched=%d upserted=%d deduped=%d", st.PostingsFetched, st.PostingsUpserted, st.Deduped)
    })
    if err != nil { log.Printf("cron add error: %v", err); return }
    c.Start()
}


