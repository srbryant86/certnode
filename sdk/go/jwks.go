package certnode

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sync"
	"time"
)

// JWKSManager manages JWKS fetching and caching.
type JWKSManager struct {
	ttl     time.Duration
	client  *http.Client
	mu      sync.RWMutex
	cache   *JWKS
	cached  time.Time
	fetcher func(url string) (*JWKS, error)
}

// JWKSManagerOptions configures the JWKSManager.
type JWKSManagerOptions struct {
	TTL     time.Duration
	Client  *http.Client
	Fetcher func(url string) (*JWKS, error)
}

// NewJWKSManager creates a new JWKS manager with caching.
func NewJWKSManager(opts *JWKSManagerOptions) *JWKSManager {
	if opts == nil {
		opts = &JWKSManagerOptions{}
	}

	ttl := opts.TTL
	if ttl == 0 {
		ttl = 5 * time.Minute // Default 5 minute cache
	}

	client := opts.Client
	if client == nil {
		client = &http.Client{
			Timeout: 30 * time.Second,
		}
	}

	manager := &JWKSManager{
		ttl:    ttl,
		client: client,
	}

	if opts.Fetcher != nil {
		manager.fetcher = opts.Fetcher
	} else {
		manager.fetcher = manager.defaultFetcher
	}

	return manager
}

// FetchFromURL fetches JWKS from URL with caching.
func (m *JWKSManager) FetchFromURL(url string) (*JWKS, error) {
	// Check cache first
	m.mu.RLock()
	if m.cache != nil && time.Since(m.cached) < m.ttl {
		jwks := m.cache
		m.mu.RUnlock()
		return jwks, nil
	}
	m.mu.RUnlock()

	// Fetch fresh JWKS
	jwks, err := m.fetcher(url)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch JWKS from %s: %w", url, err)
	}

	// Validate JWKS
	if err := m.ValidateJWKS(jwks); err != nil {
		return nil, fmt.Errorf("invalid JWKS from %s: %w", url, err)
	}

	// Update cache
	m.mu.Lock()
	m.cache = jwks
	m.cached = time.Now()
	m.mu.Unlock()

	return jwks, nil
}

// SetFromObject sets JWKS from object with validation.
func (m *JWKSManager) SetFromObject(jwks *JWKS) error {
	if err := m.ValidateJWKS(jwks); err != nil {
		return err
	}

	m.mu.Lock()
	m.cache = jwks
	m.cached = time.Now()
	m.mu.Unlock()

	return nil
}

// GetFresh returns cached JWKS if still fresh.
func (m *JWKSManager) GetFresh() *JWKS {
	m.mu.RLock()
	defer m.mu.RUnlock()

	if m.cache != nil && time.Since(m.cached) < m.ttl {
		return m.cache
	}

	return nil
}

// Thumbprints returns thumbprints of all keys in JWKS.
func (m *JWKSManager) Thumbprints(jwks *JWKS) ([]string, error) {
	if jwks == nil {
		m.mu.RLock()
		jwks = m.cache
		m.mu.RUnlock()
	}

	if jwks == nil {
		return nil, fmt.Errorf("no JWKS available")
	}

	var thumbprints []string
	for i := range jwks.Keys {
		thumbprint, err := JWKThumbprint(&jwks.Keys[i])
		if err != nil {
			// Skip keys that can't generate thumbprints
			continue
		}
		thumbprints = append(thumbprints, thumbprint)
	}

	return thumbprints, nil
}

// ValidateJWKS validates a JWKS structure.
func (m *JWKSManager) ValidateJWKS(jwks *JWKS) error {
	if jwks == nil {
		return fmt.Errorf("JWKS is nil")
	}

	if len(jwks.Keys) == 0 {
		return fmt.Errorf("JWKS contains no keys")
	}

	// Validate each key
	for i, key := range jwks.Keys {
		if err := m.ValidateJWK(&key); err != nil {
			return fmt.Errorf("key %d: %w", i, err)
		}
	}

	return nil
}

// ValidateJWK validates a single JWK.
func (m *JWKSManager) ValidateJWK(jwk *JWK) error {
	if jwk.Kty == "" {
		return fmt.Errorf("missing kty field")
	}

	switch jwk.Kty {
	case "EC":
		if jwk.Crv != "P-256" {
			return fmt.Errorf("only P-256 curve supported for EC keys, got %s", jwk.Crv)
		}
		if jwk.X == "" || jwk.Y == "" {
			return fmt.Errorf("EC key missing x or y coordinate")
		}
	case "OKP":
		if jwk.Crv != "Ed25519" {
			return fmt.Errorf("only Ed25519 curve supported for OKP keys, got %s", jwk.Crv)
		}
		if jwk.X == "" {
			return fmt.Errorf("OKP key missing x coordinate")
		}
	default:
		return fmt.Errorf("unsupported key type: %s. Use 'EC' or 'OKP'", jwk.Kty)
	}

	return nil
}

// defaultFetcher is the default JWKS fetcher using HTTP.
func (m *JWKSManager) defaultFetcher(url string) (*JWKS, error) {
	resp, err := m.client.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("HTTP %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	var jwks JWKS
	if err := json.Unmarshal(body, &jwks); err != nil {
		return nil, fmt.Errorf("failed to parse JWKS JSON: %w", err)
	}

	return &jwks, nil
}

// FetchJWKS is a simple JWKS fetch function without caching.
func FetchJWKS(url string) (*JWKS, error) {
	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	resp, err := client.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch JWKS: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("HTTP %d from %s", resp.StatusCode, url)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var jwks JWKS
	if err := json.Unmarshal(body, &jwks); err != nil {
		return nil, fmt.Errorf("failed to parse JWKS: %w", err)
	}

	// Basic validation
	if len(jwks.Keys) == 0 {
		return nil, fmt.Errorf("JWKS contains no keys")
	}

	return &jwks, nil
}