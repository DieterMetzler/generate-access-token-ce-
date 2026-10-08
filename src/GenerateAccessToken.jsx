import React, {useEffect, useState} from 'react';

/*
 * The redirect URI must be identical in the authorize and token requests and
 * must match a callback URI registered in the Liferay OAuth2 application.
 */
function getRedirectUri(liferayUrl, clientId) {
    return (
        window.location.origin +
        window.location.pathname +
        '?url=' +
        liferayUrl +
        '&client_id=' +
        clientId
    );
}

export default function GenerateAccessToken({
    authorizeUrl,
    clientId,
    clientSecret,
    liferayUrl,
}) {
    const [token, setToken] = useState('Proceed to get an Access Token');

    useEffect(() => {
        const code = new URLSearchParams(window.location.search).get('code');

        if (code) {
            getToken(code);
        }
    }, []);

    /*
     * Step 1: Obtain Authorization Code from Liferay Configured Application
     * with ClientID (Callback URL must be this application)
     */
    function getAuthorizationCode() {
        const redirectUri = encodeURIComponent(
            getRedirectUri(liferayUrl, clientId)
        );

        window.location.href =
            liferayUrl +
            authorizeUrl +
            '?client_id=' +
            encodeURIComponent(clientId) +
            '&response_type=code&redirect_uri=' +
            redirectUri;
    }

    /*
     * Step 2: Obtain OAuth2 Token
     */
    async function getToken(accessCode) {
        try {
            const response = await fetch(liferayUrl + '/o/oauth2/token', {
                body: new URLSearchParams({
                    client_id: clientId,
                    client_secret: clientSecret,
                    code: accessCode,
                    grant_type: 'authorization_code',
                    redirect_uri: getRedirectUri(liferayUrl, clientId),
                }),
                headers: {
                    Accept: 'application/json',
                },
                method: 'POST',
            });

            const json = await response.json();

            console.log(json);

            setToken(
                json.access_token ||
                    'Error: ' + (json.error_description || json.error)
            );
        }
        catch (error) {
            console.error(error);

            setToken('Error: ' + error.message);
        }
    }

    return (
        <div>
            <div>
                <button
                    className="btn btn-primary"
                    onClick={getAuthorizationCode}
                    type="button"
                >
                    Get Access Token
                </button>
            </div>

            <div>
                <h1>AccessToken: {token}</h1>
            </div>
        </div>
    );
}
