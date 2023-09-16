import Keycloak, { KeycloakInitOptions } from 'keycloak-js';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

const KeycloakContext = createContext<{
    keycloak: Keycloak | undefined;
    authenticated: boolean;
}>(undefined as any);

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

    useEffect(() => {
        //NOTE React18 problem with ReactStrictMode
        if (didLogRef.current === false) {
            didLogRef.current = true;
            const keycloak = new Keycloak(keycloakConfig);
            keycloak.init(initOptions).then((authenticated) => {
                setKeycloak(keycloak);
                setAuthenticated(authenticated);
            });
        }
    }, [keycloakConfig, keycloak, initOptions, setAuthenticated, setKeycloak]);

    const valor = useMemo(
        () => ({
            keycloak,
            authenticated
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
