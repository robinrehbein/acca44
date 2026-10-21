import React, { useEffect, useState, createContext, useContext } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useParams,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import type { Operation } from "../lib/operations";
import { shop } from "../lib/api";
import { productImage } from "../lib/product-images";
import "./style.css";
type Variant = {
  id: string;
  name: string;
  priceWithTax: number;
  stockLevel: string;
  options: { name: string; group: { name: string; code: string } }[];
};
type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  variants: Variant[];
  facetValues: {
    id: string;
    name: string;
    facet: { code: string; name: string };
  }[];
};
type Item = {
  productId: string;
  productName: string;
  slug: string;
  priceWithTax: { value?: number; min?: number };
  facetValueIds: string[];
};
type Order = {
  id: string;
  code: string;
  state: string;
  totalQuantity: number;
  subTotalWithTax: number;
  shippingWithTax: number;
  totalWithTax: number;
  lines: {
    id: string;
    quantity: number;
    linePriceWithTax: number;
    productVariant: { id: string; name: string; product: { slug: string } };
  }[];
};
const money = (amount: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(
    amount / 100,
  );
const Context = createContext<{
  order: Order | null;
  refresh: () => Promise<void>;
  busy: boolean;
  act: (op: Operation, v?: Record<string, unknown>) => Promise<any>;
}>({ order: null, refresh: async () => {}, busy: false, act: async () => {} });
function App() {
  const [order, setOrder] = useState<Order | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const refresh = async () => {
    setOrder(await shop("order"));
  };
  useEffect(() => {
    refresh().catch(() => {});
  }, []);
  async function act(op: Operation, v = {}) {
    setBusy(true);
    setNotice("");
    try {
      const r = await shop(op, v);
      await refresh();
      return r;
    } catch (e) {
      setNotice((e as Error).message);
      throw e;
    } finally {
      setBusy(false);
    }
  }
  return (
    <Context.Provider value={{ order, refresh, busy, act }}>
      <div className="demo">
        DEMO-SHOP · Fiktives Sortiment · Keine echte Bestellung oder Zahlung
      </div>
      <header>
        <Link className="logo" to="/">
          acca<span>44</span>
          <small>SCHUHE & LIEBLINGSSTÜCKE</small>
        </Link>
        <nav>
          <Link to="/#kollektion">Kollektion</Link>
          <a href="/#boutiquen">Unsere Boutiquen</a>
          <Link to="/warenkorb">
            Warenkorb <b>{order?.totalQuantity || 0}</b>
          </Link>
        </nav>
      </header>
      {notice && (
        <div role="alert" className="notice">
          {notice}
          <button aria-label="Hinweis schließen" onClick={() => setNotice("")}>
            ×
          </button>
        </div>
      )}
      <Routes>
        <Route path="/" element={<Catalog />} />
        <Route path="/produkt/:slug" element={<Detail />} />
        <Route path="/warenkorb" element={<Cart />} />
        <Route path="/kasse" element={<Checkout />} />
        <Route path="/bestaetigung" element={<Confirmation />} />
        <Route
          path="*"
          element={
            <main>
              <h1>Hier geht es nicht weiter.</h1>
              <Link to="/">Zur Kollektion</Link>
            </main>
          }
        />
      </Routes>
      <footer>
        <div className="logo">
          acca44<small>PERSÖNLICH. BESONDERS. BODENSEE.</small>
        </div>
        <p>
          Lieblingsstücke findet man nicht irgendwo.
          <br />
          Sondern bei Menschen mit einem Gespür dafür.
        </p>
        <p>
          Prototyp · Alle Produkte und Preise sind fiktiv.
          <br />
          Kein Verkauf, keine Zahlung, kein E-Mail-Versand.
        </p>
      </footer>
    </Context.Provider>
  );
}
function Catalog() {
  const [items, setItems] = useState<Item[]>([]);
  const [facets, setFacets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [params, setParams] = useSearchParams();
  const selected = params.getAll("filter");
  const query = params.get("suche") || "";
  useEffect(() => {
    shop("catalog")
      .then((r) => {
        setItems(r.items);
        setFacets(r.facetValues);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  const groups = Array.from(
    new Set(facets.map((x) => x.facetValue.facet.code)),
  );
  const shown = items.filter(
    (i) =>
      i.productName.toLowerCase().includes(query.toLowerCase()) &&
      selected.every((id) => i.facetValueIds.includes(id)),
  );
  function filter(id: string) {
    const p = new URLSearchParams(params);
    p.delete("filter");
    (selected.includes(id)
      ? selected.filter((x) => x !== id)
      : [...selected, id]
    ).forEach((x) => p.append("filter", x));
    setParams(p, { preventScrollReset: true });
  }
  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">MIT LIEBE AUSGEWÄHLT. AM BODENSEE.</p>
          <h1>
            Für die Wege,
            <br />
            die du liebst.
          </h1>
          <p>
            Gutes Design. Ein besonderes Gefühl.
            <br />
            Entdecke Schuhe und Accessoires mit Charakter.
          </p>
          <a className="button" href="#kollektion">
            Lieblingsstücke entdecken <span>↗</span>
          </a>
        </div>
        <div className="hero-art">
          <span className="circle" />
          <img
            src={productImage("kamo-gutsu-riva")}
            alt="KI-generiertes Demobild eines fiktiven Sneakerpaars"
          />
          <span className="art-note">
            Weniger Trend.
            <br />
            Mehr du.
          </span>
          <span className="edition">DIE ACCA44 AUSWAHL / 01</span>
        </div>
      </section>
      <div className="promise">
        <span>Mit Gespür ausgewählt</span>
        <span>Persönliche Beratung</span>
        <span>Zwei Boutiquen am Bodensee</span>
      </div>
      <main id="kollektion">
        <div className="section-heading">
          <div>
            <p className="eyebrow">NEUE PERSPEKTIVEN. GUTE BEGLEITER.</p>
            <h2>Dein nächstes Lieblingsstück.</h2>
          </div>
          <span>{shown.length} Entdeckungen</span>
        </div>
        <div className="filters">
          <label className="search">
            Suchen
            <input
              placeholder="Schuhe, Taschen, Marken …"
              value={query}
              onChange={(e) => {
                const p = new URLSearchParams(params);
                p.set("suche", e.target.value);
                setParams(p, { preventScrollReset: true });
              }}
            />
          </label>
          {groups.map((group) => (
            <details key={group}>
              <summary>
                {
                  facets.find((x) => x.facetValue.facet.code === group)
                    .facetValue.facet.name
                }
              </summary>
              <div>
                {facets
                  .filter((x) => x.facetValue.facet.code === group)
                  .map((x) => (
                    <label key={x.facetValue.id}>
                      <input
                        type="checkbox"
                        checked={selected.includes(x.facetValue.id)}
                        onChange={() => filter(x.facetValue.id)}
                      />
                      {x.facetValue.name} <small>{x.count}</small>
                    </label>
                  ))}
              </div>
            </details>
          ))}
          {selected.length > 0 && (
            <button className="text-button" onClick={() => setParams({})}>
              Filter zurücksetzen
            </button>
          )}
        </div>
        {loading ? (
          <p role="status">Deine Lieblingsstücke werden geladen …</p>
        ) : error ? (
          <div role="alert" className="empty">
            <h3>Die Kollektion macht eine kurze Pause.</h3>
            <p>{error}</p>
            <button onClick={() => location.reload()}>Erneut versuchen</button>
          </div>
        ) : shown.length === 0 ? (
          <p className="empty">
            Keine passenden Lieblingsstücke. Probiere andere Filter.
          </p>
        ) : (
          <div className="grid">
            {shown.map((item, i) => (
              <Link
                className="product-card"
                key={item.productId}
                to={`/produkt/${item.slug}`}
              >
                <div className={`product-art tone-${i % 4}`}>
                  <img
                    src={productImage(item.slug)}
                    alt={`KI-generiertes Demobild für ${item.productName}`}
                    loading="lazy"
                  />
                  <span className="round-arrow">↗</span>
                </div>
                <div className="card-line">
                  <h3>{item.productName}</h3>
                  <span>
                    {money(
                      item.priceWithTax.value ?? item.priceWithTax.min ?? 0,
                    )}
                  </span>
                </div>
                <p>KI-generiertes Demobild · Fiktives Produkt</p>
              </Link>
            ))}
          </div>
        )}
      </main>
      <section className="boutiques" id="boutiquen">
        <div>
          <p className="eyebrow">ONLINE ENTDECKEN. VOR ORT VERLIEBEN.</p>
          <h2>
            Ein gutes Gefühl
            <br />
            beginnt persönlich.
          </h2>
          <p>
            Wir nehmen uns Zeit. Für deinen Stil, deine Fragen
            <br />
            und für das Paar, das einfach zu dir passt.
          </p>
        </div>
        <div className="places">
          <article>
            <span>01 / INSELMOMENTE</span>
            <h3>Lindau</h3>
            <p>
              Unsere Boutique auf der Insel.
              <br />
              Lieblingsstücke mit Bodenseegefühl.
            </p>
          </article>
          <article>
            <span>02 / SEELUFT</span>
            <h3>Friedrichshafen</h3>
            <p>
              Dein Platz für neue Entdeckungen.
              <br />
              Persönlich und mit Liebe ausgewählt.
            </p>
          </article>
        </div>
      </section>
    </>
  );
}
function Detail() {
  const { slug } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [variant, setVariant] = useState("");
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);
  const { act, busy } = useContext(Context);
  useEffect(() => {
    setProduct(null);
    shop("product", { slug })
      .then((p) => {
        if (!p) throw new Error("Dieses Produkt wurde nicht gefunden.");
        setProduct(p);
        setVariant(
          p.variants.find((v: Variant) => v.stockLevel !== "OUT_OF_STOCK")
            ?.id || "",
        );
      })
      .catch((e) => setError(e.message));
  }, [slug]);
  if (!product)
    return (
      <main>
        <Link to="/">← Zur Kollektion</Link>
        <p role={error ? "alert" : "status"}>
          {error || "Lieblingsstück wird geladen …"}
        </p>
      </main>
    );
  const chosen = product.variants.find((v) => v.id === variant);
  return (
    <main>
      <Link className="back" to="/#kollektion">
        ← Zur Kollektion
      </Link>
      <div className="detail">
        <div className="detail-art">
          <img
            src={productImage(product.slug)}
            alt={`KI-generiertes Demobild für ${product.name}`}
          />
          <small>KI-generiertes Demobild · Kein Originalproduktfoto</small>
        </div>
        <div className="detail-info">
          <p className="eyebrow">DIE ACCA44 AUSWAHL</p>
          <h1>{product.name}</h1>
          <p className="price">
            {money(
              chosen?.priceWithTax || product.variants[0]?.priceWithTax || 0,
            )}
          </p>
          <p className="muted">
            Demo-Preis inkl. MwSt. · Versandkosten an der Kasse
          </p>
          <p>{product.description.replace(/<[^>]*>/g, "")}</p>
          <div className="tags">
            {product.facetValues.map((f) => (
              <span key={f.id}>{f.name}</span>
            ))}
          </div>
          <label>
            Deine Variante
            <select
              value={variant}
              onChange={(e) => {
                setVariant(e.target.value);
                setAdded(false);
              }}
            >
              <option value="" disabled>
                Bitte auswählen
              </option>
              {product.variants.map((v) => (
                <option
                  key={v.id}
                  value={v.id}
                  disabled={v.stockLevel === "OUT_OF_STOCK"}
                >
                  {v.name}
                  {v.stockLevel === "OUT_OF_STOCK" ? " · Ausverkauft" : ""}
                </option>
              ))}
            </select>
          </label>
          <button
            className="button wide"
            disabled={busy || !chosen}
            onClick={() =>
              act("add", { variantId: variant, quantity: 1 })
                .then(() => setAdded(true))
                .catch(() => {})
            }
          >
            {busy ? "Einen Moment …" : "In den Warenkorb →"}
          </button>
          {added && (
            <p role="status">
              Dein Lieblingsstück liegt im Warenkorb.{" "}
              <Link to="/warenkorb">Zum Warenkorb →</Link>
            </p>
          )}
          <div className="detail-note">
            ♡ Mit Liebe ausgewählt
            <br />↗ Persönliche Beratung in unseren Boutiquen
          </div>
        </div>
      </div>
    </main>
  );
}
function Cart() {
  const { order, busy, act } = useContext(Context);
  return (
    <main className="cart">
      <p className="eyebrow">DEINE AUSWAHL</p>
      <h1>Gute Begleiter.</h1>
      {!order?.lines.length ? (
        <div className="empty">
          <p>Dein Warenkorb wartet auf ein Lieblingsstück.</p>
          <Link className="button" to="/">
            Kollektion entdecken ↗
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div>
            {order.lines.map((line) => (
              <article className="cart-line" key={line.id}>
                <Link to={`/produkt/${line.productVariant.product.slug}`}>
                  <img
                    src={productImage(line.productVariant.product.slug)}
                    alt={`KI-generiertes Demobild für ${line.productVariant.name}`}
                  />
                </Link>
                <div>
                  <Link to={`/produkt/${line.productVariant.product.slug}`}>
                    <h3>{line.productVariant.name}</h3>
                  </Link>
                  <label>
                    Menge{" "}
                    <select
                      aria-label={`Menge ${line.productVariant.name}`}
                      disabled={busy || order.state !== "AddingItems"}
                      value={line.quantity}
                      onChange={(e) =>
                        act("adjust", {
                          lineId: line.id,
                          quantity: Number(e.target.value),
                        }).catch(() => {})
                      }
                    >
                      {Array.from({ length: 10 }, (_, i) => (
                        <option key={i + 1}>{i + 1}</option>
                      ))}
                    </select>
                  </label>
                  <button
                    className="text-button"
                    disabled={busy || order.state !== "AddingItems"}
                    onClick={() =>
                      act("remove", { lineId: line.id }).catch(() => {})
                    }
                  >
                    Entfernen
                  </button>
                </div>
                <strong>{money(line.linePriceWithTax)}</strong>
              </article>
            ))}
          </div>
          <aside className="summary">
            <h3>Deine Übersicht</h3>
            <Totals order={order} />
            <Link className="button wide" to="/kasse">
              Zur Demo-Kasse →
            </Link>
            <p className="muted">
              Ausschließlich fiktive Bestellung. Kein Geld wird abgebucht.
            </p>
          </aside>
        </div>
      )}
    </main>
  );
}
function Totals({ order }: { order: Order }) {
  return (
    <>
      <div className="total-row">
        <span>Zwischensumme</span>
        <span>{money(order.subTotalWithTax)}</span>
      </div>
      <div className="total-row">
        <span>Versand</span>
        <span>
          {order.shippingWithTax
            ? money(order.shippingWithTax)
            : "an der Kasse"}
        </span>
      </div>
      <div className="total-row final">
        <strong>Gesamt</strong>
        <strong>{money(order.totalWithTax)}</strong>
      </div>
      <p className="muted">Inkl. gesetzlicher MwSt. (Demo)</p>
    </>
  );
}
function Checkout() {
  const { order, act, busy } = useContext(Context);
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  const [consent, setConsent] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setWorking(true);
    const data = new FormData(event.currentTarget);
    const value = (key: string) => String(data.get(key) || "");
    try {
      if (order?.state === "AddingItems") {
        await act("customer", {
          input: {
            firstName: value("firstName"),
            lastName: value("lastName"),
            emailAddress: value("email"),
          },
        });
        const address = {
          fullName: `${value("firstName")} ${value("lastName")}`,
          streetLine1: value("street"),
          city: value("city"),
          postalCode: value("zip"),
          countryCode: "DE",
        };
        await act("shippingAddress", { input: address });
        await act("billingAddress", { input: address });
        const shipping = await shop("shipping");
        if (!shipping.length)
          throw new Error("Für diese Adresse ist kein Demo-Versand verfügbar.");
        await act("setShipping", { ids: [shipping[0].id] });
        await act("transition");
      }
      const methods = await shop("payments");
      if (!methods.some((m: any) => m.code === "demo-payment" && m.isEligible))
        throw new Error("Die Demo-Zahlung steht aktuell nicht zur Verfügung.");
      const placed = await act("pay");
      sessionStorage.setItem(
        "acca44-confirmation",
        JSON.stringify({ code: placed.code, total: placed.totalWithTax }),
      );
      navigate("/bestaetigung", { replace: true });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setWorking(false);
    }
  }
  return (
    <main className="checkout">
      <p className="eyebrow">NUR EIN PROBELAUF</p>
      <h1>Fast bei dir. Ganz ohne Zahlung.</h1>
      <div className="demo-note">
        Bitte ausschließlich die vorausgefüllten, synthetischen Testdaten
        verwenden. Es werden keine echten Zahlungen oder E-Mails ausgelöst.
      </div>
      {!order?.lines.length ? (
        <p>
          Dein Warenkorb ist leer. <Link to="/">Zur Kollektion</Link>
        </p>
      ) : (
        <div className="cart-layout">
          <form onSubmit={submit}>
            <h2>1. Demo-Lieferadresse</h2>
            <div className="form-grid">
              {[
                ["firstName", "Vorname", "Demo"],
                ["lastName", "Nachname", "Musterperson"],
                ["email", "E-Mail", "demo@example.invalid"],
                ["street", "Straße und Hausnummer", "Teststraße 44"],
                ["zip", "Postleitzahl", "88131"],
                ["city", "Stadt", "Lindau"],
              ].map(([name, label, def]) => (
                <label key={name}>
                  {label}
                  <input
                    name={name}
                    type={name === "email" ? "email" : "text"}
                    required
                    defaultValue={def}
                    maxLength={100}
                    readOnly
                  />
                </label>
              ))}
            </div>
            <p>
              Lieferland: Deutschland · Rechnungsadresse entspricht
              Lieferadresse
            </p>
            <h2>2. Demo-Zahlung</h2>
            <div className="payment">
              <strong>Manuelle Demo-Zahlung</strong>
              <p>
                Simuliert einen erfolgreichen Abschluss. Keine Bank- oder
                Kartendaten erforderlich.
              </p>
            </div>
            <label className="check">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                required
              />
              Ich verstehe, dass dies eine fiktive Testbestellung ist.
            </label>
            {error && (
              <p className="error" role="alert">
                {error} Du kannst es erneut versuchen.
              </p>
            )}
            <button
              className="button wide"
              disabled={busy || working || !consent}
            >
              {working
                ? "Demo-Bestellung wird verarbeitet …"
                : "Demo-Bestellung abschließen →"}
            </button>
          </form>
          <aside className="summary">
            <h3>Deine Lieblingsstücke</h3>
            {order.lines.map((l) => (
              <p key={l.id}>
                {l.quantity} × {l.productVariant.name}
              </p>
            ))}
            <Totals order={order} />
          </aside>
        </div>
      )}
    </main>
  );
}
function Confirmation() {
  let result: { code: string; total: number } | null = null;
  try {
    result = JSON.parse(
      sessionStorage.getItem("acca44-confirmation") || "null",
    );
  } catch {}
  return (
    <main className="confirmation">
      <span className="success-mark">✓</span>
      <p className="eyebrow">DAS HAT GEKLAPPT.</p>
      <h1>
        Ein kleiner Test.
        <br />
        Ein gutes Gefühl.
      </h1>
      {result ? (
        <>
          <p>
            Deine Demo-Bestellung <strong>{result.code}</strong> wurde
            abgeschlossen.
          </p>
          <p>
            Demo-Gesamtbetrag: {money(result.total)} · Keine Zahlung erfolgt.
          </p>
        </>
      ) : (
        <p>Hier findest du nach dem Checkout deine Demo-Bestätigung.</p>
      )}
      <p>Es wird keine Bestätigungs-E-Mail versendet.</p>
      <Link className="button" to="/">
        Weiter entdecken ↗
      </Link>
    </main>
  );
}
createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
