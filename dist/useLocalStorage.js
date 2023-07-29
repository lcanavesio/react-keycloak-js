"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
function useLocalStorage(key, initialValue) {
    const [storedValue, setStoredValue] = (0, react_1.useState)(() => {
        try {
            const item = window === null || window === void 0 ? void 0 : window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        }
        catch (error) {
            return initialValue;
        }
    });
    const setValue = (value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window === null || window === void 0 ? void 0 : window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
        catch (error) {
            throw new Error(error);
        }
    };
    return [storedValue, setValue];
}
exports.default = useLocalStorage;
