// Package logging builds the structured logger used across the gateway.
package logging

import (
	"log/slog"
	"os"
	"strings"
)

// New returns a JSON slog.Logger at the given level, tagged with the
// environment label. Unknown levels fall back to info so a typo never
// silences logs entirely.
func New(level, env string) *slog.Logger {
	handler := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: parseLevel(level),
	})
	return slog.New(handler).With(
		"service", "gateway",
		"env", env,
	)
}

func parseLevel(level string) slog.Level {
	switch strings.ToLower(strings.TrimSpace(level)) {
	case "debug":
		return slog.LevelDebug
	case "warn", "warning":
		return slog.LevelWarn
	case "error":
		return slog.LevelError
	default:
		return slog.LevelInfo
	}
}
