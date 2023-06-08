// ==UserScript==
// @name            Vertical tabs bar, Foxinity style
// @author          vufly
// @description     Vertical tabs bar, Foxinity style
// @version         2023-05-29 02:30  Initial
// ==/UserScript==
(function() {
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
// @ts-check

const VERTICAL_TABS_POSITION = 'pulse.tabs.vertical'
const VERTICAL_TABS_COLLAPSE = 'pulse.tabs.vertical.collapse'
const VERTICAL_TABS_WIDTH = 'pulse.tabs.vertical.width'

/**
 * @param {HTMLElement} toInsertAfter This is the element that I want to insert content after
 * @param {HTMLElement} toInsert The element to insert
 *
 * @throws {Error} If the element you want me to base insertions on has no parent
 */
function insertAfter(toInsertAfter, toInsert) {
  const parent = toInsertAfter.parentNode

  if (!parent) {
    throw new Error(
      'The element you want me to base insertions on has no parent'
    )
  }

  if (toInsertAfter.nextSibling) {
    parent.insertBefore(toInsert, toInsertAfter.nextSibling)
  } else {
    parent.appendChild(toInsert)
  }
}

/**
 * Replace a tag with another tag with a different name
 * @param {string} tagName The new tag name
 * @param {HTMLElement?} initialTag The tag to be changed
 */
function changeXULTagName(tagName, initialTag) {
  if (!initialTag) return
  if (initialTag.tagName == tagName) return

  const newParent = document.createXULElement(tagName)

  for (const attr of initialTag.attributes)
    newParent.setAttribute(attr.name, attr.value)
  while (initialTag.firstChild) newParent.appendChild(initialTag.firstChild)

  initialTag.replaceWith(newParent)
}

var VerticalTabs = {
  /**
   * @return {Boolean} true if the vertical tabs feature is enabled.
   */
  get verticalTabsEnabled() {
    return Services.prefs.getBoolPref(VERTICAL_TABS_POSITION, false)
  },

  /**
   * @return {HTMLElement?}
   */
  get tabsToolbar() {
    return document.getElementById('TabsToolbar')
  },

  /**
   * @return {HTMLElement?}
   */
  get titlebarContainer() {
    return document.getElementById('titlebar')
  },

  /**
   * @return {HTMLElement?}
   */
  get browserContainer() {
    return document.getElementById('browser')
  },

  /**
   * @return {HTMLElement?}
   */
  get splitter() {
    return document.getElementById('verticaltabs-splitter')
  },

  /**
   * @return {Boolean}
   */
  get browserCollapseTabs() {
    return Services.prefs.getBoolPref(VERTICAL_TABS_COLLAPSE, false)
  },

  /** @type {HTMLElement?} */
  arrowScrollbox: null,
  /** @type {HTMLElement?} */
  tabBrowserTabs: null,

  _initialized: false,
  /** @type {MutationObserver?} */
  _widthObserver: null,

  init() {
    if (this._initialized) {
      return
    }

    this.arrowScrollbox = document.getElementById('tabbrowser-arrowscrollbox')
    this.tabBrowserTabs = document.getElementById('tabbrowser-tabs')

    Services.prefs.addObserver(VERTICAL_TABS_POSITION, this)

    if (this.verticalTabsEnabled) {
      this.enableVerticalTabs()
    }

    this._initialized = true
  },

  enableVerticalTabs() {
    this.browserContainer?.prepend(this.tabsToolbar || '')

    this.arrowScrollbox?.setAttribute('orient', 'vertical')
    this.tabBrowserTabs?.setAttribute('orient', 'vertical')

    document
      .getElementById('navigator-toolbox-background')
      ?.setAttribute('verticaltabs', 'true')
    document
      .querySelector('#TabsToolbar .toolbar-items')
      ?.setAttribute('align', 'start')

    this.tabsToolbar?.setAttribute(
      'collapse',
      this.browserCollapseTabs ? 'true' : 'false'
    )
    this.tabsToolbar?.removeAttribute('flex')
    changeXULTagName('vbox', this.tabsToolbar)

    this._widthObserver = new MutationObserver(this._mutationObserverCallback)
    if (this.tabsToolbar)
      this._widthObserver.observe(this.tabsToolbar, { attributes: true })

    this.tabsToolbar?.setAttribute(
      'width',
      Services.prefs.getIntPref(VERTICAL_TABS_WIDTH, 200)
    )
    if (this.tabsToolbar)
      this.tabsToolbar.style.width = `${Services.prefs.getIntPref(
        VERTICAL_TABS_WIDTH,
        200
      )}px`

    if (!this.splitter) {
      const separator = document.createXULElement('splitter')
      separator.setAttribute('id', 'verticaltabs-splitter')
      separator.setAttribute(
        'class',
        'chromeclass-extrachrome verticaltabs-splitter'
      )
      separator.setAttribute('resizebefore', 'sibling')
      separator.setAttribute('resizeafter', 'none')

      const tabs = this.tabsToolbar
      if (tabs) insertAfter(tabs, separator)
    }
  },

  disableVerticalTabs() {
    this.titlebarContainer?.prepend(this.tabsToolbar || '')

    this.arrowScrollbox?.setAttribute('orient', 'horizontal')
    this.tabBrowserTabs?.setAttribute('orient', 'horizontal')

    document
      .getElementById('navigator-toolbox-background')
      ?.removeAttribute('verticaltabs')
    document
      .querySelector('#TabsToolbar .toolbar-items')
      ?.setAttribute('align', 'end')

    if (this.tabsToolbar) {
      changeXULTagName('toolbar', this.tabsToolbar)
      this.tabsToolbar.setAttribute('flex', '1')
      // Reset the resize value, or else the tabs will end up squished
      this.tabsToolbar.style.width = ''
    }

    if (this.splitter) {
      this.splitter.remove()
    }

    if (this._widthObserver) {
      this._widthObserver.disconnect()
      this._widthObserver = null
    }
  },

  /**
   * @param {MutationRecord[]} mutationsList
   * @param {MutationObserver} _observer
   */
  _mutationObserverCallback(mutationsList, _observer) {
    for (const mutation of mutationsList) {
      if (mutation.type === 'attributes' && mutation.attributeName == 'width') {
        const tabsToolbar = document.getElementById('TabsToolbar')

        Services.prefs.setIntPref(
          VERTICAL_TABS_WIDTH,
          parseInt(tabsToolbar?.getAttribute('width') || '100')
        )
      }
    }
  },

  /**
   * The handler for `Services.prefs.addObserver`.
   */
  observe(_subject, topic, data) {
    switch (topic) {
      case 'nsPref:changed':
        if (data === VERTICAL_TABS_POSITION) {
          if (this.verticalTabsEnabled) {
            this.enableVerticalTabs()
          } else {
            this.disableVerticalTabs()
          }
        }
        if (data === VERTICAL_TABS_COLLAPSE) {
          document
            .getElementById('TabsToolbar')
            ?.setAttribute(
              'collapse',
              this.browserCollapseTabs ? 'true' : 'false'
            )
        }

        break
    }
  },
}
window.VerticalTabs = VerticalTabs;
})();
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

    document.documentElement.setAttribute('foxinity', true);

    function observe(subject, topic, data) {
      switch (topic) {
        case 'vertical-tabs-pane-toggle':
          VerticalTabs.verticalTabsEnabled ? VerticalTabs.disableVerticalTabs() : VerticalTabs.enableVerticalTabs();
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