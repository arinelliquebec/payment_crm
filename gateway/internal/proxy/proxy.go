// Package proxy is the upstream client / reverse proxy boundary.
//
// Phase 1 skeleton: returns 501 Not Implemented for any /api/* request. The
// real implementation will use httputil.ReverseProxy with hop-by-hop header
// stripping, header injection from validated JWT claims, and timeouts /
// circuit breaking. It must remain free of business logic and database
// access per `.claude/rules/gateway-go.md`.
package proxy

import (
	"encoding/json"
	"log/slog"
	"net/http"
)

// New returns the placeholder proxy handler. The backend URL is captured for
// diagnostics in the response so misconfiguration is visible during local
// development without leaking it into production logs.
func New(backendURL string, logger *slog.Logger) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		logger.LogAttrs(r.Context(), slog.LevelDebug, "proxy placeholder hit",
			slog.String("path", r.URL.Path),
			slog.String("method", r.Method),
			slog.Bool("backend_configured", backendURL != ""),
		)
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusNotImplemented)
		_ = json.NewEncoder(w).Encode(map[string]string{
			"error":  "proxy not yet implemented",
			"path":   r.URL.Path,
			"method": r.Method,
		})
	})
}
