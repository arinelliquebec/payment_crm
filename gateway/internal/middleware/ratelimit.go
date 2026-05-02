package middleware

import (
	"context"
	"encoding/json"
	"math"
	"net"
	"net/http"
	"strconv"
	"sync"
	"time"

	"golang.org/x/time/rate"
)

// IPRateLimiter applies a token-bucket rate limit per client IP.
//
// It is intentionally minimal:
//   - per-IP buckets, reset by token refill
//   - no distributed coordination (single-instance only)
//   - opportunistic cleanup of idle visitors via a janitor goroutine bound to
//     the parent context, so the limiter does not leak memory across long
//     gateway lifetimes.
//
// In production behind a reverse proxy, the calling middleware should be
// preceded by a trusted-proxy step that rewrites RemoteAddr from the
// X-Forwarded-For chain. The skeleton uses RemoteAddr only and documents
// the gap.
type IPRateLimiter struct {
	rps   rate.Limit
	burst int
	ttl   time.Duration

	mu       sync.Mutex
	visitors map[string]*visitor
}

type visitor struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

// NewIPRateLimiter constructs a limiter and starts a janitor goroutine that
// purges idle visitors every sweep interval. The janitor stops when ctx is
// canceled. When rps or burst is non-positive, the limiter is disabled and
// no goroutine is started; the returned value is safe to use and Middleware
// returns a pass-through.
func NewIPRateLimiter(ctx context.Context, rps float64, burst int, ttl, sweep time.Duration) *IPRateLimiter {
	l := &IPRateLimiter{
		rps:      rate.Limit(rps),
		burst:    burst,
		ttl:      ttl,
		visitors: make(map[string]*visitor),
	}
	if !l.enabled() || sweep <= 0 {
		return l
	}
	go l.janitor(ctx, sweep)
	return l
}

func (l *IPRateLimiter) enabled() bool {
	return l != nil && l.burst > 0 && l.rps > 0 && !math.IsInf(float64(l.rps), 0)
}

// Middleware returns the http middleware. When the limiter is disabled it
// returns the identity middleware, so callers can wire it unconditionally.
func (l *IPRateLimiter) Middleware() Middleware {
	if !l.enabled() {
		return func(next http.Handler) http.Handler { return next }
	}
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip := clientIP(r)
			lim := l.get(ip)
			if !lim.Allow() {
				retryAfter := time.Duration(float64(time.Second) / float64(l.rps))
				if retryAfter < time.Second {
					retryAfter = time.Second
				}
				w.Header().Set("Retry-After", strconv.Itoa(int(retryAfter.Seconds())))
				w.Header().Set("Content-Type", "application/json; charset=utf-8")
				w.WriteHeader(http.StatusTooManyRequests)
				_ = json.NewEncoder(w).Encode(map[string]string{
					"error": "rate limit exceeded",
				})
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func (l *IPRateLimiter) get(ip string) *rate.Limiter {
	l.mu.Lock()
	defer l.mu.Unlock()
	v, ok := l.visitors[ip]
	if !ok {
		v = &visitor{limiter: rate.NewLimiter(l.rps, l.burst)}
		l.visitors[ip] = v
	}
	v.lastSeen = time.Now()
	return v.limiter
}

func (l *IPRateLimiter) janitor(ctx context.Context, sweep time.Duration) {
	t := time.NewTicker(sweep)
	defer t.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case now := <-t.C:
			l.sweep(now)
		}
	}
}

func (l *IPRateLimiter) sweep(now time.Time) {
	l.mu.Lock()
	defer l.mu.Unlock()
	for ip, v := range l.visitors {
		if now.Sub(v.lastSeen) > l.ttl {
			delete(l.visitors, ip)
		}
	}
}

// clientIP returns the bare host portion of RemoteAddr. SplitHostPort fails
// for addresses without a port (rare, but happens in tests via httptest);
// in that case the raw RemoteAddr is used as the bucket key.
func clientIP(r *http.Request) string {
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}
