// ==UserScript==
// @name            Vertical tabs bar, Foxinity style
// @author          vufly
// @description     Vertical tabs bar, Foxinity style
// @version         2023-05-29 02:30  Initial
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

  function init() {
    document.documentElement.setAttribute('foxinity', true);

    var css = `
    #vertical-tabs-button {
      list-style-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="context-fill %230c0c0d"><path fill-opacity="context-fill-opacity" d="M2,7h3v6H2V7z"/><path d="M6,7v6H5V7H2V6h12v1H6z M13,1c1.657,0,3,1.343,3,3v8c0,1.657-1.343,3-3,3H3c-1.657,0-3-1.343-3-3V4c0-1.657,1.343-3,3-3H13z M3,3C2.448,3,2,3.448,2,4v8c0,0.6,0.4,1,1,1h10c0.6,0,1-0.4,1-1V4c0-0.6-0.4-1-1-1H3z"/></svg>');
      fill-opacity: 0.4;
    }

    #vertical-tabs-button:not([positionstart="true"]) .toolbarbutton-icon {
      transform: scaleX(-1);
    }

    #vertical-tabs-button[checked] {
      list-style-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="context-fill %230c0c0d"><path fill-opacity="context-fill-opacity" d="M2,3h12v3H2V3z"/><path d="M6,7v6H5V7H2V6h12v1H6z M13,1c1.657,0,3,1.343,3,3v8c0,1.657-1.343,3-3,3H3c-1.657,0-3-1.343-3-3V4c0-1.657,1.343-3,3-3H13z M3,3C2.448,3,2,3.448,2,4v8c0,0.6,0.4,1,1,1h10c0.6,0,1-0.4,1-1V4c0-0.6-0.4-1-1-1H3z"/></svg>');
      fill-opacity: 0.4;
    }
    `;

    var sss = Cc['@mozilla.org/content/style-sheet-service;1'].getService(Ci.nsIStyleSheetService);
    var uri = makeURI('data:text/css;charset=UTF=8,' + encodeURIComponent(css));
    if(!sss.sheetRegistered(uri, sss.AUTHOR_SHEET))
      sss.loadAndRegisterSheet(uri, sss.AUTHOR_SHEET);

    var vtbEnabled = false;
    var ref = /*document.getElementById('SM_toolbox') ||*/
              document.getElementById('sidebar-box') ||
              document.getElementById("appcontent");
    var vtbTabsToolbar = document.createXULElement('hbox');
    vtbTabsToolbar.setAttribute('id', 'vtb_TabsToolbar');
    document.getElementById("browser").insertBefore(vtbTabsToolbar, ref);
    var tabsToolbar = document.getElementById('TabsToolbar');
    var titlebar = document.getElementById('titlebar');

    //prepare for splitter
    var vtbSplitter = document.createXULElement('splitter');
    vtbSplitter.setAttribute('id', 'vtb_splitter');
    vtbSplitter.setAttribute('state', 'open');
    vtbSplitter.setAttribute('collapse', 'before');
    vtbSplitter.setAttribute('resizebefore', 'sibling');
    vtbSplitter.setAttribute('resizeafter', 'none');
    vtbSplitter.setAttribute('style', 'order:2;visibility:collapse');
    document.getElementById('browser').insertBefore(vtbSplitter, ref);

    //scrollbox
    var arrowScrollbox = gBrowser.tabContainer.arrowScrollbox;
    var scrollbox = arrowScrollbox.shadowRoot.querySelector('scrollbox');
    var scrollboxClip = arrowScrollbox.shadowRoot.querySelector('.scrollbox-clip');

    var originalLockTabSizing = gBrowser.tabContainer._lockTabSizing;

    function enableVerticalTabs() {
      vtbTabsToolbar.style.removeProperty('visibility');
      vtbSplitter.style.removeProperty('visibility');
      vtbTabsToolbar.appendChild(tabsToolbar);
      tabsToolbar.setAttribute('orient', 'vertical');
      tabsToolbar.querySelector('.toolbar-items').setAttribute('orient', 'vertical');
      tabsToolbar.querySelector('.toolbar-items').removeAttribute('align');
      tabsToolbar.querySelector('#TabsToolbar-customization-target').setAttribute('orient', 'vertical');

      // scrollbar
      gBrowser.tabContainer.setAttribute('orient', 'vertical');
      arrowScrollbox.setAttribute('orient', 'vertical');
      scrollbox.setAttribute('orient', 'vertical');
      scrollbox.style.setProperty('overflow-y', 'auto', '');
      scrollbox.style.setProperty('scrollbar-width', 'thin', '');
      scrollboxClip.style.setProperty('contain', 'unset', '');
      
      // ignore lock tab width when closing
      gBrowser.tabContainer._lockTabSizing = function (aTab, tabWidth){};

      vtbEnabled = true;
    }

    function disableVerticalTabs() {
      // ignore lock tab width when closing
      gBrowser.tabContainer._lockTabSizing = originalLockTabSizing;

      // scrollbar
      scrollboxClip.style.setProperty('contain', 'inline-size', '');
      scrollbox.style.removeProperty('scrollbar-width');
      scrollbox.style.removeProperty('overflow-y');
      scrollbox.setAttribute('orient', 'horizontal');
      arrowScrollbox.setAttribute('orient', 'horizontal');
      gBrowser.tabContainer.setAttribute('orient', 'horizontal');

      tabsToolbar.querySelector('#TabsToolbar-customization-target').removeAttribute('orient');
      tabsToolbar.querySelector('.toolbar-items').setAttribute('align', 'end');
      tabsToolbar.querySelector('.toolbar-items').removeAttribute('orient');
      tabsToolbar.setAttribute('orient', 'horizontal');
      vtbSplitter.style.setProperty('visibility', 'collapse');
      vtbTabsToolbar.style.setProperty('visibility', 'collapse');
      titlebar.appendChild(tabsToolbar);

      vtbEnabled = false;
    }

    function observe(subject, topic, data) {
      switch (topic) {
        case 'vertical-tabs-pane-toggle':
          vtbEnabled ? disableVerticalTabs() : enableVerticalTabs();
          break;
        case 'nsPref:changed':
        case 'nsPref:read':
          // _onPrefChanged(subject, data);
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

    const tabsPositionPref = "foxinity.tabs.position";
    const prefSvc = Services.prefs;

    Services.obs.addObserver(observe, 'vertical-tabs-pane-toggle');
    // prefSvc.addObserver(tabsPositionPref, observe);

    makeWidget();
    
    // create the main button that goes in the tabs toolbar and opens the pane.
    function makeWidget() {
      // if you create a widget in the first window, it will automatically be
      // created in subsequent videos. so we stop the script from re-registering
      // it on every subsequent window load.
      if (CustomizableUI.getPlacementOfWidget('vertical-tabs-button', true)) {
        return;
      }
      CustomizableUI.createWidget({
        id: 'vertical-tabs-button',
        type: 'button',
        defaultArea: CustomizableUI.AREA_TABSTRIP,
        label: 'Vertical Tabs',
        tooltiptext: 'Toggle vertical tabs',
        localized: false,
        onCommand() {
          Services.obs.notifyObservers(
            null,
            'vertical-tabs-pane-toggle',
            1
          );
        }
      });
    }
  }
})();