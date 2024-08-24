// ==UserScript==
// @name            URL bar show domain
// @author          vufly
// @description     Show only domain in the URL bar input field
// @version         2024-08-25 02:13  Fix the URL input value didn't recover on focusing
// @version         2024-01-13 01:40  Delay the domain trimming after the valueFormatter.update() because it's async
// @version         2023-05-31 23:00  Strip out www.
// @version         2023-05-29 02:30  Initial
// ==/UserScript==
(function () {
  // wait for delayed startup for some parts of the script to execute.
  if (gBrowserInit.delayedStartupFinished) {
    init();
  } else {
    let delayedListener = (subject, topic) => {
      if (topic == "browser-delayed-startup-finished" && subject == window) {
        Services.obs.removeObserver(delayedListener, topic);
        init();
      }
    };
    Services.obs.addObserver(
      delayedListener,
      "browser-delayed-startup-finished"
    );
  }

  function init() {
    var originalSetValue = UrlbarInput.prototype._setValue,
      urlbarValueFormater = new UrlbarValueFormatter(gURLBar);

    UrlbarInput.prototype._setValue = function (val, ...args) {
      originalSetValue.call(this, val, ...args);
      if (val)
        this.window.requestAnimationFrame(_ => replaceUrlByDomain());
    }
    gURLBar.inputField.addEventListener('blur', replaceUrlByDomain);
    gURLBar.inputField.addEventListener('focus', _ => {
      gURLBar.inputField.value = gURLBar.untrimmedValue;
    })

    function replaceUrlByDomain() {
      var urlMetadata = urlbarValueFormater._getUrlMetaData();
      if (urlMetadata) {
        let domain = urlMetadata.domain;
        if (domain.startsWith("www.")) {
          domain = domain.slice(4);
        }
        gURLBar.inputField.value = domain;
      }
    }
  }
})();