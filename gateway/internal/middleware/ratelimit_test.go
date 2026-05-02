package middleware

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestIPRateLimiter_Disabled(t *testing.T) {
	t.Parallel()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// rps=0 disables the limiter. Middleware must be a pass-through.
	l := NewIPRateLimiter(ctx, 0, 0, time.Minute, time.Minute)
	called := 0
	h := l.Middleware()(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		called++
		w.WriteHeader(http.StatusOK)
	}))

	for i := 0; i < 5; i++ {
		rec := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		req.RemoteAddr = "10.0.0.1:1234"
		h.ServeHTTP(rec, req)
		if rec.Code != http.StatusOK {
			t.Fatalf("iter %d: status = %d, want 200", i, rec.Code)
		}
	}
	if called != 5 {
		t.Errorf("handler called %d times, want 5", called)
	}
}

func TestIPRateLimiter_LimitsByIP(t *testing.T) {
	t.Parallel()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Burst=2, RPS=1: first two requests pass, third within the same second
	// is rejected.
	l := NewIPRateLimiter(ctx, 1, 2, time.Minute, 0)
	h := l.Middleware()(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	statuses := make([]int, 0, 3)
	for i := 0; i < 3; i++ {
		rec := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		req.RemoteAddr = "10.0.0.2:1234"
		h.ServeHTTP(rec, req)
		statuses = append(statuses, rec.Code)
	}

	if statuses[0] != http.StatusOK || statuses[1] != http.StatusOK {
		t.Errorf("first two statuses = %v, want both 200", statuses[:2])
	}
	if statuses[2] != http.StatusTooManyRequests {
		t.Errorf("third status = %d, want %d", statuses[2], http.StatusTooManyRequests)
	}
}

func TestIPRateLimiter_DifferentIPsIndependent(t *testing.T) {
	t.Parallel()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	l := NewIPRateLimiter(ctx, 1, 1, time.Minute, 0)
	h := l.Middleware()(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	for _, ip := range []string{"10.0.0.10:1", "10.0.0.11:1", "10.0.0.12:1"} {
		rec := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		req.RemoteAddr = ip
		h.ServeHTTP(rec, req)
		if rec.Code != http.StatusOK {
			t.Errorf("ip %s: status = %d, want 200", ip, rec.Code)
		}
	}
}

func TestIPRateLimiter_RejectionIncludesRetryAfter(t *testing.T) {
	t.Parallel()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	l := NewIPRateLimiter(ctx, 1, 1, time.Minute, 0)
	h := l.Middleware()(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	for i := 0; i < 2; i++ {
		rec := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		req.RemoteAddr = "10.0.0.20:1"
		h.ServeHTTP(rec, req)
		if i == 1 {
			if rec.Code != http.StatusTooManyRequests {
				t.Fatalf("status = %d, want %d", rec.Code, http.StatusTooManyRequests)
			}
			if rec.Header().Get("Retry-After") == "" {
				t.Error("missing Retry-After header on 429")
			}
		}
	}
}

func TestIPRateLimiter_JanitorPurgesStaleVisitors(t *testing.T) {
	t.Parallel()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// TTL=1ms, sweep=2ms: a visitor should disappear quickly after a request.
	l := NewIPRateLimiter(ctx, 5, 5, time.Millisecond, 2*time.Millisecond)
	h := l.Middleware()(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.RemoteAddr = "10.0.0.30:1"
	h.ServeHTTP(rec, req)

	deadline := time.Now().Add(200 * time.Millisecond)
	for time.Now().Before(deadline) {
		l.mu.Lock()
		n := len(l.visitors)
		l.mu.Unlock()
		if n == 0 {
			return
		}
		time.Sleep(2 * time.Millisecond)
	}
	t.Error("janitor did not purge stale visitor within deadline")
}
