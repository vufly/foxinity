// ==UserScript==
// @name            Vertical tab bar, Foxinity style
// @author          vufly
// @description     Vertical tab bar, Foxinity style
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
    console.log('vertical-tab-foxinity');
  }
  // create the main button that goes in the tabs toolbar and opens the pane.
  function makeWidget() {
    // if you create a widget in the first window, it will automatically be
    // created in subsequent videos. so we stop the script from re-registering
    // it on every subsequent window load.
    if (CustomizableUI.getPlacementOfWidget("vertical-tabs-button", true)) {
      return;
    }
    CustomizableUI.createWidget({
      id: "vertical-tabs-button",
      type: "button",
      // it should go in the tabs toolbar by default but can be moved to any
      // customizable toolbar.
      defaultArea: CustomizableUI.AREA_TABSTRIP,
      label: 'Vertical Tabs',
      tooltiptext: 'Toggle vertical tabs',
      localized: false,
      onCommand(e) {
        Services.obs.notifyObservers(
          e.target.ownerGlobal,
          'vertical-tabs-pane-toggle'
        );
      },
      onCreated(node) {
        // an <observes> element is how we get the button to appear "checked"
        // when the tabs pane is checked. it automatically sets its parent's
        // specified attribute ("checked" and "positionstart") to match that of
        // whatever it's observing.
        // let doc = node.ownerDocument;
        // node.appendChild(
        //   create(doc, "observes", {
        //     element: "vertical-tabs-pane",
        //     attribute: "checked",
        //   })
        // );
        // node.appendChild(
        //   create(doc, "observes", {
        //     element: "vertical-tabs-pane",
        //     attribute: "positionstart",
        //   })
        // );
        // if ("key_toggleVerticalTabs" in window) {
        //   node.tooltipText += ` (${ShortcutUtils.prettifyShortcut(
        //     window.key_toggleVerticalTabs
        //   )})`;
        // }
      },
    });
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

  // make the main elements
  document.getElementById("sidebar-splitter").after(
    create(document, "splitter", {
      class: "chromeclass-extrachrome sidebar-splitter",
      id: "vertical-tabs-splitter",
      hidden: true,
    })
  );
  document.getElementById("sidebar-splitter").after(
    create(document, "vbox", {
      class: "chromeclass-extrachrome",
      id: "vertical-tabs-pane",
      context: "vertical-tabs-context-menu",
      hidden: true,
    })
  );

  makeWidget();
})();