# Keycloak Login for React

This package uses [keycloak-js](https://github.com/keycloak/keycloak) to provide seamless Keycloak authentication integration for React applications with advanced token management features.

It lets you login against a Keycloak instance from React with real-time token status monitoring, automatic refresh capabilities, and comprehensive error handling.

## Install

```bash
npm install react-keycloak-js
```

## Compatibility

- **Keycloak**: 22.0.3 - 26.x
- **React**: 16.8+
- **TypeScript**: Full support included

## Quick Start

```jsx
import { KeycloakProvider, useKeycloak } from 'react-keycloak-js';

const configKeycloak = {
    url: process.env.REACT_APP_AUTH_APP,
    realm: process.env.REACT_APP_PUBLIC_REALM,
    clientId: process.env.REACT_APP_CLIENT_ID
};

const App = () => (
    <KeycloakProvider
        keycloakConfig={configKeycloak}
        initOptions={{ onLoad: 'login-required' }}
    >
        <AppRoute />
    </KeycloakProvider>
);

// In your components
function MyComponent() {
    const { keycloak, authenticated, loading, error } = useKeycloak();

    if (loading) return <div>Loading...</div>;
    if (!authenticated) return <div>Please login</div>;

    return <div>Welcome, {keycloak.tokenParsed?.preferred_username}!</div>;
}
```

## Advanced Features

### 🔐 Token Status Monitoring

Monitor your token status in real-time:

```jsx
import { useKeycloakTokenStatus } from 'react-keycloak-js';

function TokenStatusComponent() {
    const {
        tokenStatus,
        tokenExpiresIn,
        isTokenValid,
        isTokenExpired,
        needsRefresh
    } = useKeycloakTokenStatus();

    return (
        <div>
            Status: {tokenStatus}
            {tokenExpiresIn && `Expires in: ${tokenExpiresIn}s`}
        </div>
    );
}
```

### 🚫 Network Protection

Block network operations when tokens expire:

```jsx
function App() {
    const [networkBlocked, setNetworkBlocked] = useState(false);

    return (
        <KeycloakProvider
            keycloakConfig={configKeycloak}
            initOptions={{ onLoad: 'login-required' }}
            autoRefreshToken={false} // Manual control
            onTokenExpired={(keycloak) => {
                console.warn('Token expired!');
                setNetworkBlocked(true);
            }}
            onTokenRefreshFailed={(keycloak) => {
                console.error('Token refresh failed!');
                setNetworkBlocked(true);
            }}
        >
            <MyApp networkBlocked={networkBlocked} />
        </KeycloakProvider>
    );
}
```

### ⚡ Quick Actions

Use common Keycloak actions easily:

```jsx
import { useKeycloakActions } from 'react-keycloak-js';

function LoginComponent() {
    const { login, logout, register, updateToken } = useKeycloakActions();

    return (
        <div>
            <button onClick={() => login()}>Login</button>
            <button onClick={() => logout()}>Logout</button>
            <button onClick={() => register()}>Register</button>
            <button onClick={() => updateToken(30)}>Refresh Token</button>
        </div>
    );
}
```

## API Reference

### KeycloakProvider Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `keycloakConfig` | `Keycloak.KeycloakConfig` | required | Keycloak configuration object |
| `initOptions` | `KeycloakInitOptions` | `{}` | Keycloak initialization options |
| `children` | `React.ReactNode` | required | Child components |
| `onError` | `(error: string) => void` | optional | Error callback |
| `onTokenExpired` | `(keycloak: Keycloak) => void` | optional | Token expiration callback |
| `onTokenRefreshFailed` | `(keycloak: Keycloak) => void` | optional | Token refresh failure callback |
| `tokenCheckInterval` | `number` | `30` | Token check interval in seconds |
| `autoRefreshToken` | `boolean` | `true` | Enable automatic token refresh |

### useKeycloak() Hook

Returns the main Keycloak state:

```typescript
const {
    keycloak,        // Keycloak instance
    authenticated,   // boolean
    loading,         // boolean
    error,          // string | undefined
    tokenStatus,    // 'valid' | 'expired' | 'refresh-required' | 'refresh-failed' | 'unknown'
    tokenExpiresIn  // number | undefined (seconds)
} = useKeycloak();
```

### useKeycloakTokenStatus() Hook

Returns token-specific state and utilities:

```typescript
const {
    tokenStatus,        // Current token status
    tokenExpiresIn,     // Seconds until expiration
    isTokenValid,       // boolean
    isTokenExpired,     // boolean
    needsRefresh,       // boolean
    refreshFailed,      // boolean
    forceTokenRefresh   // (minValidity?: number) => Promise<boolean>
} = useKeycloakTokenStatus();
```

### useKeycloakActions() Hook

Returns common Keycloak actions:

```typescript
const {
    login,              // (options?) => Promise<void>
    logout,             // (options?) => Promise<void>
    register,           // (options?) => Promise<void>
    updateToken,        // (minValidity?) => Promise<boolean>
    accountManagement   // () => Promise<void>
} = useKeycloakActions();
```

## Complete Example

```jsx
import React, { useState, useEffect } from 'react';
import {
    KeycloakProvider,
    useKeycloak,
    useKeycloakTokenStatus,
    useKeycloakActions
} from 'react-keycloak-js';

const keycloakConfig = {
    url: 'https://your-keycloak-server.com',
    realm: 'your-realm',
    clientId: 'your-client-id'
};

function App() {
    const [networkBlocked, setNetworkBlocked] = useState(false);

    return (
        <KeycloakProvider
            keycloakConfig={keycloakConfig}
            initOptions={{ onLoad: 'login-required' }}
            tokenCheckInterval={15}
            onTokenExpired={() => setNetworkBlocked(true)}
            onTokenRefreshFailed={() => setNetworkBlocked(true)}
        >
            <MainApp networkBlocked={networkBlocked} setNetworkBlocked={setNetworkBlocked} />
        </KeycloakProvider>
    );
}

function MainApp({ networkBlocked, setNetworkBlocked }) {
    const { authenticated, loading, error } = useKeycloak();
    const { tokenStatus, isTokenExpired, forceTokenRefresh } = useKeycloakTokenStatus();
    const { logout } = useKeycloakActions();

    useEffect(() => {
        if (tokenStatus === 'valid') {
            setNetworkBlocked(false);
        }
    }, [tokenStatus, setNetworkBlocked]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!authenticated) return <div>Not authenticated</div>;

    return (
        <div>
            <TokenStatusIndicator />
            {networkBlocked && (
                <TokenExpiredModal
                    onRefresh={async () => {
                        const refreshed = await forceTokenRefresh();
                        if (refreshed) setNetworkBlocked(false);
                    }}
                    onLogout={logout}
                />
            )}
            <YourAppContent />
        </div>
    );
}

function TokenStatusIndicator() {
    const { tokenStatus, tokenExpiresIn } = useKeycloakTokenStatus();

    const statusColor = {
        'valid': 'green',
        'refresh-required': 'orange',
        'expired': 'red',
        'refresh-failed': 'red'
    }[tokenStatus] || 'gray';

    return (
        <div style={{ color: statusColor }}>
            Token: {tokenStatus}
            {tokenExpiresIn && ` (${tokenExpiresIn}s)`}
        </div>
    );
}

export default App;
```

## Migration from v1.0.x

If upgrading from a previous version:

1. The basic API remains the same
2. New optional props are available for advanced features
3. New hooks are available but optional
4. Token status monitoring is automatic but can be configured

## Contributing

Feel free to open issues and pull requests. Help from the community is always welcome.

## License

MIT

---

If you found this project to be helpful, please consider buying me a coffee.

[![buy me a coffee](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/lcanavesio)
