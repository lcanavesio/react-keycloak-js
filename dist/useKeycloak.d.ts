import Keycloak, { KeycloakInitOptions } from 'keycloak-js';
import React from 'react';
type State = {
    keycloak: Keycloak | undefined;
    authenticated: boolean;
    loading: boolean;
};
interface IKeycloakProvider {
    keycloakConfig: Keycloak.KeycloakConfig;
    initOptions: KeycloakInitOptions;
    children: React.ReactNode;
}
export declare const KeycloakProvider: React.FunctionComponent<IKeycloakProvider>;
export declare function useKeycloak(): State;
export {};
