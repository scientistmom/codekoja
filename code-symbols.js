(function (global) {
  "use strict";

  const symbols = [
    "<", ">", "==", "!=", "<=", ">=", "=", ":", "(", ")", "[", "]",
    '"', "'", ",", ".", "+", "-", "*", "/", "%", "_", "#",
  ];

  function render(host, insert, more = true) {
    host.classList.add("code-symbols");
    host.replaceChildren();
    host.setAttribute("role", "group");
    let menu;
    const makeButton = (entry) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.codeSymbol = entry;
      const code = document.createElement("code");
      code.textContent = entry;
      button.append(code);
      // Keep the editor's selection when a child clicks a symbol.
      button.addEventListener("mousedown", event => event.preventDefault());
      button.addEventListener("click", () => {
        if (button.disabled) return;
        if (menu) menu.open = false;
        insert(entry);
      });
      return button;
    };
    host.append(...symbols.slice(0, 2).map(makeButton));
    if (!more) return;
    menu = document.createElement("details");
    const summary = document.createElement("summary");
    summary.textContent = "…";
    const panel = document.createElement("div");
    panel.className = "code-symbol-panel";
    panel.append(...symbols.map(makeButton));
    menu.append(summary, panel);
    menu.addEventListener("keydown", event => {
      if (event.key !== "Escape") return;
      event.preventDefault(); event.stopPropagation();
      menu.open = false; summary.focus();
    });
    menu.addEventListener("focusout", event => {
      if (!menu.contains(event.relatedTarget)) menu.open = false;
    });
    host.append(menu);
  }

  global.PipCodeSymbols = Object.freeze({ render });
})(window);
