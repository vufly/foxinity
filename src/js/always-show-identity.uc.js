// ==UserScript==
// @name            Always show identity value
// @author          vufly
// @description     Show indentity label if the identity-icon has a tooltip.
// @version         2024-02-16 13:30  Initial
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
    var css = `
      /* https */
      #identity-box.verifiedDomain #identity-icon-box {
        background-color: rgba(50,255,50,0.2)
      }

      #identity-box.verifiedDomain:hover #identity-icon-box {
        background-color: rgba(50,255,50,0.3)
      }
      
      /* http: and potentially some other insecure connections like ftp: */
      #identity-box.certErrorPage #identity-icon-box,
      #identity-box.notSecure #identity-icon-box {
        background-color: rgba(255,50,50,0.3)
      }

      #identity-box.certErrorPage:hover #identity-icon-box,
      #identity-box.notSecure:hover #identity-icon-box {
        background-color: rgba(255,50,50,0.4)
      }
      
      /* Mixed content including neterror */
      #identity-box.unknownIdentity #identity-icon-box {
        background-color: rgba(255,255,50,0.2)
      }

      #identity-box.unknownIdentity:hover #identity-icon-box {
        background-color: rgba(255,255,50,0.3)
      }
      
      /* Extension pages */
      #identity-box.extensionPage #identity-icon-box {
        background-color: rgba(150,50,250,0.2)
      }

      #identity-box.extensionPage:hover #identity-icon-box {
        background-color: rgba(150,50,250,0.3)
      }
      
      /* Internal about: and chrome:// urls (includes reader-view) */
      #identity-box.chromeUI #identity-icon-box {
        background-color: rgba(50,150,250,0.2)
      }

      #identity-box.chromeUI:hover #identity-icon-box {
        background-color: rgba(50,150,250,0.3)
      }
    `;

    var sss = Cc['@mozilla.org/content/style-sheet-service;1'].getService(Ci.nsIStyleSheetService);
    var uri = makeURI('data:text/css;charset=UTF=8,' + encodeURIComponent(css));
    if(!sss.sheetRegistered(uri, sss.AUTHOR_SHEET))
      sss.loadAndRegisterSheet(uri, sss.AUTHOR_SHEET);

    const originalRefreshIdentityIcons = gIdentityHandler._refreshIdentityIcons;
    gIdentityHandler._refreshIdentityIcons = function() {
      originalRefreshIdentityIcons.call(this);
      if (!gIdentityHandler._identityIconLabel.value)
        gIdentityHandler._identityIconLabel.value = gIdentityHandler._identityIconLabel.tooltipText;
      if (gIdentityHandler._identityIconLabel.value)
        gIdentityHandler._identityIconLabel.collapsed = false;
    }
  }
})();