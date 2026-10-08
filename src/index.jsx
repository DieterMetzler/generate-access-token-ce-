import React from 'react';
import {createRoot} from 'react-dom/client';

import GenerateAccessToken from './GenerateAccessToken.jsx';

const ELEMENT_NAME = 'generate-access-token';

class GenerateAccessTokenElement extends HTMLElement {

    connectedCallback() {
        if (this._root) {
            return;
        }

        const configuration = {
            authorizeUrl:
                this.getAttribute('oauth2-authorization-url') ||
                '/o/oauth2/authorize',
            clientId: this.getAttribute('client-id') || '',
            clientSecret: this.getAttribute('client-secret') || '',
            liferayUrl: (
                this.getAttribute('liferay-portal-url') ||
                window.location.origin
            ).replace(/\/+$/, ''),
        };

        this._root = createRoot(this);

        this._root.render(<GenerateAccessToken {...configuration} />);
    }

    disconnectedCallback() {
        if (this._root) {
            this._root.unmount();

            this._root = null;
        }
    }
}

if (!customElements.get(ELEMENT_NAME)) {
    customElements.define(ELEMENT_NAME, GenerateAccessTokenElement);
}
