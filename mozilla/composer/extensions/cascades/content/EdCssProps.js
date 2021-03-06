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
 * The Initial Developer of the Original Code is Daniel Glazman.
 * Portions created by the Initial Developer are Copyright (C) 2002
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Daniel Glazman <daniel@glazman.org>
 *   Fabien Cazenave <kaze@kompozer.net>
 *   Miha Vitorovic <mike5@eunet.si>
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

const SHEET        = 1;
const STYLE_RULE   = 2;
const IMPORT_RULE  = 3;
const MEDIA_RULE   = 4;
const CHARSET_RULE = 5;
const PAGE_RULE    = 6;
const OWNER_NODE   = 7;

// const COMPATIBILITY_TAB = 1;
const GENERAL_TAB       = 2;
const TEXT_TAB          = 3;
const BACKGROUND_TAB    = 4;
const BORDER_TAB        = 5;
const BOX_TAB           = 6;
const AURAL_TAB         = 7;
const LIST_TAB          = 8;

const GENERIC_SELECTOR      = 0;
const TYPE_ELEMENT_SELECTOR = 1;
const CLASS_SELECTOR        = 2;

const kAsyncTimeout = 1500; // 1.5 second

var objectsArray = null;
var gTimerID;
var gAsyncLoadingTimerID;

// needed for commonCssProps.js
var gHaveDocumentUrl = false;

var gInsertIndex = -1;

// * dialog initialization code
function Startup()
{
  // are we in a pre-1.3 Mozilla?
  if (typeof window.InitEditorShell == "function") {
    // yes, so let's get an editorshell
    if (!InitEditorShell())
      return;
  }
  else if (typeof window.GetCurrentEditor != "function" || !GetCurrentEditor()) {
    window.close();
    return;
  }

  // gDialog is declared in EdDialogCommon.js

  gDialog.selectionBased = false;

  // Set commonly-used widgets like this:
  gDialog.selectedTab = TEXT_TAB;
  gDialog.sheetsTreechildren            = document.getElementById("stylesheetsTree");
  gDialog.sheetsTree                    = document.getElementById("sheetsTree");
  gDialog.sheetInfoTab                  = document.getElementById("sheetInfoTab");
  gDialog.atimportButton                = document.getElementById("atimportButton");
  gDialog.atmediaButton                 = document.getElementById("atmediaButton");
  gDialog.linkButton                    = document.getElementById("linkButton");
  gDialog.styleButton                   = document.getElementById("styleButton");
  gDialog.ruleButton                    = document.getElementById("ruleButton");
  gDialog.removeButton                  = document.getElementById("removeButton");
  gDialog.upButton                      = document.getElementById("upButton");
  gDialog.downButton                    = document.getElementById("downButton");
  gDialog.renameButton                  = document.getElementById("renameButton"); // Kaze

  gDialog.selectedTab = GENERAL_TAB;
  gDialog.sheetInfoTabPanelTitle        = document.getElementById("sheetInfoTabPanelTitle");
  gDialog.textTab                       = document.getElementById("textTab");
  gDialog.brownFoxLabel                 = document.getElementById("brownFoxLabel");
  gDialog.backgroundImageInput          = document.getElementById("backgroundImageInput");
  gDialog.backgroundPreview             = document.getElementById("backgroundPreview");
  gDialog.sheetTabbox                   = document.getElementById("sheetTabbox");
  gDialog.backgroundColorInput          = document.getElementById("backgroundColorInput");
  gDialog.textColorInput                = document.getElementById("textColorInput");
  gDialog.backgroundRepeatMenulist      = document.getElementById("backgroundRepeatMenulist");
  gDialog.backgroundAttachmentCheckbox  = document.getElementById("backgroundAttachmentCheckbox");
  gDialog.xBackgroundPositionRadiogroup = document.getElementById("xBackgroundPositionRadiogroup");
  gDialog.yBackgroundPositionRadiogroup = document.getElementById("yBackgroundPositionRadiogroup");
  gDialog.fontFamilyRadiogroup          = document.getElementById("fontFamilyRadiogroup");
  gDialog.customFontFamilyInput         = document.getElementById("customFontFamilyInput");
  gDialog.predefFontFamilyMenulist      = document.getElementById("predefFontFamilyMenulist");
  gDialog.fontSizeInput                 = document.getElementById("fontSizeInput");
  gDialog.lineHeightInput               = document.getElementById("lineHeightInput");
  gDialog.textUnderlineCheckbox         = document.getElementById("underlineTextDecorationCheckbox");
  gDialog.textOverlineCheckbox          = document.getElementById("overlineTextDecorationCheckbox");
  gDialog.textLinethroughCheckbox       = document.getElementById("linethroughTextDecorationCheckbox");
  gDialog.textBlinkCheckbox             = document.getElementById("blinkTextDecorationCheckbox");
  gDialog.noDecorationCheckbox          = document.getElementById("noneTextDecorationCheckbox");

  gDialog.topBorderStyleMenulist        = document.getElementById("topBorderStyleMenulist");
  gDialog.topBorderWidthInput           = document.getElementById("topBorderWidthInput");
  gDialog.topBorderColorInput           = document.getElementById("topBorderColorInput");

  gDialog.leftBorderStyleMenulist       = document.getElementById("leftBorderStyleMenulist");
  gDialog.leftBorderWidthInput          = document.getElementById("leftBorderWidthInput");
  gDialog.leftBorderColorInput          = document.getElementById("leftBorderColorInput");

  gDialog.rightBorderStyleMenulist      = document.getElementById("rightBorderStyleMenulist");
  gDialog.rightBorderWidthInput         = document.getElementById("rightBorderWidthInput");
  gDialog.rightBorderColorInput         = document.getElementById("rightBorderColorInput");

  gDialog.bottomBorderStyleMenulist     = document.getElementById("bottomBorderStyleMenulist");
  gDialog.bottomBorderWidthInput        = document.getElementById("bottomBorderWidthInput");
  gDialog.bottomBorderColorInput        = document.getElementById("bottomBorderColorInput");

  gDialog.allFourBordersSame            = document.getElementById("allFourBordersSame");
  gDialog.borderPreview                 = document.getElementById("borderPreview");

  gDialog.volumeScrollbar               = document.getElementById("volumeScrollbar");
  gDialog.volumeMenulist                = document.getElementById("volumeMenulist");
  gDialog.muteVolumeCheckbox            = document.getElementById("muteVolumeCheckbox");

  gDialog.opacityScrollbar              = document.getElementById("opacityScrollbar");
  gDialog.opacityLabel                  = document.getElementById("opacityLabel");

  gDialog.sheetInfoTabGridRows          = document.getElementById("sheetInfoTabGridRows");
  gDialog.sheetInfoTabGrid              = document.getElementById("sheetInfoTabGrid");

  gDialog.listStyleImageInput           = document.getElementById("listStyleImageInput");

  gDialog.expertMode = true;            // Kaze: this pref isn't used any more
  gDialog.dropdownLists = false;        // Kaze: new hidden pref
  gDialog.modified = false;
  gDialog.selectedIndex = -1;

  gDialog.bundle                        = document.getElementById("cascadesBundle");

  gHaveDocumentUrl = GetDocumentBaseUrl();
    
  // Initialize all dialog widgets here,
  // e.g., get attributes from an element for property dialog
  InitSheetsTree(gDialog.sheetsTreechildren);
  
  // Set window location relative to parent window (based on persisted attributes)
  SetWindowLocation();
}

// * Toggles on/off expert mode. In expert mode, all buttons are enabled
//   including buttons for stylesheet creation. When the mode is off, only
//   the "create rule" button is enabled, a stylesheet being created to contain
//   the new rule if necessary
function toggleExpertMode()
{
  // toggle the boolean
  gDialog.expertMode = !gDialog.expertMode;
  
  // Kaze
  //if (document.getElementById("sheetTabbox").selectedTab.getAttribute("id") == "sheetInfoTab")
  if (gDialog.sheetTabbox.selectedTab == gDialog.sheetInfoTab)
    onSelectCSSTreeItem("general");

  if (gDialog.expertMode) {
    if (gDialog.selectedIndex == -1) {
      // if expert mode is on but no selection in the tree,
      // only sheet creation buttons are enabled
      UpdateButtons(false, false, true, true, false, false);
    }
    else {
      // if expert mode is on and we have something selected in the tree,
      // the state of the buttons depend on the type of the selection
      var external = objectsArray[gDialog.selectedIndex].external;
      var type   = objectsArray[gDialog.selectedIndex].type;
      UpdateButtons(!external, !external, true, true, !external, (!external || (type == SHEET)) );
    }
    // Kaze: in case some !important rules have been set in normal mode
    //~ var cssObject = gDialog.selectedObject;
    if ((gDialog.selectedIndex > -1) && (gDialog.selectedTab == GENERAL_TAB)
      && (gDialog.selectedType == STYLE_RULE || gDialog.selectedType == PAGE_RULE) )
      gDialog.cssTBox.value = PrettyPrintCSS(gDialog.selectedObject.cssText, gDialog.selectedObject.href);
  }
  else {
    //~ // if we're not in expert mode, allow only rule creation button
    //~ UpdateButtons(!gDialog.atimportButton.hasAttribute("disabled"),
            //~ !gDialog.atmediaButton.hasAttribute("disabled"),
            //~ !gDialog.linkButton.hasAttribute("disabled"),
            //~ !gDialog.styleButton.hasAttribute("disabled"),
            //~ !gDialog.ruleButton.hasAttribute("disabled"),
            //~ !gDialog.removeButton.hasAttribute("disabled"));
    // Kaze: if we're not in expert mode, allow only rule creation button IF AN ELEMENT IS SELECTED
    UpdateButtons(!gDialog.atimportButton.hasAttribute("disabled"),
            !gDialog.atmediaButton.hasAttribute("disabled"),
            !gDialog.linkButton.hasAttribute("disabled"),
            !gDialog.styleButton.hasAttribute("disabled"),
            (gDialog.selectedIndex > -1),
            !gDialog.removeButton.hasAttribute("disabled"));
    // Kaze: in case some !important rules have been set in expert mode
    //~ if (gDialog.selectedTab == GENERAL_TAB)
      //~ UpdateCSS();
  }
  
  // Kaze: store the checkbox value in the prefs
  window.opener.kzsPrefs.setBoolPref("expertMode", gDialog.expertMode);

}
// * This function recreates the contents of the STYLE elements and
//   of the stylesheets local to the filesystem
function FlushChanges()
{
  if (gDialog.modified) {
    // let's make sure the editor is going to require save on exit
    getCurrentEditor().incrementModificationCount(1);
  }

  // Validate all user data and set attributes and possibly insert new element here
  // If there's an error the user must correct, return false to keep dialog open.
  var sheet;
  for (var i = 0; i < objectsArray.length; i++) {
    if (objectsArray[i].modified && !objectsArray[i].external &&
        objectsArray[i].type == SHEET) {
      // let's serialize this stylesheet!
      sheet = objectsArray[i].cssElt;
      if (sheet.ownerNode.nodeName.toLowerCase() == "link")
        SerializeExternalSheet(sheet, null);
      else
        SerializeEmbeddedSheet(sheet);
    }
  }

  if (gDialog.head)
    delete(gDialog.head);

  SaveWindowLocation();

	// KompoZer 0.8
	window.opener.ResetStructToolbar();

  return true; // do close the window
}

// * removes all the content in a tree
//   param XULElement sheetsTree
function CleanSheetsTree(sheetsTreeChildren)
{
  // we need to clear the selection in the tree otherwise the onselect
  // action on the tree will be fired when we removed the selected entry
  ClearTreeSelection(gDialog.sheetsTree);

  var elt = sheetsTreeChildren.firstChild;
  while (elt) {
    var tmp = elt.nextSibling;
    sheetsTreeChildren.removeChild(elt);
    elt = tmp;
  }
}

function AddSheetEntryToTree(sheetsTree, ownerNode)
{
  if (ownerNode.nodeType == Node.ELEMENT_NODE) {
    var ownerTag  = ownerNode.nodeName.toLowerCase()
    var relType   = ownerNode.getAttribute("rel");
    if (relType) relType = relType.toLowerCase();
    if (ownerTag == "style" ||
        (ownerTag == "link" && relType.indexOf("stylesheet") != -1)) {

      var treeitem  = document.createElementNS(XUL_NS, "treeitem");
      var treerow   = document.createElementNS(XUL_NS, "treerow");
      var treecell  = document.createElementNS(XUL_NS, "treecell");

      // what kind of owner node do we have here ?
      // a style element indicates an embedded stylesheet,
      // while a link element indicates an external stylesheet;
      // the case of an XML Processing Instruction is not handled, we
      // are supposed to be in HTML 4
      var external = false;
      if (ownerTag == "style") {
        treecell.setAttribute("label", GetString("InternalStylesheet"));
      }
      else if (ownerTag == "link") {
        // external stylesheet, let's present its URL to user
        //~ treecell.setAttribute("label", StripUsernamePassword(ownerNode.href));
        treecell.setAttribute("label", MakeRelativeUrl(StripUsernamePassword(ownerNode.href))); // Kaze
        external = true;
        if ( /(\w*):.*/.test(ownerNode.href) ) {
          if (RegExp.$1 == "file") {
            external = false;
          }
        }
        else
          external = false;
      }
      // add a new entry to the tree
      var o = newObject(treeitem, external, SHEET, ownerNode.sheet, false, 0);
      PushInObjectsArray(o);
      treerow.appendChild(treecell);
      treeitem.appendChild(treerow);
      treeitem.setAttribute("container", "true");
      
      // add entries to the tree for the rules in the current stylesheet
      var rules = null;
      //Refresh(); // Kaze
      //if (ownerNode.sheet)
      if (ownerNode.sheet) try { // Kaze
        rules = ownerNode.sheet.cssRules;
        AddRulesToTreechildren(treeitem, rules, external, 1);
      } catch(e) { // the stylesheet isn't fully loaded yet, retry in a moment
        //setTimeout("Refresh", 500);
        var sheetIndex = objectsArray.length - 1;
        gAsyncLoadingTimerID = setTimeout("sheetLoadedTimeoutCallback(" + sheetIndex + ")", kAsyncTimeout);
      }
      //AddRulesToTreechildren(treeitem, rules, external, 1);

      sheetsTree.appendChild(treeitem);
    }
  }
}

function PushInObjectsArray(o)
{
  if (gInsertIndex == -1)
    objectsArray.push(o);
  else {
    objectsArray.splice(gInsertIndex, 0, o);
    gInsertIndex++;
  }
}

// * populates the tree in the dialog with entries
//   corresponding to all stylesheets and CSS rules attached to the document
//   param XULElement sheetsTree
function InitSheetsTree(sheetsTree)
{
  // remove all entries in the tree
  CleanSheetsTree(sheetsTree);
  // Look for the stylesheets attached to the current document
  // Get them from the STYLE and LINK elements because of async sheet loading:
  // the LINK element is always here while the corresponding sheet might be
  // delayed by network
  var headNode = GetHeadElement();
  if (headNode && headNode.hasChildNodes()) {
    var ssn = headNode.childNodes.length;
    objectsArray = new Array();
    if (ssn) {
      var i;
      gInsertIndex = -1;
      for (i=0; i<ssn; i++) {
        var ownerNode = headNode.childNodes[i];
        AddSheetEntryToTree(sheetsTree, ownerNode); 
      }
    }
  }
}

// * create a new "object" corresponding to an entry in the tree
//   unfortunately, it's still impossible to attach a JS object to a treecell :-(
//   param XULElement xulElt
//   param boolean external
//   param integer type
//   param (DOMNode|DOMCSSStyleSheet|DOMCSSRule) cssElt
//   param boolean modified
//   param integer depth
function newObject(xulElt, external, type, cssElt, modified, depth)
{
  return {
    xulElt   : xulElt,
    external : external,
    type     : type,
    cssElt   : cssElt,
    modified : modified,
    depth    : depth
  };
}

function AddStyleRuleToTreeChildren(rule, external, depth)
{
  var subtreeitem  = document.createElementNS(XUL_NS, "treeitem");
  var subtreerow   = document.createElementNS(XUL_NS, "treerow");
  var subtreecell  = document.createElementNS(XUL_NS, "treecell");
  // show the selector attached to the rule
  subtreecell.setAttribute("label", rule.selectorText);
  var o = newObject(subtreeitem, external, STYLE_RULE, rule, false, depth);
  PushInObjectsArray(o);
  if (external) {
    subtreecell.setAttribute("properties", "external");
  }
  subtreerow.appendChild(subtreecell);
  subtreeitem.appendChild(subtreerow);

  return subtreeitem;
}

function AddPageRuleToTreeChildren(rule, external, depth)
{
  var subtreeitem  = document.createElementNS(XUL_NS, "treeitem");
  var subtreerow   = document.createElementNS(XUL_NS, "treerow");
  var subtreecell  = document.createElementNS(XUL_NS, "treecell");
  // show the selector attached to the rule
  subtreecell.setAttribute("label", "@page " + rule.selectorText);
  var o = newObject(subtreeitem, external, PAGE_RULE, rule, false, depth);
  PushInObjectsArray(o);
  if (external) {
    subtreecell.setAttribute("properties", "external");
  }
  subtreerow.appendChild(subtreecell);
  subtreeitem.appendChild(subtreerow);

  return subtreeitem;
}

function AddImportRuleToTreeChildren(rule, external, depth)
{
  var subtreeitem  = document.createElementNS(XUL_NS, "treeitem");
  var subtreerow   = document.createElementNS(XUL_NS, "treerow");
  var subtreecell  = document.createElementNS(XUL_NS, "treecell");
  // show "@import" and the URL
  subtreecell.setAttribute("label", "@import "+rule.href, external);
  var o = newObject(subtreeitem, external, IMPORT_RULE, rule, false, depth);
  PushInObjectsArray(o);
  if (external) {
    subtreecell.setAttribute("properties", "external");
  }
  subtreerow.appendChild(subtreecell);
  subtreeitem.appendChild(subtreerow);
  subtreeitem.setAttribute("container", "true");
  if (rule.styleSheet) {
    // if we have a stylesheet really imported, let's browse it too
    // increasing the depth and marking external
    AddRulesToTreechildren(subtreeitem , rule.styleSheet.cssRules, true, depth+1);
  }
  return subtreeitem;
}

// * adds subtreeitems for the CSS rules found
//   into rules; in case of an at-rule, the method calls itself with
//   a subtreeitem, the rules in the at-rule, a boolean specifying if
//   the rules are external to the document or not, and an increased
//   depth.
//   param XULElement  treeItem
//   param CSSRuleList rules
//   param boolean     external
//   param integer     depth
function AddRulesToTreechildren(treeItem, rules, external, depth)
{
  // is there any rule in the stylesheet ; earlay way out if not
  if (rules && rules.length) {
    var subtreechildren = document.createElementNS(XUL_NS, "treechildren");
    var j, o;
    var subtreeitem, subtreerow, subtreecell;
    // let's browse all the rules
    for (j=0; j< rules.length; j++) {
      switch (rules[j].type) {
        case CSSRule.STYLE_RULE:
          // this is a CSSStyleRule
          subtreeitem  = AddStyleRuleToTreeChildren(rules[j], external, depth);
          subtreechildren.appendChild(subtreeitem);
          break;
        case CSSRule.PAGE_RULE:
          // this is a CSSStyleRule
          subtreeitem  = AddPageRuleToTreeChildren(rules[j], external, depth);
          subtreechildren.appendChild(subtreeitem);
          break;
        case CSSRule.IMPORT_RULE:
          // this is CSSImportRule for @import
          subtreeitem  = AddImportRuleToTreeChildren(rules[j], external, depth);
          subtreechildren.appendChild(subtreeitem);
          break;
        case CSSRule.MEDIA_RULE:
          // this is a CSSMediaRule @media
          subtreeitem  = document.createElementNS(XUL_NS, "treeitem");
          subtreerow   = document.createElementNS(XUL_NS, "treerow");
          subtreecell  = document.createElementNS(XUL_NS, "treecell");
          // show "@media" and media list
          subtreecell.setAttribute("label", "@media "+rules[j].media.mediaText, external);
          o = newObject(subtreeitem, external, MEDIA_RULE, rules[j], false, depth);
          PushInObjectsArray(o);
          if (external) {
            subtreecell.setAttribute("properties", "external");
          }
          subtreerow.appendChild(subtreecell);
          subtreeitem.appendChild(subtreerow);
          subtreeitem.setAttribute("container", "true");
          // let's browse the rules attached to this CSSMediaRule, keeping the
          // current external and increasing depth
          AddRulesToTreechildren(subtreeitem, rules[j].cssRules, external, depth+1);
          subtreechildren.appendChild(subtreeitem);
          break;
        case CSSRule.CHARSET_RULE:
          // this is a CSSCharsetRule
          subtreeitem  = document.createElementNS(XUL_NS, "treeitem");
          subtreerow   = document.createElementNS(XUL_NS, "treerow");
          subtreecell  = document.createElementNS(XUL_NS, "treecell");
          // show "@charset" and the encoding
          subtreecell.setAttribute("label", "@charset "+rules[j].encoding, external);
          o = newObject(subtreeitem, external, CHARSET_RULE, rules[j], false, depth);
          PushInObjectsArray(o);


          if (external) {
            subtreecell.setAttribute("properties", "external");
          }
          subtreerow.appendChild(subtreecell);
          subtreeitem.appendChild(subtreerow);
          subtreechildren.appendChild(subtreeitem);
          break;          
      }
    }
    treeItem.appendChild(subtreechildren);
  }
}

function GetSelectedItemData()
{
  // get the selected tree item (if any)
  var selectedItem = getSelectedItem(gDialog.sheetsTree);
  gDialog.selectedIndex  = -1;
  gDialog.selectedObject = null;

  if (!objectsArray)
    return;
  // look for the object in objectsArray corresponding to the
  // selectedItem
  var i, l = objectsArray.length;
  if (selectedItem) {
    for (i=0; i<l; i++) {
      if (objectsArray[i].xulElt == selectedItem) {
        gDialog.selectedIndex  = i;
        gDialog.treeItem       = objectsArray[i].xulElt;
        gDialog.externalObject = objectsArray[i].external;
        gDialog.selectedType   = objectsArray[i].type;
        gDialog.selectedObject = objectsArray[i].cssElt;
        gDialog.modifiedObject = objectsArray[i].modified;
        gDialog.depthObject    = objectsArray[i].depth;
        break;
      }
    }
  }
}

// * selects either a tree item (sheet, rule) or a tab
//   in the former case, the parameter is null ; in the latter,
//   the parameter is a string containing the name of the selected tab
//   param String tab
function onSelectCSSTreeItem(tab)
{
  // convert the tab string into a tab id
  if      (tab == "general")       tab = GENERAL_TAB;
  else if (tab == "text")          tab = TEXT_TAB;
  else if (tab == "background")    tab = BACKGROUND_TAB;
  else if (tab == "border")        tab = BORDER_TAB;
  else if (tab == "box")           tab = BOX_TAB;
  else if (tab == "aural")         tab = AURAL_TAB;
  else if (tab == "list")          tab = LIST_TAB;

  GetSelectedItemData();

  if (gDialog.selectedIndex == -1) {
    // there is no tree item selected, let's fallback to the Info tab
    // but there is nothing we can display in that tab...
    gDialog.sheetTabbox.selectedTab = gDialog.sheetInfoTab;
    return;
  }

  var external  = objectsArray[gDialog.selectedIndex].external;
  var type      = objectsArray[gDialog.selectedIndex].type;
  var cssObject = gDialog.selectedObject;

  // Let's update the buttons depending on what kind of object is
  // selected in the tree
  UpdateButtons(!external, !external, true, true, !external, (!external || (type == SHEET)) );

  if (gDialog.selectedType != STYLE_RULE) {
    // user did not select a CSSStyleRule, let's fallback to Info tab
    tab = GENERAL_TAB;
    // Kaze: hide the other tabs
    gDialog.sheetTabbox.setAttribute("class", "disabled");
  } else
    gDialog.sheetTabbox.removeAttribute("class");
  if (!tab) {
    // this method gets called by a selection in the tree. Is there a
    // tab already selected ? If yes, keep it; if no, fallback to the
    // Info tab
    tab = gDialog.selectedTab ? gDialog.selectedTab : GENERAL_TAB;
  }
  switch (tab) {
    case TEXT_TAB:
      // we have to update the text preview, let's remove its style attribute
      gDialog.brownFoxLabel.removeAttribute("style");      
      InitTextTabPanel();
      return;
      break;
    case BACKGROUND_TAB:
      InitBackgroundTabPanel();
      return;
      break;
    case BORDER_TAB:
      InitBorderTabPanel();
      return;
      break;
    case BOX_TAB:
      InitBoxTabPanel();
      return;
      break;
    case AURAL_TAB:
      InitAuralTabPanel();
      return;
      break;
    case LIST_TAB:
      InitListTabPanel();
      return;
      break;
  }

  // if we are here, the Info tab is our choice
  gDialog.selectedTab = GENERAL_TAB;
  gDialog.sheetTabbox.selectedTab = gDialog.sheetInfoTab;
  
  var gridrows = gDialog.sheetInfoTabGridRows;
  var grid     = gDialog.sheetInfoTabGrid;

  if (gridrows) {
    // first, remove all information present in the Info tab
    grid.removeChild(gridrows);
  }

  gridrows = document.createElementNS(XUL_NS, "rows");
  gDialog.sheetInfoTabGridRows = gridrows;
  gridrows.setAttribute("id", "sheetInfoTabGridRows");
  grid.appendChild(gridrows);
  grid.removeAttribute("style");

  switch (type) {
    case OWNER_NODE:
      gDialog.cssTBox.setAttribute("hidden", true); // Kaze
      // this case is a workaround when we have a LINK element but the
      // corresponding stylesheet is not loaded yet
      if (gDialog.selectedObject.sheet) {
        var index = gDialog.selectedIndex;
        sheetLoadedTimeoutCallback(index);
        onSelectCSSTreeItem(tab);
        return;
      }
      break;
    case SHEET:
      gDialog.cssTBox.setAttribute("hidden", true); // Kaze
      if (cssObject) {
        var alternate = "";
        if (external &&
            cssObject.ownerNode.getAttribute("rel").toLowerCase().indexOf("alternate") != -1) {
          alternate = GetString("AlternateKeyword")
        }
        gDialog.sheetInfoTabPanelTitle.setAttribute("value", GetString("Stylesheet")+alternate);
        AddLabelToInfobox(gridrows, GetString("Type"), cssObject.type, null, false);
        AddCheckboxToInfobox(gridrows,
                             GetString("Disabled"),
                             GetString("DisableStylesheet"),
                             cssObject.disabled, "onStylesheetDisabledChange");
        var href;
        if (cssObject.ownerNode.nodeName.toLowerCase() == "link") {
          href = cssObject.href;
        }
        else {
          href = GetString("StyleSheetIsEmbedded");
        }
        var cleanUrl = StripUsernamePassword(href);
        /* <Kaze> we have to limit the width of this field,
           in order to avoid sending the OK/Cancel buttons out of the window bounds.
              if (cleanUrl == href)
                AddLabelToInfobox(gridrows, "URL:", href, null, false);
              else
                AddLabelToInfobox(gridrows, "URL:",
                                  cleanUrl + " " + GetString("UserPasswdStripped"),
                                  null, false);
        */
        var urlbox;
        if (cleanUrl == href)
          urlbox = AddEditableZoneToInfobox(gridrows, "URL:", href, null, false);
        else
          urlbox = AddEditableZoneToInfobox(gridrows, "URL:",
                                            cleanUrl + " " + GetString("UserPasswdStripped"),
                                            null, false);
        urlbox.setAttribute("readonly", "true");
        // </Kaze>
        var mediaList = cssObject.media.mediaText;
        if (!mediaList || mediaList == "") {
          mediaList = "all";
        }
        AddEditableZoneToInfobox(gridrows, GetString("MediaList"),
                                 mediaList, "onStylesheetMediaChange", false);
        if (cssObject.title) {
          AddEditableZoneToInfobox(gridrows, GetString("Title"),
                                   cssObject.title, "onStylesheetTitleChange", false);
        }

        if (cssObject.cssRules) {
          AddLabelToInfobox(gridrows, GetString("NumberRules"),
                            cssObject.cssRules.length, null, false);
        }
        if (!external && cssObject.ownerNode.nodeName.toLowerCase() == "style")
          // we can export only embedded stylesheets
          AddSingleButtonToInfobox(gridrows, GetString("ExportStylesheet"),
                                   "onExportStylesheet")
      }
      else
        AddLabelToInfobox(gridrows, GetString("UnableRetrieveStylesheet"),
                          null, null, false);
      break;
    case STYLE_RULE:
    case PAGE_RULE:
      // <Kaze>
      gDialog.cssTBox.setAttribute("hidden", !gDialog.expertMode);
      if (gDialog.expertMode) { // source mode (KaZcadeS)
        gDialog.sheetInfoTabPanelTitle.setAttribute("value",
          (type == STYLE_RULE) ? GetString("StyleRule") : GetString("PageRule"));
        AddLabelToInfobox(gridrows, GetString("Selector"), cssObject.selectorText, null, false);
        if (cssObject.style.length) {
          gDialog.cssTBox.value = PrettyPrintCSS(cssObject.cssText, gDialog.selectedObject.href);
        } else {
          gDialog.cssTBox.value = "";
        }
      }
      else { // default mode, untouched
        var h = document.defaultView.getComputedStyle(grid.parentNode, "").getPropertyValue("height");
        // let's prepare the grid for the case the rule has a laaaaarge number
        // of property declarations
        grid.setAttribute("style", "overflow: auto; height: "+h);
        gDialog.sheetInfoTabPanelTitle.setAttribute("value",
          (type == STYLE_RULE) ? GetString("StyleRule") : GetString("PageRule"));
        AddLabelToInfobox(gridrows, GetString("Selector"), cssObject.selectorText, null, false);
        if (cssObject.style.length) {
          AddLabelToInfobox(gridrows, GetString("Declarations"),
                  " ", GetString("Importance"), false);
          for (var i=0; i<cssObject.style.length; i++) {
          AddDeclarationToInfobox(gridrows, cssObject, i, false);
          }
        }
        // TO BE DONE : need a way of changing the importance of a given declaration
      } // </Kaze>
      break;
    case MEDIA_RULE:
      gDialog.cssTBox.setAttribute("hidden", true); // Kaze
      gDialog.sheetInfoTabPanelTitle.setAttribute("value", "Media rule");
      AddLabelToInfobox(gridrows, GetString("MediaList"),   cssObject.media.mediaText, null, false);
      AddLabelToInfobox(gridrows, GetString("NumberRules"), cssObject.cssRules.length, null, false);
      break;
    case IMPORT_RULE:
      gDialog.cssTBox.setAttribute("hidden", true); // Kaze
      gDialog.sheetInfoTabPanelTitle.setAttribute("value", "Import rule");
      AddLabelToInfobox(gridrows, "URL:", cssObject.href, null, false);
      AddLabelToInfobox(gridrows, GetString("MediaList"), cssObject.media.mediaText, null, false);
      break;
    // TO BE DONE : @charset and other exotic rules
  }
}

// * updates the UI buttons with the given states
//   param boolean importState
//   param mediaState
//   param boolean linkState
//   param boolean styleState
//   param boolean ruleState
//   param boolean removeState
function UpdateButtons(importState, mediaState, linkState, styleState, ruleState, removeState)
{
  if (!gDialog.expertMode) {
    importState = false;
    mediaState  = false;
    linkState   = false;
    styleState  = false;
  }
  if (!gDialog.selectedObject) {
    importState = false;
    mediaState  = false;
    //~ if (gDialog.selectedIndex != -1)
      //~ ruleState = false;
  }
  ruleState = true;
  removeState = (objectsArray.length > 0); // Kaze
  var editState = (gDialog.selectedType == STYLE_RULE) && (gDialog.selectedIndex > 0);
  
  EnableUI(gDialog.atimportButton, importState);
  EnableUI(gDialog.atmediaButton,  false); // Kaze: I don't get what this button stands for...
  EnableUI(gDialog.linkButton,     linkState);
  EnableUI(gDialog.styleButton,    styleState);
  EnableUI(gDialog.ruleButton,     ruleState);
  EnableUI(gDialog.removeButton,   removeState);
  EnableUI(gDialog.upButton,       removeState);
  EnableUI(gDialog.downButton,     removeState);
  EnableUI(gDialog.renameButton,   editState);
  
  // KaZcadeS main button
  if (gDialog.expertMode) {
    gDialog.styleMenu.setAttribute("type", "menu-button");
    gDialog.styleMenu.removeAttribute("tooltiptext");
  } else {
    gDialog.styleMenu.setAttribute("tooltiptext", gDialog.menuTooltip);
    gDialog.styleMenu.removeAttribute("type");
  }
}

// * adds a button to the given treerow
//   param XULElement rows
//   param String label
//   param String callback
function AddSingleButtonToInfobox(rows, label, callback, className)
{
  var row = document.createElementNS(XUL_NS, "row");
  row.setAttribute("align", "center");
  var spacer = document.createElementNS(XUL_NS, "spacer");
  var hbox = document.createElementNS(XUL_NS, "hbox");
  var button = document.createElementNS(XUL_NS, "button");
  button.setAttribute("label", label);
  //~ button.setAttribute("class", "align-right");
  button.setAttribute("class", "align-right " + className); // Kaze: adding a custom class
  button.setAttribute("oncommand", callback+"();");
  row.appendChild(spacer);
  hbox.appendChild(button);
  row.appendChild(hbox);
  rows.appendChild(row);
}

// * adds a textarea to the given treerow, allows to assign the
//   initial value and specify that it should acquire the focus
//   param XULElement rows
//   param String label
//   param String value
//   param String callback
//   param boolean focus
function AddEditableZoneToInfobox(rows, label, value, callback, focus)
{
  var labelLabel = document.createElementNS(XUL_NS, "label");
  var row = document.createElementNS(XUL_NS, "row");
  row.setAttribute("align", "center");
  labelLabel.setAttribute("value", label);
  row.appendChild(labelLabel);

  var textbox = document.createElementNS(XUL_NS, "textbox");
  if (callback != "") 
    textbox.setAttribute("oninput", callback+"(this)");
  textbox.setAttribute("value", value);
  textbox.setAttribute("size", 20);
  row.appendChild(textbox);
  rows.appendChild(row);
  if (focus)
    SetTextboxFocus(textbox);
  return textbox;
}

// <Kaze>
function AddEditableListToInfobox(rows, label, value, callback, focus)
{
  var labelLabel = document.createElementNS(XUL_NS, "label");
  var row = document.createElementNS(XUL_NS, "row");
  row.setAttribute("align", "left");
  labelLabel.setAttribute("value", label);
  row.appendChild(labelLabel);

  var menulist = document.createElementNS(XUL_NS, "menulist");
  if (callback != "") {
    menulist.setAttribute("onkeypress", "setTimeout("+callback+", 0)");
    menulist.setAttribute("oncommand",  "setTimeout("+callback+", 0)");
  }
  menulist.setAttribute("value", value);
  menulist.setAttribute("editable", true);
  row.appendChild(menulist);
  rows.appendChild(row);
  if (focus)
    menulist.focus();

  var menupopup = document.createElementNS(XUL_NS, "menupopup");
  menulist.appendChild(menupopup);

  return menulist;
}
// </Kaze>

// * adds a radiogroup to the given treerow
//   param XULElement rows
//   param String label
function AddRadioGroupToInfoBox(rows, label)
{
  var row = document.createElementNS(XUL_NS, "row");
  row.setAttribute("align", "center");

  var labelLabel = document.createElementNS(XUL_NS, "label");
  labelLabel.setAttribute("value", label);
  row.appendChild(labelLabel);

  var radiogroup = document.createElementNS(XUL_NS, "radiogroup");
  row.appendChild(radiogroup);
  rows.appendChild(row);
  return radiogroup;
}

// * adds a radio button to a previously created radiogroup
//   param XULElement radiogroup
//   param String label
//   param String callback
//   param integer selectorType
//   param boolean selected
function AddRadioToRadioGroup(radiogroup, label, callback, selectorType, selected)
{
  var radio = document.createElementNS(XUL_NS, "radio");
  radio.setAttribute("label",     label);
  radio.setAttribute("oncommand", callback + "(" + selectorType + ");" );
  if (selected)
    radio.setAttribute("selected", "true");
  radiogroup.appendChild(radio);
}

// * adds a label and a checkbox to a given treerows
//   param XULElement rows
//   param String label
//   param String checkboxLabel
//   param String value
//   param String callback
function AddCheckboxToInfobox(rows, label, checkboxLabel, value, callback)
{
  var row = document.createElementNS(XUL_NS, "row");
  row.setAttribute("align", "center");

  var labelLabel = document.createElementNS(XUL_NS, "label");
  labelLabel.setAttribute("value", label);
  row.appendChild(labelLabel);

  var checkbox = document.createElementNS(XUL_NS, "checkbox");
  checkbox.setAttribute("label", checkboxLabel);
  checkbox.setAttribute("checked", value);
  checkbox.setAttribute("oncommand", callback+"()");
  row.appendChild(checkbox);

  rows.appendChild(row);
}

// * adds a label to a given treerows; strong indicates a bold font
//   param XULElement rows
//   param String label
//   param String value
//   param boolean strong
function AddLabelToInfobox(rows, firstLabel, flexibleLabel, lastLabel, strong)
{
  var labelLabel = document.createElementNS(XUL_NS, "label");
  var row = document.createElementNS(XUL_NS, "row");
  row.setAttribute("align", "center");
  labelLabel.setAttribute("value", firstLabel);
  if (strong) {
    labelLabel.setAttribute("class", "titleLabel");
  }
  row.appendChild(labelLabel);

  if (flexibleLabel) {
    var valueLabel = document.createElementNS(XUL_NS, "label");
    valueLabel.setAttribute("value", flexibleLabel);
    if (strong) {
      valueLabel.setAttribute("class", "titleLabel");
    }
    row.appendChild(valueLabel);
  }

  if (lastLabel) {
    valueLabel = document.createElementNS(XUL_NS, "label");
    valueLabel.setAttribute("value", lastLabel);
    if (strong) {
      valueLabel.setAttribute("class", "titleLabel");
    }
    row.appendChild(valueLabel);
  }

  rows.appendChild(row);
}

// <Kaze>
function AddLabelToRadiogroup(radiogroup, label, style)
{
  var labelLabel = document.createElementNS(XUL_NS, "label");
  labelLabel.setAttribute("value", label);
  labelLabel.setAttribute("class", "radiogrouplabel");
  radiogroup.appendChild(labelLabel);
}
// <Kaze>


// * adds a declaration's importance to a given treerows
//   param XULElement rows
//   param String label
//   param String value
//   param String importance
function AddDeclarationToInfobox(rows, cssObject, i, importance)
{
  var labelLabel = document.createElementNS(XUL_NS, "label");
  var row = document.createElementNS(XUL_NS, "row");
  row.setAttribute("align", "center");
  labelLabel.setAttribute("value", "");
  row.appendChild(labelLabel);

  var valueLabel = document.createElementNS(XUL_NS, "label");
  valueLabel.setAttribute("value", GetDeclarationText(cssObject, i));
  row.appendChild(valueLabel);

  var importanceLabel = document.createElementNS(XUL_NS, "checkbox");
  if (GetDeclarationImportance(cssObject, i) == "important") {
    importanceLabel.setAttribute("checked", true);
  }
  importanceLabel.setAttribute("oncommand", "TogglePropertyImportance(\"" + cssObject.style.item(i) + "\")" );
  row.appendChild(importanceLabel);

  rows.appendChild(row);
}

function TogglePropertyImportance(property)
{
  var cssObject = gDialog.selectedObject;
  var newImportance =  (cssObject.style.getPropertyPriority(property) == "important") ? "" : "important" ;
  cssObject.style.setProperty(property, cssObject.style.getPropertyValue(property), newImportance);
}

// * retrieves the index-nth style declaration in a rule
//   param DOMCSSRule styleRule
//   param integer index
//   return String
function GetDeclarationText(styleRule, index)
{
  var pName = styleRule.style.item(index);
  return pName + ": " + styleRule.style.getPropertyValue(pName);
}

// * retrieves the stylesheet containing the selected tree entry
//   return integer
function GetSheetContainer()
{
  var index = gDialog.selectedIndex;
  while (index >= 0 && objectsArray[index].type != SHEET) {
    index--;
  }
  return index;
}

// * declares that the stylesheet containing the selected tree entry
//   has been modified
function SetModifiedFlagOnStylesheet()
{
  var index = GetSheetContainer();
  if (index != -1) {
    //~ objectsArray[index].modified = true;
    SetModifiedFlagOnTreeItem(index); // Kaze
    if (isInternalStylesheet(index))  // Kaze
      gDialog.modified = true;
  }
}

// * we are about to put some info about the selected entry into
//   the Info tab
//   return XULElement
function PrepareInfoGridForCreation()
{
  gDialog.sheetTabbox.selectedTab = gDialog.sheetInfoTab;
  
  var gridrows = gDialog.sheetInfoTabGridRows;
  var grid     = gDialog.sheetInfoTabGrid;

  if (gridrows) {
    grid.removeChild(gridrows);
  }

  gridrows = document.createElementNS(XUL_NS, "rows");
  gDialog.sheetInfoTabGridRows = gridrows;
  gridrows.setAttribute("id", "sheetInfoTabGridRows");
  grid.appendChild(gridrows);
  grid.removeAttribute("style");
  return gridrows;
}

// * user wants to create a @import rule
function CreateNewAtimportRule()
{
  var gridrows = PrepareInfoGridForCreation();

  gDialog.newType      = IMPORT_RULE;
  gDialog.newMediaList = "";
  gDialog.newURL       = "";
  gDialog.sheetInfoTabPanelTitle.setAttribute("value", GetString("NewImportRule"));
  AddEditableZoneToInfobox(gridrows, "URL:",        gDialog.newURL,    "onNewURLChange", true);
  AddEditableZoneToInfobox(gridrows, GetString("MediaList"),
                           gDialog.newMediaList, "onNewMediaListChange", false);
  AddSingleButtonToInfobox(gridrows, GetString("CreateImportRule"),
                           "onConfirmCreateNewObject", false);
}

// * user wants to create a new style rule
function CreateNewStyleRule()
{
  var gridrows = PrepareInfoGridForCreation();
  
  gDialog.newExternal  = false;
  gDialog.newType      = STYLE_RULE;
  gDialog.newSelector  = "";
  gDialog.sheetInfoTabPanelTitle.setAttribute("value", GetString("NewStyleRule"));
  gDialog.newSelectorType = CLASS_SELECTOR;
  /* <Kaze>
  var radiogroup = AddRadioGroupToInfoBox(gridrows, GetString("CreateNew"));
  // offer choice between class selector and type element selector
  AddRadioToRadioGroup(radiogroup, GetString("NamedStyle"),
             "onCreationStyleRuleTypeChange", CLASS_SELECTOR, true);
  AddRadioToRadioGroup(radiogroup, GetString("ElementStyle"),
             "onCreationStyleRuleTypeChange", TYPE_ELEMENT_SELECTOR, false);
  
  // oh, and in expert mode, allow of course any selector
  if (gDialog.expertMode) {
    AddRadioToRadioGroup(radiogroup, GetString("SelectorStyle"),
               "onCreationStyleRuleTypeChange", GENERIC_SELECTOR, false);
  }
   */
  if (gDialog.expertMode && false) { // Kaze: the 'Expert' mode is disabled now
    // let the "expert" user directly enter the selector
    AddLabelToInfobox(gridrows, GetString("Selector"), null, null, false);
    gDialog.newSelectorType = GENERIC_SELECTOR;
  } else if (false) {
    var radiogroup = AddRadioGroupToInfoBox(gridrows, GetString("CreateNew"));
    // offer choice between class selector and type element selector
    AddRadioToRadioGroup(radiogroup, GetString("NamedStyle"),
               "onCreationStyleRuleTypeChange", CLASS_SELECTOR, true);
    AddRadioToRadioGroup(radiogroup, GetString("ElementStyle"),
               "onCreationStyleRuleTypeChange", TYPE_ELEMENT_SELECTOR, false);
    AddRadioToRadioGroup(radiogroup, GetString("SelectorStyle"),
               "onCreationStyleRuleTypeChange", GENERIC_SELECTOR, false);
  } else {
    var radiogroup = AddRadioGroupToInfoBox(gridrows, GetString("CreateNew"));
    radiogroup.setAttribute("id", "cssSelectorType");

    // offer choice between class selector and type element selector
    AddRadioToRadioGroup(radiogroup, GetString("ElementStyle"),
               "onCreationStyleRuleTypeChange", "'type'", true);
    AddLabelToRadiogroup(radiogroup, GetString("ElementStyleExample"));
    AddRadioToRadioGroup(radiogroup, GetString("NamedStyle"),
               "onCreationStyleRuleTypeChange", "'class'", false);
    AddLabelToRadiogroup(radiogroup, GetString("NamedStyleExample"));
    AddRadioToRadioGroup(radiogroup, GetString("IdStyle"),
               "onCreationStyleRuleTypeChange", "'id'", false);
    AddLabelToRadiogroup(radiogroup, GetString("IdStyleExample"));
    AddRadioToRadioGroup(radiogroup, GetString("SelectorStyle"),
               "onCreationStyleRuleTypeChange", "'custom'", false);
    AddLabelToRadiogroup(radiogroup, GetString("SelectorStyleExample"));
  }
  
  var selectorBox = null;
  if (gDialog.dropdownLists)
    selectorBox = AddEditableListToInfobox(gridrows, " ", "", "onCssSelectorChange", true);
  else
    selectorBox = AddEditableZoneToInfobox(gridrows, " ", gDialog.newSelector, "onCssSelectorChange", true);
  selectorBox.setAttribute("id", "cssSelectorInput");
  selectorBox.setAttribute("style", "margin-top: 1em; margin-bottom: 1em;");
  onCreationStyleRuleTypeChange("type");
  // </Kaze>
  
  //AddEditableZoneToInfobox(gridrows, " ", gDialog.newSelector, "onNewSelectorChange", true);
  
  AddSingleButtonToInfobox(gridrows, GetString("CreateStyleRule"), "onConfirmCreateNewObject");

  // Kaze: add a dynamic description for beginners (TODO)
}

// * user changed the type of style rule (s)he wants to create
//   param integer type
function onCreationStyleRuleTypeChange(type)
{
  gDialog.newSelectorType = type;

  // <Kaze>
  gDialog.newSelectorType = GENERIC_SELECTOR;
  UpdateCssSelectorInputPopup(type, true);

  var cssField = document.getElementById("cssSelectorInput");

  switch (type) {
  case "id":
    cssField.value = "#";
    break;
  case "class":
    cssField.value = ".";
    break;
  default:
    cssField.value = "";
    break;
  }

  cssField.focus();
  return;
  // </Kaze>
}

// * user wants to create a new embedded stylesheet
function CreateNewStyleElement()
{
  var gridrows = PrepareInfoGridForCreation();

  gDialog.newExternal  = false;
  gDialog.newType      = SHEET;
  gDialog.newMediaList = "";
  gDialog.newTitle     = "";
  gDialog.sheetInfoTabPanelTitle.setAttribute("value", GetString("NewStylesheet"));
  AddLabelToInfobox(gridrows, GetString("Type"), "text/css", null, false);
  AddEditableZoneToInfobox(gridrows, GetString("MediaList"),
                           gDialog.newMediaList, "onNewMediaListChange", true);
  AddEditableZoneToInfobox(gridrows, GetString("Title"),
                           gDialog.newTitle,  "onNewTitleChange", false);

  AddSingleButtonToInfobox(gridrows, GetString("CreateStylesheet"),
                           "onConfirmCreateNewObject")
}

// * user wants to attach an external stylesheet
function CreateNewLinkedSheet()
{
  var gridrows = PrepareInfoGridForCreation();

  gDialog.newExternal  = true;
  gDialog.newType      = SHEET;
  gDialog.newAlternate = false;
  gDialog.newURL       = "";
  gDialog.newMediaList = "";
  gDialog.newTitle     = "";
  gDialog.sheetInfoTabPanelTitle.setAttribute("value", GetString("NewLinkedStylesheet"));
  AddLabelToInfobox(gridrows, GetString("Type"),
                    "text/css", null, false);
  // alternate stylesheet ?
  AddCheckboxToInfobox(gridrows, GetString("Alternate"),
                       GetString("CreateAltStylesheet"),
                       gDialog.newAlternate,
                       "onNewAlternateChange");
  gDialog.URLtextbox = AddEditableZoneToInfobox(gridrows, "URL:",
                                                gDialog.newURL,    "onNewURLChange", true);
  //~ AddSingleButtonToInfobox(gridrows, GetString("ChooseFile"), "onChooseLocalFile")
  AddSingleButtonToInfobox(gridrows, GetString("ChooseFile"), "onChooseLocalFile", "filePicker"); // Kaze

  AddEditableZoneToInfobox(gridrows, GetString("MediaList"),
                           gDialog.newMediaList, "onNewMediaListChange", false);
  AddEditableZoneToInfobox(gridrows, GetString("Title"),
                           gDialog.newTitle,  "onNewTitleChange", false);

  AddSingleButtonToInfobox(gridrows, GetString("CreateStylesheet"),
                           "onConfirmCreateNewObject")

  // the two following labels are unfortunately useful...
  AddLabelToInfobox(gridrows, "", GetString("SaveBeforeLocalSheetWarning1"), null, false);
  AddLabelToInfobox(gridrows, "", GetString("SaveBeforeLocalSheetWarning2"), null, false);
}

// * forget about everything, and let's redo it
function Restart()
{
  // delete all objects we keep track of
  var l = objectsArray.length;
  for (var i=0; i<l; i++) {
    delete objectsArray[i];
  }
  delete objectsArray;

  // now, let's clear the tree
  var gridrows = gDialog.sheetInfoTabGridRows;
  if (gridrows) {
    var elt = gridrows.lastChild;
    while (elt) {
      var tmp = elt.previousSibling;
      gridrows.removeChild(elt);
      elt = tmp;
    }
  }

  // switch to default Info tab
  gDialog.selectedTab = GENERAL_TAB;
  gDialog.sheetInfoTabPanelTitle.setAttribute("value", "");

  // let's recreate the tree
  InitSheetsTree(gDialog.sheetsTreechildren);
  // and update the buttons
  UpdateButtons(false, false, true, true, false, false);
}

// * does less than Restart(). We only regenerate the tree, keeping track
//   of the selection
function Refresh()
{
  // <Kaze>
  var mod = new Array();
  for (var i = 0; i < objectsArray.length; i++)
    if (objectsArray[i].modified)
      mod.push(i);
  // </Kaze>

  var index = gDialog.selectedIndex;
  Restart();
  if (index != -1)
    selectTreeItem(objectsArray[index].xulElt);

  // <Kaze>
  for (i = 0; i < mod.length; i++)
    SetModifiedFlagOnTreeItem(mod[i], true);
  //~ UnfoldFirstStylesheet();
  // </Kaze>
}

/* CALLBACKS */

// * user toggled the "Alternate Stylesheet" checkbox
function onNewAlternateChange()
{
  gDialog.newAlternate = !gDialog.newAlternate;
}

// * user changed the URL of an external stylesheet; elt is the textarea
//   param XULElement elt
function onNewURLChange(elt)
{
  gDialog.newURL = elt.value;
}

// * user changed the selector for a rule; elt is the textarea
//   param XULElement elt
function onNewSelectorChange(elt)
{
  gDialog.newSelector = elt.value;
}

// * user changed the list of medias for a new rule; elt is the textarea
//   param XULElement elt
function onNewMediaListChange(elt)
{
  gDialog.newMediaList = elt.value;
}

// * user changed the title of a new stylesheet; elt is the textarea
//   param XULElement elt
function onNewTitleChange(elt)
{
  gDialog.newTitle = elt.value;
}

// * user disables/enabled the stylesheet
function onStylesheetDisabledChange()
{
  gDialog.selectedObject.disabled = !gDialog.selectedObject.disabled;
}

// * user changed the title of an existing stylesheet; elt is the textarea
//   param XULElement elt
function onStylesheetTitleChange(elt)
{
  var titleText = elt.value;
  gDialog.selectedObject.ownerNode.setAttribute("title", titleText);
  SetModifiedFlagOnStylesheet();
}

// * user changed the list of medias of an existing stylesheet; elt is the textarea
//   param XULElement elt
function onStylesheetMediaChange(elt)
{
  var mediaText= elt.value;
  gDialog.selectedObject.ownerNode.setAttribute("media", mediaText);
  SetModifiedFlagOnStylesheet();
}

function GetSubtreeChildren(elt)
{
  var subtreechildren = null;
  if (!elt) return null;
  if (elt.hasChildNodes()) {
    subtreechildren = elt.lastChild;
    while (subtreechildren && subtreechildren .nodeName.toLowerCase() != "treechildren") {
      subtreechildren = subtreechildren .previousSibling;
    }
  }
  if (!subtreechildren) {
    subtreechildren = document.createElementNS(XUL_NS, "treechildren");
    elt.appendChild(subtreechildren);
  }
  return subtreechildren;
}

// * here, we create a new sheet or rule
function onConfirmCreateNewObject()
{
  // <Kaze>
  if (gDialog.newType == STYLE_RULE) {
    // remove useless spaces in the selector
    gDialog.newSelector = gDialog.newSelector.replace(/^\s+|\s+$/g, "")
                                             .replace(/\s*,\s*/g, ", ")
                                             .replace(/\s+/g, " ");
    // check that this selector isn't already used in the current stylesheet.
    var index = FindRuleIndexInObjectArray(gDialog.newSelector);
    if (index > 0) { // select the existing rule, don't create a new one
      selectTreeItem(objectsArray[index].xulElt);
      onSelectCSSTreeItem('general');
      return;
    }
  }
  // </Kaze>

  // first, let's declare we modify the document
  gDialog.modified = true;
  var selector;

  // if we are requested to create a style rule in expert mode,
  // let's find the last embedded stylesheet
  //if (!gDialog.expertMode && gDialog.newType == STYLE_RULE) {
  if (gDialog.newType == STYLE_RULE) {
    var indexLastEmbeddedStylesheet = -1;

    //for (var i = objectsArray.length-1; i >= 0 ; i--) {
    for (var i = gDialog.selectedIndex; i >= 0 ; i--) { // Kaze: use the selected stylesheet!
      if (objectsArray[i].type == SHEET && ! objectsArray[i].external) {
        indexLastEmbeddedStylesheet = i;
        break;
      }
    }
    if (indexLastEmbeddedStylesheet != -1) {
      gDialog.selectedIndex = indexLastEmbeddedStylesheet;
    }
    else {
      // there is no stylesheet ! let's create one that will contain our rule
      gDialog.newExternal  = false;
      gDialog.newMediaList = "";
      gDialog.newTitle     = "";
      gDialog.newType      = SHEET;
      var selectorType     = gDialog.newSelectorType;
      selector             = gDialog.newSelector;
      onConfirmCreateNewObject();

      // now, create the rule...
      gDialog.newType         = STYLE_RULE;
      gDialog.newSelectorType = selectorType;
      gDialog.newSelector     = selector;
    }
  }
  var containerIndex, sheetIndex;
  var cssObject;
  var l;
  var ruleIndex;
  var newSheetOwnerNode;
  var headNode;
  var newCssRule;
  switch (gDialog.newType) {
    case STYLE_RULE:
      if (gDialog.newSelector != "") {
        containerIndex = gDialog.selectedIndex;
        while (objectsArray[containerIndex].type != SHEET &&
               objectsArray[containerIndex].type != MEDIA_RULE)
          containerIndex--;

        switch (gDialog.newSelectorType) {
          case TYPE_ELEMENT_SELECTOR:
          case GENERIC_SELECTOR:
            selector = gDialog.newSelector;
            break;
          case CLASS_SELECTOR:
            selector = "." + gDialog.newSelector;
            break;
        }
        cssObject = objectsArray[containerIndex].cssElt;
        l = cssObject.cssRules.length;
        cssObject.insertRule(selector + " { }", l);

        if (cssObject.cssRules.length > l) {
          // hmmm, there's always the bad case of a wrong rule, dropped by the
          // parser ; that's why we need to check we really inserted something

          /* find inserted rule's index in objectsArray */
          var depth    = objectsArray[containerIndex].depth;
          var external = objectsArray[containerIndex].external;

          ruleIndex = containerIndex + 1;
          while (ruleIndex < objectsArray.length &&
                 objectsArray[ruleIndex].depth > depth) {
            ruleIndex++;
          }
          var subtreechildren = GetSubtreeChildren(objectsArray[containerIndex].xulElt);
          gInsertIndex = ruleIndex;
          var subtreeitem = AddStyleRuleToTreeChildren(cssObject.cssRules[l], external, depth);
          subtreechildren.appendChild(subtreeitem);
          selectTreeItem(subtreeitem);
          SetModifiedFlagOnStylesheet();
        }
        
        //if (gDialog.expertMode) { // Kaze
            gDialog.cssTBox.focus();
        //}
      }
      break;
    case IMPORT_RULE:
      if (gDialog.newURL != "") {

        containerIndex     = GetSheetContainer();
        // **must** clear the selection before changing the tree
        ClearTreeSelection(gDialog.sheetsTree);

        var containerCssObject = objectsArray[containerIndex].cssElt;
        var containerDepth     = objectsArray[containerIndex].depth;
        var containerExternal  = objectsArray[containerIndex].external;

        var cssRuleIndex = -1;
        if (containerCssObject.cssRules)
          for (i=0; i < containerCssObject.cssRules.length; i++)
            if (containerCssObject.cssRules[i].type != CSSRule.IMPORT_RULE &&
                containerCssObject.cssRules[i].type != CSSRule.CHARSET_RULE) {
              cssRuleIndex = i;
              break;
            }
        if (cssRuleIndex == -1) {
          // no rule in the sheet for the moment or only charset and import rules
          containerCssObject.insertRule('@import url("'+ gDialog.newURL + '") ' + gDialog.newMediaList + ";",
                                        containerCssObject.cssRules.length);
          newCssRule = containerCssObject.cssRules[containerCssObject.cssRules.length - 1];

          subtreechildren = GetSubtreeChildren(objectsArray[containerIndex].xulElt);

          gInsertIndex = ruleIndex;
          subtreeitem = AddImportRuleToTreeChildren(newCssRule,
                                                    containerExternal,
                                                    containerDepth + 1);
          
          subtreechildren.appendChild(subtreeitem);
          ruleIndex = FindObjectIndexInObjectsArray(newCssRule);
        }
        else {
          // cssRuleIndex is the index of the first not charset and not import rule in the sheet
          ruleIndex = FindObjectIndexInObjectsArray(containerCssObject.cssRules[cssRuleIndex]);
          // and ruleIndex represents the index of the corresponding object in objectsArray
          var refObject  = objectsArray[ruleIndex];

          containerCssObject.insertRule('@import url("'+ gDialog.newURL + '") ' + gDialog.newMediaList + ";",
                                        cssRuleIndex);
          newCssRule = containerCssObject.cssRules[cssRuleIndex];
          gInsertIndex = ruleIndex;
          subtreeitem = AddImportRuleToTreeChildren(newCssRule, containerExternal, containerDepth + 1);

          var refNode = refObject.xulElt;
          refNode.parentNode.insertBefore(subtreeitem, refNode);
        }

          
        selectTreeItem(subtreeitem);
        SetModifiedFlagOnStylesheet();
        if (gAsyncLoadingTimerID)
          clearTimeout(gAsyncLoadingTimerID);
        if (!newCssRule.styleSheet)
          gAsyncLoadingTimerID = setTimeout("sheetLoadedTimeoutCallback(" + ruleIndex + ")", kAsyncTimeout);
      }
      break;
    case SHEET:
      gInsertIndex = -1;

      ClearTreeSelection(gDialog.sheetsTree);

      if (gDialog.newExternal && gDialog.newURL != "") { // Linked stylesheet
        // <Kaze>
        var relativeURL = MakeRelativeUrl(gDialog.newURL);
        var absoluteURL = MakeAbsoluteUrl(gDialog.newURL);
        // </Kaze>

        subtreeitem  = document.createElementNS(XUL_NS, "treeitem");
        var subtreerow   = document.createElementNS(XUL_NS, "treerow");
        var subtreecell  = document.createElementNS(XUL_NS, "treecell");
        subtreeitem.setAttribute("container", "true");
        subtreerow.appendChild(subtreecell);
        subtreeitem.appendChild(subtreerow);
        gDialog.sheetsTreechildren.appendChild(subtreeitem);

        newSheetOwnerNode = getCurrentEditor().document.createElement("link");
        newSheetOwnerNode.setAttribute("type", "text/css");
        //~ newSheetOwnerNode.setAttribute("href", gDialog.newURL);
        newSheetOwnerNode.setAttribute("href", relativeURL); // Kaze
        if (gDialog.newAlternate) {
          newSheetOwnerNode.setAttribute("rel", "alternate stylesheet");
        }
        else {
          newSheetOwnerNode.setAttribute("rel", "stylesheet");
        }
        if (gDialog.newMediaList != "") {
          newSheetOwnerNode.setAttribute("media", gDialog.newMediaList);
        }
        if (gDialog.newTitle != "") {
          newSheetOwnerNode.setAttribute("title", gDialog.newTitle);
        }
        headNode = GetHeadElement();
        headNode.appendChild(newSheetOwnerNode);

        //~ subtreecell.setAttribute("label", gDialog.newURL);
        subtreecell.setAttribute("label", relativeURL); // Kaze
        external = true;
        //~ if ( /(\w*):.*/.test(gDialog.newURL) ) {
        if ( /(\w*):.*/.test(absoluteURL) ) { // Kaze
          if (RegExp.$1 == "file") {
            external = false;
          }
        }
        if (external)
          subtreecell.setAttribute("properties", "external");

        // <Kaze> this is a workaround for that bug:
        // http://www.geckozone.org/forum/viewtopic.php?p=392959#392959
        var cssRules = null;
        if (newSheetOwnerNode.sheet) try {
          cssRules = newSheetOwnerNode.sheet.cssRules;
        } catch(e) {} 
        // </Kaze>
        //if (!newSheetOwnerNode.sheet) {
        if (!newSheetOwnerNode.sheet || !cssRules) {
          /* hack due to asynchronous load of external stylesheet */        
          var o = newObject(subtreeitem, external, OWNER_NODE, newSheetOwnerNode, false, 0);
          PushInObjectsArray(o)
          if (gAsyncLoadingTimerID)
            clearTimeout(gAsyncLoadingTimerID);
          sheetIndex = objectsArray.length - 1;
          
          gAsyncLoadingTimerID = setTimeout("sheetLoadedTimeoutCallback(" + sheetIndex + ")", kAsyncTimeout);
        }
        else {
          o = newObject(subtreeitem, external, SHEET, newSheetOwnerNode.sheet, false, 0);
          PushInObjectsArray(o);
          //AddRulesToTreechildren(subtreeitem, newSheetOwnerNode.sheet.cssRules, external, 1);
          AddRulesToTreechildren(subtreeitem, cssRules, external, 1); // Kaze
        }
      }
      else if (!gDialog.newExternal) { // Internal stylesheet
        newSheetOwnerNode = getCurrentEditor().document.createElement("style");
        newSheetOwnerNode.setAttribute("type", "text/css");
        if (gDialog.newMediaList != "") {
          newSheetOwnerNode.setAttribute("media", gDialog.newMediaList);
        }
        if (gDialog.newTitle != "") {
          newSheetOwnerNode.setAttribute("title", gDialog.newTitle);
        }
        headNode = GetHeadElement();
        headNode.appendChild(newSheetOwnerNode);
        AddSheetEntryToTree(gDialog.sheetsTreechildren, newSheetOwnerNode);
        selectTreeItem(objectsArray[objectsArray.length - 1].xulElt);
      }
      selectTreeItem(subtreeitem);
      break;
  }
  // Kaze: trying to solve the "phantom stylesheet" bug
  Refresh(); // Kaze
}

// * we need that to refresh the tree after async sheet load
//   param integer index
function sheetLoadedTimeoutCallback(index)
{
  var subtreeitem = objectsArray[index].xulElt;
  gInsertIndex = index+1;
  ClearTreeSelection(gDialog.sheetsTree);
  if (objectsArray[index].type == OWNER_NODE && objectsArray[index].cssElt.sheet != null) {
    var sheet = objectsArray[index].cssElt.sheet;
    // Kaze: this line raises an exception, but the code seems to work. Weird.
    AddRulesToTreechildren(subtreeitem , sheet.cssRules, objectsArray[index].external,
                           objectsArray[index].depth+1);
    objectsArray[index].type = SHEET;
    objectsArray[index].cssElt = sheet;
  }
  else if (objectsArray[index].type == IMPORT_RULE && objectsArray[index].cssElt.styleSheet != null) {
    AddRulesToTreechildren(subtreeitem , objectsArray[index].cssElt.styleSheet.cssRules, true,
                           objectsArray[index].depth+1)
  }
  else
    return;
  selectTreeItem(subtreeitem);
}

// * gets the object's index corresponding to an entry in the tree
//   param XULElement object
//   return integer
function FindObjectIndexInObjectsArray(object)
{
  var i, l = objectsArray.length;
  for (i=0; i<l; i++)
    if (objectsArray[i].cssElt == object)
      return i;
  return -1;
}

// * removes the selected entry from the tree and deletes the corresponding
//   object ; does some magic if we remove a container like a stylesheet or
//   an @import rule to remove all the contained rules
function RemoveObject()
{
  SetModifiedFlagOnStylesheet(); // Kaze

  GetSelectedItemData();
  var objectIndex = gDialog.selectedIndex;
  if (objectIndex == -1) return;
  var depth = gDialog.depthObject;

  var ruleIndex, i, ruleIndexInTree, toSplice;

  switch (gDialog.selectedType) {
    case SHEET:
      var ownerNode = gDialog.selectedObject.ownerNode;
      ownerNode.parentNode.removeChild(ownerNode);

      for (i=objectIndex+1; i<objectsArray.length && objectsArray[i].depth > depth; i++);
      toSplice = i - objectIndex;
      break;

    case IMPORT_RULE:
    case MEDIA_RULE:
      for (ruleIndexInTree=objectIndex-1; objectsArray[ruleIndexInTree].depth >= depth; ruleIndexInTree--);

      objectsArray[ruleIndexInTree].modified = true;
      ruleIndex = getRuleIndexInRulesList(gDialog.selectedObject.parentStyleSheet.cssRules,
                                          gDialog.selectedObject);
      if (ruleIndex != -1) {
        gDialog.selectedObject.parentStyleSheet.deleteRule(ruleIndex);
      }
      for (i=objectIndex+1; i<objectsArray.length && objectsArray[i].depth > depth; i++);
      toSplice = i - objectIndex;
      break;

    case STYLE_RULE:
      for (ruleIndexInTree=objectIndex-1; objectsArray[ruleIndexInTree].depth; ruleIndexInTree--);
      objectsArray[ruleIndexInTree].modified = true;
      if (gDialog.selectedObject.parentRule) {
        /* this style rule is contained in an at-rule */
        /* need to remove the rule only from the at-rule listing it */
        ruleIndex = getRuleIndexInRulesList(gDialog.selectedObject.parentRule.cssRules,
                                            gDialog.selectedObject);
        if (ruleIndex != -1) {
          gDialog.selectedObject.parentRule.deleteRule(ruleIndex);
        }
      }
      else {
        ruleIndex = getRuleIndexInRulesList(gDialog.selectedObject.parentStyleSheet.cssRules,
                                            gDialog.selectedObject);
        if (ruleIndex != -1) {
          gDialog.selectedObject.parentStyleSheet.deleteRule(ruleIndex);
        }
      }
      toSplice = 1;
      break;
  }
  // let's remove the whole treeitem
  gDialog.treeItem.parentNode.removeChild(gDialog.treeItem);
  // and then remove the objects from our array
  objectsArray.splice(objectIndex, toSplice);
  // can we select an item ?
  if (objectsArray.length)
    selectTreeItem(objectsArray[Math.min(objectIndex, objectsArray.length - 1)].xulElt);
}

// * moves a sheet/rule up in the tree
function MoveObjectUp()
{
  GetSelectedItemData();
  var index = gDialog.selectedIndex;
  if (index <= 0) return;
  var sheetIndex = GetSheetContainer();
  //~ var xulObject = objectsArray[index].xulElt;
  
  switch (gDialog.selectedType) {
  
  case SHEET:
  case OWNER_NODE:
    // Kaze: merging theses two cases to avoid code duplication
    var ownerNode = (gDialog.selectedType == OWNER_NODE) ?
      gDialog.selectedObject : gDialog.selectedObject.ownerNode;
    // Kaze: the following is the same as the original
    ClearTreeSelection(gDialog.sheetsTree);
    index--;
    while (index && objectsArray[index].type != SHEET)
      index--;
    if (index == -1) return;
    ownerNode.parentNode.insertBefore(ownerNode, objectsArray[index].cssElt.ownerNode);
    Restart();
    selectTreeItem(objectsArray[index].xulElt);
    gDialog.modified = true;
    break;
  
  case STYLE_RULE:
  case PAGE_RULE:
    var rule = gDialog.selectedObject;
    //~ objectsArray[sheetIndex].modified = true;
    ClearTreeSelection(gDialog.sheetsTree);
    // Kaze: replacing the whole piece of code by a "MoveRuleUp" call
    var item = MoveRuleUp(rule, index);
    if (item) {
      selectTreeItem(item);
      SetModifiedFlagOnTreeItem(sheetIndex); // Kaze
    } else
      selectTreeItem(objectsArray[index].xulElt);
    break;
  }
}

// * moves a sheet/rule down in the tree
function MoveObjectDown()
{
  /* NOT YET IMPLEMENTED */
  //~ var objectIndex = FindObjectIndexInObjectsArray(gDialog.selectedObject);
  //~ if (objectIndex == -1) return;
  
  // <Kaze> can't move the current object down? Let's move the next object up!
  GetSelectedItemData();
  var index = gDialog.selectedIndex;
  if (index < 0) return;
  var sheetIndex = GetSheetContainer();
  
  switch (gDialog.selectedType) {
  
  case SHEET:
  case OWNER_NODE:
    // I'm not sure this really works... further testing needed.
    var cssObject = gDialog.selectedObject;
    var xulObject = objectsArray[index].xulElt;
    index++;
    while (index < objectsArray.length && objectsArray[index].type != SHEET)
      index++;
    if (index >= objectsArray.length) return;
    ClearTreeSelection(gDialog.sheetsTree);
    var nextObject = objectsArray[index].cssElt;
    var ownerNode = (nextObject.type == OWNER_NODE) ? nextObject : nextObject.ownerNode;
    ownerNode.parentNode.insertBefore(ownerNode, cssObject.ownerNode);
    Restart();
    var objectIndex = FindObjectIndexInObjectsArray(cssObject);
    selectTreeItem(objectsArray[objectIndex].xulElt);
    gDialog.modified = true;
    break;
    
  case STYLE_RULE:
  case PAGE_RULE:
    index++;
    if (index >= objectsArray.length || gDialog.selectedType != objectsArray[index].type)
      return;
    var rule = objectsArray[index].cssElt;
    //~ objectsArray[sheetIndex].modified = true;
    ClearTreeSelection(gDialog.sheetsTree);
    var item = MoveRuleUp(rule, index);
    if (item)
      SetModifiedFlagOnTreeItem(sheetIndex); // Kaze
    //~ SetModifiedFlagOnStylesheet(); // Kaze
    selectTreeItem(objectsArray[index].xulElt);
    break;
  }
  // </Kaze>
}

// * opens a file picker and returns the file:/// URL in gDialog.newURL
function onChooseLocalFile()
{
  // Get a local file, converted into URL format
  var fileName = getLocalFileURL(true);
  if (fileName)
  {
    gDialog.URLtextbox.setAttribute("value", fileName);
    gDialog.newURL = fileName;
  }
}

// * opens a file picker for a *.css filename, exports the selected stylesheet
//   in that file, and replace the selected embedded sheet by its external, but
//   local to the filesystem, new counterpart
function onExportStylesheet()
{
  var fileName = getLocalFileURL(false);
  //~ var fileName = getLocalFileURL(false, true); // Kaze: *.css file filter
  if (!fileName) // Kaze (bugfix: erases the current page if cancelled)
    return;
  gDialog.modified = true; // Kaze

  SerializeExternalSheet(gDialog.selectedObject, fileName);
  var ownerNode = gDialog.selectedObject.ownerNode;
  var newSheetOwnerNode = ownerNode.ownerDocument.createElement("link");
  newSheetOwnerNode.setAttribute("type", "text/css");
  //~ newSheetOwnerNode.setAttribute("href", fileName);
  newSheetOwnerNode.setAttribute("href", MakeRelativeUrl(fileName)); // Kaze
  newSheetOwnerNode.setAttribute("rel", "stylesheet");
  var mediaList = ownerNode.getAttribute("media");
  if (mediaList && mediaList != "")
    newSheetOwnerNode.setAttribute("media", mediaList);
  ownerNode.parentNode.insertBefore(newSheetOwnerNode, ownerNode);
  ownerNode.parentNode.removeChild(ownerNode);

  // we still have to wait for async sheet loading's completion
  if (gAsyncLoadingTimerID)
    clearTimeout(gAsyncLoadingTimerID);
  gAsyncLoadingTimerID = setTimeout("Refresh()", 500);
}

function getCurrentEditor()
{
  if (typeof window.InitEditorShell == "function")
    return editorShell.editor;
  else
    return GetCurrentEditor();
}

function AddCSSLevelChoice(rows)
{
  var labelLabel = document.createElementNS(XUL_NS, "label");
  var row = document.createElementNS(XUL_NS, "row");
  row.setAttribute("align", "center");
  labelLabel.setAttribute("value", "CSS Level");
  
  row.appendChild(labelLabel);

  var level;
  for (level = 1; level < 4; level++) {
    var levelCheckbox = document.createElementNS(XUL_NS, "checkbox");
    levelCheckbox.setAttribute("label", level);
    row.appendChild(levelCheckbox);
  }

  rows.appendChild(row);
}

function GetString(key)
{
  var result = "";
  try
  {
    result = gDialog.bundle.getString(key);
  }
  catch(e)
  {
    dump("GetString error!")
  }
  return result;
}
//
// <Kaze> KaZcadeS overlay: new globals and functions
var kzsPrefs = Components.classes["@mozilla.org/preferences-service;1"]
                         .getService(Components.interfaces.nsIPrefService)
                         .getBranch("extensions.cascades.");
const gModifiedFlagSrc = "chrome://editor/skin/icons/modified.gif";
var gNewStyleRule = "StyleRule";

function kzsStartup() {
  Startup(); // normal CaScadeS startup

  // Kaze: prevents to close this window with [Return]
  // disabled, I couldn't make it work properly
  //window.addEventListener("keypress", noReturn, true);

  gDialog.cssTBox     = document.getElementById("cssTBox");
  gDialog.styleMenu   = document.getElementById("styleMenu");
  gDialog.menuTooltip = gDialog.styleMenu.getAttribute("tooltiptext");
  
  // backup <head> element and load prefs
  gDialog.head          = GetHeadElement().cloneNode(true);
  gDialog.expertMode    = true;
  gDialog.dropdownLists = true;
  try {
    gDialog.expertMode    = kzsPrefs.getBoolPref("expertMode");
    gDialog.dropdownLists = kzsPrefs.getBoolPref("dropdownLists");
  } catch(e) {}
  document.getElementById("expertModeCheckbox").setAttribute("checked", gDialog.expertMode);
  UpdateButtons(false, false, true, true, false, false);
  
  // select the first stylesheet if any
  if (objectsArray.length) {
    var xulElt = objectsArray[0].xulElt;
    selectTreeItem(xulElt);
    // unfold the stylesheet if it's the only one
    if (!xulElt.nextSibling)
      xulElt.setAttribute("open", "true");
  }
  else {
    // no stylesheet yet: let's create one that will contain our rule
    gDialog.newExternal  = false;
    gDialog.newMediaList = "";
    gDialog.newTitle     = "";
    gDialog.newType      = SHEET;
    onConfirmCreateNewObject();
    CreateNewStyleRule();
  }
}

function noReturn(event) {
  if (event.keyCode == KeyEvent.DOM_VK_RETURN) {
    // if (document.commandDispatcher.focusedElement != gDialog.cssTBox) {
    // if (document.commandDispatcher.focusedElement.id != "cssTBox") {
      event.preventDefault();  // required in Gecko 1.8
      // event.stopPropagation();
    // }
  }
}

function CancelAllChanges() {
  // To cancel all changes, we replace the current <head> node with the one we cloned at startup time.

  // Unfortunately, starting with Gecko 1.8, this adds "*|" strings in all
  // selectors for all external stylesheets.
  // Workaround: modify each stylesheet before resetting the <head> node.
  for (var i = 0; i < objectsArray.length; i++) {
    if (objectsArray[i].type == SHEET) try {
      objectsArray[i].cssElt.deleteRule(0);
    } catch(e) {}
  }

  // Now reset the <head> node to revert all changes
  if (gDialog.head) try {
    var headElt = GetHeadElement();
    headElt.parentNode.replaceChild(gDialog.head, headElt);
    delete(gDialog.head);
  } catch (e) {}
}

function MoveRuleUp(rule, index) {  // extracted from the original "MoveObjectUp"
  var ruleText = rule.cssText;
  var subtreeitem;
  var newRule;
  if (rule.parentRule) { // Kaze: what's this for???
    var ruleIndex = getRuleIndexInRulesList(rule.parentRule.cssRules, rule);
    var parentRule = rule.parentRule;
    if (ruleIndex == -1) return;

    if (!ruleIndex) {
      // we have to move the rule just before its parent rule
      parentRule.deleteRule(0);
      var parentRuleIndex;

      parentRuleIndex = getRuleIndexInRulesList(parentRule.parentStyleSheet.cssRules, parentRule);
      parentRule.parentStyleSheet.insertRule(ruleText, parentRuleIndex);
      newRule = parentRule.parentStyleSheet.cssRules[parentRuleIndex];
    }
    else {
      // we just move the rule in its parentRule
      parentRule.deleteRule(ruleIndex);
      parentRule.insertRule(ruleText, ruleIndex - 1);
      newRule = parentRule.cssRules.item(ruleIndex - 1);
    }
    // remove the tree entry
    objectsArray[index].xulElt.parentNode.removeChild(objectsArray[index].xulElt);
    // delete the object
    objectsArray.splice(index, 1);
    // position the insertion index
    gInsertIndex = index - 1;
    subtreeitem  = AddStyleRuleToTreeChildren(newRule,
                                              objectsArray[index-1].external,
                                              objectsArray[index-1].depth);
    // make the new tree entry
    objectsArray[index].xulElt.parentNode.insertBefore(subtreeitem,
                                                       objectsArray[index].xulElt);
    //~ selectTreeItem(subtreeitem);
    //~ gDialog.modified = true // Kaze: the HTML document has been modified
    //~ SetModifiedFlagOnStylesheet(); // Kaze
    return(subtreeitem); // Kaze
  }
  else {
    // standard case, the parent of the rule is the stylesheet itself
    ruleIndex = getRuleIndexInRulesList(rule.parentStyleSheet.cssRules, rule);
    var refStyleSheet = rule.parentStyleSheet;
    if (ruleIndex == -1) return;
    if (ruleIndex) {
      // we just move the rule in the sheet
      refStyleSheet.deleteRule(ruleIndex);
      var targetRule = refStyleSheet.cssRules.item(ruleIndex - 1);
    
      if (targetRule.type == CSSRule.MEDIA_RULE) {
        targetRule.insertRule(ruleText, targetRule.cssRules.length);
        var targetRuleIndex = FindObjectIndexInObjectsArray(targetRule);
        newRule = targetRule.cssRules.item(targetRule.cssRules.length - 1);
        var subtreechildren = GetSubtreeChildren(objectsArray[targetRuleIndex].xulElt);
      
        // in this case, the target treeitem is at same location but one level deeper
        // remove the tree entry
        objectsArray[index].xulElt.parentNode.removeChild(objectsArray[index].xulElt);
        // delete the object
        objectsArray.splice(index, 1);
        // position the insertion index
        gInsertIndex = index;
        subtreeitem = AddStyleRuleToTreeChildren(newRule,
                                                 objectsArray[targetRuleIndex].external,
                                                 objectsArray[targetRuleIndex].depth + 1);
        // make the new tree entry
        subtreechildren.appendChild(subtreeitem);
        //~ selectTreeItem(subtreeitem);
        //~ return;
        SetModifiedFlagOnStylesheet(); // Kaze
        return subtreeitem;
      }
      else if (targetRule.type != CSSRule.IMPORT_RULE &&
               targetRule.type != CSSRule.CHARSET_RULE) {
        // we can move the rule before its predecessor only if that one is
        // not an @import rule nor an @charset rule
        refStyleSheet.insertRule(ruleText, ruleIndex - 1);
        newRule = refStyleSheet.cssRules[ruleIndex - 1];
        // remove the tree entry
        objectsArray[index].xulElt.parentNode.removeChild(objectsArray[index].xulElt);
        // delete the object
        objectsArray.splice(index, 1);
        // position the insertion index
        gInsertIndex = index - 1;
        subtreeitem =  AddStyleRuleToTreeChildren(newRule,
                                                  objectsArray[index-1].external,
                                                  objectsArray[index-1].depth);
        // make the new tree entry
        objectsArray[index].xulElt.parentNode.insertBefore(subtreeitem,
                                                           objectsArray[index].xulElt);
        //~ selectTreeItem(subtreeitem);
        //~ return;
        //~ SetModifiedFlagOnStylesheet(); // Kaze
        return subtreeitem;
      }
    }
    /* Kaze: disabled
    // At this point, we need to move the rule from one sheet to another one, if it
    // exists...
    // First, let's if there is another candidate stylesheet before the current one
    // for the style rule's ownership
    var refSheetIndex = FindObjectIndexInObjectsArray(refStyleSheet);
    sheetIndex = refSheetIndex;

    if (!sheetIndex) return; // early way out
    sheetIndex--;
    while (sheetIndex && (objectsArray[sheetIndex].type != SHEET ||
                          objectsArray[sheetIndex])) {
      sheetIndex--;
    }
    if (sheetIndex == -1) return; // no embedded or local stylesheet available
    var newStyleSheet = objectsArray[sheetIndex].cssElt;
    // we need to check the type of the last rule in the sheet, if it exists
    if (newStyleSheet.cssRules.length &&
        newStyleSheet.cssRules[newStyleSheet.cssRules.length - 1].type == CSSRule.MEDIA_RULE) {
      // this media rule is our target
      var refMediaRule      = newStyleSheet.cssRules[newStyleSheet.cssRules.length - 1];
      var refMediaRuleIndex = FindObjectIndexInObjectsArray(refMediaRule );
      var refRuleIndex      = refMediaRuleIndex++;
      while (refRuleIndex < objectsArray.length && objectsArray[refRuleIndex].depth > 1)
        refRuleIndex++;
      // refRuleIndex represents where we should insert the new object
    }
    else {
      // we just append the rule to the list of rules of the sheet
    } */
    // Kaze: if this is already the first element, select it
    //~ selectTreeItem(objectsArray[index].xulElt);
    //~ return objectsArray[index].xulElt;
    return false;
  }
}

function UpdateCSS() {
  // Expert mode only!
  
  // remove all existing properties
  var style = gDialog.selectedObject.style;
  if (!style) // this has to be a stylesheet
    return;
  
  for (var i=0; i<style.length; i++) {
    var property = style.item(i);
    style.removeProperty(property);
  }
  
  // add all properties from the textbox
  var cssArr = gDialog.cssTBox.value.replace(/[\s]*([:;])[\s]*/g, "$1").split(';');
  for (i=0; i<cssArr.length; i++) {
    property  = cssArr[i].replace(/[\s]*:.*$/, '');
    var value = cssArr[i].replace(/^.*:[\s]*/g, '').replace(/;[\s]*:/, '').replace(/\!.*$/, '');
    var important = /\![\s]*important/.test(cssArr[i]) ? "important" : "";
    style.setProperty(property, value, important);
  }
  
  // mark the stylesheet as modified
  SetModifiedFlagOnStylesheet();
}

function isInternalStylesheet(i) {
  if (objectsArray[i].type != SHEET)
    return;
  sheet = objectsArray[i].cssElt;
  return (sheet.ownerNode.nodeName.toLowerCase() == "style")
}

function CreateNewRule() {
  // empty and hide CSS TBox before creating the rule
  onSelectCSSTreeItem('general');
  gDialog.cssTBox.setAttribute("hidden", true);
  gDialog.cssTBox.value = "";
  
  // create the selected rule
  switch (gNewStyleRule) {
    case "StyleRule":
      // taken from onConfirmCreateNewObject()
      if (gDialog.selectedIndex < 0) {
        // no stylesheet selected! let's find the last embedded stylesheet
        for (var i = objectsArray.length - 1; i >= 0 ; i--) {
          if (isInternalStylesheet(i)) {
            gDialog.selectedIndex = i;
            break;
          }
        }
      }
      if (gDialog.selectedIndex < 0) {
        // no stylesheet found! let's create one that will contain our rule
        gDialog.newExternal  = false;
        gDialog.newMediaList = "";
        gDialog.newTitle     = "";
        gDialog.newType      = SHEET;
        onConfirmCreateNewObject();
      }
      CreateNewStyleRule();
      break;
    case "StyleElement":
      CreateNewStyleElement();
      break;
    case "LinkedSheet":
      CreateNewLinkedSheet();
      break;
    case "AtimportRule":
      CreateNewAtimportRule();
      break;
    case "AtmediaRule": // not yet implemented
      //~ CreateNewAtmediaRule();
      break;
  }
  gNewStyleRule = "StyleRule";
}
function SetModifiedFlagOnTreeItem(index, force) {
  // mark the stylesheet in the tree
  if (!objectsArray[index].modified || force) {
    // put a "modified" icon before the stylesheet
    var treecell = objectsArray[index].xulElt.firstChild.firstChild;
    treecell.setAttribute("src", gModifiedFlagSrc);
    // force to refresh the treeitem
    var label = treecell.getAttribute("label");
    treecell.setAttribute("label", label + " ");
  }
  objectsArray[index].modified = true;
}

// Kaze: added
function ReloadStylesheets() {
  // see http://www.danielandrade.net/2007/02/25/css-refresh/
  // (unused at the moment)
  var links = GetCurrentEditor().document.getElementsByTagName('link');
  for (var i = 0; i < links.length; i++) {
    var link = links[i];
    if (link.rel.toLowerCase().indexOf('stylesheet') >= 0 && link.href) {
      var href = link.href.replace(/[&\?]forceReload=[0-9]+/, '');
      link.href = href + (href.indexOf('?') >= 0 ? '&' : '?')
                       + 'forceReload=' + (new Date().valueOf());
    }
  }
}

function onDoubleClickCSSTreeItem() {
  if (gDialog.selectedType != STYLE_RULE) return;
  if (gDialog.selectedIndex <= 0) return;
  ChangeSelector();
}

function ChangeSelector() {
  var ownerNode, ruleIndex, ruleIndexInTree;
  var objectIndex = gDialog.selectedIndex;
  
  for (ruleIndexInTree=objectIndex-1; objectsArray[ruleIndexInTree].depth; ruleIndexInTree--);
  objectsArray[ruleIndexInTree].modified = true;
  if (gDialog.selectedObject.parentRule) {
    /* this style rule is contained in an at-rule */
    /* need to remove the rule only from the at-rule listing it */
    ownerNode = gDialog.selectedObject.parentRule;
  }
  else {
    ownerNode = gDialog.selectedObject.parentStyleSheet;
  }
  
  ruleIndex = getRuleIndexInRulesList(ownerNode.cssRules, gDialog.selectedObject);      
  if (ruleIndex != -1) {    
    var cssText  = gDialog.selectedObject.cssText;
    var selector = gDialog.selectedObject.selectorText;

    var promptService;
    try {
      promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService();
      promptService = promptService.QueryInterface(Components.interfaces.nsIPromptService);
    } catch (e) {}
    if (!promptService) return false;
    
    // User input
    var result = {value:selector};
    var captionStr = " ";
    var msgStr = GetString("Selector");
    var confirmed = promptService.prompt(window, captionStr, msgStr, result, null, {value:0});

    // replace the selector in the CSS rule
    if (confirmed) {
      cssText = cssText.replace(/^[^{]*/, result.value);
      ownerNode.deleteRule(ruleIndex);
      ownerNode.insertRule(cssText, ruleIndex);
      Refresh();
    }
  }
}

// Kaze: test (using drop-down lists to help creating a new style rule)
function findAllAttributes(menupopup, attr) {
  if (menupopup.hasChildNodes())
    return;

  var arr = new Array();
  var list = GetCurrentEditor().document.getElementsByTagName("*");
  var menuitem, value, prefix;

  for (var i=0; i<list.length; i++) if (list[i].hasAttribute(attr)) {
    value = list[i].getAttribute(attr);
    if (!isInArray(arr, value))
      arr.push(value);
  }

  switch(attr) {
    case "class":
      prefix = ".";
      break;
    case "id":
      prefix = "#";
      break;
    default:
      prefix = "";
      break;
  }

  arr.sort();
  for (i=0; i<arr.length; i++) {
    menuitem = document.createElement("menuitem");
    menuitem.setAttribute("label", prefix + arr[i]);
    menupopup.appendChild(menuitem);
  }
}

function findAllElements(menupopup) {
  if (menupopup.hasChildNodes())
    return;

  var menuitem, value, prefix;
  var arr = new Array();
  var list = GetCurrentEditor().document.getElementsByTagName("body")[0].getElementsByTagName("*");
 
  for (var i=0; i<list.length; i++) {
    value = list[i].tagName;
    if (!isInArray(arr, value))
      arr.push(value);
  }

  menuitem = document.createElementNS(XUL_NS, "menuitem");
  menuitem.setAttribute("label", "html");
  menupopup.appendChild(menuitem);

  menuitem = document.createElementNS(XUL_NS, "menuitem");
  menuitem.setAttribute("label", "body");
  menupopup.appendChild(menuitem);

  menuitem = document.createElementNS(XUL_NS, "menuitem");
  menuitem.setAttribute("label", "-");
  menuitem.setAttribute("disabled", "true");
  menupopup.appendChild(menuitem);

  // this raises an exception in xblpopupshowing() with Gecko 1.7
  menuitem = document.createElementNS(XUL_NS, "menuseparator");
  menuitem.setAttribute("disabled", "true");
  menupopup.appendChild(menuitem);

  arr.sort();
  for (i=0; i<arr.length; i++) {
    menuitem = document.createElement("menuitem");
    menuitem.setAttribute("label", arr[i].toLowerCase());
    menupopup.appendChild(menuitem);
  }
}

function filterAllElements(menupopup) {
  // TODO
  return;
}

function isInArray(arr, elt) {
  for (var j=0; j<arr.length; j++)
    if (elt == arr[j])
      return true;
  return false;
}

function onCssSelectorChange() {
  var cssSelectorType = document.getElementById("cssSelectorType");
  var value = document.getElementById("cssSelectorInput").value;
  gDialog.newSelector = value;

  // force to the correct radiobutton if needed
  var index = cssSelectorType.selectedIndex;
  if (/^\.[^\s\:\.#,]*$/.test(value))
    index = 1;
  else if (/^#[^\s\:\.#,]*$/.test(value))
    index = 2;
  else if (!value.length || /[\s\:\.#,]/.test(value))
    index = 3;

  var arr = ["type", "class", "id", "custom"];
  if (cssSelectorType.selectedIndex != index) {
    cssSelectorType.selectedIndex = index;
    UpdateCssSelectorInputPopup(arr[index]);
  }

  return;
}

function UpdateCssSelectorInputPopup(type) {
  if (!gDialog.dropdownLists)
    return; // Kaze: dropdown lists are disabled until KompoZer 0.8

  var cssField = document.getElementById("cssSelectorInput");
  var cssPopup = cssField.getElementsByTagName("menupopup")[0];
  if (cssPopup)
    cssField.removeChild(cssPopup);

  var cssList = document.getElementById("cssSelector-" + type);
  cssPopup = cssList.cloneNode(true);
  cssField.appendChild(cssPopup);
}

function FindRuleIndexInObjectArray(selectorText) {
  if (!objectsArray.length)
    return -1; // no stylesheet

  var cssObject = objectsArray[gDialog.selectedIndex].cssElt;
  var i, index = FindObjectIndexInObjectsArray(cssObject);

  // find the related stylesheet
  if (objectsArray[gDialog.selectedIndex].type != SHEET) {
    for (i = index-1; i >= 0 ; i--) {
      if (objectsArray[i].type == SHEET && ! objectsArray[i].external) {
        cssObject = objectsArray[i].cssElt;
        index = i;
        break;
      }
    }
  }

  // check if this selector isn't already used in the current stylesheet.
  var l = cssObject.cssRules.length;
  for (i = index+1; i <= index+l; i++) {
    if ((objectsArray[i].type == STYLE_RULE) && (objectsArray[i].cssElt.selectorText == selectorText) ) {
      return i;
    }
  }
  return -1; // not found
}

// </Kaze>
