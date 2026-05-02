package middleware

import (
	"net/http"
)

// Auth is a placeholder boundary middleware. It does NOT verify any token in
// this phase. It marks the location where real JWT/JWKS validation, claim
// extraction, and header injection (`X-User-Id`, `X-User-Login`,
// `X-User-Groups`) will be wired in a future phase.
//
// Until then, it is a no-op pass-through so downstream handlers can be
// exercised. Public routes will eventually be allowlisted explicitly.
//
// Per CLAUDE.md and `.claude/rules/gateway-go.md`, no real auth is
// implemented in this skeleton.
func Auth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		next.ServeHTTP(w, r)
	})
}
