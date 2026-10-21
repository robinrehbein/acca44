# Acca44 – Vendure-Demonstration

Entwicklungsprototyp für den Ladenbetrieb in Lindau und Friedrichshafen: Vendure 3.8, PostgreSQL 16, Dashboard und ein deutscher React-Shop mit Vite und React Router. Ein kleiner Express-Server liefert den Shop aus und verbindet ihn mit der Shop API. Der Shop benötigt damit einen laufenden Container; eine Next.js-Plattform ist nicht erforderlich.

Alle Produkte, Bestellungen und Zahlungen dienen ausschließlich dem Test. Keine echten Kundendaten eingeben. Die Zahlungssimulation zieht kein Geld ein. Der Prototyp ist keine produktionsfertige Warenwirtschaft und keine steuerkonforme Kasse.

## Lokal starten

Voraussetzungen: Node.js 22, npm und Docker mit Compose. Vor neuen Arbeiten Branch, Upstream und Arbeitsbaum prüfen und den Arbeitsbranch mit `git pull --ff-only` aktualisieren. Vorhandene Änderungen bewahren.

1. `.env.example` nach `.env` kopieren. Alle Passwortplatzhalter unter den `SERVICE_PASSWORD_64_*`-Schlüsseln durch eigene lokale Entwicklungszugangsdaten ersetzen, zum Beispiel mit `openssl rand -hex 32`. `.env` bleibt lokal.
2. `npm ci` ausführen.
3. `docker compose build` und `docker compose up -d postgres` ausführen.
4. Das Schema ausdrücklich mit `docker compose run --rm migrate` anlegen bzw. aktualisieren.
5. Synthetische Beispieldaten einmalig mit `docker compose run --rm --no-deps server npm run seed -w @acca44/server` anlegen.
6. `docker compose up -d server worker storefront` ausführen.

Compose veröffentlicht absichtlich keine Host-Ports. Für lokalen Browserzugriff eine unversionierte Datei `/tmp/acca44-local.yaml` anlegen:

```yaml
services:
  server:
    ports: ["127.0.0.1:3001:3001"]
  storefront:
    ports: ["127.0.0.1:3000:3000"]
```

Dann mit `docker compose -f compose.yaml -f /tmp/acca44-local.yaml up -d` starten. Shop: `http://localhost:3000`; Dashboard: `http://localhost:3001/dashboard`; Shop API: `http://localhost:3001/shop-api`. Lokale Zugangsdaten stammen aus der eigenen `.env`; die dortigen `SERVICE_URL_*`-Werte zeigen auf localhost. Den lokalen HTTP-Aufbau ausschließlich lokal verwenden.

`docker compose down` beendet den Stack und bewahrt Daten und Produktdateien. `down -v` löscht die persistenten Volumes und ist kein normaler Neustart.

## Bedienung im Dashboard

Mit dem konfigurierten Administrator anmelden. Der Seed enthält zwölf synthetische Produkte aus Schuhen, Taschen und Gürteln mit Varianten und Beständen an zwei Lagerorten. Lindau ist der erste vorgesehene Erfüllungsort, Friedrichshafen die nachgelagerte Quelle. Vor einem Bedienertest die tatsächlich angezeigten Berechtigungen und Bestände kontrollieren.

- Im Produktkatalog eine Variante öffnen und die Mengen pro Lagerort prüfen. Die verfügbare Menge berücksichtigt Reservierungen; sie ist nicht immer mit dem physischen Bestand identisch.
- Wareneingänge und Korrekturen über die Bestandsfunktion des Dashboards buchen. Vorher und nachher die Menge und die Bestandsbewegung prüfen. Keine direkten Datenbankänderungen verwenden.
- Im Shop eine Testbestellung mit synthetischen Kontaktdaten und Testzahlung anlegen. Im Dashboard Bestellung, Zahlungssimulation und Reservierung prüfen.
- Eine Lieferung erst für tatsächlich versendete Testartikel erzeugen. Die Erfüllung wandelt zugeordnete Reservierungen in Verkaufsbewegungen um. Anschließend die Lagerbewegungen prüfen.
- Eine Bestellung über den vorgesehenen Stornierungsablauf stornieren und gegebenenfalls die Rücklagerungsoption bewusst wählen. Bereits versendete Ware wird durch eine bloße Stornierung nicht physisch zurückgebracht; Rücknahme und Bestandskorrektur getrennt prüfen.

Eine manuelle Bestandskorrektur für einen Ladenverkauf erfasst allein die Mengenänderung. Sie erzeugt keinen Kassenbeleg, keine rechtskonforme Steuerabrechnung und keinen vollständigen POS-Verkauf. Ein Lagertransfer darf nicht ohne Prüfung als atomarer Vorgang angenommen werden: Abgang und Zugang samt Historie kontrollieren. Tabellenimport und echte Zahlungen sind nicht Bestandteil dieser Version.

## Entwicklungsbereitstellung in Coolify

Ziel ist das Projekt **Carina Rehbein**, Umgebung **development**. Produktionsressourcen nicht verändern. Repository: `https://github.com/robinrehbein/acca44`, Bereitstellung über den Branch `dev` und die Datei `compose.yaml`.

1. Auf dem Zielserver freie Kapazität prüfen. Die bestehende [Entwicklungsanwendung](https://coolify.robinrehbein.de/project/x7o8imdwnnumgvo2zs1coqxr/environment/3qafrazukc2j1wx1dwyb0rfr/application/zanlm9c121xyyoq6nda6tzh8) auf Docker Compose umstellen und den vorgesehenen Branch/Commit kontrollieren. Keine zweite Anwendung anlegen.
2. Coolify erzeugt die vier `SERVICE_PASSWORD_64_*`-Werte automatisch: PostgreSQL, Administrator, Cookie-Signatur und Demo-Bediener erhalten getrennte Zufallswerte. Die Datenbankreferenz wird für PostgreSQL und Vendure wiederverwendet. Keine lokale `.env` hochladen und keine lokalen Testpasswörter übernehmen. `SUPERADMIN_USERNAME` ist standardmäßig `admin@acca44.example`; der Demo-Bediener heißt `operator@acca44.example`. Zugangsdaten ausschließlich in den Coolify-Umgebungsvariablen abrufen und sicher weitergeben. Coolify erzeugt `SERVICE_URL_SERVER_3001` und `SERVICE_URL_STOREFRONT_3000` aus der Domainkonfiguration; beide auf die vorgesehenen HTTPS-Domains ohne abschließenden Schrägstrich prüfen. `COOKIE_SECURE` für die HTTPS-Bereitstellung weglassen (Standard `true`) oder ausdrücklich auf `true` setzen.
3. Nur `server:3001` und `storefront:3000` mit HTTPS-Domains routen. PostgreSQL, Worker und Werkzeugdienste erhalten keine öffentliche Route. Volumes für Datenbank und Assets beibehalten.
4. Images bauen und bereitstellen. Der einmalige Migrationsdienst wartet auf PostgreSQL; Server und Worker starten erst nach dessen erfolgreichem Abschluss. Der erfolgreich beendete Migrationscontainer kann in Coolify als „Exited“ erscheinen; dessen Exit-Code und den Zustand der laufenden Dienste getrennt prüfen. Vor dem ersten Bedienertest den Seed genau einmal im Server-Terminal mit `npm run seed -w @acca44/server` ausführen.
5. Server, Worker und Shop starten. Bei einem Migrationsfehler stoppen und die Ursache prüfen; den Start nicht erzwingen. Seed nie bei jedem Deployment automatisch ausführen.
6. HTTPS, Dashboard-Anmeldung, Shopkatalog, Testbestellung und Lagerbewegungen prüfen. Einen Neustart durchführen und die erhaltenen Daten kontrollieren. Den verwendeten Commit und diese Ergebnisse getrennt von lokalen Tests dokumentieren.

Dashboard und Admin API sind über die Serverdomain erreichbar und erfordern Authentifizierung. Entwicklungszugänge nur an beteiligte Testpersonen weitergeben. Die Laufzeitlimits betragen für Server und Migration jeweils 1 GiB/1 CPU, Worker 768 MiB/0,5 CPU, Shop 256 MiB/0,5 CPU und PostgreSQL 768 MiB/1 CPU. Build-Prozesse sind davon unabhängig; Speicherverbrauch und Worker-Queues beim Test beobachten.

Vor jeder Änderung an einem bestehenden Datenbestand Datenbank und Asset-Volume sichern. Wiederherstellung in einer getrennten Umgebung prüfen; ein vorhandenes Volume allein ist kein Backup.

Details zu Betrieb, Sicherung und Abnahme: [deployment.md](docs/deployment.md). Die ursprüngliche Zielbeschreibung steht unter [design](docs/2026-10-21-vendure-prototype-design.md).
