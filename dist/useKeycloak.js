"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useKeycloak = exports.KeycloakProvider = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const keycloak_js_1 = __importDefault(require("keycloak-js"));
const react_1 = require("react");
const useLocalStorage_1 = __importDefault(require("./useLocalStorage"));
const KeycloakContext = (0, react_1.createContext)(undefined);
function initializeKeycloak(keycloakConfig, initOptions) {
    return __awaiter(this, void 0, void 0, function* () {
        const keycloak = new keycloak_js_1.default(keycloakConfig);
        let authenticated = false;
        let errorObj = null;
        try {
            authenticated = yield keycloak.init(initOptions);
        }
        catch (err) {
            console.error('Error al inicializar Keycloak:', err);
            errorObj = 'Error al inicializar API KEYCLOAK - Por favor intente nuevamente más tarde';
        }
        return { keycloak, authenticated, errorObj };
    });
}
const isTokenExpired = (idTokenParsed) => {
    if (!idTokenParsed || !idTokenParsed.exp) {
        return true;
    }
    const expirationTime = idTokenParsed.exp;
    const currentTime = Math.floor(Date.now() / 1000);
    return expirationTime < currentTime;
};
const KeycloakProvider = (props) => {
    const { keycloakConfig, initOptions } = props;
    const didLogRef = (0, react_1.useRef)(false);
    const [authenticated, setAuthenticated] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const [keycloak, setKeycloak] = (0, useLocalStorage_1.default)('keycloak', undefined);
    (0, react_1.useEffect)(() => {
        if (didLogRef.current === false) {
            didLogRef.current = true;
            if (keycloak && keycloak.authenticated) {
                const tokenExpired = isTokenExpired(keycloak.tokenParsed ? keycloak.tokenParsed : {});
                setAuthenticated(keycloak.authenticated && !tokenExpired);
            }
            else {
                initializeKeycloak(keycloakConfig, initOptions).then(({ keycloak, authenticated, errorObj }) => {
                    setError(errorObj);
                    setKeycloak(keycloak);
                    setAuthenticated(authenticated);
                });
            }
        }
    }, [keycloakConfig, initOptions, error]);
    const valor = (0, react_1.useMemo)(() => ({
        keycloak,
        authenticated,
        error,
        isTokenExpired
    }), [keycloak, authenticated]);
    return (0, jsx_runtime_1.jsx)(KeycloakContext.Provider, Object.assign({ value: valor }, props));
};
exports.KeycloakProvider = KeycloakProvider;
function useKeycloak() {
    const context = (0, react_1.useContext)(KeycloakContext);
    if (!context) {
        throw new Error('useKeycloak must be used within a KeycloakProvider');
    }
    return context;
}
exports.useKeycloak = useKeycloak;
