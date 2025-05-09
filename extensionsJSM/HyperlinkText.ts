﻿/*
 *  Copyright 1998-2025 by Northwoods Software Corporation. All Rights Reserved.
 */

/*
 * This is an extension and not part of the main GoJS library.
 * The source code for this is at extensionsJSM/HyperlinkText.ts.
 * Note that the API for this class may change with any version, even point releases.
 * If you intend to use an extension in production, you should copy the code to your own source directory.
 * Extensions can be found in the GoJS kit under the extensions or extensionsJSM folders.
 * See the Extensions intro page (https://gojs.net/latest/intro/extensions.html) for more information.
 */

import * as go from 'gojs';

// A "HyperlinkText" is either a TextBlock or a Panel containing a TextBlock that when clicked
// opens a new browser window with a given or computed URL.
// When the user's mouse passes over a "HyperlinkText", the text is underlined.
// When the mouse hovers over a "HyperlinkText", it shows a tooltip that displays the URL.

// This "HyperlinkText" builder is not pre-defined in the GoJS library, so you will need to load this definition.

// Typical usages:
//    $("HyperlinkText", "https://gojs.net", "Visit GoJS")
//
//    $("HyperlinkText",
//        node => "https://gojs.net/" + node.data.version,
//        node => "Visit GoJS version " + node.data.version)
//
//    $("HyperlinkText",
//        node => "https://gojs.net/" + node.data.version,
//        $(go.Panel, "Auto",
//            $(go.Shape, ...),
//            $(go.TextBlock, ...)
//        )
//    )

// The first argument to the "HyperlinkText" builder should be either the URL string or a function
// that takes the data-bound Panel and returns the URL string.
// If the URL string is empty or if the function returns an empty string,
// the text will not be underlined on a mouse-over and a click has no effect.

// The second argument to the "HyperlinkText" builder may be either a string to display in a TextBlock,
// or a function that takes the data-bound Panel and returns the string to display in a TextBlock.
// If no text string or function is provided, it assumes all of the arguments are used to
// define the visual tree for the "HyperlinkText", in the normal fashion for a Panel.

// The result is either a TextBlock or a Panel.

go.GraphObject.defineBuilder('HyperlinkText', (args) => {
  // the URL is required as the first argument, either a string or a side-effect-free function returning a string
  const url = go.GraphObject.takeBuilderArgument(
    args,
    undefined,
    (x) => typeof x === 'string' || typeof x === 'function'
  );
  // the text for the HyperlinkText is the optional second argument, either a string or a side-effect-free function returning a string
  let text = go.GraphObject.takeBuilderArgument(
    args,
    null,
    (x) => typeof x === 'string' || typeof x === 'function'
  );

  // see if the visual tree is supplied in the arguments to the "HyperlinkText"
  let anyGraphObjects = false;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a && a instanceof go.GraphObject) anyGraphObjects = true;
  }

  // define the click behavior
  const click = (e: go.InputEvent, obj: go.GraphObject) => {
    let u = (obj as any)._url;
    if (typeof u === 'function') u = u(obj.findBindingPanel());
    if (u) window.open(u, '_blank');
  };

  // define the tooltip
  const tooltip = go.GraphObject.build<go.Adornment>('ToolTip')
    .add(
      new go.TextBlock({ name: 'TB', margin: 4 }).bindObject('text', '', obj => {
        // here OBJ will be in the Adornment, need to get the HyperlinkText/TextBlock
        obj = obj.part.adornedObject;
        let u = obj._url;
        if (typeof u === 'function') u = u(obj.findBindingPanel());
        return u;
      })
    )
    .bindObject('visible', 'text', t => !!t, undefined, 'TB');

  // if the text is provided, use a new TextBlock; otherwise assume the TextBlock is provided
  if (typeof text === 'string' || typeof text === 'function' || !anyGraphObjects) {
    if (text === null && typeof url === 'string') text = url;
    const tb = new go.TextBlock({
      cursor: 'pointer',
      mouseEnter: (e: go.InputEvent, obj: go.GraphObject) => {
        let u = (obj as any)._url;
        if (typeof u === 'function') u = u(obj.findBindingPanel());
        if (u && obj instanceof go.TextBlock) obj.isUnderline = true;
      },
      mouseLeave: (e: go.InputEvent, obj: go.GraphObject) => {
        if (obj instanceof go.TextBlock) obj.isUnderline = false;
      },
      isActionable: true,
      click: click, // defined above
      toolTip: tooltip // shared by all HyperlinkText textblocks
    }).attach({ _url: url });
    if (typeof text === 'string') {
      tb.text = text;
    } else if (typeof text === 'function') {
      tb.bindObject('text', '', text);
    } else if (typeof url === 'function') {
      tb.bindObject('text', '', url);
    }
    return tb;
  } else {
    const findTextBlock = (obj: go.GraphObject): go.TextBlock | null => {
      if (obj instanceof go.TextBlock) return obj;
      if (obj instanceof go.Panel) {
        const it = obj.elements;
        while (it.next()) {
          const result = findTextBlock(it.value);
          if (result !== null) return result;
        }
      }
      return null;
    };
    return new go.Panel({
      cursor: 'pointer',
      mouseEnter: (e: go.InputEvent, panel: go.GraphObject) => {
        const tb = findTextBlock(panel);
        let u = (panel as any)._url;
        if (typeof u === 'function') u = u(panel.findBindingPanel());
        if (tb !== null && u) tb.isUnderline = true;
      },
      mouseLeave: (e: go.InputEvent, panel: go.GraphObject) => {
        const tb = findTextBlock(panel);
        if (tb !== null) tb.isUnderline = false;
      },
      isActionable: true,
      click: click, // defined above
      toolTip: tooltip // shared by all HyperlinkText panels
    }).attach({ _url: url });
  }
});
