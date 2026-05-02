// Package middleware contains the cross-cutting HTTP middlewares used by the
// gateway: correlation IDs, structured logging, panic recovery, CORS, and an
// auth boundary placeholder.
package middleware

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"net/http"
)

type ctxKey int

const requestIDKey ctxKey = iota

// RequestIDHeader is the canonical header used to propagate correlation IDs
// across services. Both inbound and outbound proxies should preserve it.
const RequestIDHeader = "X-Request-ID"

// Middleware is the standard net/http middleware shape.
type Middleware func(http.Handler) http.Handler

// Chain composes middlewares so the first argument runs first on the request
// path. Equivalent to a -> b -> c -> handler.
func Chain(mws ...Middleware) Middleware {
	return func(h http.Handler) http.Handler {
		for i := len(mws) - 1; i >= 0; i-- {
			h = mws[i](h)
		}
		return h
	}
}

// Correlation reads or generates a request ID, stores it on the request
// context, and echoes it on the response so clients and downstream services
// can correlate logs.
func Correlation(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id := r.Header.Get(RequestIDHeader)
		if id == "" {
			id = newID()
		}
		w.Header().Set(RequestIDHeader, id)
		ctx := context.WithValue(r.Context(), requestIDKey, id)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// RequestID returns the correlation ID stored on ctx, or "" if none is set.
func RequestID(ctx context.Context) string {
	if v, ok := ctx.Value(requestIDKey).(string); ok {
		return v
	}
	return ""
}

func newID() string {
	b := make([]byte, 8)
	if _, err := rand.Read(b); err != nil {
		// Extremely unlikely with crypto/rand; fall back to a fixed marker so
		// observability still works.
		return "req-fallback"
	}
	return hex.EncodeToString(b)
}
