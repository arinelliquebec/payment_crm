// Command gateway is the thin Go API Gateway for the payment_crm project.
//
// It wires configuration, the middleware chain, the placeholder proxy layer,
// and the health endpoints. It is intentionally dependency-free at this
// phase: routing uses the standard library mux, observability uses log/slog,
// and the upstream proxy is a stub.
package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/payment-crm/gateway/internal/config"
	"github.com/payment-crm/gateway/internal/httpserver"
	"github.com/payment-crm/gateway/internal/logging"
)

func main() {
	if code := run(); code != 0 {
		os.Exit(code)
	}
}

func run() int {
	cfg, err := config.Load(os.Getenv)
	if err != nil {
		bootstrapLogger().Error("config load failed", "err", err)
		return 1
	}

	logger := logging.New(cfg.LogLevel, cfg.Env)
	slog.SetDefault(logger)

	appCtx, cancelApp := context.WithCancel(context.Background())
	defer cancelApp()

	handler := httpserver.New(appCtx, cfg, logger)

	srv := &http.Server{
		Addr:              cfg.ListenAddr,
		Handler:           handler,
		ReadTimeout:       cfg.ReadTimeout,
		ReadHeaderTimeout: cfg.ReadTimeout,
		WriteTimeout:      cfg.WriteTimeout,
		IdleTimeout:       cfg.IdleTimeout,
	}

	serverErr := make(chan error, 1)
	go func() {
		logger.Info("gateway listening",
			"addr", cfg.ListenAddr,
			"backend_url", cfg.BackendURL,
		)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			serverErr <- err
			return
		}
		serverErr <- nil
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)

	select {
	case sig := <-stop:
		logger.Info("shutdown signal received", "signal", sig.String())
	case err := <-serverErr:
		if err != nil {
			logger.Error("server error", "err", err)
			return 1
		}
		return 0
	}

	shutdownCtx, cancelShutdown := context.WithTimeout(context.Background(), cfg.ShutdownTimeout)
	defer cancelShutdown()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		logger.Error("graceful shutdown failed", "err", err)
		return 1
	}
	cancelApp()
	logger.Info("gateway stopped")
	return 0
}

// bootstrapLogger is used only before configuration is parsed, so we cannot
// rely on the user-selected log level yet.
func bootstrapLogger() *slog.Logger {
	return slog.New(slog.NewJSONHandler(os.Stderr, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	})).With("phase", "bootstrap", "ts", time.Now().UTC().Format(time.RFC3339))
}
