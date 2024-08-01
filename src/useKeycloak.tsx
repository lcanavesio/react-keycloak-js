import Keycloak, { KeycloakInitOptions } from 'keycloak-js';
import React, { createContext, useContext, useEffect, useMemo, useRef, useReducer, useCallback } from 'react';

type State = {
    keycloak: Keycloak | undefined;
    authenticated: boolean;
    loading: boolean;
};

type Action =
    | { type: 'SET_KEYCLOAK'; payload: Keycloak }
    | { type: 'SET_AUTHENTICATED'; payload: boolean }
    | { type: 'SET_LOADING'; payload: boolean };

const reducer = (state: State, action: Action): State => {
    switch (action.type) {
        case 'SET_KEYCLOAK':
            return { ...state, keycloak: action.payload };
        case 'SET_AUTHENTICATED':
            return { ...state, authenticated: action.payload };
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        default:
            return state;
    }
};

const initialContextValue = {
    keycloak: undefined,
    authenticated: false,
    loading: true
};

const KeycloakContext = createContext<State>(initialContextValue);

interface IKeycloakProvider {
    keycloakConfig: Keycloak.KeycloakConfig;
    initOptions: KeycloakInitOptions;
    children: React.ReactNode;
}

export const KeycloakProvider: React.FunctionComponent<IKeycloakProvider> = (props: IKeycloakProvider) => {
    const { keycloakConfig, initOptions, children } = props;
    const didLogRef = useRef(false);
    const [state, dispatch] = useReducer(reducer, initialContextValue);

    const initializeKeycloak = useCallback(() => {
        const keycloakInstance = new Keycloak(keycloakConfig);
        keycloakInstance
            .init(initOptions)
            .then((authenticated) => {
                dispatch({ type: 'SET_KEYCLOAK', payload: keycloakInstance });
                dispatch({ type: 'SET_AUTHENTICATED', payload: authenticated });
            })
            .catch((error) => {
                console.error('Failed to initialize Keycloak:', error);
            })
            .finally(() => {
                dispatch({ type: 'SET_LOADING', payload: false });
            });
    }, [keycloakConfig, initOptions]);

    useEffect(() => {
        if (!didLogRef.current) {
            didLogRef.current = true;
            initializeKeycloak();
        }
    }, [initializeKeycloak]);

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
