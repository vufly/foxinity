// ==UserScript==
// @name            Sidebar Easy Switch
// @author          vufly
// @description     Bring out sidebar switcher as a panel.
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

    #sidebar-box.animating {
      transition: width 0.2s ease-out;
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
    }

    :root[foxinity] #sidebarMenu-popup > menuitem {
      min-width: unset;
      padding: var(--arrowpanel-menuitem-padding);
      border-radius: var(--arrowpanel-menuitem-border-radius);
    }

    :root[foxinity] #sidebarMenu-popup > menuitem:not([disabled]):hover {
      color: inherit;
      background-color: var(--panel-item-hover-bgcolor);
    }

    :root[foxinity] #sidebarMenu-popup .menu-iconic > .menu-iconic-left,
    :root[foxinity] #sidebarMenu-popup .menuitem-iconic > .menu-iconic-left {
      padding-top: unset;
      margin-inline-end: unset !important;
    }

    :root[foxinity] #sidebarMenu-popup > menuseparator {
      padding-inline: unset !important;
    }

    #sidebarMenu-popup #sidebar-collapse image,
    #sidebarMenu-popup #sidebar-switcher-bookmarks image,
    #sidebarMenu-popup #sidebar-switcher-history image,
    #sidebarMenu-popup #sidebar-switcher-tabs image,
    #sidebarMenu-popup #sidebar-reverse-position image,
    #sidebarMenu-popup [data-l10n-id="sidebar-menu-close"] image {
      fill: currentColor;
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
      --webextension-menuitem-image: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="2 3 20 18"><path d="M8,10V13H14V18H8V21L2,15.5L8,10M22,8.5L16,3V6H10V11H16V14L22,8.5Z" fill="currentColor" fill-opacity="var(--context-fill-opacity)"/></svg>');
      --webextension-menuitem-image-2x: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="2 3 20 18"><path d="M8,10V13H14V18H8V21L2,15.5L8,10M22,8.5L16,3V6H10V11H16V14L22,8.5Z" fill="currentColor" fill-opacity="var(--context-fill-opacity)"/></svg>');
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

    #sidebarMenu-popup menuitem.active {
      box-shadow: 0 0 4px rgba(0,0,0,.4);
      background-image: linear-gradient(var(--lwt-selected-tab-background-color, transparent), var(--lwt-selected-tab-background-color, transparent)), linear-gradient(var(--toolbar-bgcolor), var(--toolbar-bgcolor)), var(--lwt-header-image, none);
      background-position: 0 0, 0 0, right top;
      background-repeat: repeat-x, repeat-x, no-repeat;
      background-size: auto 100%, auto 100%, auto auto;
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
    const switcherBox = document.createXULElement('box');
    SidebarUI._header = document.getElementById('sidebar-header');
    while (SidebarUI._switcherPanel.firstChild) {
      const child = SidebarUI._switcherPanel.firstChild;
      if (child.tagName.toLowerCase() === 'toolbarbutton') {
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
    switcherBox.setAttribute('orient', 'vertical');
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
      return originalShow.call(this, commandId, triggerNode);
    }

    const originalShowInitially = SidebarUI.showInitially;
    SidebarUI.showInitially = function(commandId) {
      toggleActive(commandId);
      return originalShowInitially.call(this, commandId);
    }

    function toggleActive(commandId) {
      console.log(commandId);
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
      SidebarUI._box.getAttribute('sb-collapsed') ? expand() : collapse();
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
      
      if (SidebarUI._box.getAttribute('sb-collapsed'))
        SidebarUI._box.style.width = SidebarUI._header.getBoundingClientRect().width + 'px';
      else
        SidebarUI._box.style.width = width + 'px';
    }

    function setCollapse(collapsed) {
      collapsed ? collapse() : expand();
    }

    const collapsedPref = "foxinity.sidebar.collapsed";
    const widthPref = "foxinity.sidebar.width";
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
        prefSvc.setBoolPref(collapsedPref, SidebarUI._box.getAttribute('sb-collapsed') || false);
        prefSvc.setIntPref(widthPref, parseInt(SidebarUI._box.getAttribute('width')) || DEFAULT.SIDEBAR_WIDTH);
      }
    }

    const readPref = pref => observe(prefSvc, "nsPref:read", pref);

    // When new window load, try to read sidebar states from last window
    SessionStore.promiseInitialized.then(() => {
      if (window.closed) return;
      SidebarUI._box.style.minWidth = SidebarUI._header.getBoundingClientRect().width + 'px';
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
    });

    function _adoptFromWindow(sourceWindow) {
      const sourceBox = sourceWindow?.SidebarUI?._box;
      if (sourceBox) {
        const collapsed = sourceBox.getAttribute('sb-collapsed') || false;
        const width = sourceBox.getAttribute('width') || DEFAULT.SIDEBAR_WIDTH;
        setWidth(width);
        setCollapse(collapsed);
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
          setCollapse(value);
          break;
      }
    }
  } 
})();