import Keycloak, { KeycloakInitOptions, KeycloakTokenParsed } from 'keycloak-js';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import useLocalStorage from './useLocalStorage';

const KeycloakContext = createContext<{
    keycloak: Keycloak | undefined;
    authenticated: boolean;
    error: string | null;
    isTokenExpired: (idTokenParsed: any) => boolean;
}>(undefined as any);

interface IKeycloakProvider {
    keycloakConfig: Keycloak.KeycloakConfig;
    initOptions: KeycloakInitOptions;
    children: React.ReactNode;
}

async function initializeKeycloak(keycloakConfig: Keycloak.KeycloakConfig, initOptions: KeycloakInitOptions) {
    const keycloak = new Keycloak(keycloakConfig);
    let authenticated = false;
    let errorObj = null; // Cambiar el nombre de la variable de captura de error

    try {
        authenticated = await keycloak.init(initOptions);
    } catch (err) {
        console.error('Error al inicializar Keycloak:', err);
        errorObj = 'Error al inicializar API KEYCLOAK - Por favor intente nuevamente más tarde';
    }

    return { keycloak, authenticated, errorObj };
}

const isTokenExpired = (idTokenParsed: KeycloakTokenParsed) => {
    if (!idTokenParsed || !idTokenParsed.exp) {
        // Si no se proporciona el objeto idTokenParsed o la propiedad exp, consideramos que el token está expirado.
        return true;
    }

    const expirationTime = idTokenParsed.exp;
    const currentTime = Math.floor(Date.now() / 1000);

    return expirationTime < currentTime;
};

export const KeycloakProvider: React.FunctionComponent<IKeycloakProvider> = (props: IKeycloakProvider) => {
    const { keycloakConfig, initOptions } = props;
    const didLogRef = useRef(false);
    const [authenticated, setAuthenticated] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [keycloak, setKeycloak] = useLocalStorage<Keycloak>('keycloak', undefined as any);

    useEffect(() => {
        if (didLogRef.current === false) {
            didLogRef.current = true;
            if (keycloak && keycloak.authenticated) {
                const tokenExpired = isTokenExpired(keycloak.tokenParsed ? keycloak.tokenParsed : {});
                setAuthenticated(keycloak.authenticated && !tokenExpired);
            } else {
                initializeKeycloak(keycloakConfig, initOptions).then(({ keycloak, authenticated, errorObj }) => {
                    setError(errorObj);
                    setKeycloak(keycloak);
                    setAuthenticated(authenticated);
                });
            }
        }
    }, [keycloakConfig, initOptions, error]);

    const valor = useMemo(
        () => ({
            keycloak,
            authenticated,
            error,
            isTokenExpired
        }),
        [keycloak, authenticated]
    );

    return <KeycloakContext.Provider value={valor} {...props} />;
};

export function useKeycloak() {
    const context = useContext(KeycloakContext);

    if (!context) {
        throw new Error('useKeycloak must be used within a KeycloakProvider');
    }
    return context;
}
