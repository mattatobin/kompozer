/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is CaScadeS, a stylesheet editor for Composer.
 *
 * The Initial Developer of the Original Code is
 * Daniel Glazman.
 * Portions created by the Initial Developer are Copyright (C) 2002
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Original author: Daniel Glazman <daniel@glazman.org>
 *   Fabien Cazenave (Kaze) http://fabiwan.kenobi.free.fr/
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

// Kaze: remeber the "expert mode" setting
var kzsExpertMode = true; // reminder
var kzsPrefs = Components.classes["@mozilla.org/preferences-service;1"]
    .getService(Components.interfaces.nsIPrefService).getBranch("extensions.KaZcadeS.");
    
function kzsCheckTitle() {                   // created
  // CaScadeS won't work if the document hasn't been saved yet
  if (IsUrlAboutBlank(GetDocumentUrl()))
    return SaveDocument(true, false, "text/html");
  
  // CaScadeS won't work if the <title> is missing 
  var editor = GetCurrentEditor();
  var docNode = editor.document;
  var headNode = null;
  var titleNode = null;
  try {
    headNode = docNode.getElementsByTagName("head").item(0);
    titleNode = docNode.getElementsByTagName("title").item(0);
  } catch(e) {}
  if (!headNode) {
    headNode = docNode.createElement("head");
    var htmlNode = docNode.getElementsByTagName("html").item(0);
    var bodyNode = docNode.getElementsByTagName("body").item(0);
    htmlNode.insertBefore(headNode, bodyNode);
  }
  if (!titleNode) {
    titleNode = docNode.createElement("title");
    headNode.appendChild(titleNode);
    editor.incrementModificationCount(1);
  }
  return true;
}

function openCascadesDialog() {              // modified
  //~ window.openDialog("chrome://cascades/content/EdCssProps.xul","_blank", "chrome,close,modal,titlebar,resizable=yes");
  //~ window._content.focus();
  if (kzsCheckTitle()) {
    window.openDialog("chrome://cascades/content/EdCssProps.xul", 
      "_blank", "chrome,close,titlebar,modal", "", null);
    window._content.focus();
  }
}

//
// Modified 'UpdateStructToolbar' function (override that in 'comm.jar/editor/content/editor.js')
function newStructToolbarButton(tag, attr) { // created
  var ttip, tagId, attrName, attrValue, attref;
  var hasStyle = false;
  
  button = document.createElementNS(XUL_NS, "toolbarbutton");
  button.setAttribute("value", tag);
  
  // get user prefs (TODO)
  var ShowId    = true;
  var ShowClass = true;
  var ShowAttrs = true;
  /* try {
    ShowId    = kzsPrefs.getBoolPref("ShowId");
    ShowClass = kzsPrefs.getBoolPref("ShowClass");
    ShowAttrs = kzsPrefs.getBoolPref("ShowAttrs");
  } catch (e) {}; */
  
  // Let's add "id" and "class" attributes in the label
  // and other attributes in the tooltip
  ttip = "";
  tagId = "";
  if (tag != "php" && tag != "comment") for (attref = 0; attref < attr.length; attref++) {
    attrName  = attr[attref].nodeName;
    attrValue = attr[attref].value;
    if (ShowId && (attrName == "id"))
      tagId = ' id="' + attrValue + '"' + tagId;
    else if (ShowClass && (attrName == "class"))
      tagId += ' class="' + attrValue + '"';
    else if (ShowAttrs && !(/^_moz/).test(attrName))
      ttip += attrName + '="' + attrValue + '" ';
    if (attrName == "style")
      hasStyle = true;
  }
  button.setAttribute("label", "<" + tag + tagId + ">");
  button.setAttribute("value",   tag);
  //~ button.setAttribute("ondblclick", "StructSelectTag(); goDoCommand('cmd_insertHTMLWithDialog');");
  //~ button.setAttribute("onclick", "onStructToolbarClick(this.event)");
  
  if (ttip != "")
    button.setAttribute("tooltiptext", ttip);
  
  if (hasStyle)
    button.setAttribute("style", "font-style: italic;");
  
  //~ button.addEventListener("click", onStructToolbarClick, true);
  //~ button.addEventListener("click", onStructToolbarClick, false);
  
  return button;
}

function UpdateStructToolbar() {             // modified
  var editor = GetCurrentEditor();
  if (!editor) return;

  var mixed = GetSelectionContainer();
  if (!mixed) return;
  var element = mixed.node;
  var oneElementSelected = mixed.oneElementSelected;

  if (!element) return;

  NotifyProcessors(kProcessorsWhenSelectionChanges, element);

  if (element == gLastFocusNode &&
      oneElementSelected == gLastFocusNodeWasSelected)
    return;

  gLastFocusNode = element;
  gLastFocusNodeWasSelected = mixed.oneElementSelected;

  var toolbar = document.getElementById("structToolbar");
  //~ var toolbar = document.getElementById("structToolbarButtons");
  if (!toolbar) return;
  var childNodes = toolbar.childNodes;
  var childNodesLength = childNodes.length;
  // We need to leave the <label> to flex the buttons to the left
  // so, don't remove the last child at position length - 1
  for (var i = childNodesLength - 2; i >= 0; i--) {
    toolbar.removeChild(childNodes.item(i));
  }

  toolbar.removeAttribute("label");

  if ( IsInHTMLSourceMode() ) {
    // we have destroyed the contents of the status bar and are
    // about to recreate it ; but we don't want to do that in
    // Source mode
    return;
  }

  // XXXXXX
  if (true)
  {
    UpdateRulers(element);
    if (!gScrollListener)
      gScrollListener        = GetCurrentEditor().document.addEventListener("scroll", UpdateRulerRequestListener, false);
    if (!gResizeListener)
      gResizeListener        = window.addEventListener("resize", UpdateRulerRequestListener, false);
    if (!gEditorUpdatedListener)
      gEditorUpdatedListener = GetCurrentEditor().document.addEventListener("editorViewUpdated", UpdateRulerRequestListener, false);
  }

  var bodyElement = GetBodyElement();
  var isFocusNode = true;
  var tmp;
  var tag = gLastFocusNode.nodeName.toLowerCase();

  toolbar.firstChild.removeAttribute("style");

  var button;
  do {
    tag = element.nodeName.toLowerCase();

    // <Kaze>
    //~ button = document.createElementNS(XUL_NS, "toolbarbutton");
    //~ button.setAttribute("label",   "<" + tag + ">");
    //~ button.setAttribute("value",   tag);
    // Let's add "id" and "class" attributes in the tag
    // and other attributes in the tooltip
    button = newStructToolbarButton(tag, element.attributes);
    // </Kaze>
    button.setAttribute("context", "structToolbarContext");
    button.className = "struct-button";

    toolbar.insertBefore(button, toolbar.firstChild);

    button.addEventListener("command", newCommandListener(element), false);
    button.addEventListener("contextmenu", newContextmenuListener(button, element), false);

    if (isFocusNode && oneElementSelected) {
      button.setAttribute("checked", "true");
      isFocusNode = false;
    }

    tmp = element;
    element = element.parentNode;

  } while (tmp != bodyElement);
  
}

//
// 'Inline Styles' pop-up menu
// taken from editor/StructBarContextMenu.js
function openCSSPropsDialog(item, tab) {     // modified
  // Kaze: corrected to use the localized title
  var title = item.getAttribute("label");

  if (tab) // open the specified tab
    window.openDialog("chrome://cascades/content/" + tab + "Props.xul",
        "_blank", "chrome,close,modal,titlebar", tab, title, false);
  else // no tab specified, using CaScadeS instead
    window.openDialog("chrome://cascades/content/allProps.xul", 
      "_blank", "chrome,close,titlebar,modal", "all", title, false);
  window._content.focus();
}

function EnableExtractInlineStyles() {
  var elt = gContextMenuFiringDocumentElement;
  var style = elt.getAttribute("style");
  var hasInlineStyle = !style;
  SetElementEnabledById("makeCSSRule", style);
}

function ExtractInlineStyles() {
  window.openDialog("chrome://editor/content/ExtractStyles.xul","_blank",
    "chrome,close,modal,titlebar", gContextMenuFiringDocumentElement);
  window._content.focus();
}

function cleanPopup(menuPopup) {
  var child = menuPopup.lastChild;
  while (child)
  {
    var tmp = child.previousSibling;
    menuPopup.removeChild(child);
    child = tmp;
  }
}

function InitIDSelectMenu(menuPopup) {
  cleanPopup(menuPopup);
  
  var id = gContextMenuFiringDocumentElement.getAttribute("id");
  if (id)
  {
    var menuEntry = document.createElementNS(XUL_NS, "menuitem");
    menuEntry.setAttribute("type",    "radio");
    menuEntry.setAttribute("checked", "true");
    menuEntry.setAttribute("label",   id);
    menuEntry.setAttribute("value",   id);
    menuPopup.appendChild(menuEntry);
  }

  var idList = GetCurrentEditor().document.getSelectorList(CSSSelectorQuery.SHOW_ID_SELECTOR);
  if (idList && idList.length)
  {
    if (id)
    {
      var menuSep = document.createElementNS(XUL_NS, "menuseparator");
      menuPopup.appendChild(menuSep);
    }

    var idListArray  = new Array();
    var idListLength = idList.length;
    for (index = 0; index < idListLength; index++)
      idListArray.push(idList.item(index).substr(1));
    idListArray.sort();

    var previousId = "";
    for (index = 0; index < idListLength; index++)
    {
      var idEntry = idListArray[index];
      if (idEntry != previousId)
      {
        previousId = idEntry;

        if (idEntry != id)
        {
          menuEntry = document.createElementNS(XUL_NS, "menuitem");
          menuEntry.setAttribute("type",    "radio");
          menuEntry.setAttribute("label",   idEntry);
          menuEntry.setAttribute("value",   idEntry);
          menuPopup.appendChild(menuEntry);
        }
      }
    }
  }
}

function InitClassSelectMenu(menuPopup) {
  cleanPopup(menuPopup);

  var classes   = gContextMenuFiringDocumentElement.getAttribute("class");
  var classesArray, classesArrayLength;
  if (classes)
  {
    classesArray = classes.split(" ");
    classesArray.sort();
    classesArrayLength = classesArray.length;
    var index;
    for (index = 0; index < classesArrayLength; index++)
    {
      var menuEntry = document.createElementNS(XUL_NS, "menuitem");
      menuEntry.setAttribute("type",    "checkbox");
      menuEntry.setAttribute("checked", "true");
      menuEntry.setAttribute("label",   classesArray[index]);
      menuEntry.setAttribute("value",   classesArray[index]);
      menuPopup.appendChild(menuEntry);
    }
  }


  var classList = GetCurrentEditor().document.getSelectorList(CSSSelectorQuery.SHOW_CLASS_SELECTOR);
  if (classList && classList.length)
  {
    if (classesArrayLength)
    {
      var menuSep = document.createElementNS(XUL_NS, "menuseparator");
      menuPopup.appendChild(menuSep);
    }

    var classListArray  = new Array();
    var classListLength = classList.length;
    for (index = 0; index < classListLength; index++)
      classListArray.push(classList.item(index).substr(1));
    classListArray.sort();

    var previousClass = "";
    for (index = 0; index < classListLength; index++)
    {
      var classEntry = classListArray[index];
      if (classEntry != previousClass)
      {
        previousClass = classEntry;

        var found = false;
        if (classesArrayLength)
        {
          var existingClassesIndex;
          for (existingClassesIndex = 0; existingClassesIndex < classesArrayLength; existingClassesIndex++)
            if (classesArray[existingClassesIndex] == classEntry)
            {
              found = true;
              break;
            }
        }
        if (!found)
        {
          menuEntry = document.createElementNS(XUL_NS, "menuitem");
          menuEntry.setAttribute("type",    "checkbox");
          menuEntry.setAttribute("label",   classEntry);
          menuEntry.setAttribute("value",   classEntry);
          menuPopup.appendChild(menuEntry);
        }
      }
    }
  }
}

function onClassSelectChange() {             // modified
  var menuPopup = document.getElementById("classSelectMenuPopup");
  var resultingClassAttribute = "";
  var classEntry = menuPopup.firstChild;
  while (classEntry)
  {
    if (classEntry.nodeName.toLowerCase() == "menuitem" &&
        classEntry.getAttribute("checked"))
    {
      var value = classEntry.getAttribute("value");
      if (resultingClassAttribute)
        resultingClassAttribute += " ";
      resultingClassAttribute += value;
    }
    classEntry = classEntry.nextSibling;
  }
  // <Kaze>
  //~ GetCurrentEditor().setAttribute(gContextMenuFiringDocumentElement, "class", resultingClassAttribute);
  if (/^[\s]*$/.test(resultingClassAttribute))
    GetCurrentEditor().removeAttribute(gContextMenuFiringDocumentElement, "class");
  else
    GetCurrentEditor().setAttribute(gContextMenuFiringDocumentElement, "class", resultingClassAttribute);
  // refresh the structure toolbar
  gLastFocusNode = null;
  setTimeout("UpdateStructToolbar();", 100);
  // </Kaze>
}

function onIDSelectChange() {                // modified
  var menuPopup = document.getElementById("idSelectMenuPopup");
  var classEntry = menuPopup.firstChild;
  var resultingID;
  var idEntry = menuPopup.firstChild;
  while (idEntry)
  {
    if (idEntry.nodeName.toLowerCase() == "menuitem" &&
        idEntry.getAttribute("checked"))
    {
      var value = idEntry.getAttribute("value");
      resultingID = value;
      break;
    }
    idEntry = idEntry.nextSibling;
  }
  // <Kaze>
  if (resultingID) {
    var currID = null;
    if (gContextMenuFiringDocumentElement.hasAttribute("id"))
      currID = gContextMenuFiringDocumentElement.getAttribute("id");

    if (resultingID == currID) { // user reselects the element's current ID
      // in this case, just remove the current ID attribute
      GetCurrentEditor().removeAttribute(gContextMenuFiringDocumentElement, "id");
    }
    else {                       // user selects a new ID
      // first, check if an element (or more...) already has this ID
      var currElt;
      while (currElt  = GetCurrentEditor().document.getElementById(resultingID))
	      GetCurrentEditor().removeAttribute(currElt, "id");
      // apply new ID on the selected element
      GetCurrentEditor().setAttribute(gContextMenuFiringDocumentElement, "id", resultingID);
    }
  }
  // refresh the structure toolbar
  gLastFocusNode = null;
  setTimeout("UpdateStructToolbar();", 100);
  // </Kaze>
}
