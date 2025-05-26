import Keycloak, { KeycloakInitOptions } from 'keycloak-js';
import React, { createContext, useContext, useEffect, useMemo, useRef, useReducer, useCallback } from 'react';

type TokenStatus = 'valid' | 'expired' | 'refresh-required' | 'refresh-failed' | 'unknown';

type State = {
    keycloak: Keycloak | undefined;
    authenticated: boolean;
    loading: boolean;
    error?: string;
    tokenStatus: TokenStatus;
    tokenExpiresIn?: number; // seconds until expiration
};

type Action =
    | { type: 'SET_KEYCLOAK'; payload: Keycloak }
    | { type: 'SET_AUTHENTICATED'; payload: boolean }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string }
    | { type: 'CLEAR_ERROR' }
    | { type: 'SET_TOKEN_STATUS'; payload: { status: TokenStatus; expiresIn?: number } };

const reducer = (state: State, action: Action): State => {
    switch (action.type) {
        case 'SET_KEYCLOAK':
            return { ...state, keycloak: action.payload, error: undefined };
        case 'SET_AUTHENTICATED':
            return { ...state, authenticated: action.payload };
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload, loading: false };
        case 'CLEAR_ERROR':
            return { ...state, error: undefined };
        case 'SET_TOKEN_STATUS':
            return {
                ...state,
                tokenStatus: action.payload.status,
                tokenExpiresIn: action.payload.expiresIn
            };
        default:
            return state;
    }
};

const initialContextValue: State = {
    keycloak: undefined,
    authenticated: false,
    loading: true,
    error: undefined,
    tokenStatus: 'unknown',
    tokenExpiresIn: undefined
};

const KeycloakContext = createContext<State>(initialContextValue);

interface IKeycloakProvider {
    keycloakConfig: Keycloak.KeycloakConfig;
    initOptions?: KeycloakInitOptions;
    children: React.ReactNode;
    onError?: (error: string) => void;
    onTokenExpired?: (keycloak: Keycloak) => void;
    onTokenRefreshFailed?: (keycloak: Keycloak) => void;
    tokenCheckInterval?: number; // seconds, default 30
    autoRefreshToken?: boolean; // default true
}


export const KeycloakProvider: React.FunctionComponent<IKeycloakProvider> = (props: IKeycloakProvider) => {
    const {
        keycloakConfig,
        initOptions = {},
        children,
        onError,
        onTokenExpired,
        onTokenRefreshFailed,
        tokenCheckInterval = 30,
        autoRefreshToken = true
    } = props;
    const didLogRef = useRef(false);
    const tokenCheckIntervalRef = useRef<NodeJS.Timeout>();
    const [state, dispatch] = useReducer(reducer, initialContextValue);

    // Función para calcular tiempo hasta expiración
    const getTokenExpirationTime = useCallback((keycloak: Keycloak): number | undefined => {
        if (!keycloak.tokenParsed?.exp) return undefined;
        const now = Math.floor(Date.now() / 1000);
        const expiresIn = keycloak.tokenParsed.exp - now;
        return expiresIn > 0 ? expiresIn : 0;
    }, []);

    // Función para verificar el estado del token
    const checkTokenStatus = useCallback((keycloak: Keycloak) => {
        if (!keycloak.token) {
            dispatch({ type: 'SET_TOKEN_STATUS', payload: { status: 'unknown' } });
            return;
        }

        const expiresIn = getTokenExpirationTime(keycloak);

        if (expiresIn === undefined) {
            dispatch({ type: 'SET_TOKEN_STATUS', payload: { status: 'unknown' } });
            return;
        }

        if (expiresIn <= 0) {
            dispatch({ type: 'SET_TOKEN_STATUS', payload: { status: 'expired', expiresIn: 0 } });
            onTokenExpired?.(keycloak);
        } else if (expiresIn <= 30) { // Token expira en menos de 30 segundos
            dispatch({ type: 'SET_TOKEN_STATUS', payload: { status: 'refresh-required', expiresIn } });
        } else {
            dispatch({ type: 'SET_TOKEN_STATUS', payload: { status: 'valid', expiresIn } });
        }
    }, [getTokenExpirationTime, onTokenExpired]);

    // Configurar interval para verificar token
    const setupTokenCheck = useCallback((keycloak: Keycloak) => {
        // Limpiar interval anterior si existe
        if (tokenCheckIntervalRef.current) {
            clearInterval(tokenCheckIntervalRef.current);
        }

        // Verificar inmediatamente
        checkTokenStatus(keycloak);

        // Configurar verificación periódica
        tokenCheckIntervalRef.current = setInterval(() => {
            checkTokenStatus(keycloak);
        }, tokenCheckInterval * 1000);
    }, [checkTokenStatus, tokenCheckInterval]);

    const initializeKeycloak = useCallback(() => {
        try {
            const keycloakInstance = new Keycloak(keycloakConfig);

            // Configurar event listeners para manejar cambios de estado
            keycloakInstance.onAuthSuccess = () => {
                dispatch({ type: 'SET_AUTHENTICATED', payload: true });
                setupTokenCheck(keycloakInstance);
            };

            keycloakInstance.onAuthError = () => {
                dispatch({ type: 'SET_AUTHENTICATED', payload: false });
                dispatch({ type: 'SET_TOKEN_STATUS', payload: { status: 'unknown' } });
                const errorMsg = 'Authentication failed';
                dispatch({ type: 'SET_ERROR', payload: errorMsg });
                onError?.(errorMsg);
            };

            keycloakInstance.onAuthLogout = () => {
                dispatch({ type: 'SET_AUTHENTICATED', payload: false });
                dispatch({ type: 'SET_TOKEN_STATUS', payload: { status: 'unknown' } });
                if (tokenCheckIntervalRef.current) {
                    clearInterval(tokenCheckIntervalRef.current);
                }
            };

            keycloakInstance.onTokenExpired = () => {
                dispatch({ type: 'SET_TOKEN_STATUS', payload: { status: 'expired', expiresIn: 0 } });
                onTokenExpired?.(keycloakInstance);

                if (autoRefreshToken) {
                    // Intentar refrescar el token automáticamente
                    keycloakInstance.updateToken(30)
                        .then((refreshed) => {
                            if (refreshed) {
                                dispatch({ type: 'SET_TOKEN_STATUS', payload: { status: 'valid' } });
                                setupTokenCheck(keycloakInstance);
                            } else {
                                const expiresIn = getTokenExpirationTime(keycloakInstance);
                                const status = expiresIn && expiresIn > 30 ? 'valid' : 'refresh-required';
                                dispatch({ type: 'SET_TOKEN_STATUS', payload: { status, expiresIn } });
                            }
                        })
                        .catch(() => {
                            dispatch({ type: 'SET_TOKEN_STATUS', payload: { status: 'refresh-failed' } });
                            onTokenRefreshFailed?.(keycloakInstance);
                        });
                }
            };

            keycloakInstance
                .init(initOptions)
                .then((authenticated) => {
                    dispatch({ type: 'SET_KEYCLOAK', payload: keycloakInstance });
                    dispatch({ type: 'SET_AUTHENTICATED', payload: authenticated });
                    if (authenticated) {
                        setupTokenCheck(keycloakInstance);
                    }
                })
                .catch((error) => {
                    const errorMsg = `Failed to initialize Keycloak: ${error.message || error}`;
                    console.error(errorMsg, error);
                    dispatch({ type: 'SET_ERROR', payload: errorMsg });
                    onError?.(errorMsg);
                })
                .finally(() => {
                    dispatch({ type: 'SET_LOADING', payload: false });
                });
        } catch (error) {
            const errorMsg = `Failed to create Keycloak instance: ${error instanceof Error ? error.message : error}`;
            console.error(errorMsg, error);
            dispatch({ type: 'SET_ERROR', payload: errorMsg });
            dispatch({ type: 'SET_LOADING', payload: false });
            onError?.(errorMsg);
        }
    }, [keycloakConfig, initOptions, onError, onTokenExpired, onTokenRefreshFailed, autoRefreshToken, setupTokenCheck, getTokenExpirationTime]);

    useEffect(() => {
        if (!didLogRef.current) {
            didLogRef.current = true;
            initializeKeycloak();
        }
    }, [initializeKeycloak]);

    // Cleanup function para remover event listeners y intervals
    useEffect(() => {
        return () => {
            if (tokenCheckIntervalRef.current) {
                clearInterval(tokenCheckIntervalRef.current);
            }
            if (state.keycloak) {
                state.keycloak.onAuthSuccess = undefined;
                state.keycloak.onAuthError = undefined;
                state.keycloak.onAuthLogout = undefined;
                state.keycloak.onTokenExpired = undefined;
            }
        };
    }, [state.keycloak]);

    const contextValue = useMemo(() => state, [state]);

    return <KeycloakContext.Provider value={contextValue}>{children}</KeycloakContext.Provider>;
};

export function useKeycloak() {
    const context = useContext(KeycloakContext);

    if (!context) {
        throw new Error('useKeycloak must be used within a KeycloakProvider');
    }
    return context;
}

// Hook adicional para acciones comunes
export function useKeycloakActions() {
    const { keycloak } = useKeycloak();

    const login = useCallback((options?: Keycloak.KeycloakLoginOptions) => {
        return keycloak?.login(options);
    }, [keycloak]);

    const logout = useCallback((options?: Keycloak.KeycloakLogoutOptions) => {
        return keycloak?.logout(options);
    }, [keycloak]);

    const register = useCallback((options?: Keycloak.KeycloakRegisterOptions) => {
        return keycloak?.register(options);
    }, [keycloak]);

    const updateToken = useCallback((minValidity: number = 30) => {
        return keycloak?.updateToken(minValidity);
    }, [keycloak]);

    const accountManagement = useCallback(() => {
        return keycloak?.accountManagement();
    }, [keycloak]);

    return {
        login,
        logout,
        register,
        updateToken,
        accountManagement
    };
}

// Hook específico para el manejo de tokens
export function useKeycloakTokenStatus() {
    const { tokenStatus, tokenExpiresIn, keycloak } = useKeycloak();

    const isTokenValid = tokenStatus === 'valid';
    const isTokenExpired = tokenStatus === 'expired';
    const needsRefresh = tokenStatus === 'refresh-required';
    const refreshFailed = tokenStatus === 'refresh-failed';

    const forceTokenRefresh = useCallback(async (minValidity = 30) => {
        if (!keycloak) return false;
        try {
            return await keycloak.updateToken(minValidity);
        } catch (error) {
            console.error('Token refresh failed:', error);
            return false;
        }
    }, [keycloak]);

    return {
        tokenStatus,
        tokenExpiresIn,
        isTokenValid,
        isTokenExpired,
        needsRefresh,
        refreshFailed,
        forceTokenRefresh
    };
}
