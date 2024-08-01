"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useKeycloak = exports.KeycloakProvider = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const keycloak_js_1 = __importDefault(require("keycloak-js"));
const react_1 = require("react");
const KeycloakContext = (0, react_1.createContext)({
    keycloak: undefined,
    authenticated: false,
    loading: true
});
const KeycloakProvider = (props) => {
    const { keycloakConfig, initOptions } = props;
    const didLogRef = (0, react_1.useRef)(false);
    const [keycloak, setKeycloak] = (0, react_1.useState)();
    const [authenticated, setAuthenticated] = (0, react_1.useState)(false);
    const [loading, setLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        if (didLogRef.current === false) {
            didLogRef.current = true;
            const keycloakInstance = new keycloak_js_1.default(keycloakConfig);
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
    const valor = (0, react_1.useMemo)(() => ({
        keycloak,
        authenticated,
        loading
    }), [keycloak, authenticated, loading]);
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
