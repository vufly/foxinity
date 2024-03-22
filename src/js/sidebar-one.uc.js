// ==UserScript==
// @name            Sidebar One
// @author          vufly
// @description     A solution to strongly enhance the original sidebar of firefox.
// @version         2024-02-23 21:45  Initial
// ==/UserScript==
(function () {
  // wait for delayed startup for some parts of the script to execute.
  if (gBrowserInit.delayedStartupFinished) {
    init();
  } else {
    const delayedListener = (subject, topic) => {
      if (topic == 'browser-delayed-startup-finished' && subject == window) {
        Services.obs.removeObserver(delayedListener, topic);
        init();
      }
    };
    Services.obs.addObserver(
      delayedListener,
      'browser-delayed-startup-finished'
    );
  }

  const DEFAULT = {
    SIDEBAR_BOX_WIDTH: 350,
    SIDEBAR_MIN_WIDTH: 0
  }

  const SIDEBAR_ONE = {
    all: new Map,
    list: []
  }

  function init() {
    const css = `
    :root[foxinity] #sidebar-throbber,
    :root[foxinity] #sidebar-spacer,
    :root[foxinity] #sidebar-close,
    :root[foxinity] #sidebar-title, 
    :root[foxinity] #sidebar-switcher-arrow {
      display: none;
    }

    :root[foxinity] #sidebar-switcher-target {
      flex: 0;
    }

    :root[foxinity] #sidebar-splitter {
      z-index: 2;
      margin-top: var(--bookmarks-toolbar-overlapping-browser-height);
    }

    :root[foxinity] #sidebar-box {
      max-width: 99vw;
      flex-direction: row;
    }

    :root[foxinity] #sidebar-box:not([positionend="true"]) {
      flex-direction: row-reverse;
    }

    :root[foxinity] #sidebar-header {
      background: var(--toolbar-bgcolor);
      padding: 2px 4px;
      position: absolute;
      z-index: -1;
      opacity: 0;
      transition: opacity 0.2s ease-in-out;
    }

    #sidebar-box:not([positionend="true"]) #sidebar-header {
      inset-inline-start: 100%;
      border-bottom-right-radius: var(--arrowpanel-menuitem-border-radius);
    }

    #sidebar-box[positionend="true"] #sidebar-header {
      inset-inline-end: 100%;
      border-bottom-left-radius: var(--arrowpanel-menuitem-border-radius);
    }

    #sidebar-box:hover #sidebar-header,
    #browser:has(#sidebar-splitter:hover) #sidebar-header,
    #sidebarMenu-popup:hover #sidebar-header {
      z-index: 1;
      opacity: 1;
    }

    #sidebar-collapse,
    #sidebar-settings,
    #sidebar-switcher-target {
      margin: 0;
      padding: 6px 6px;
    }


    #sidebarMenu-popup #sidebar-switcher-bookmarks {
      --webextension-menuitem-image: url(chrome://browser/skin/bookmark.svg);
      --webextension-menuitem-image-2x: url(chrome://browser/skin/bookmark.svg);
    }

    #sidebarMenu-popup #sidebar-switcher-history {
      --webextension-menuitem-image: url(chrome://browser/skin/history.svg);
      --webextension-menuitem-image-2x: url(chrome://browser/skin/history.svg);
    }

    #sidebarMenu-popup #sidebar-switcher-tabs {
      --webextension-menuitem-image: url(chrome://browser/skin/synced-tabs.svg);
      --webextension-menuitem-image-2x: url(chrome://browser/skin/synced-tabs.svg);
    }

    #sidebarMenu-popup #sidebar-reverse-position {
      --webextension-menuitem-image: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="2 3 20 18"><path d="M8,10V13H14V18H8V21L2,15.5L8,10M22,8.5L16,3V6H10V11H16V14L22,8.5Z" fill="context-fill" fill-opacity="context-fill-opacity"/></svg>');
      --webextension-menuitem-image-2x: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="2 3 20 18"><path d="M8,10V13H14V18H8V21L2,15.5L8,10M22,8.5L16,3V6H10V11H16V14L22,8.5Z" fill="context-fill" fill-opacity="context-fill-opacity"/></svg>');
    }

    #sidebarMenu-popup [data-l10n-id="sidebar-menu-close"] {
      --webextension-menuitem-image: url(chrome://global/skin/icons/close.svg);
      --webextension-menuitem-image-2x: url(chrome://global/skin/icons/close.svg);
    }

    :root[foxinity] #sidebarMenu-popup image {
      -moz-context-properties: fill;
      fill: currentColor;
    }

    :root[foxinity] #sidebar-box:not([positionend="true"]) #sidebar-header {
      flex-direction: row-reverse;
    }
    #sidebar-box #sidebar-collapse > image {
      list-style-image: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M11.92,19.92L4,12L11.92,4.08L13.33,5.5L7.83,11H22V13H7.83L13.34,18.5L11.92,19.92M4,12V2H2V22H4V12Z" fill="context-fill" fill-opacity="context-fill-opacity"/></svg>');
    }

    #sidebar-box[positionend="true"] #sidebar-collapse > image {
      list-style-image: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12.08,4.08L20,12L12.08,19.92L10.67,18.5L16.17,13H2V11H16.17L10.67,5.5L12.08,4.08M20,12V22H22V2H20V12Z" fill="context-fill" fill-opacity="context-fill-opacity"/></svg>');
    }

    #sidebar-settings > image {
      list-style-image: url(chrome://global/skin/icons/settings.svg);
    }

    #sidebar-collapse > .toolbarbutton-text,
    #sidebar-settings > .toolbarbutton-text {
      display: none;
    }

    `;
    const sss = Cc['@mozilla.org/content/style-sheet-service;1'].getService(Ci.nsIStyleSheetService);
    const uri = makeURI('data:text/css;charset=UTF=8,' + encodeURIComponent(css));
    if (!sss.sheetRegistered(uri, sss.AUTHOR_SHEET))
      sss.loadAndRegisterSheet(uri, sss.AUTHOR_SHEET);

    document.documentElement.setAttribute('foxinity', true);

    SidebarUI._header = document.getElementById('sidebar-header');
    SidebarUI._header.setAttribute('orient', 'vertical');

    Array.from(SidebarUI._switcherPanel.children).forEach(child => {
      if (child.tagName.toLowerCase() === 'menuitem' && child.firstChild?.tagName.toLowerCase() !== 'hbox') {
        const hbox = dom.hbox(document, false, {
          class: 'menu-iconic-left',
          align: 'center',
          pack: 'center',
          'aria-hidden': true
        }, dom.image(document, false, {
          class: 'menu-iconic-icon'
        }));
        child.insertBefore(hbox, child.firstChild);
        child.classList.add('menuitem-iconic', 'webextension-menuitem');
      }
    });

    // Create sidebar collapse toolbarbutton
    SidebarUI._collapseButton = dom.toolbarbutton(document, false, {
      id: 'sidebar-collapse',
      label: 'Collapse',
      tooltiptext: 'Collapse',
      oncommand: 'SidebarUI.toggleCollapse();',
      class: 'subviewbutton subviewbutton-iconic',
      key: 'sidebarCollapseBtn'
    });
    SidebarUI._header.insertBefore(SidebarUI._collapseButton, SidebarUI._header.firstChild);
  
    SidebarUI.toggleCollapse = function () {
      // SidebarUI._box.hasAttribute('sb-collapsed') ? expand() : collapse();
      console.log('toggle collapsed');
      SidebarUI._box.classList.add('animating');
      setTimeout(() => SidebarUI._box.classList.remove('animating'), 200);
    }

    // Create sidebar settings toolbarbutton
    SidebarUI._settingsButton = dom.toolbarbutton(document, false, {
      id: 'sidebar-settings',
      label: 'Settings',
      tooltiptext: 'Settings',
      oncommand: 'console.log("Sidebar settings");',
      class: 'subviewbutton subviewbutton-iconic',
      key: 'sidebarSettingsBtn'
    });
    SidebarUI._header.append(SidebarUI._settingsButton);

    // SidebarUI._floatPanel = dom.vbox(document, false, {
    //   id: 'sidebar-float'
    // })

    // SidebarUI._box.append(SidebarUI._floatPanel);

    function readSidebarPref(prefString) {
      SIDEBAR_ONE.all = SidebarUI._sidebars;
      try {
        const prefObj = JSON.parse(prefString);
        const entries = Object.entries(prefObj.all);
        entries.forEach(([sidebarId, pref]) => {
          SIDEBAR_ONE.all.get(sidebarId).width = pref.width;
        });
      } catch (error) {
        console.error(error);
      }
    }

    function getSidebarPrefString() {
      const all = {};
      SidebarUI._sidebars.forEach((sidebar, id) => {
        all[id] = {
          width: sidebar.width
        };
      });
      return JSON.stringify({
        all,
        list: []
      });
    }

    const onePref = 'foxinity.sidebar.one';
    const prefSvc = Services.prefs;

    //On last window close, save sidebar states to pref
    const originalOnUnload = gBrowserInit.onUnload;
    gBrowserInit.onUnload = function () {
      originalOnUnload.call(this);
      uninit();
    }
    window.onunload = gBrowserInit.onUnload.bind(gBrowserInit);

    function uninit() {
      const enumerator = Services.wm.getEnumerator("navigator:browser");
      if (!enumerator.hasMoreElements()) {
        console.log(getSidebarPrefString());
        // prefSvc.setBoolPref(collapsedPref, SidebarUI._box.hasAttribute('sb-collapsed'));
        // prefSvc.setIntPref(widthPref, parseInt(SidebarUI._box.getAttribute('width')) || DEFAULT.SIDEBAR_BOX_WIDTH);
        // prefSvc.setBoolPref(overlayPref, SidebarUI._box.hasAttribute('overlay'));
        prefSvc.setStringPref(onePref, getSidebarPrefString());

      }
    }


    const readPref = pref => observe(prefSvc, 'nsPref:read', pref);

    // When new window load, try to read sidebar states from last window
    SessionStore.promiseInitialized.then(() => {
      if (window.closed) return;
      const collapsedWidth = SidebarUI._header.getBoundingClientRect().width + 'px';
      SidebarUI._box.style.minWidth = collapsedWidth;
      // const browser = document.getElementById('browser');
      // browser.style.setProperty('--collapsed-sb-width', collapsedWidth);
      // const sourceWindow = window.opener;
      // if (
      //   sourceWindow &&
      //   !sourceWindow.closed &&
      //   sourceWindow.location.protocol == "chrome:" &&
      //   _adoptFromWindow(sourceWindow)
      // ) {
      //   return;
      // }
      // //Otherwise read from pref
      // readPref(widthPref);
      // readPref(collapsedPref);
      // readPref(overlayPref);
      readPref(onePref);
    });

    function observe(subject, topic, data) {
      switch (topic) {
        case 'nsPref:changed':
        case 'nsPref:read':
          _onPrefChanged(subject, data);
          break;
      }
    }

    function _getPref(root, pref) {
      switch (root.getPrefType(pref)) {
        case root.PREF_BOOL:
          return root.getBoolPref(pref);
        case root.PREF_INT:
          return root.getIntPref(pref);
        case root.PREF_STRING:
          return root.getStringPref(pref);
        default:
          return null;
      }
    }

    function _onPrefChanged(sub, pref) {
      let value = _getPref(sub, pref);
      switch (pref) {
        case onePref:
          console.log('changePref');
          readSidebarPref(value);
          break;
      }
    }
  }

  var dom = (_ => {
    var fns = new Map;
    var getPrototypeOf = Object.getPrototypeOf;
    var objPrototype = getPrototypeOf({});
    var camelCaseRegex = /([A-Z])/g;

    function create(name, aDoc, isHTML = false, attributes = {}, ...children) {
      var element = aDoc[isHTML ? 'createElement' : 'createXULElement'](name.replaceAll(camelCaseRegex, '-$1').toLowerCase());
      if (getPrototypeOf(attributes) === objPrototype)
        Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
      else
        element.append(attributes);

      element.append(...children)
      return element;
    }

    return new Proxy(create, {
      get(target, name) {
        var fn = fns.get(name);
        if (!fn) {
          fn = create.bind(null, name);
          fns.set(name, fn);
        }
        return fn;
      }
    });
  })();


})();