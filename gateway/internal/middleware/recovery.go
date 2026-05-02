package middleware

import (
	"log/slog"
	"net/http"
	"runtime/debug"
)

// Recovery converts panics into a 500 response and logs the stack trace plus
// correlation ID. Without it, a panicking handler would close the connection
// abruptly and bypass the access log.
func Recovery(logger *slog.Logger) Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			defer func() {
				if rec := recover(); rec != nil {
					logger.LogAttrs(r.Context(), slog.LevelError, "panic recovered",
						slog.Any("panic", rec),
						slog.String("path", r.URL.Path),
						slog.String("method", r.Method),
						slog.String("request_id", RequestID(r.Context())),
						slog.String("stack", string(debug.Stack())),
					)
					if !headerWritten(w) {
						http.Error(w, `{"error":"internal server error"}`, http.StatusInternalServerError)
					}
				}
			}()
			next.ServeHTTP(w, r)
		})
	}
}

// headerWritten is best-effort: net/http does not expose whether the header
// was written, so we rely on a sentinel response writer when present. For
// the standard ResponseWriter we conservatively return false so the handler
// always tries to write a 500 body, which is the safer default for a
// skeleton.
func headerWritten(w http.ResponseWriter) bool {
	if hw, ok := w.(interface{ WroteHeader() bool }); ok {
		return hw.WroteHeader()
	}
	return false
}
