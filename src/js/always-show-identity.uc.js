// ==UserScript==
// @name            Always show identity value
// @author          vufly
// @description     Show indentity label if the identity-icon has a tooltip.
// @version         2024-02-16 17:45  Show subject organization in the tooltip as well.
// @version         2024-02-16 17:10  Show subject organization instead of CA organization.
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
      #identity-box.evCert #identity-icon-box {
        background-color: rgba(50,255,50,0.2)
      }

      #identity-box.evCert:hover #identity-icon-box {
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

    /**
     * Override the whole gIdentityHandler._refreshIdentityIcons function
     * Should be in sync with Firefox future updates.
     * https://searchfox.org/mozilla-central/source/browser/base/content/browser-siteIdentity.js#815
     */

    gIdentityHandler._refreshIdentityIcons = function() {
      let icon_label = "";
      let tooltip = "";
  
      let warnTextOnInsecure =
        this._insecureConnectionTextEnabled ||
        (this._insecureConnectionTextPBModeEnabled &&
          PrivateBrowsingUtils.isWindowPrivate(window));
  
      if (this._isSecureInternalUI) {
        // This is a secure internal Firefox page.
        this._identityBox.className = "chromeUI";
        let brandBundle = document.getElementById("bundle_brand");
        icon_label = brandBundle.getString("brandShorterName");
      } else if (this._pageExtensionPolicy) {
        // This is a WebExtension page.
        this._identityBox.className = "extensionPage";
        let extensionName = this._pageExtensionPolicy.name;
        icon_label = gNavigatorBundle.getFormattedString(
          "identity.extension.label",
          [extensionName]
        );
      } else if (this._uriHasHost && this._isSecureConnection) {
        // This is a secure connection.
        this._identityBox.className = "verifiedDomain";
        if (this._isMixedActiveContentBlocked) {
          this._identityBox.classList.add("mixedActiveBlocked");
        }
        if (!this._isCertUserOverridden) {
          const identityData = this.getIdentityData();
          const { subjectOrg, country } = identityData;
          const orgLabel = subjectOrg ? `${subjectOrg} (${country})` : '';
          // It's a normal cert, verifier is the CA Org.
          tooltip = (subjectOrg ? (orgLabel + '\n') : '') + gNavigatorBundle.getFormattedString(
            "identity.identified.verifier",
            [this.getIdentityData().caOrg]
          );
          icon_label = orgLabel;
          if (subjectOrg)
            this._identityBox.classList.add('evCert');
        }
      } else if (this._isBrokenConnection) {
        // This is a secure connection, but something is wrong.
        this._identityBox.className = "unknownIdentity";
  
        if (this._isMixedActiveContentLoaded) {
          this._identityBox.classList.add("mixedActiveContent");
          if (UrlbarPrefs.get("trimHttps") && warnTextOnInsecure) {
            icon_label = gNavigatorBundle.getString("identity.notSecure.label");
            this._identityBox.classList.add("notSecureText");
          }
        } else if (this._isMixedActiveContentBlocked) {
          this._identityBox.classList.add(
            "mixedDisplayContentLoadedActiveBlocked"
          );
        } else if (this._isMixedPassiveContentLoaded) {
          this._identityBox.classList.add("mixedDisplayContent");
        } else {
          this._identityBox.classList.add("weakCipher");
        }
      } else if (this._isCertErrorPage) {
        // We show a warning lock icon for certificate errors, and
        // show the "Not Secure" text.
        this._identityBox.className = "certErrorPage notSecureText";
        icon_label = gNavigatorBundle.getString("identity.notSecure.label");
        tooltip = gNavigatorBundle.getString("identity.notSecure.tooltip");
      } else if (this._isAboutHttpsOnlyErrorPage) {
        // We show a not secure lock icon for 'about:httpsonlyerror' page.
        this._identityBox.className = "httpsOnlyErrorPage";
      } else if (
        this._isAboutNetErrorPage ||
        this._isAboutBlockedPage ||
        this._isAssociatedIdentity
      ) {
        // Network errors, blocked pages, and pages associated
        // with another page get a more neutral icon
        this._identityBox.className = "unknownIdentity";
      } else if (this._isPotentiallyTrustworthy) {
        // This is a local resource (and shouldn't be marked insecure).
        this._identityBox.className = "localResource";
      } else {
        // This is an insecure connection.
        let className = "notSecure";
        this._identityBox.className = className;
        tooltip = gNavigatorBundle.getString("identity.notSecure.tooltip");
        icon_label = gNavigatorBundle.getString("identity.notSecure.label");
        if (warnTextOnInsecure) {
          this._identityBox.classList.add("notSecureText");
        }
      }
  
      if (this._isCertUserOverridden) {
        this._identityBox.classList.add("certUserOverridden");
        // Cert is trusted because of a security exception, verifier is a special string.
        tooltip = gNavigatorBundle.getString(
          "identity.identified.verified_by_you"
        );
      }
  
      // Push the appropriate strings out to the UI
      this._identityIcon.setAttribute("tooltiptext", tooltip);
  
      if (this._pageExtensionPolicy) {
        let extensionName = this._pageExtensionPolicy.name;
        this._identityIcon.setAttribute(
          "tooltiptext",
          gNavigatorBundle.getFormattedString("identity.extension.tooltip", [
            extensionName,
          ])
        );
      }
  
      this._identityIconLabel.setAttribute("tooltiptext", tooltip);
      this._identityIconLabel.setAttribute("value", icon_label);
      this._identityIconLabel.collapsed = !icon_label;
    };
  }
})();