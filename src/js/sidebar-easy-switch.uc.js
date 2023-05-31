// ==UserScript==
// @name            Sidebar easy switch
// @author          vufly
// @description     Bring out sidebar switcher as a panel.
// @version         2023-06-31 18:30  Initial
// ==/UserScript==
(function () {
  // wait for delayed startup for some parts of the script to execute.
  if (gBrowserInit.delayedStartupFinished) {
    init();
  } else {
    let delayedListener = (subject, topic) => {
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
    #sidebar-switcher-target,
    #sidebar-throbber,
    #sidebar-spacer {
      display: none !important;
    }

    #sidebar-box {
      max-width: 50vw !important;
    }

    #sidebar-box[positionend="true"] #sidebar-header {
      -moz-box-ordinal-group: 2;
      order: 2;
    }

    #sidebar-header {
      font-size: 1em !important;
      padding: 8px 4px !important;
      background: var(--toolbar-bgcolor) !important;
    }

    #sidebarMenu-popup {
      height: 100%;
    }

    #sidebarMenu-popup #sidebar-switcher-bookmarks image,
    #sidebarMenu-popup #sidebar-switcher-history image,
    #sidebarMenu-popup #sidebar-switcher-tabs image,
    #sidebarMenu-popup #sidebar-reverse-position image,
    #sidebarMenu-popup [data-l10n-id="sidebar-menu-close"] image {
      -moz-context-properties: fill;
      fill: currentColor;
    }

    #sidebarMenu-popup #sidebar-switcher-bookmarks label,
    #sidebarMenu-popup #sidebar-switcher-history label,
    #sidebarMenu-popup #sidebar-switcher-tabs label,
    #sidebarMenu-popup #sidebar-reverse-position label,
    #sidebarMenu-popup [data-l10n-id="sidebar-menu-close"] label  {
      padding-inline-start: 8px !important;
    }

    #sidebarMenu-popup #sidebar-switcher-bookmarks image {
      list-style-image: url(chrome://browser/skin/bookmark.svg);
    }

    #sidebarMenu-popup #sidebar-switcher-history image {
      list-style-image: url(chrome://browser/skin/history.svg);
    }

    #sidebarMenu-popup #sidebar-switcher-tabs image {
      list-style-image: url(chrome://browser/skin/synced-tabs.svg);
    }

    #sidebarMenu-popup #sidebar-reverse-position image {
      list-style-image: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="2 3 20 18"><path d="M8,10V13H14V18H8V21L2,15.5L8,10M22,8.5L16,3V6H10V11H16V14L22,8.5Z" fill="currentColor" fill-opacity="var(--context-fill-opacity)"/></svg>');
    }

    #sidebarMenu-popup [data-l10n-id="sidebar-menu-close"] image {
      list-style-image: url(chrome://global/skin/icons/close.svg);
    }

    #sidebarMenu-popup toolbarbutton > label.toolbarbutton-text {
      display: none !important;
    }

    #sidebarMenu-popup toolbarbutton {
      margin: 0 !important;
      min-width: unset !important;
      justify-content: center !important;
    }

    #sidebarMenu-popup toolbarbutton.active {
      box-shadow: 0 0 4px rgba(0,0,0,.4);
    }

    #sidebarMenu-popup toolbarseparator {
      -moz-appearance: none !important;
      border-top: 1px solid color-mix(in srgb, currentColor 25%, transparent);
    }
    `
    var sss = Cc['@mozilla.org/content/style-sheet-service;1'].getService(Ci.nsIStyleSheetService);
    var uri = makeURI('data:text/css;charset=UTF=8,' + encodeURIComponent(css));
    if(!sss.sheetRegistered(uri, sss.AGENT_SHEET))
      sss.loadAndRegisterSheet(uri, sss.AGENT_SHEET);

    // Move all children from the original popup to the box
    const switcherBox = document.createXULElement('box');
    SidebarUI._header = document.getElementById('sidebar-header');
    while (SidebarUI._switcherPanel.firstChild) {
      const child = SidebarUI._switcherPanel.firstChild;
      if (child.tagName.toLowerCase() === 'toolbarbutton') {
        setTimeout(() => child.tooltipText = child.getAttribute('label'), 500);
      }
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
      let label =
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
      button.tooltipText = button.getAttribute('label');
    }

    //Toggle active state to highlight active sidebar
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
      Array.from(SidebarUI._switcherPanel.querySelectorAll('toolbarbutton[id]'))
        .forEach(button => {
          button.classList.remove('active');
          if (button.getAttribute('oncommand')?.includes(commandId))
            button.classList.add('active');
        });
    }

    //Change the direction of items
    SidebarUI._box.setAttribute('orient', 'horizontal');
    SidebarUI._header.setAttribute('orient', 'vertical');
  } 
})();