import Keycloak, { KeycloakInitOptions } from 'keycloak-js';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

const KeycloakContext = createContext<{
    keycloak: Keycloak | undefined;
    authenticated: boolean;
    loading: boolean;
}>({
    keycloak: undefined,
    authenticated: false,
    loading: true
});

interface IKeycloakProvider {
    keycloakConfig: Keycloak.KeycloakConfig;
    initOptions: KeycloakInitOptions;
    children: React.ReactNode;
}

export const KeycloakProvider: React.FunctionComponent<IKeycloakProvider> = (props: IKeycloakProvider) => {
    const { keycloakConfig, initOptions } = props;
    const didLogRef = useRef(false);
    const [keycloak, setKeycloak] = useState<Keycloak>();
    const [authenticated, setAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (didLogRef.current === false) {
            didLogRef.current = true;
            const keycloakInstance = new Keycloak(keycloakConfig);
            keycloakInstance
                .init(initOptions)
                .then((authenticated) => {
                    setKeycloak(keycloakInstance);
                    setAuthenticated(authenticated);
                })
                .catch((error) => {
                    console.error('Failed to initialize Keycloak:', error);
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, []);

    const valor = useMemo(
        () => ({
            keycloak,
            authenticated,
            loading
        }),
        [keycloak, authenticated, loading]
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
