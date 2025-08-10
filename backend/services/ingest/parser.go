package ingest

import (
    "bytes"
    "encoding/json"
    "regexp"
    "strings"
    "unicode"
    "golang.org/x/net/html"
)

// htmlToText converts HTML to plain text by traversing nodes
func htmlToText(h string) string {
    if strings.TrimSpace(h) == "" { return "" }
    node, err := html.Parse(strings.NewReader(h))
    if err != nil { return strings.TrimSpace(stripTags(h)) }
    var buf bytes.Buffer
    var f func(*html.Node)
    f = func(n *html.Node) {
        if n.Type == html.TextNode {
            buf.WriteString(n.Data)
            buf.WriteByte(' ')
        }
        for c := n.FirstChild; c != nil; c = c.NextSibling { f(c) }
    }
    f(node)
    return strings.Join(strings.Fields(buf.String()), " ")
}

// stripTags fallback
func stripTags(s string) string {
    out := make([]rune, 0, len(s))
    in := false
    for _, r := range s {
        if r == '<' { in = true; continue }
        if r == '>' { in = false; continue }
        if !in { out = append(out, r) }
    }
    return string(out)
}

// extractLIs returns bullet list items found in HTML
func extractLIs(h string) []string {
    if strings.TrimSpace(h) == "" { return nil }
    node, err := html.Parse(strings.NewReader(h))
    if err != nil { return nil }
    var items []string
    var f func(*html.Node)
    f = func(n *html.Node) {
        if n.Type == html.ElementNode && n.Data == "li" {
            items = append(items, strings.Join(strings.Fields(textContent(n)), " "))
        }
        for c := n.FirstChild; c != nil; c = c.NextSibling { f(c) }
    }
    f(node)
    return items
}

func textContent(n *html.Node) string {
    var buf bytes.Buffer
    var f func(*html.Node)
    f = func(nd *html.Node) {
        if nd.Type == html.TextNode { buf.WriteString(nd.Data); buf.WriteByte(' ') }
        for c := nd.FirstChild; c != nil; c = c.NextSibling { f(c) }
    }
    f(n)
    return buf.String()
}

var yearsRe = regexp.MustCompile(`(?i)(\b(\d{1,2})\+?\s*(?:\-\s*(\d{1,2})\s*)?years?\s+of\s+experience\b)`)

func extractYearsExperience(s string) (minPtr *int, maxPtr *int) {
    m := yearsRe.FindStringSubmatch(s)
    if len(m) >= 3 {
        min := atoi(m[2])
        var max *int
        if len(m) >= 4 && m[3] != "" { v := atoi(m[3]); max = &v }
        return &min, max
    }
    return nil, nil
}

func atoi(s string) int {
    n := 0
    for _, r := range s {
        if unicode.IsDigit(r) { n = n*10 + int(r-'0') }
    }
    return n
}

// ExtractPostingFields parses HTML to produce plain text, bullets and years exp
func ExtractPostingFields(htmlStr string) (descText string, bulletsJSON string, yearsMin *int, yearsMax *int) {
    if htmlStr == "" { return "", "[]", nil, nil }
    txt := htmlToText(htmlStr)
    lis := extractLIs(htmlStr)
    b, _ := json.Marshal(lis)
    min, max := extractYearsExperience(txt)
    return txt, string(b), min, max
}


