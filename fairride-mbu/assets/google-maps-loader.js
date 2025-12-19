// Lightweight Google Maps JS API loader.
// Uses window.GOOGLE_MAPS_API_KEY or localStorage.GOOGLE_MAPS_API_KEY.
(function () {
  const DEFAULT_CALLBACK = "__onGMapsLoaded";
  let loadingPromise = null;

  function getKey(explicitKey) {
    if (explicitKey) return explicitKey;
    if (typeof window.GOOGLE_MAPS_API_KEY === "string" && window.GOOGLE_MAPS_API_KEY.trim()) {
      return window.GOOGLE_MAPS_API_KEY.trim();
    }
    try {
      const ls = localStorage.getItem("GOOGLE_MAPS_API_KEY");
      if (ls && ls.trim()) return ls.trim();
    } catch (_) {}
    return "";
  }

  window.loadGoogleMaps = function loadGoogleMaps(opts = {}) {
    if (window.google && window.google.maps) {
      return Promise.resolve(window.google);
    }
    if (loadingPromise) return loadingPromise;

    const key = getKey(opts.key);
    if (!key) {
      loadingPromise = Promise.reject(new Error("Missing Google Maps API key"));
      return loadingPromise;
    }

    loadingPromise = new Promise((resolve, reject) => {
      let settled = false;
      const timeoutMs = Number(opts.timeoutMs || 10000);
      const libraries = opts.libraries || "places";
      const callbackName = opts.callbackName || DEFAULT_CALLBACK;

      const finish = (err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        try { delete window[callbackName]; } catch (_) {}
        if (err) reject(err);
        else resolve(window.google);
      };

      const existing = document.querySelector("script[data-gmaps-loader]");
      if (existing) {
        existing.addEventListener("load", () => finish());
        existing.addEventListener("error", () => finish(new Error("Failed to load Google Maps")));
        return;
      }

      const script = document.createElement("script");
      script.async = true;
      script.defer = true;
      script.dataset.gmapsLoader = "1";
      window[callbackName] = () => finish();
      script.onerror = () => finish(new Error("Failed to load Google Maps"));
      script.src =
        "https://maps.googleapis.com/maps/api/js" +
        "?key=" +
        encodeURIComponent(key) +
        "&libraries=" +
        encodeURIComponent(libraries) +
        "&callback=" +
        encodeURIComponent(callbackName);
      document.head.appendChild(script);

      const timeoutId = setTimeout(() => finish(new Error("Google Maps load timed out")), timeoutMs);
    });

    return loadingPromise;
  };
})();

