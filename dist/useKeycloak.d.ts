import Keycloak, { KeycloakInitOptions } from 'keycloak-js';
import React from 'react';
interface IKeycloakProvider {
    keycloakConfig: Keycloak.KeycloakConfig;
    initOptions: KeycloakInitOptions;
    children: React.ReactNode;
}
export declare const KeycloakProvider: React.FunctionComponent<IKeycloakProvider>;
export declare function useKeycloak(): {
    keycloak: Keycloak | undefined;
    authenticated: boolean;
};
export {};
