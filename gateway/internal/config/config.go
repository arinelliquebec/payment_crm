// Package config loads the gateway runtime configuration from environment
// variables. Configuration is intentionally minimal at this phase: only what
// the skeleton needs to start, log, and expose health endpoints.
package config

import (
	"fmt"
	"strconv"
	"strings"
	"time"
)

// Getenv mirrors os.Getenv. Accepting it as a parameter makes Load testable
// without touching the process environment.
type Getenv func(string) string

// Config holds runtime configuration. New fields should be optional with
// safe defaults; required fields must fail fast in Load.
type Config struct {
	ListenAddr      string
	Env             string
	LogLevel        string
	BackendURL      string
	AllowedOrigins  []string
	ReadTimeout     time.Duration
	WriteTimeout    time.Duration
	IdleTimeout     time.Duration
	ShutdownTimeout time.Duration

	// RateLimitRPS is the steady-state request-per-second budget per client
	// IP. Non-positive disables rate limiting.
	RateLimitRPS float64
	// RateLimitBurst is the bucket size: how many requests a client may fire
	// instantly before being throttled to RateLimitRPS. Non-positive disables
	// rate limiting.
	RateLimitBurst int
	// RateLimitTTL bounds how long an idle visitor's bucket is kept in
	// memory. The janitor sweeps stale entries.
	RateLimitTTL time.Duration
}

const (
	defaultListenAddr      = ":8080"
	defaultEnv             = "development"
	defaultLogLevel        = "info"
	defaultReadTimeout     = 10 * time.Second
	defaultWriteTimeout    = 15 * time.Second
	defaultIdleTimeout     = 60 * time.Second
	defaultShutdownTimeout = 15 * time.Second
	defaultRateLimitTTL    = 10 * time.Minute
)

// Load reads the configuration via the provided lookup function. Returns an
// error if any explicitly set value is malformed. Missing values fall back to
// safe defaults so the skeleton can boot with zero env configuration.
func Load(getenv Getenv) (*Config, error) {
	cfg := &Config{
		ListenAddr:      stringOr(getenv("LISTEN_ADDR"), defaultListenAddr),
		Env:             stringOr(getenv("ENV"), defaultEnv),
		LogLevel:        strings.ToLower(stringOr(getenv("LOG_LEVEL"), defaultLogLevel)),
		BackendURL:      strings.TrimRight(getenv("BACKEND_URL"), "/"),
		AllowedOrigins:  splitCSV(getenv("ALLOWED_ORIGINS")),
		ReadTimeout:     defaultReadTimeout,
		WriteTimeout:    defaultWriteTimeout,
		IdleTimeout:     defaultIdleTimeout,
		ShutdownTimeout: defaultShutdownTimeout,
	}

	var err error
	if cfg.ReadTimeout, err = secondsOr(getenv("READ_TIMEOUT_SECONDS"), defaultReadTimeout); err != nil {
		return nil, fmt.Errorf("READ_TIMEOUT_SECONDS: %w", err)
	}
	if cfg.WriteTimeout, err = secondsOr(getenv("WRITE_TIMEOUT_SECONDS"), defaultWriteTimeout); err != nil {
		return nil, fmt.Errorf("WRITE_TIMEOUT_SECONDS: %w", err)
	}
	if cfg.IdleTimeout, err = secondsOr(getenv("IDLE_TIMEOUT_SECONDS"), defaultIdleTimeout); err != nil {
		return nil, fmt.Errorf("IDLE_TIMEOUT_SECONDS: %w", err)
	}
	if cfg.ShutdownTimeout, err = secondsOr(getenv("SHUTDOWN_TIMEOUT_SECONDS"), defaultShutdownTimeout); err != nil {
		return nil, fmt.Errorf("SHUTDOWN_TIMEOUT_SECONDS: %w", err)
	}
	if cfg.RateLimitRPS, err = floatOr(getenv("RATE_LIMIT_RPS"), 0); err != nil {
		return nil, fmt.Errorf("RATE_LIMIT_RPS: %w", err)
	}
	if cfg.RateLimitBurst, err = intOr(getenv("RATE_LIMIT_BURST"), 0); err != nil {
		return nil, fmt.Errorf("RATE_LIMIT_BURST: %w", err)
	}
	if cfg.RateLimitTTL, err = secondsOr(getenv("RATE_LIMIT_TTL_SECONDS"), defaultRateLimitTTL); err != nil {
		return nil, fmt.Errorf("RATE_LIMIT_TTL_SECONDS: %w", err)
	}

	return cfg, nil
}

func floatOr(value string, fallback float64) (float64, error) {
	value = strings.TrimSpace(value)
	if value == "" {
		return fallback, nil
	}
	n, err := strconv.ParseFloat(value, 64)
	if err != nil || n < 0 {
		return 0, fmt.Errorf("invalid non-negative float: %q", value)
	}
	return n, nil
}

func intOr(value string, fallback int) (int, error) {
	value = strings.TrimSpace(value)
	if value == "" {
		return fallback, nil
	}
	n, err := strconv.Atoi(value)
	if err != nil || n < 0 {
		return 0, fmt.Errorf("invalid non-negative integer: %q", value)
	}
	return n, nil
}

func stringOr(value, fallback string) string {
	if v := strings.TrimSpace(value); v != "" {
		return v
	}
	return fallback
}

func splitCSV(value string) []string {
	if value == "" {
		return nil
	}
	parts := strings.Split(value, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if p = strings.TrimSpace(p); p != "" {
			out = append(out, p)
		}
	}
	return out
}

func secondsOr(value string, fallback time.Duration) (time.Duration, error) {
	value = strings.TrimSpace(value)
	if value == "" {
		return fallback, nil
	}
	n, err := strconv.Atoi(value)
	if err != nil || n < 0 {
		return 0, fmt.Errorf("invalid non-negative integer: %q", value)
	}
	return time.Duration(n) * time.Second, nil
}
