// Shared coin wallet and cosmetic rewards. No movement or sensor rules change.
(function (global) {
  "use strict";
  const key = "pip-python-lab.skins.v1";
  const catalog = Object.freeze([
    { id: "classic", price: 0, name: ["Original Koja", "Eredeti Koja"] },
    { id: "mint", price: 4, name: ["Mint", "Menta"] },
    { id: "ocean", price: 8, name: ["Ocean", "Óceán"] },
    { id: "sunset", price: 12, name: ["Sunset", "Naplemente"] },
    { id: "ladybird", price: 16, name: ["Ladybird", "Katica"] },
    { id: "cosmic", price: 20, name: ["Star traveller", "Csillagjáró"] },
    { id: "oak", price: 24, name: ["Oak", "Tölgy"] },
    { id: "bubblegum", price: 28, name: ["Bubblegum", "Rágógumi"] },
    { id: "stone", price: 32, name: ["Stone", "Kő"] },
    { id: "iron", price: 40, name: ["Iron", "Vas"] },
    { id: "gold", price: 48, name: ["Gold", "Arany"] },
    { id: "diamond", price: 64, name: ["Diamond", "Gyémánt"] },
    { id: "aurora", price: 80, name: ["Aurora", "Sarki fény"] },
    { id: "rainbow", price: 120, name: ["Rainbow", "Szivárvány"] },
  ]);
  function restore(raw) {
    const owned = catalog.filter(s => s.price === 0 || Array.isArray(raw?.owned) && raw.owned.includes(s.id)).map(s => s.id);
    return { owned, selected: owned.includes(raw?.selected) ? raw.selected : "classic" };
  }
  function spent(state) { return catalog.filter(s => state.owned.includes(s.id)).reduce((sum, s) => sum + s.price, 0); }
  function balance(earned, state) { return Math.max(0, earned - spent(state)); }
  function purchase(state, id, earned) {
    const skin = catalog.find(s => s.id === id);
    if (!skin || !state.owned.includes(id) && balance(earned, state) < skin.price) return null;
    return { owned: [...new Set([...state.owned, id])], selected: id };
  }
  function rewardSummary(cardCount, par) {
    if (!Number.isInteger(cardCount) || cardCount < 0 || !Number.isInteger(par) || par < 0) throw new RangeError("Card count and par must be non-negative integers.");
    const closeThreshold = par + Math.max(1, Math.ceil(par * 0.25));
    return { stars: cardCount <= par ? 3 : cardCount <= closeThreshold ? 2 : 1, earned: cardCount < par ? 3 : cardCount === par ? 2 : 1 };
  }
  let state = restore(null);
  let additionalEarnings = () => 0, shop = null, shopCallbacks = null, shopDialog = null, refreshingWallet = false;
  const walletListeners = new Set();
  function finiteAmount(value) { return typeof value === "number" && Number.isFinite(value) ? value : 0; }
  function bonus() {
    try { return finiteAmount(additionalEarnings()); } catch { return 0; }
  }
  function totalEarned(earned) { return finiteAmount(earned) + bonus(); }
  function getBalance() { return balance(totalEarned(shopCallbacks ? shopCallbacks.getEarned() : 0), state); }
  function refreshWallet() {
    if (refreshingWallet) return getBalance();
    refreshingWallet = true;
    try {
      if (shopCallbacks) shopCallbacks.onChange();
      if (shopDialog?.open) shop.render();
      for (const listener of walletListeners) listener(getBalance());
    } finally { refreshingWallet = false; }
    return getBalance();
  }
  function setAdditionalEarningsProvider(provider) {
    if (provider != null && typeof provider !== "function") throw new TypeError("Earnings provider must be a function.");
    additionalEarnings = provider || (() => 0);
    refreshWallet();
  }
  function onWalletChange(listener) {
    if (typeof listener !== "function") throw new TypeError("Wallet listener must be a function.");
    walletListeners.add(listener);
    return () => walletListeners.delete(listener);
  }
  try { state = restore(JSON.parse(global.localStorage.getItem(key))); } catch { /* Default skin. */ }
  function apply() { if (global.document) global.document.documentElement.dataset.pipSkin = state.selected; }
  apply();
  function createShop({ getEarned = () => 0, getLocale = () => global.PipLocale || "en", onChange = () => {} } = {}) {
    if (shop) return shop;
    shopCallbacks = { getEarned, getLocale, onChange };
    const doc = global.document, dialog = doc.createElement("dialog");
    shopDialog = dialog;
    dialog.id = "pip-skin-shop";
    dialog.setAttribute("aria-labelledby", "pip-shop-title");
    dialog.innerHTML = '<header><h2 id="pip-shop-title"></h2><button type="button" id="pip-shop-close">×</button></header><p id="pip-shop-balance"></p><div class="pip-skin-list"></div><p id="pip-shop-feedback" role="status"></p>';
    doc.body.append(dialog);
    const text = (en, hu) => getLocale() === "hu" ? hu : en;
    const feedback = dialog.querySelector("#pip-shop-feedback");
    function render() {
      const currentBalance = getBalance();
      dialog.querySelector("h2").textContent = text("Koja's little shop", "Koja kisboltja");
      dialog.querySelector("#pip-shop-balance").textContent = text("Wallet: ", "Persely: ") + currentBalance + text(" coins", " érme");
      const list = dialog.querySelector(".pip-skin-list"); list.replaceChildren();
      for (const skin of catalog) {
        const card = doc.createElement("div"); card.className = "pip-skin-card";
        const preview = doc.createElement("span"); preview.className = "pip-skin-preview"; preview.dataset.skin = skin.id; preview.textContent = "•‿•"; preview.setAttribute("aria-hidden", "true");
        const name = doc.createElement("strong"); name.textContent = skin.name[getLocale() === "hu" ? 1 : 0];
        const button = doc.createElement("button"); button.type = "button"; button.dataset.buySkin = skin.id;
        const owned = state.owned.includes(skin.id), selected = state.selected === skin.id;
        button.textContent = selected ? text("Wearing", "Ezt viseled") : owned ? text("Wear", "Felveszem") : skin.price + text(" coins", " érme");
        button.disabled = selected || !owned && currentBalance < skin.price;
        if (!owned && button.disabled) button.title = text("Need ", "Még ") + (skin.price - currentBalance) + text(" more coins", " érme hiányzik");
        card.append(preview, name, button); list.append(card);
      }
    }
    dialog.querySelector("#pip-shop-close").addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", event => {
      const button = event.target.closest("[data-buy-skin]");
      if (!button || button.disabled || global.PipResetInProgress) return;
      const next = purchase(state, button.dataset.buySkin, totalEarned(getEarned()));
      if (!next) return;
      try { global.localStorage.setItem(key, JSON.stringify(next)); }
      catch { feedback.textContent = text("Could not save the purchase. Your coins were not spent.", "Nem sikerült menteni a vásárlást. Az érméid megmaradtak."); return; }
      state = next; apply(); refreshWallet();
      feedback.textContent = text("Koja is wearing the new look!", "Koja már az új kinézetet viseli!");
      dialog.querySelector("#pip-shop-close").focus();
    });
    shop = { open() { render(); feedback.textContent = ""; if (!dialog.open) dialog.showModal(); }, render };
    return shop;
  }
  global.PipSkins = Object.freeze({ catalog, restore, spent, balance, purchase, rewardSummary, createShop, available: earned => balance(totalEarned(earned), state), setAdditionalEarningsProvider, getBalance, openShop: () => shop?.open(), refreshWallet, onWalletChange });
})(window);
