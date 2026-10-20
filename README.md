# Generate Access Token (Custom Element Client Extension)

Widget für Liferay DXP 2026.Q3, das über den OAuth2 **Authorization Code Flow** ein
Access Token für eine in Liferay registrierte OAuth2-Anwendung (z. B. „Stockwaage“)
erzeugt und anzeigt.

Ablauf:

1. Der Benutzer klickt auf **Get Access Token**.
2. Das Widget leitet auf `<liferay-portal-url><oauth2-authorization-url>` weiter
   (Standard: `http://localhost:8080/o/oauth2/authorize`).
3. Nach Login und ggf. Zustimmung leitet Liferay mit `?…&code=<Authorization Code>`
   zurück auf die Seite mit dem Widget (Callback URI).
4. Das Widget tauscht den Code über `POST /o/oauth2/token` gegen ein Access Token
   und zeigt es an.

## Inhalt

| Datei | Zweck |
|---|---|
| `client-extension.yaml` | Definition der Client Extension (Typ `customElement`, Element `<generate-access-token>`, Default-Properties) |
| `src/index.jsx` | Registriert das Custom Element und liest die Konfiguration aus den HTML-Attributen |
| `src/GenerateAccessToken.jsx` | React-Komponente mit dem OAuth2-Ablauf |
| `vite.config.js` | Build nach `dist/index.js` |

## Build und Deployment

```powershell
cd C:\Users\dmetz\Liferay-DXP2026q3\Liferay-DXP2026q3
.\gradlew.bat :client-extensions:generate-access-token-ce:deploy

Wenn die Client-Extension im Docker Container cloud4Bees-docker deployed werden soll:
.\gradlew.bat :client-extensions:generate-access-token-ce:deploy "-Pauto.deploy.dir=C:\Users\dmetz\cloud4Bees- docker\liferay_deploy"
```


Wenn du künftig standardmäßig in die Docker-Instanz deployen möchtest, ergänze in der gradle.properties:

auto.deploy.dir=C:\\Users\\dmetz\\cloud4Bees- docker\\liferay_deploy

In einer .properties-Datei müssen die Backslashes verdoppelt werden. Danach genügt wieder der normale Aufruf:
.\gradlew.bat :client-extensions:generate-access-token-ce:deploy



Der Gradle-Task führt `npm install` und `npm run build` aus und kopiert
`generate-access-token-ce.zip` nach `bundles\osgi\client-extensions`. Ein Neustart
von Liferay ist nicht nötig.

Die Extension erscheint danach unter *Control Panel → Client Extensions* sowie
im Widget-Menü in der Kategorie **4Bees** als **Generate Access Token**.

## 1. OAuth2-Anwendung „Stockwaage“ anlegen

Wichtig: Die Callback URI enthält die Client ID, die Liferay erst beim Speichern
erzeugt. Die Anwendung wird deshalb in zwei Schritten angelegt.

### Schritt 1: Anwendung erstellen

*Control Panel → Sicherheit → OAuth 2 Administration → **+** (Hinzufügen)*

| Feld | Wert | Hinweis |
|---|---|---|
| **Name** | `Stockwaage` | Pflichtfeld |
| **Website URL** | leer oder z. B. `https://www.cloud4bees.com` | optional, nur Information |
| **Description** | z. B. `Access Token für die Stockwaage` | optional |
| **Callback URIs** | vorläufig `http://localhost:8080/access-token` | wird in Schritt 2 vervollständigt |
| **Privacy Policy URL** | leer | optional |
| **Client Authentication Method** | **Client Secret Basic or Post** | Das Widget sendet `client_id` und `client_secret` im Body (Post) |
| **JSON Web Key Set** | leer | nur für *Private Key JWT* nötig |
| **Client Profile** | **Web Application** | Server-/Browser-Anwendung mit Client Secret und Redirect |

**Allowed Authorization Types**

| Typ | Einstellung | Begründung |
|---|---|---|
| Authorization Code | **aktivieren** | wird vom Widget verwendet (Pflicht) |
| Refresh Token | **aktivieren** (empfohlen) | Token kann später ohne erneuten Login erneuert werden |
| Client Credentials | deaktiviert | nicht benötigt |
| JWT_BEARER | deaktiviert | nicht benötigt |
| Resource Owner Password Credentials | deaktiviert | nicht benötigt, unsicher |

| Abschnitt | Einstellung | Hinweis |
|---|---|---|
| **Client Credentials User** | unverändert lassen | nur relevant für *Client Credentials* |
| **Trusted Application** | optional aktivieren | überspringt die Zustimmungsseite („Allow/Deny“) nach dem Login |
| **Remember Device** | deaktiviert | nicht benötigt |
| **Token Introspection** | optional aktivieren | erlaubt der Stockwaage, Tokens über `/o/oauth2/introspect` zu prüfen |

**Speichern.** Liferay zeigt jetzt **Client ID** (`id-…`) und **Client Secret**
(`secret-…`) an. Beide über die Kopier-Buttons vollständig kopieren.

### Schritt 2: Callback URI vervollständigen

Das Widget verwendet als Redirect URI **exakt**:

```
<Seiten-URL>?url=<liferay-portal-url>&client_id=<Client ID>
```

Liferay vergleicht die Callback URI zeichengenau, einschließlich Query-String.
Für die Seite `http://localhost:8080/access-token` also:

```
http://localhost:8080/access-token?url=http://localhost:8080&client_id=id-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

Diese URI im Feld **Callback URIs** eintragen (die vorläufige ersetzen) und
erneut **speichern**. Mehrere Seiten oder Umgebungen (z. B. Produktion auf
`https://www.cloud4bees.com`) jeweils als eigene Zeile eintragen.

### Schritt 3: Scopes festlegen

Nach dem Speichern erscheint der Reiter **Scopes**. Dort die Berechtigungen
auswählen, die das Access Token haben soll (z. B. die benötigten
`Liferay.Headless.*`-APIs), und speichern. Ohne passende Scopes wird das Token
zwar ausgestellt, die APIs liefern aber `403 Forbidden`.

## 2. Seite anlegen

1. *Site Builder → Pages*: Eine Inhaltsseite mit der Friendly URL
   **`/access-token`** anlegen.
2. Die Seite muss genau unter der URL aufgerufen werden, die als Callback URI
   registriert ist, also `http://localhost:8080/access-token`.
   Varianten wie `/web/guest/access-token`, `127.0.0.1` statt `localhost` oder
   ein abschließender `/` ergeben eine andere Redirect URI und führen zu
   **`400 Bad Request`** auf `/o/oauth2/authorize`.

## 3. Widget platzieren und konfigurieren

1. Seite bearbeiten → *Fragmente und Widgets → Widgets → 4Bees →
   **Generate Access Token*** auf die Seite ziehen.
2. Im Widget-Menü (⋮) → **Konfiguration** öffnen.
3. Im Feld **Properties** eine Zeile pro Wert eintragen:

   ```properties
   client-id=id-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   client-secret=secret-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   liferay-portal-url=http://localhost:8080
   oauth2-authorization-url=/o/oauth2/authorize
   ```

4. **Speichern** und die Seite veröffentlichen.

| Property | Pflicht | Default | Bedeutung |
|---|---|---|---|
| `client-id` | ja | – | Client ID der OAuth2-Anwendung |
| `client-secret` | ja | – | Client Secret der OAuth2-Anwendung |
| `liferay-portal-url` | nein | aktuelle Origin (`window.location.origin`) | Basis-URL des Liferay-Servers, der die Tokens ausstellt |
| `oauth2-authorization-url` | nein | `/o/oauth2/authorize` | Pfad des Authorize-Endpunkts |

Die Defaults stehen in `client-extension.yaml` unter `properties` und gelten für
alle Instanzen. Werte im Feld *Properties* einer Instanz überschreiben sie.

> **Achtung:** `client-id` und `client-secret` werden als HTML-Attribute des
> Elements `<generate-access-token>` ausgegeben und sind im Seitenquelltext
> sichtbar. Die Seite daher nur für berechtigte Benutzer freigeben
> (*Seite → Berechtigungen*).

## 4. Test

1. `http://localhost:8080/access-token` aufrufen und **Get Access Token** klicken.
2. Anmelden und ggf. die Zustimmung bestätigen (entfällt bei *Trusted Application*).
3. Nach der Rückleitung zeigt das Widget **AccessToken: …** an. Die komplette
   Antwort (inkl. `refresh_token`, `expires_in`, `scope`) steht in der
   Browser-Konsole.

## Fehlerbehebung

| Symptom | Ursache / Lösung |
|---|---|
| `400 Bad Request` auf `/o/oauth2/authorize` | Redirect URI passt nicht zur Callback URI: Seiten-URL, `liferay-portal-url` und `client-id` müssen exakt der registrierten Callback URI entsprechen. Client ID unvollständig kopiert. |
| Anzeige `Error: invalid_client` | Client Secret falsch oder Client Authentication Method nicht *Client Secret Basic or Post*. |
| Anzeige `Error: invalid_grant` | Code abgelaufen oder bereits verwendet (z. B. Seite mit `?code=…` neu geladen). Erneut **Get Access Token** klicken. |
| Anzeige `Error: unauthorized_client` | *Authorization Code* ist unter *Allowed Authorization Types* nicht aktiviert. |
| CORS-Fehler in der Konsole | `liferay-portal-url` zeigt auf einen anderen Host als die Seite. Für `/o/oauth2/token` muss dann unter *Systemeinstellungen → Sicherheitstools → Portal Cross-Origin Resource Sharing (CORS)* die Origin der Seite freigegeben werden. |
| Widget fehlt in der Widget-Liste | Client Extension nicht deployt: *Control Panel → Client Extensions* prüfen und den Gradle-Deploy wiederholen. |
