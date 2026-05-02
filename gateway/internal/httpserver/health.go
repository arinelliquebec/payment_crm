package httpserver

import (
	"encoding/json"
	"net/http"
)

// Healthz is a liveness probe. It only signals that the process is up and
// the HTTP server is accepting connections. It must never depend on any
// downstream system.
func Healthz(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

// Readyz is a readiness probe. In this skeleton it mirrors Healthz; once the
// gateway gains real dependencies (JWKS fetch, upstream reachability, etc.)
// each one should be added here as a non-blocking check.
func Readyz(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{
		"status": "ready",
		"checks": map[string]string{},
	})
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}
