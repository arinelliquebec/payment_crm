package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCorrelation_GeneratesIDWhenMissing(t *testing.T) {
	t.Parallel()

	var seen string
	h := Correlation(http.HandlerFunc(func(_ http.ResponseWriter, r *http.Request) {
		seen = RequestID(r.Context())
	}))

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	h.ServeHTTP(rec, req)

	if seen == "" {
		t.Fatal("expected generated request ID, got empty")
	}
	if got := rec.Header().Get(RequestIDHeader); got != seen {
		t.Errorf("response header = %q, want %q", got, seen)
	}
}

func TestCorrelation_PreservesIncomingID(t *testing.T) {
	t.Parallel()

	const incoming = "abc-123"
	var seen string
	h := Correlation(http.HandlerFunc(func(_ http.ResponseWriter, r *http.Request) {
		seen = RequestID(r.Context())
	}))

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set(RequestIDHeader, incoming)
	h.ServeHTTP(rec, req)

	if seen != incoming {
		t.Errorf("RequestID(ctx) = %q, want %q", seen, incoming)
	}
	if got := rec.Header().Get(RequestIDHeader); got != incoming {
		t.Errorf("response header = %q, want %q", got, incoming)
	}
}
