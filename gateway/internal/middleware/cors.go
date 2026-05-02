package middleware

import (
	"net/http"
	"strings"
)

// CORS returns an env-driven CORS middleware. An empty allowlist is a no-op:
// no headers are added and OPTIONS requests fall through to the next handler.
//
// The allowlist is matched exactly (scheme + host + port). Wildcards are not
// supported on purpose: the gateway is the credentialed boundary and a
// permissive `*` is incompatible with cookie-bearing requests.
func CORS(allowedOrigins []string) Middleware {
	allowed := make(map[string]struct{}, len(allowedOrigins))
	for _, o := range allowedOrigins {
		allowed[o] = struct{}{}
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if len(allowed) == 0 {
				next.ServeHTTP(w, r)
				return
			}

			origin := r.Header.Get("Origin")
			if _, ok := allowed[origin]; ok {
				h := w.Header()
				h.Set("Access-Control-Allow-Origin", origin)
				h.Set("Vary", "Origin")
				h.Set("Access-Control-Allow-Credentials", "true")
				h.Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
				h.Set("Access-Control-Allow-Headers", allowHeadersFrom(r))
				h.Set("Access-Control-Max-Age", "600")
			}

			if r.Method == http.MethodOptions && origin != "" {
				w.WriteHeader(http.StatusNoContent)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// allowHeadersFrom echoes the requested preflight headers when present, with
// a sane default. Echoing avoids a hardcoded list drifting from real client
// usage; the default is used when no preflight header is sent.
func allowHeadersFrom(r *http.Request) string {
	if v := r.Header.Get("Access-Control-Request-Headers"); strings.TrimSpace(v) != "" {
		return v
	}
	return "Authorization, Content-Type, X-Request-ID"
}
