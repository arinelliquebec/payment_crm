package config

import (
	"testing"
	"time"
)

func TestLoad_DefaultsWhenEmpty(t *testing.T) {
	t.Parallel()

	cfg, err := Load(func(string) string { return "" })
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if cfg.ListenAddr != defaultListenAddr {
		t.Errorf("ListenAddr = %q, want %q", cfg.ListenAddr, defaultListenAddr)
	}
	if cfg.Env != defaultEnv {
		t.Errorf("Env = %q, want %q", cfg.Env, defaultEnv)
	}
	if cfg.LogLevel != defaultLogLevel {
		t.Errorf("LogLevel = %q, want %q", cfg.LogLevel, defaultLogLevel)
	}
	if cfg.BackendURL != "" {
		t.Errorf("BackendURL = %q, want empty", cfg.BackendURL)
	}
	if len(cfg.AllowedOrigins) != 0 {
		t.Errorf("AllowedOrigins = %v, want empty", cfg.AllowedOrigins)
	}
	if cfg.ReadTimeout != defaultReadTimeout {
		t.Errorf("ReadTimeout = %v, want %v", cfg.ReadTimeout, defaultReadTimeout)
	}
}

func TestLoad_ParsesValues(t *testing.T) {
	t.Parallel()

	env := map[string]string{
		"LISTEN_ADDR":              ":9000",
		"ENV":                      "staging",
		"LOG_LEVEL":                "DEBUG",
		"BACKEND_URL":              "http://backend:5101/",
		"ALLOWED_ORIGINS":          "http://a, http://b ,",
		"READ_TIMEOUT_SECONDS":     "5",
		"WRITE_TIMEOUT_SECONDS":    "20",
		"IDLE_TIMEOUT_SECONDS":     "30",
		"SHUTDOWN_TIMEOUT_SECONDS": "7",
		"RATE_LIMIT_RPS":           "12.5",
		"RATE_LIMIT_BURST":         "30",
		"RATE_LIMIT_TTL_SECONDS":   "120",
	}
	cfg, err := Load(func(k string) string { return env[k] })
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if cfg.LogLevel != "debug" {
		t.Errorf("LogLevel not lowercased: %q", cfg.LogLevel)
	}
	if cfg.BackendURL != "http://backend:5101" {
		t.Errorf("BackendURL trailing slash not trimmed: %q", cfg.BackendURL)
	}
	if got, want := cfg.AllowedOrigins, []string{"http://a", "http://b"}; !equal(got, want) {
		t.Errorf("AllowedOrigins = %v, want %v", got, want)
	}
	if cfg.ReadTimeout != 5*time.Second {
		t.Errorf("ReadTimeout = %v, want 5s", cfg.ReadTimeout)
	}
	if cfg.ShutdownTimeout != 7*time.Second {
		t.Errorf("ShutdownTimeout = %v, want 7s", cfg.ShutdownTimeout)
	}
	if cfg.RateLimitRPS != 12.5 {
		t.Errorf("RateLimitRPS = %v, want 12.5", cfg.RateLimitRPS)
	}
	if cfg.RateLimitBurst != 30 {
		t.Errorf("RateLimitBurst = %v, want 30", cfg.RateLimitBurst)
	}
	if cfg.RateLimitTTL != 120*time.Second {
		t.Errorf("RateLimitTTL = %v, want 120s", cfg.RateLimitTTL)
	}
}

func TestLoad_RateLimitDefaultsDisabled(t *testing.T) {
	t.Parallel()

	cfg, err := Load(func(string) string { return "" })
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if cfg.RateLimitRPS != 0 {
		t.Errorf("default RateLimitRPS = %v, want 0", cfg.RateLimitRPS)
	}
	if cfg.RateLimitBurst != 0 {
		t.Errorf("default RateLimitBurst = %v, want 0", cfg.RateLimitBurst)
	}
	if cfg.RateLimitTTL != defaultRateLimitTTL {
		t.Errorf("default RateLimitTTL = %v, want %v", cfg.RateLimitTTL, defaultRateLimitTTL)
	}
}

func TestLoad_RejectsInvalidTimeout(t *testing.T) {
	t.Parallel()

	env := map[string]string{"READ_TIMEOUT_SECONDS": "not-a-number"}
	if _, err := Load(func(k string) string { return env[k] }); err == nil {
		t.Fatal("expected error for invalid timeout, got nil")
	}
}

func equal(a, b []string) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}
