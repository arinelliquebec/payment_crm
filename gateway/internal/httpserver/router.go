// Package httpserver wires the HTTP router and middleware chain.
//
// Handlers stay thin per `.claude/rules/gateway-go.md`. Anything resembling
// business logic must live downstream in the .NET backend.
package httpserver

import (
	"context"
	"log/slog"
	"net/http"
	"time"

	"github.com/payment-crm/gateway/internal/config"
	"github.com/payment-crm/gateway/internal/middleware"
	"github.com/payment-crm/gateway/internal/proxy"
)

// New builds the root http.Handler. It registers the health endpoints, the
// proxy boundary, and applies the middleware chain in a deliberate order:
//
// Global chain (all routes):
//
//	correlation -> logging -> recovery -> cors
//
// Per /api/* boundary (after the global chain):
//
//	rate limit -> auth -> proxy
//
// Rationale:
//   - Correlation runs first so the request ID is available to every other
//     layer, including health probes for k8s-style log correlation.
//   - Logging wraps recovery so panics are still observed in the access log.
//   - CORS sits inside the global chain so preflight responses are also
//     correlated and logged.
//   - Rate limiting sits before auth so attackers cannot burn auth cycles
//     during a flood, but only on /api/* — health/readiness probes must not
//     be throttled because k8s-style orchestrators may poll aggressively.
//   - Auth is the last layer before the proxy boundary; today it is a
//     no-op placeholder.
//
// The provided ctx scopes long-lived helpers (rate limit janitor) to the
// gateway's lifetime; canceling it during shutdown lets goroutines exit.
func New(ctx context.Context, cfg *config.Config, logger *slog.Logger) http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /healthz", Healthz)
	mux.HandleFunc("GET /readyz", Readyz)

	limiter := middleware.NewIPRateLimiter(
		ctx,
		cfg.RateLimitRPS,
		cfg.RateLimitBurst,
		cfg.RateLimitTTL,
		rateLimitSweep(cfg.RateLimitTTL),
	)
	apiChain := middleware.Chain(
		limiter.Middleware(),
		middleware.Auth,
	)
	mux.Handle("/api/", apiChain(proxy.New(cfg.BackendURL, logger)))

	chain := middleware.Chain(
		middleware.Correlation,
		middleware.Logging(logger),
		middleware.Recovery(logger),
		middleware.CORS(cfg.AllowedOrigins),
	)
	return chain(mux)
}

// rateLimitSweep keeps the janitor cadence proportional to the visitor TTL,
// with a sane floor so we never sweep too aggressively in tests or when TTL
// is misconfigured to a tiny value.
func rateLimitSweep(ttl time.Duration) time.Duration {
	if ttl <= 0 {
		return 0
	}
	if sweep := ttl / 2; sweep > time.Second {
		return sweep
	}
	return time.Second
}
