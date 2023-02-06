# Keycloak login for React

This package use [keycloak-js](https://github.com/keycloak/keycloak).

It lets you login against a keycloak instance from an React.

## Install

```
npm install react-keycloak-js
```

## How to use

```js

import { KeycloakProvider } from 'react-keycloak-js';

const configKeycloak = {
    url: process.env.REACT_APP_AUTH_APP,
    realm: process.env.REACT_APP_PUBLIC_REALM,
    clientId: process.env.REACT_APP_CLIENT_ID
};

const App = () => (
 <KeycloakProvider keycloakConfig={configKeycloak} initOptions={{ onLoad: 'login-required' }}>
        <AppRoute />
  </KeycloakProvider>
);

# You can use hook useKeycloak()

const { authenticated, keycloak } = useKeycloak();

```

## Contributing

Feel free to open issues and pull requests. Help from the community is always welcome.

## License

MIT

---

If you found this project to be helpful, please consider buying me a coffee.

[![buy me a coffee](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/lcanavesio)
