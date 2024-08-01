"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useKeycloak = exports.KeycloakProvider = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const keycloak_js_1 = __importDefault(require("keycloak-js"));
const react_1 = require("react");
const reducer = (state, action) => {
    switch (action.type) {
        case 'SET_KEYCLOAK':
            return Object.assign(Object.assign({}, state), { keycloak: action.payload });
        case 'SET_AUTHENTICATED':
            return Object.assign(Object.assign({}, state), { authenticated: action.payload });
        case 'SET_LOADING':
            return Object.assign(Object.assign({}, state), { loading: action.payload });
        default:
            return state;
    }
};
const initialContextValue = {
    keycloak: undefined,
    authenticated: false,
    loading: true
};
const KeycloakContext = (0, react_1.createContext)(initialContextValue);
const KeycloakProvider = (props) => {
    const { keycloakConfig, initOptions, children } = props;
    const didLogRef = (0, react_1.useRef)(false);
    const [state, dispatch] = (0, react_1.useReducer)(reducer, initialContextValue);
    const initializeKeycloak = (0, react_1.useCallback)(() => {
        const keycloakInstance = new keycloak_js_1.default(keycloakConfig);
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
    (0, react_1.useEffect)(() => {
        if (!didLogRef.current) {
            didLogRef.current = true;
            initializeKeycloak();
        }
    }, [initializeKeycloak]);
    const contextValue = (0, react_1.useMemo)(() => state, [state]);
    return (0, jsx_runtime_1.jsx)(KeycloakContext.Provider, { value: contextValue, children: children });
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
