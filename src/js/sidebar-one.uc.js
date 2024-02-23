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
    SIDEBAR_BOX_MIN_WIDTH: 0
  }

  function init() {
    const css = `
    :root[foxinity] #sidebar-box {
      max-width: 99vw;
    }
    `;
    const sss = Cc['@mozilla.org/content/style-sheet-service;1'].getService(Ci.nsIStyleSheetService);
    const uri = makeURI('data:text/css;charset=UTF=8,' + encodeURIComponent(css));
    if (!sss.sheetRegistered(uri, sss.AUTHOR_SHEET))
      sss.loadAndRegisterSheet(uri, sss.AUTHOR_SHEET);

    document.documentElement.setAttribute('foxinity', true);

    SidebarUI._header = document.getElementById('sidebar-header');

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