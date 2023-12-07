// ==UserScript==
// @name            Sidebar Easy Switch
// @author          vufly
// @description     Bring out sidebar switcher as a panel.
// @version         2023-12-08 01:15  Fix overlay mode position
// @version         2023-11-26 05:20  Update behaviour when click menuitem
// @version         2023-11-26 04:45  Add overlay mode
// @version         2023-11-26 02:00  Fix the sidebar icon background color and tooltip text
// @version         2023-11-17 15:00  Fix the SVG fill in reverse position button
// @version         2023-07-09 02:00  Fix the SVG fill in context menu problem. Must update about:config
// @version         2023-07-09 01:00  Workaround for menuitem background style in MacOS
// @version         2023-07-07 18:30  Breaking change in Firefox 116
// @version         2023-06-08 03:00  Change CSS config to avoid using !important
// @version         2023-06-08 02:00  Dynamic sidebar minWidth
// @version         2023-06-01 22:30  Collapse/Expand sidebar
// @version         2023-05-31 18:30  Initial
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
    SIDEBAR_WIDTH: 350,
    SIDEBAR_MIN_WIDTH: 43,
  }

  function init() {
    var css = `
    :root[foxinity] #sidebar-switcher-target,
    :root[foxinity] #sidebar-throbber,
    :root[foxinity] #sidebar-spacer,
    :root[foxinity] #sidebar-close {
      display: none;
    }

    :root[foxinity] #sidebar-box {
      max-width: 99vw;
    }

    :root[foxinity] #sidebar-box[sb-collapsed] ~ #sidebar-splitter {
      display: none;
    }

    #sidebar-box[overlay] {
      z-index: 1;
    }

    #sidebar-box[overlay]:not([sb-collapsed="true"]):not([positionend="true"]) {
      margin-inline-end: calc(var(--collapsed-sb-width) - var(--sb-width));
    }

    #sidebar-box[overlay]:not([sb-collapsed="true"])[positionend="true"] {
      margin-inline-start: calc(var(--collapsed-sb-width) - var(--sb-width));
    }

    #sidebar-box.animating {
      transition-property: width, margin;
      transition-timing-function: ease-out, ease-out;
      transition-duration: 0.2s, 0.2s;
    }

    :root[foxinity] #sidebar-header {
      font-size: 1em;
      padding: 8px 5px;
      background: var(--toolbar-bgcolor);
    }

    #sidebar-box[positionend="true"] #sidebar-header {
      -moz-box-ordinal-group: 2;
      order: 2;
      border-left: solid 1px color-mix(in srgb, currentColor 25%, transparent);
    }

    #sidebar-box:not([positionend="true"]) #sidebar-header {
      border-right: solid 1px color-mix(in srgb, currentColor 25%, transparent);
    }

    #sidebarMenu-popup {
      height: 100%;
      position: relative;
    }

    :root[foxinity] #sidebarMenu-popup > menuitem {
      min-width: unset;
      margin: 2px 0;
      padding: var(--arrowpanel-menuitem-padding);
      border-radius: var(--arrowpanel-menuitem-border-radius);
      position: relative;
      align-items: center;
      justify-content: center;
    }

    :root[foxinity] #sidebarMenu-popup > menuitem::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border-radius: var(--arrowpanel-menuitem-border-radius);
    }

    :root[foxinity] #sidebarMenu-popup > menuitem > hbox {
      z-index: 1;
    }

    :root[foxinity] #sidebarMenu-popup > menuitem:hover::before {
      background-color: var(--panel-item-hover-bgcolor);
    }

    #sidebarMenu-popup menuitem.active::before {
      box-shadow: 0 0 4px rgba(0,0,0,.4);
      background-color: var(--tab-selected-bgcolor);
      background-repeat: repeat-x;
      background-size: auto 100%, auto 100%, auto auto;
    }

    :root[foxinity] #sidebarMenu-popup .menu-iconic > .menu-iconic-left,
    :root[foxinity] #sidebarMenu-popup .menuitem-iconic > .menu-iconic-left {
      padding-top: unset;
      margin-inline-end: unset !important;
    }

    :root[foxinity] #sidebarMenu-popup > menuseparator {
      padding-inline: unset !important;
    }

    :root[foxinity] #sidebarMenu-popup menuitem image {
      margin-inline-end: unset;
    }

    #sidebar-box #sidebar-collapse image {
      list-style-image: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M11.92,19.92L4,12L11.92,4.08L13.33,5.5L7.83,11H22V13H7.83L13.34,18.5L11.92,19.92M4,12V2H2V22H4V12Z" fill="context-fill" fill-opacity="context-fill-opacity"/></svg>');
    }

    #sidebar-box[sb-collapsed] #sidebar-collapse image {
      list-style-image: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M4,2H2V22H4V13H18.17L12.67,18.5L14.08,19.92L22,12L14.08,4.08L12.67,5.5L18.17,11H4V2Z" fill="context-fill" fill-opacity="context-fill-opacity"/></svg>');
    }

    #sidebar-box[positionend="true"] #sidebar-collapse image {
      list-style-image: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12.08,4.08L20,12L12.08,19.92L10.67,18.5L16.17,13H2V11H16.17L10.67,5.5L12.08,4.08M20,12V22H22V2H20V12Z" fill="context-fill" fill-opacity="context-fill-opacity"/></svg>');
    }

    #sidebar-box[positionend="true"][sb-collapsed] #sidebar-collapse image {
      list-style-image: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M20,22H22V2H20V11H5.83L11.33,5.5L9.92,4.08L2,12L9.92,19.92L11.33,18.5L5.83,13H20V22Z" fill="context-fill" fill-opacity="context-fill-opacity"/></svg>');
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

    :root[foxinity] #sidebarMenu-popup menuitem > label.menu-text,
    :root[foxinity] #sidebarMenu-popup menuitem > label.menu-iconic-text,
    :root[foxinity] #sidebarMenu-popup menuitem > hbox.menu-accel-container {
      display: none;
    }

    :root[foxinity] #sidebarMenu-popup toolbarbutton > label.toolbarbutton-text {
      display: none;
    }

    :root[foxinity] #sidebarMenu-popup toolbarbutton {
      margin: 0;
      min-width: unset;
      justify-content: center;
    }

    :root[foxinity] #sidebarMenu-popup image {
      -moz-context-properties: fill;
      fill: currentColor;
    }

    :root[foxinity] #sidebarMenu-popup toolbarseparator {
      -moz-appearance: none;
      border-top: solid 1px color-mix(in srgb, currentColor 25%, transparent);
    }
    `
    var sss = Cc['@mozilla.org/content/style-sheet-service;1'].getService(Ci.nsIStyleSheetService);
    var uri = makeURI('data:text/css;charset=UTF=8,' + encodeURIComponent(css));
    if(!sss.sheetRegistered(uri, sss.AUTHOR_SHEET))
      sss.loadAndRegisterSheet(uri, sss.AUTHOR_SHEET);

    document.documentElement.setAttribute('foxinity', true);

    // Move all children from the original popup to the box
    const switcherBox = document.createXULElement('vbox');
    SidebarUI._header = document.getElementById('sidebar-header');
    while (SidebarUI._switcherPanel.firstChild) {
      const child = SidebarUI._switcherPanel.firstChild;
      if (child.tagName.toLowerCase() === 'menuitem') {
        const commandString = child.getAttribute('oncommand');
        if (commandString?.startsWith('SidebarUI.show'))
          child.setAttribute('oncommand', commandString.replace('SidebarUI.show', 'SidebarUI.toggle'));
        setTimeout(() => child.tooltipText = child.getAttribute('label'), 500);
      }
      setTimeout(() => {
        if (child.tagName.toLowerCase() === 'menuitem' && child.firstChild?.tagName.toLowerCase() !== 'hbox') {
          const hbox = document.createXULElement('hbox');
          hbox.classList.add('menu-iconic-left');
          hbox.setAttribute('align', 'center');
          hbox.setAttribute('pack', 'center');
          hbox.setAttribute('aria-hidden', true);

          const image = document.createXULElement('image');
          image.classList.add('menu-iconic-icon');
          hbox.append(image);
          child.insertBefore(hbox, child.firstChild);
          child.classList.add('menuitem-iconic', 'webextension-menuitem');
        }
      }, 500);
      switcherBox.append(child);
    }

    // SidebarUI._switcherPanel.remove();
    switcherBox.setAttribute('id', 'sidebarMenu-popup');
    switcherBox.setAttribute('context', 'foxinity-sidebar-context-menu');
    SidebarUI._header.append(switcherBox);
    SidebarUI._switcherPanel = switcherBox;
    SidebarUI.hideSwitcherPanel = () => {};
    updateReverseLabel();

    //Update label of move sidebar to left/right
    const originalSetPosition = SidebarUI.setPosition;
    SidebarUI.setPosition = function() {
      originalSetPosition.call(this);
      updateReverseLabel();
    }

    const originalReversePosition = SidebarUI.reversePosition;
    SidebarUI.reversePosition = function() {
      originalReversePosition.call(this);
      updateReverseLabel();
    }

    function updateReverseLabel() {
      const label =
        SidebarUI._positionStart == RTL_UI
          ? gNavigatorBundle.getString('sidebar.moveToLeft')
          : gNavigatorBundle.getString('sidebar.moveToRight');
      SidebarUI._reversePositionButton.setAttribute('label', label);
      SidebarUI._reversePositionButton.tooltipText = label;
    }

    //Add spring space so reverse button will be in bottom
    const reverseButton = SidebarUI._switcherPanel.querySelector('#sidebar-reverse-position');
    const spring = document.createXULElement('toolbarspring');
    SidebarUI._switcherPanel.insertBefore(spring, reverseButton);

    //Update tooltip text for extensions
    const originalUpdateShortcut = SidebarUI.updateShortcut;
    SidebarUI.updateShortcut = function(shortcut) {
      originalUpdateShortcut.call(this, shortcut);
      const { button } = shortcut;
      if (button)
        button.tooltipText = button.getAttribute('label');
    }

    //Toggle active state to highlight active sidebar icon button
    const originalShow = SidebarUI.show;
    SidebarUI.show = function(commandId, triggerNode) {
      toggleActive(commandId);
      setCollapsedState(false);
      return originalShow.call(this, commandId, triggerNode);
    }

    const originalShowInitially = SidebarUI.showInitially;
    SidebarUI.showInitially = function(commandId) {
      toggleActive(commandId);
      setCollapsedState(false);
      return originalShowInitially.call(this, commandId);
    }

    SidebarUI.toggle = function(commandID = this.lastOpenedId, triggerNode) {
      if (
        CustomizationHandler.isCustomizing() ||
        CustomizationHandler.isExitingCustomizeMode
      ) {
        return Promise.resolve();
      }
      // First priority for a default value is this.lastOpenedId which is set during show()
      // and not reset in hide(), unlike currentID. If show() hasn't been called and we don't
      // have a persisted command either, or the command doesn't exist anymore, then
      // fallback to a default sidebar.
      if (!commandID) {
        commandID = this._box.getAttribute("sidebarcommand");
      }
      if (!commandID || !this.sidebars.has(commandID)) {
        commandID = this.DEFAULT_SIDEBAR_ID;
      }
  
      if (this.isOpen && commandID == this.currentID) {
        // this.hide(triggerNode);
        SidebarUI.toggleCollapse();
        return Promise.resolve();
      }
      return this.show(commandID, triggerNode);
    };

    function toggleActive(commandId) {
      Array.from(SidebarUI._switcherPanel.querySelectorAll('menuitem[id]'))
        .forEach(button => {
          button.classList.remove('active');
          if (button.getAttribute('oncommand')?.includes(commandId))
            button.classList.add('active');
        });
    }

    SidebarUI._header.addEventListener('dblclick', () => {
      SidebarUI.toggleCollapse();
    });

    //Change the direction of items
    SidebarUI._box.setAttribute('orient', 'horizontal');
    SidebarUI._header.setAttribute('orient', 'vertical');

    //Create collapse toolbarbutton
    const toolbarbutton = document.createXULElement('toolbarbutton');
    toolbarbutton.setAttribute('id', 'sidebar-collapse');
    toolbarbutton.setAttribute('label', 'Collapse');
    toolbarbutton.setAttribute('oncommand', 'SidebarUI.toggleCollapse();');
    toolbarbutton.classList.add('subviewbutton', 'subviewbutton-iconic');
    toolbarbutton.setAttribute('key', 'sidebarCollapseBtn');
    SidebarUI._collapseButton = toolbarbutton;
    SidebarUI._switcherPanel.insertBefore(document.createXULElement('toolbarseparator'), SidebarUI._switcherPanel.firstChild);
    SidebarUI._switcherPanel.insertBefore(toolbarbutton, SidebarUI._switcherPanel.firstChild);

    SidebarUI.toggleCollapse = function() {
      SidebarUI._box.hasAttribute('sb-collapsed') ? expand() : collapse();
      SidebarUI._box.classList.add('animating');
      setTimeout(() => SidebarUI._box.classList.remove('animating'), 200);
    }

    function collapse() {
      var width = parseInt(SidebarUI._box.style.width);
      SidebarUI._box.setAttribute('width', width);
      
      SidebarUI._box.style.width = SidebarUI._header.getBoundingClientRect().width + 'px';
      SidebarUI._box.setAttribute('sb-collapsed', 'true');
    }

    function expand() {
      var width = SidebarUI._box.getAttribute('width') || DEFAULT.SIDEBAR_WIDTH;
      SidebarUI._box.style.width = width + 'px';
      SidebarUI._box.removeAttribute('sb-collapsed');
    }

    function setWidth(width) {
      SidebarUI._box.setAttribute('width', width);
      
      if (SidebarUI._box.hasAttribute('sb-collapsed'))
        SidebarUI._box.style.width = SidebarUI._header.getBoundingClientRect().width + 'px';
      else
        SidebarUI._box.style.width = width + 'px';
    }

    function setCollapsedState(collapsed) {
      collapsed ? collapse() : expand();
    }

    function setOverlayState(overlay) {
      if (overlay) {
        browser.style.setProperty('--sb-width', SidebarUI._box.getAttribute('width') + 'px');
        contextMenu.menuitemOverlay.setAttribute("checked", true);
        SidebarUI._box.setAttribute("overlay", true);
      } else {
        contextMenu.menuitemOverlay.removeAttribute("checked");
        SidebarUI._box.removeAttribute("overlay");
      }
    }
    SidebarUI.setOverlayState = setOverlayState;

    const contextMenu = document.getElementById('mainPopupSet').appendChild(
      create(document, "menupopup", {
        id: "foxinity-sidebar-context-menu",
      })
    );

    contextMenu.menuitemOverlay = contextMenu.appendChild(
      create(document, "menuitem", {
        id: "foxinity-sidebar-context-overlay",
        label: 'Overlay Sidebar',
        type: "checkbox",
        oncommand: `SidebarUI.setOverlayState(this.hasAttribute("checked"));`,
      })
    );

    const collapsedPref = "foxinity.sidebar.collapsed";
    const widthPref = "foxinity.sidebar.width";
    const overlayPref = 'foxinity.sidebar.overlay';
    const prefSvc = Services.prefs;

    //On last window close, save sidebar states to pref
    const originalOnUnload = gBrowserInit.onUnload;
    gBrowserInit.onUnload = function() {
      originalOnUnload.call(this);
      uninit();
    }
    window.onunload = gBrowserInit.onUnload.bind(gBrowserInit);

    function uninit() {
      const enumerator = Services.wm.getEnumerator("navigator:browser");
      if (!enumerator.hasMoreElements()) {
        prefSvc.setBoolPref(collapsedPref, SidebarUI._box.hasAttribute('sb-collapsed'));
        prefSvc.setIntPref(widthPref, parseInt(SidebarUI._box.getAttribute('width')) || DEFAULT.SIDEBAR_WIDTH);
        prefSvc.setBoolPref(overlayPref, SidebarUI._box.hasAttribute('overlay'));
      }
    }

    const readPref = pref => observe(prefSvc, "nsPref:read", pref);

    // When new window load, try to read sidebar states from last window
    SessionStore.promiseInitialized.then(() => {
      if (window.closed) return;
      const collapsedWidth = SidebarUI._header.getBoundingClientRect().width + 'px';
      SidebarUI._box.style.minWidth = collapsedWidth;
      const browser = document.getElementById('browser');
      browser.style.setProperty('--collapsed-sb-width', collapsedWidth);
      const sourceWindow = window.opener;
        if (
          sourceWindow &&
          !sourceWindow.closed &&
          sourceWindow.location.protocol == "chrome:" &&
          _adoptFromWindow(sourceWindow)
        ) {
          return;
        }
      //Otherwise read from pref
      readPref(widthPref);
      readPref(collapsedPref);
      readPref(overlayPref);
    });

    function _adoptFromWindow(sourceWindow) {
      const sourceBox = sourceWindow?.SidebarUI?._box;
      if (sourceBox) {
        const collapsed = sourceBox.hasAttribute('sb-collapsed');
        const width = sourceBox.getAttribute('width') || DEFAULT.SIDEBAR_WIDTH;
        const overlay = sourceBox.hasAttribute('overlay');
        setWidth(width);
        setCollapsedState(collapsed);
        setOverlayState(overlay);
      }
      return true;
    }

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
        case widthPref:
          value = value || DEFAULT.SIDEBAR_WIDTH;
          setWidth(value);
          break;
        case collapsedPref:
          setCollapsedState(value);
          break;
        case overlayPref:
          setOverlayState(value);
          break;
      }
    }

    /**
     * create a DOM node with given parameters
     * @param {object} aDoc (which document to create the element in)
     * @param {string} tag (an HTML tag name, like "button" or "p")
     * @param {object} props (an object containing attribute name/value pairs,
     *                       e.g. class: ".bookmark-item")
     * @param {boolean} isHTML (if true, create an HTML element. if omitted or
     *                         false, create a XUL element. generally avoid HTML
     *                         when modding the UI, most UI elements are actually
     *                         XUL elements.)
     * @returns the created DOM node
     */
    function create(aDoc, tag, props, isHTML = false) {
      let el = isHTML ? aDoc.createElement(tag) : aDoc.createXULElement(tag);
      for (let prop in props) {
        el.setAttribute(prop, props[prop]);
      }
      return el;
    }
  } 
})();