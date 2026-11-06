/* Consentimento de cookies + loaders de analytics/ads + CFC.track */
(function () {
  var STORAGE_KEY = "cfc_cookie_consent";
  var cfg = window.CFC_TRACKING || {};
  var advanced = cfg.googleConsentMode === 'advanced';
  var loaded = { ga4: false, gtm: false, meta: false, bing: false };
  var consent = null;
  var bannerEl = null;
  var adsPurchases = new Set();
  var pageViewed = false;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('consent', 'default', {analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
  window.gtag('set', 'ads_data_redaction', true);
  window.gtag('set', 'url_passthrough', false);

  function t(key, vars) {
    if (window.CFC && typeof CFC.t === "function") {
      var out = CFC.t(key, vars);
      if (out && out !== key) return out;
    }
    var fallback = {
      "cookies.card_title": "PRIVACIDADE E COOKIES",
      "cookies.card_text": "Usamos cookies para lembrar seu carrinho. Ao aceitar, você permite cookies para melhorar sua experiência, analisar o uso do site e medir campanhas.",
      "cookies.card_accept": "ACEITAR",
      "cookies.card_more": "Saber mais",
      "cookies.advanced_text": "Usamos cookies essenciais. Com seu aceite, usamos cookies de analytics e publicidade. Sem aceite, enviamos ao Google sinais limitados de navegação e compras, sem esses cookies, para medição estatística.",
      "cookies.title": "Cookies e privacidade",
      "cookies.text": "Usamos cookies essenciais para a loja funcionar e, com seu consentimento, cookies de analytics e marketing para melhorar a experiência e medir campanhas.",
      "cookies.accept": "Aceitar todos",
      "cookies.essential": "Só essenciais",
      "cookies.policy": "Política de cookies",
      "cookies.manage": "Gerenciar cookies"
    };
    return fallback[key] || key;
  }

  function readConsent() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || typeof data !== "object") return null;
      if (!Number.isFinite(data.ts) || Date.now()-data.ts > 180*86400000 || data.ts > Date.now()+300000) return null;
      return {
        essential: true,
        analytics: !!data.analytics,
        marketing: !!data.marketing,
        ts: data.ts || Date.now()
      };
    } catch (e) {
      return null;
    }
  }

  function saveConsent(next) {
    consent = {
      essential: true,
      analytics: !!next.analytics,
      marketing: !!next.marketing,
      ts: Date.now()
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
    } catch (e) { /* ignore */ }
    applyConsent();
    document.dispatchEvent(new CustomEvent("cfc:consent", { detail: consent }));
  }

  function injectScript(src, attrs) {
    if (document.querySelector('script[src="' + src + '"]')) return null;
    var s = document.createElement("script");
    s.src = src;
    s.async = true;
    if (attrs) {
      Object.keys(attrs).forEach(function (k) { s.setAttribute(k, attrs[k]); });
    }
    document.head.appendChild(s);
    return s;
  }

  function loadGtm() {
    var id = (cfg.gtmId || "").trim();
    if (!id || loaded.gtm) return;
    loaded.gtm = true;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({"gtm.start": new Date().getTime(), event: "gtm.js"});
    injectScript("https://www.googletagmanager.com/gtm.js?id=" + encodeURIComponent(id));
  }

  function loadGa4() {
    var id = (cfg.ga4Id || "").trim();
    var ads = (cfg.googleAdsId || "").trim();
    if (!id && !ads) return;
    if (!advanced && (!consent || (!consent.analytics && !consent.marketing))) return;

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    if (!loaded.ga4) window.gtag("js", new Date());
    loaded.ga4 = true;

    var primary = id || ads;
    injectScript("https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(primary));

    if (id && (advanced || consent.analytics) && !loaded.ga4Config) {
      loaded.ga4Config = true;
      window.gtag("config", id, { anonymize_ip: true, send_page_view: false, allow_google_signals: false, page_location: safeLocation(), page_referrer: safeReferrer() });
    }
    if (ads && (advanced || consent.marketing) && !loaded.adsConfig) {
      loaded.adsConfig = true;
      window.gtag("config", ads, {allow_enhanced_conversions:true, page_location:safeLocation(), page_referrer:safeReferrer()});
    }
  }

  function loadMeta() {
    var id = (cfg.metaPixelId || "").trim();
    if (!id || loaded.meta || !consent || !consent.marketing) return;
    loaded.meta = true;

    !(function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = "2.0";
      n.queue = [];
      t = b.createElement(e);
      t.async = true;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");

    window.fbq("init", id);
    window.fbq("track", "PageView");
  }

  function loadBing() {
    var id = (cfg.bingUetId || "").trim();
    if (!id || loaded.bing || !consent || !consent.marketing) return;
    loaded.bing = true;

    window.uetq = window.uetq || [];
    (function (w, d, t, r, u) {
      var f, n, i;
      w[u] = w[u] || [];
      f = function () {
        var o = { ti: id, enableAutoSpaTracking: true };
        o.q = w[u];
        w[u] = new UET(o);
        w[u].push("pageLoad");
      };
      n = d.createElement(t);
      n.src = r;
      n.async = 1;
      n.onload = n.onreadystatechange = function () {
        var s = this.readyState;
        if ((!s || s === "loaded" || s === "complete") && typeof UET === "function") {
          f();
          n.onload = n.onreadystatechange = null;
        }
      };
      i = d.getElementsByTagName(t)[0];
      i.parentNode.insertBefore(n, i);
    })(window, document, "script", "https://bat.bing.com/bat.js", "uetq");
  }

  function applyConsent() {
    if (!consent) return;
    window.gtag('consent', 'update', {
      analytics_storage:consent.analytics?'granted':'denied',
      ad_storage:consent.marketing?'granted':'denied',
      ad_user_data:consent.marketing?'granted':'denied',
      ad_personalization:consent.marketing?'granted':'denied'
    });
    if (window.fbq) window.fbq('consent', consent.marketing?'grant':'revoke');
    if (advanced || consent.analytics || consent.marketing) { loadGtm(); loadGa4(); }
    if (consent.marketing) loadMeta();
    if (consent.marketing) loadBing();
    if (consent.analytics) injectScript('/static/js/marketing.js?v=20261025tracking4');
    googleContext();
    hideBanner();
  }

  function track(eventName, params) {
    params = params || {};
    if (!eventName) return;

    var analyticsOk = consent && consent.analytics;
    var marketingOk = consent && consent.marketing;
    if (!advanced && !analyticsOk && !marketingOk) return;

    var googleParams = params;
    if (advanced && !analyticsOk) {
      if (!['page_view','view_item','add_to_cart','begin_checkout','purchase','whatsapp_click','lead'].includes(eventName)) return;
      googleParams = {page_location:safeLocation(),page_referrer:safeReferrer()};
      ['value','currency','transaction_id'].forEach(function(key){
        if (params[key] !== undefined) googleParams[key] = params[key];
      });
    }
    // The GA4 base tag in GTM, plus the Meta and Bing loaders, already
    // register the initial page view. Keep the internal event below, but
    // prevent a second platform-level page view from this helper.
    var platformPageView = eventName === "page_view";
    var gtmOwnsGaPageView = platformPageView && !!(cfg.gtmId || "").trim();
    if ((advanced || analyticsOk) && cfg.ga4Id && typeof window.gtag === "function" && !gtmOwnsGaPageView) {
      window.gtag("event", eventName, Object.assign({}, googleParams, {send_to:cfg.ga4Id}));
    }
    if (analyticsOk) document.dispatchEvent(new CustomEvent('cfc:track', {detail:{name:eventName,params:params}}));

    if (eventName === 'purchase' && (advanced || marketingOk) && cfg.googleAdsId && cfg.googleAdsPurchaseLabel && hasGooglePaidAttribution()) {
      var transactionId = typeof params.transaction_id === 'string' ? params.transaction_id.trim() : '';
      var destination = cfg.googleAdsId + '/' + cfg.googleAdsPurchaseLabel;
      var purchaseKey = destination + ':' + transactionId;
      if (transactionId && transactionId.length <= 64 && Number.isFinite(params.value) && params.value >= 0 &&
          params.currency === 'BRL' && !adsPurchases.has(purchaseKey)) {
        // Google also deduplicates this transaction ID across page reloads.
        var emailInput = (typeof document !== 'undefined' && document.getElementById && document.getElementById('email')) ? document.getElementById('email').value : '';
        var phoneInput = (typeof document !== 'undefined' && document.getElementById && document.getElementById('telefone')) ? document.getElementById('telefone').value : '';
        var customerEmail = (params.email || (params.user_data && params.user_data.email) || emailInput || '').trim().toLowerCase();
        var rawPhone = (params.phone || (params.user_data && params.user_data.phone_number) || phoneInput || '').replace(/\D/g, '');
        var phoneE164 = (rawPhone.length >= 10 && rawPhone.length <= 11) ? ('+55' + rawPhone) : '';
        
        var convPayload = {
          send_to: destination,
          value: params.value,
          currency: 'BRL',
          transaction_id: transactionId
        };
        var userData = {};
        if (customerEmail && customerEmail.indexOf('@') !== -1) {
          userData.email = customerEmail;
          userData.email_address = customerEmail;
        }
        if (phoneE164) {
          userData.phone_number = phoneE164;
        }
        if (Object.keys(userData).length > 0) {
          window.gtag('set', 'user_data', userData);
          convPayload.user_data = userData;
        }
        window.gtag('event', 'conversion', convPayload);
        adsPurchases.add(purchaseKey);
      }
    }

    if (marketingOk && typeof window.fbq === "function" && !platformPageView) {
      var metaMap = {
        page_view: "PageView",
        view_item: "ViewContent",
        add_to_cart: "AddToCart",
        begin_checkout: "InitiateCheckout",
        purchase: "Purchase",
        search: "Search"
      };
      var metaEvent = metaMap[eventName];
      if (metaEvent) {
        if (eventName === "page_view") {
          /* PageView já enviado no init */
        } else if (eventName === "purchase") {
          var reference = typeof params.transaction_id === 'string' ? params.transaction_id.trim() : '';
          var amount = Number(params.value);
          if (/^CFC-[A-F0-9]{32}$/.test(reference) && Number.isFinite(amount) && amount > 0) window.fbq("track", metaEvent, {
            value: params.value,
            currency: params.currency || "BRL",
            content_ids: params.items ? params.items.map(function (i) { return i.item_id; }) : undefined,
            content_type: "product"
          }, { eventID: 'cfc-purchase-' + reference });
        } else if (eventName === "search") {
          window.fbq("track", metaEvent, { search_string: params.search_term || "" });
        } else {
          window.fbq("track", metaEvent, {
            value: params.value,
            currency: params.currency || "BRL",
            content_name: params.item_name || (params.items && params.items[0] && params.items[0].item_name),
            content_ids: params.items ? params.items.map(function (i) { return i.item_id; }) : (params.item_id ? [params.item_id] : undefined),
            content_type: "product"
          });
        }
      }
    }

    if (marketingOk && window.uetq && typeof window.uetq.push === "function" && !platformPageView) {
      if (eventName === "page_view") {
        window.uetq.push("event", "page_view", {});
      } else {
        window.uetq.push("event", eventName, {
          event_category: "ecommerce",
          event_label: params.item_name || params.search_term || eventName,
          event_value: params.value
        });
      }
    }
  }

  function trackingCookie(name) {
    try {
      var prefix = name + '=';
      return document.cookie.split(';').map(function (part) { return part.trim(); }).filter(function (part) {
        return part.indexOf(prefix) === 0;
      }).map(function (part) { return part.slice(prefix.length); })[0] || '';
    } catch (_) { return ''; }
  }

  function paidUtm(platform) {
    var raw = new URLSearchParams(location.search);
    var source = (raw.get('utm_source') || '').trim().toLowerCase();
    var medium = (raw.get('utm_medium') || '').trim().toLowerCase();
    var paid = ['cpc','ppc','ads','paid','paid_search','paidsearch','paid-social','paid_social','paidsocial'];
    if (paid.indexOf(medium) === -1) return false;
    if (platform === 'google') return ['google','googleads','google_ads','adwords'].indexOf(source) !== -1;
    if (platform === 'meta') return ['facebook','fb','instagram','meta'].indexOf(source) !== -1;
    return false;
  }

  function hasGooglePaidAttribution() {
    var context = googleContext() || {};
    return !!(context.gclid || context.gbraid || context.wbraid || paidUtm('google'));
  }

  function hasMetaPaidAttribution() {
    var fbc = trackingCookie('_fbc');
    return /^fb\.\d+\.\d{10,16}\.[A-Za-z0-9._-]{1,400}$/.test(fbc) || paidUtm('meta');
  }

  function safeLocation() {
    var raw=new URLSearchParams(location.search), clean=new URLSearchParams();
    ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'].forEach(function(k){
      var v=raw.get(k)||'';
      if(v && v.length<=100 && /^[\p{L}\p{N}_ .()-]*$/u.test(v))clean.set(k,v);
    });
    if (consent && consent.marketing) ['gclid','gbraid','wbraid','gad_source','gad_campaignid'].forEach(function(k){
      var v=raw.get(k)||'';
      if (/^[A-Za-z0-9_-]{1,512}$/.test(v)) clean.set(k,v);
    });
    return location.origin+location.pathname+(clean.size?'?'+clean.toString():'');
  }
  // Keep ad identifiers only after marketing consent, with a bounded lifetime.
  function googleContext() {
    var key = 'cfc-google-click-v1';
    if (!consent || !consent.marketing) {
      try { localStorage.removeItem(key); } catch (_) {}
      return null;
    }
    var saved = null, now = Date.now(), raw = new URLSearchParams(location.search);
    try { saved = JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) {}
    if (!saved || !Number.isFinite(saved.ts) || now-saved.ts > 30*86400000 || saved.ts > now+300000) saved = null;
    var next = {}, found = false;
    ['gclid','gbraid','wbraid'].forEach(function (k) {
      var v = raw.get(k) || '';
      if (/^[A-Za-z0-9_-]{1,512}$/.test(v)) { next[k] = v; found = true; }
    });
    if (found) {
      saved = Object.assign(next, {ts: now});
      try { localStorage.setItem(key, JSON.stringify(saved)); } catch (_) {}
    }
    return Object.assign({consent: true}, saved || {});
  }

  function safeReferrer() {
    try { return new URL(document.referrer).origin+'/'; } catch(_) { return ''; }
  }
  function pageView() {
    if (pageViewed) return;
    if (!advanced && (!consent || (!consent.analytics && !consent.marketing))) return;
    pageViewed = true;
    track("page_view", {
      page_title: document.title,
      page_location: safeLocation(),
      page_referrer: safeReferrer(),
      page_path: location.pathname
    });
  }

  function hideBanner() {
    if (bannerEl) {
      bannerEl.hidden = true;
    }
  }

  function showBanner() {
    if (!bannerEl) buildBanner();
    bannerEl.hidden = false;
  }

  function buildBanner() {
    if (bannerEl) return bannerEl;
    bannerEl = document.createElement("div");
    bannerEl.id = "cookie-banner";
    bannerEl.className = "cookie-banner";
    bannerEl.setAttribute("role", "dialog");
    bannerEl.setAttribute("aria-label", t("cookies.card_title"));
    bannerEl.innerHTML =
      '<button type="button" class="cookie-close" data-cookie-essential aria-label="Fechar e manter apenas cookies essenciais" title="Manter apenas cookies essenciais">×</button>' +
      '<div class="cookie-banner-inner"><div class="cookie-banner-copy"><strong><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 10V7a5 5 0 0 1 10 0v3M4 10h16v11H4z"/></svg><span data-cookie-title>'+t("cookies.card_title")+'</span></strong><p>'+t("cookies.card_text")+'</p></div><div class="cookie-banner-actions"><button type="button" class="cookie-btn cookie-btn-primary" data-cookie-accept>'+t("cookies.card_accept")+'</button><a class="cookie-banner-link" href="/politica-cookies">'+t("cookies.card_more")+'</a></div></div>';
    document.body.appendChild(bannerEl);

    bannerEl.querySelector("[data-cookie-accept]").addEventListener("click", function () {
      saveConsent({ analytics: true, marketing: true });
      pageView();
    });
    bannerEl.querySelector("[data-cookie-essential]").addEventListener("click", function () {
      saveConsent({ analytics: false, marketing: false });
    });
    return bannerEl;
  }

  function refreshBannerText() {
    if (!bannerEl) return;
    var title = bannerEl.querySelector("[data-cookie-title]");
    var text = bannerEl.querySelector(".cookie-banner-copy p");
    var link = bannerEl.querySelector(".cookie-banner-link");
    var essential = bannerEl.querySelector("[data-cookie-essential]");
    var accept = bannerEl.querySelector("[data-cookie-accept]");
    if (title) title.textContent = t("cookies.card_title");
    if (text) text.textContent = t("cookies.card_text");
    if (link) link.textContent = t("cookies.card_more");

    if (accept) accept.textContent = t("cookies.card_accept");
  }

  function openPreferences() {
    showBanner();
    refreshBannerText();
  }

  function wireFooterManage() {
    document.addEventListener("click", function (event) {
      var link = event.target.closest("[data-cookie-manage]");
      if (!link) return;
      event.preventDefault();
      openPreferences();
    });
  }

  function boot() {
    consent = readConsent();
    wireFooterManage();
    if (!consent) {
      showBanner();
      refreshBannerText();
      if (advanced) pageView();
    } else {
      applyConsent();
      // page_view após loaders terem chance de iniciar
      setTimeout(pageView, 300);
    }

    document.addEventListener("cfc:langchange", refreshBannerText);
    document.dispatchEvent(new CustomEvent('cfc:tracking-ready'));
  }

  // API pública (antes e depois do CFC existir)
  var api = {
    googleContext: googleContext,
    getConsent: function () { return consent ? Object.assign({}, consent) : null; },
    isAdvanced: function () { return advanced; },
    setConsent: saveConsent,
    openPreferences: openPreferences,
    track: track,
    pageView: pageView,
    purchase: function (params) { track("purchase", params || {}); }
  };
  window.CFC_COOKIES = api;
  // Defaults precede initialization; restore only an actual saved choice.
  if (advanced) {
    consent = readConsent();
    if (consent) applyConsent();
    else loadGa4();
  }

  function attachToCFC() {
    if (!window.CFC) return;
    window.CFC.track = track;
    window.CFC.cookies = api;
  }
  attachToCFC();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      attachToCFC();
      boot();
    });
  } else {
    boot();
  }

  // Se site.js carregar depois, reanexa
  var tries = 0;
  var timer = setInterval(function () {
    attachToCFC();
    tries += 1;
    if (window.CFC || tries > 40) clearInterval(timer);
  }, 50);
})();
