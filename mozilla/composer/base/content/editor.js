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
 * The Original Code is Mozilla.org
 *
 * The Initial Developer of the Original Code is
 * Netscape Communications Corporation.
 * Portions created by the Initial Developer are Copyright (C) 1998-2004
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Sammy Ford      <sford@swbell.net>
 *   Dan Haddix      <dan6992@hotmail.com>
 *   John Ratke      <jratke@owc.net>
 *   Ryan Cassin     <rcassin@supernova.org>
 *   Daniel Glazman  <glazman@netscape.com>
 *   Daniel Glazman  <glazman@disruptive-innovations.com>, on behalf of Linspire Inc.
 *   Fabien Cazenave <kaze@kompozer.net>
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


/* Main Composer window UI control */

var gComposerWindowControllerID = 0;
var prefAuthorString = "";

const SIS_CTRID                 = "@mozilla.org/scriptableinputstream;1"
const cnsIScriptableInputStream = Components.interfaces.nsIScriptableInputStream;

const kDisplayModeNormal        = 0;
const kDisplayModeAllTags       = 1;
const kDisplayModePreview       = 2;
const kDisplayModeMenuIDs       = ["viewNormalMode",   "viewAllTagsMode", "viewPreviewMode"];
const kDisplayModeTabIDS        = ["NormalModeButton", "TagModeButton",   "PreviewModeButton"];
const kNormalStyleSheet         = "chrome://editor/content/EditorContent.css";
const kAllTagsStyleSheet        = "chrome://editor/content/EditorAllTags.css";
const kParagraphMarksStyleSheet = "chrome://editor/content/EditorParagraphMarks.css";
const kBlockOutlinesStyleSheet  = "chrome://editor/content/EditorBlockOutlines.css";

// <Kaze> adding some Edit modes:
const kEditModeDesign  = 0;
const kEditModeSplit   = 1;
const kEditModeSource  = 2;
const kEditModeMenuIDs = ["editDesignMode",   "editSplitMode",   "editSourceMode"];
const kEditModeTabIDS  = ["DesignModeButton", "SplitModeButton", "SourceModeButton"];
// </Kaze>

const kBlockOutlinesAttr = "blockoutlines";

const kTextMimeType = "text/plain";
const kHTMLMimeType = "text/html";
const kXMLMimeType  = "text/xml";

const nsIWebNavigation = Components.interfaces.nsIWebNavigation;

// Kaze: added kColoredSourceView to enable Nvu's pseudo-syntax highlighting later
const kColoredSourceView = false;

var gPreviousNonSourceEditMode = 1;
var gEditorDisplayMode    = -1;
var gEditorEditMode       = 0;      // Kaze
var gEditorFocus          = false;  // Kaze
var gDocWasModified       = false;  // Check if clean document, if clean then unload when user "Opens"
var gContentWindow        = 0;
var gSourceContentWindow  = 0;
var gSourceTextEditor     = null;
var gContentWindowDeck    = null;
var gSourceBrowserDeck    = null;   // Kaze
var gFormatToolbar1       = null;
var gFormatToolbar2       = null;
var gFormatToolbarHidden1 = false;
var gFormatToolbarHidden2 = false;
var gViewFormatToolbar1   = null;
var gViewFormatToolbar2   = null;
var gColorObj = {
  LastTextColor       : "",
  LastBackgroundColor : "",
  LastHighlightColor  : "",
  Type                : "",
  SelectedType        : "",
  NoDefault           : false,
  Cancel              : false,
  HighlightColor      : "",
  BackgroundColor     : "",
  PageColor           : "",
  TextColor           : "",
  TableColor          : "",
  CellColor           : ""
};
var gDefaultTextColor = "";
var gDefaultBackgroundColor = "";
var gCSSPrefListener;
var gPrefs;
var gLocalFonts = null;
var gFontMenuOk = {};

var gLastFocusNode = null;
var gLastFocusNodeWasSelected = false;

var gIsTemplate    = false;
var gIsTemplateRef = false;

var gScrollListener        = null;
var gResizeListener        = null;
var gEditorUpdatedListener = null;
var gUpdateRulerTimeOutId  = null;

var gSiteManagerNotificationHandler = null;
var gSiteManagerItemsArray          = null;
var gSiteManagerCurrentFilter       = "all";

var gWasInlineSpellCheckerEnabled = false;

// These must be kept in synch with the XUL <options> lists
var gFontSizeNames = ["xx-small","x-small","small","medium","large","x-large","xx-large"];

const nsIFilePicker = Components.interfaces.nsIFilePicker;

const kEditorToolbarPrefs = "editor.toolbars.showbutton.";

function ShowHideToolbarSeparators(toolbar) {
  dump("===> ShowHideToolbarSeparators\n");

  var childNodes = toolbar.childNodes;
  var separator = null;
  var hideSeparator = true;
  for (var i = 0; childNodes[i].localName != "spacer"; i++) {
    if (childNodes[i].localName == "toolbarseparator") {
      if (separator)
        separator.hidden = true;
      separator = childNodes[i];
    } else if (!childNodes[i].hidden) {
      if (separator)
        separator.hidden = hideSeparator;
      separator = null;
      hideSeparator = false;
    }
  }
}

function ShowHideToolbarButtons()
{
  dump("===> ShowHideToolbarButtons\n");

  var array = GetPrefs().getChildList(kEditorToolbarPrefs, {});
  for (var i in array) {
    var prefName = array[i];
    var id = prefName.substr(kEditorToolbarPrefs.length) + "Button";
    var button = document.getElementById(id);
    if (button)
      button.hidden = !gPrefs.getBoolPref(prefName);
  }
  ShowHideToolbarSeparators(document.getElementById("EditToolbar"));
  ShowHideToolbarSeparators(document.getElementById("FormatToolbar1"));
  ShowHideToolbarSeparators(document.getElementById("FormatToolbar2"));
}
  
function AddToolbarPrefListener()
{
  try {
    var pbi = GetPrefs().QueryInterface(Components.interfaces.nsIPrefBranchInternal);
    pbi.addObserver(kEditorToolbarPrefs, gEditorToolbarPrefListener, false);
  } catch(ex) {
    dump("Failed to observe prefs: " + ex + "\n");
  }
}

function RemoveToolbarPrefListener()
{
  try {
    var pbi = GetPrefs().QueryInterface(Components.interfaces.nsIPrefBranchInternal);
    pbi.removeObserver(kEditorToolbarPrefs, gEditorToolbarPrefListener);
  } catch(ex) {
    dump("Failed to remove pref observer: " + ex + "\n");
  }
}

// Pref listener constants
const gEditorToolbarPrefListener =
{
  observe: function(subject, topic, prefName)
  {
    // verify that we're changing a button pref
    if (topic != "nsPref:changed")
      return;

    var id = prefName.substr(kEditorToolbarPrefs.length) + "Button";
    var button = document.getElementById(id);
    if (button) {
      button.hidden = !gPrefs.getBoolPref(prefName);
      ShowHideToolbarSeparators(button.parentNode);
    }
  }
};

function nsButtonPrefListener()
{
  this.startup();
}

// implements nsIObserver
nsButtonPrefListener.prototype =
{
  domain: "editor.use_css",
  startup: function()
  {
    try {
      var pbi = pref.QueryInterface(Components.interfaces.nsIPrefBranchInternal);
      pbi.addObserver(this.domain, this, false);
    } catch(ex) {
      dump("Failed to observe prefs: " + ex + "\n");
    }
  },
  shutdown: function()
  {
    try {
      var pbi = pref.QueryInterface(Components.interfaces.nsIPrefBranchInternal);
      pbi.removeObserver(this.domain, this);
    } catch(ex) {
      dump("Failed to remove pref observers: " + ex + "\n");
    }
  },
  observe: function(subject, topic, prefName)
  {
    if (!IsHTMLEditor())
      return;
    // verify that we're changing a button pref
    if (topic != "nsPref:changed") return;
    if (prefName.substr(0, this.domain.length) != this.domain) return;

    var cmd = document.getElementById("cmd_highlight");
    if (cmd) {
      var prefs = GetPrefs();
      var useCSS = prefs.getBoolPref(prefName);
      var editor = GetCurrentEditor();
      if (useCSS && editor) {
        var mixedObj = {};
        var state = editor.getHighlightColorState(mixedObj);
        cmd.setAttribute("state", state);
        cmd.collapsed = false;
      }      
      else {
        cmd.setAttribute("state", "transparent");
        cmd.collapsed = true;
      }

      if (editor)
        editor.isCSSEnabled = useCSS;

      goUpdateCommand("cmd_dtdStrictness");
      goUpdateCommand("cmd_dtdStrictness2");
    }
  }
}

function AfterHighlightColorChange()
{
  if (!IsHTMLEditor())
    return;

  var button = document.getElementById("cmd_highlight");
  if (button) {
    var mixedObj = {};
    try {
      var state = GetCurrentEditor().getHighlightColorState(mixedObj);
      button.setAttribute("state", state);
      onHighlightColorChange();
    } catch (e) {}
  }      
}

function EditorOnLoad()
{
  // See if argument was passed.
  if ( window.arguments && window.arguments[0] ) {
      // Opened via window.openDialog with URL as argument.
      // Put argument where EditorStartup expects it.
      document.getElementById( "args" ).setAttribute( "value", window.arguments[0] );
  }

  // get default character set if provided
  if ("arguments" in window && window.arguments.length > 1 && window.arguments[1]) {
    for (var i = 1; i < window.arguments.length; i++) {
      if (window.arguments[i].indexOf("charset=") != -1) {
        var arrayArgComponents = window.arguments[i].split("=");
        if (arrayArgComponents) {
          // Put argument where EditorStartup expects it.
          document.getElementById( "args" ).setAttribute("charset", arrayArgComponents[1]);
        }
      }
      else if (window.arguments[i] == "template") {
        gIsTemplate = true;
      }
      else if (window.arguments[i] == "templateref") {
        gIsTemplateRef = true;
      }
    }
  }

  window.tryToClose = EditorCanClose;

  // Continue with normal startup.
  EditorStartup();

  // Initialize our source text <editor>
  try {
    gSourceContentWindow = document.getElementById("content-source");
    gSourceContentWindow.makeEditable("text", false);
    gSourceTextEditor = gSourceContentWindow.getEditor(gSourceContentWindow.contentWindow);

    gSourceTextEditor.QueryInterface(Components.interfaces.nsIPlaintextEditor);
    gSourceTextEditor.enableUndo(false);
    gSourceTextEditor.rootElement.style.fontFamily = "-moz-fixed";
    gSourceTextEditor.rootElement.style.whiteSpace = "pre";
    gSourceTextEditor.rootElement.style.margin = 0;
    if (kColoredSourceView) {
      gSourceTextEditor.rootElement.style.backgroundColor = "#f0f0f0";
      gSourceTextEditor.rootElement.setAttribute("_moz_sourceview", "true");
    }
    var controller = Components.classes["@mozilla.org/embedcomp/base-command-controller;1"]
                               .createInstance(Components.interfaces.nsIControllerContext);
    controller.init(null);
    controller.setCommandContext(gSourceContentWindow);
    gSourceContentWindow.contentWindow.controllers.insertControllerAt(0, controller);
    var commandTable = controller.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                                 .getInterface(Components.interfaces.nsIControllerCommandTable);
    commandTable.registerCommand("cmd_find",        nsFindCommand);
    commandTable.registerCommand("cmd_findNext",    nsFindAgainCommand);
    commandTable.registerCommand("cmd_findPrev",    nsFindAgainCommand);
    // gSourceContentWindow.addEventListener("keypress", KeyPressedInSourceView, false);
  } catch (e) { dump("makeEditable failed: "+e+"\n"); }

  // don't wait if the sidebar is hidden...
  if ( document.getElementById("sidebar-box").getAttribute("collapsed") )
    OnSidebarLoad();
}

const gSourceTextListener =
{
  NotifyDocumentCreated: function NotifyDocumentCreated() {},
  NotifyDocumentWillBeDestroyed: function NotifyDocumentWillBeDestroyed() {},
  NotifyDocumentStateChanged: function NotifyDocumentStateChanged(isChanged)
  {
    window.updateCommands("save");
  }
};

const gSourceTextObserver =
{
  observe: function observe(aSubject, aTopic, aData)
  {
    // we currently only use this to update undo
    window.updateCommands("undo");
  }
};

function TextEditorOnLoad()
{
    // See if argument was passed.
    if ( window.arguments && window.arguments[0] ) {
        // Opened via window.openDialog with URL as argument.
        // Put argument where EditorStartup expects it.
        document.getElementById( "args" ).setAttribute( "value", window.arguments[0] );
    }
    // Continue with normal startup.
    EditorStartup();
}

// This should be called by all editor users when they close their window
//  or other similar "done with editor" actions, like recycling a Mail Composer window.
function EditorCleanup()
{
  SwitchInsertCharToAnotherEditorOrClose();
}

var DocumentReloadListener =
{
  NotifyDocumentCreated: function() {},
  NotifyDocumentWillBeDestroyed: function() {},

  NotifyDocumentStateChanged:function( isNowDirty )
  {
    var editor = GetCurrentEditor();
    try {
      // unregister the listener to prevent multiple callbacks
      editor.removeDocumentStateListener( DocumentReloadListener );

      var charset = editor.documentCharacterSet;

      // update the META charset with the current presentation charset
      editor.documentCharacterSet = charset;

    } catch (e) {}
  }
};

function addEditorClickEventListener()
{
  try {
    var bodyelement = GetBodyElement();
    if (bodyelement) {
      bodyelement.addEventListener("click", EditorClick, false);
      bodyelement.addEventListener("mouseup", EditorClick2, false);
    }
  } catch (e) {}
}

// implements nsIObserver
var gEditorDocumentObserver =
{ 
  observe: function(aSubject, aTopic, aData)
  {
    // Should we allow this even if NOT the focused editor?
    var commandManager = GetCurrentCommandManager();
    if (commandManager != aSubject)
      return;

    var editor = GetCurrentEditor();
    switch(aTopic)
    {
      case "obs_documentCreated":
        // Just for convenience
        gContentWindow = window.content;

        // Get state to see if document creation succeeded
        var params = newCommandParams();
        if (!params)
          return;

        // Kaze: the spell checker might be disabled for some reason
        try {
          RealTimeSpell.Init(editor, true);
        } catch(e) {
            dump("\n The spell checker could not start. \n\n");
        }

        try {
          commandManager.getCommandState(aTopic, gContentWindow, params);
          var errorStringId = 0;
          var editorStatus = params.getLongValue("state_data");
          if (!editor && editorStatus == nsIEditingSession.eEditorOK)
          {
            dump("\n ****** NO EDITOR BUT NO EDITOR ERROR REPORTED ******* \n\n");
            editorStatus = nsIEditingSession.eEditorErrorUnknown;
          }

          switch (editorStatus)
          {
            case nsIEditingSession.eEditorErrorCantEditFramesets:
              errorStringId = "CantEditFramesetMsg";
              break;
            case nsIEditingSession.eEditorErrorCantEditMimeType:
              errorStringId = "CantEditMimeTypeMsg";
              break;
            case nsIEditingSession.eEditorErrorUnknown:
              errorStringId = "CantEditDocumentMsg";
              break;
            // Note that for "eEditorErrorFileNotFound, 
            // network code popped up an alert dialog, so we don't need to
          }
          if (errorStringId)
            AlertWithTitle("", GetString(errorStringId));
        } catch(e) { dump("EXCEPTION GETTING obs_documentCreated state "+e+"\n"); }

        // We have a bad editor -- nsIEditingSession will rebuild an editor
        //   with a blank page, so simply abort here
        if (editorStatus)
          return; 

        if (!("InsertCharWindow" in window))
          window.InsertCharWindow = null;

        try {
          editor.QueryInterface(nsIEditorStyleSheets);

          //  and extra styles for showing anchors, table borders, smileys, etc
          editor.addOverrideStyleSheet(kNormalStyleSheet);
        } catch (e) {}

        // Things for just the Web Composer application
        if (IsWebComposer())
        {
          NotifyProcessors(kProcessorsBeforeBackToNormal, editor.document);

          if (gIsTemplate) {
            MakeDocumentBecomeATemplate();
            gIsTemplate = false;
          }
          else if (gIsTemplateRef)
          {
            MakeDocumentBecomeATemplateRef();
            gIsTemplateRef = false;
          }

          // Set focus to content window if not a mail composer
          // Race conditions prevent us from setting focus here
          //   when loading a url into blank window
          setTimeout(SetFocusOnStartup, 0);

          // Call EditorSetDefaultPrefsAndDoctype first so it gets the default author before initing toolbars
          EditorSetDefaultPrefsAndDoctype();

          // We may load a text document into an html editor,
          //   so be sure editortype is set correctly
          // XXX We really should use the "real" plaintext editor for this!
          if (editor.contentsMIMEType == "text/plain")
          {
            CloseCurrentTab(true);
            AlertWithTitle("", GetString("CanEditOnlyHTMLDocuments"));
            
            /*
            try {
              GetCurrentEditorElement().editortype = "text";
            } catch (e) { dump (e)+"\n"; }

            // Hide or disable UI not used for plaintext editing
            HideItem("FormatToolbar");
            HideItem("EditModeToolbar");
            HideItem("formatMenu");
            HideItem("tableMenu");
            HideItem("menu_validate");
            HideItem("sep_validate");
            HideItem("previewButton");
            HideItem("imageButton");
            HideItem("linkButton");
            HideItem("namedAnchorButton");
            HideItem("hlineButton");
            HideItem("tableButton");

            HideItem("fileExportToText");
            HideItem("previewInBrowser");

            HideItem("menu_pasteNoFormatting"); 

            HideItem("cmd_viewFormatToolbar");
            HideItem("cmd_viewEditModeToolbar");

            HideItem("viewSep1");
            HideItem("viewNormalMode");
            HideItem("viewAllTagsMode");
            HideItem("viewSourceMode");
            HideItem("viewPreviewMode");

            HideItem("structSpacer");

            // Hide everything in "Insert" except for "Symbols"
            var menuPopup = document.getElementById("insertMenuPopup");
            if (menuPopup)
            {
              var children = menuPopup.childNodes;
              for (var i=0; i < children.length; i++) 
              {
                var item = children.item(i);
                if (item.id != "insertChars")
                  item.hidden = true;
              }
            }
            */
          }
    
          // Set window title
          UpdateWindowTitle();

          // We must wait until document is created to get proper Url
          // (Windows may load with local file paths)
          SetSaveAndPublishUI(GetDocumentUrl());

          // Start in "Normal" edit mode
          SetDisplayMode(kDisplayModeNormal);

          // and place the selection in the body to update the rulers
          editor.selection.collapse(editor.document.body, 0);

          // we can't use the controller here
          if (IsStrictDTD())
            document.getElementById("cmd_dtdStrictness").setAttribute("disabled", true);
          else
            document.getElementById("cmd_dtdStrictness").removeAttribute("disabled");
          if (!IsStrictDTD() || GetCurrentEditor().isCSSEnabled)
            document.getElementById("cmd_dtdStrictness2").removeAttribute("disabled");
          else
            document.getElementById("cmd_dtdStrictness2").setAttribute("disabled", true);
        }

        // Add mouse click watcher if right type of editor
        if (IsHTMLEditor())
        {
          addEditorClickEventListener();

          // Force color widgets to update
          onFontColorChange();
          onBackgroundColorChange();
        }
        break;

      case "cmd_setDocumentModified":
        window.updateCommands("save");
        document.getElementById("tabeditor").showCurrentTabAsModified(IsDocumentModified() || IsHTMLSourceChanged());
        break;

      case "obs_documentWillBeDestroyed":
        dump("obs_documentWillBeDestroyed notification\n");
        break;

      case "obs_documentLocationChanged":
        // Ignore this when editor doesn't exist,
        //   which happens once when page load starts
        if (editor)
          try {
            editor.updateBaseURL();
          } catch(e) { dump (e); }
        break;

      case "cmd_bold":
        // Update all style items
        // cmd_bold is a proxy; see EditorSharedStartup (above) for details
        window.updateCommands("style");
        window.updateCommands("undo");
        break;
    }
  }
}

function SetFocusOnStartup()
{
  setZoom();
  gContentWindow.focus();
}

function OnSidebarLoad()
{
  document.getElementById("tipoftheday").launch(null);
  // Kaze: disable the pinger
  //~ window.delayedOpenWindow( "chrome://pinger/content/pinger.xul",
                            //~ "_blank",
                            //~ "chrome,close=no,titlebar,modal",
                            //~ "",
                            //~ 600);
}

function EditorStartup()
{
  var is_HTMLEditor = IsHTMLEditor();
  if (is_HTMLEditor)
  {
    // XUL elements we use when switching from normal editor to edit source
    gContentWindowDeck  = document.getElementById("ContentWindowDeck");
    gSourceBrowserDeck  = document.getElementById("SourceBrowserDeck");
    gFormatToolbar1     = document.getElementById("FormatToolbar1");
    gFormatToolbar2     = document.getElementById("FormatToolbar2");
    gViewFormatToolbar1 = document.getElementById("viewFormatToolbar1");
    gViewFormatToolbar2 = document.getElementById("viewFormatToolbar2");
  }

  // set up our global prefs object
  GetPrefsService();

  // set up a title listener
  GetCurrentEditorElement().addEventListener("DOMTitleChanged",
                       document.getElementById("tabeditor").changeTabTitle, false);

  // Startup also used by other editor users, such as Message Composer
  EditorSharedStartup();

  // Commands specific to the Composer Application window,
  //  (i.e., not embedded editors)
  //  such as file-related commands, HTML Source editing, Edit Modes...
  SetupComposerWindowCommands();

  // ShowHideToolbarButtons();
  AddToolbarPrefListener();

  // Customizable toolbars
  document.getElementById("EditorToolbox").customizeDone = ToolboxCustomizeDone;
  document.getElementById("FormatToolbox").customizeDone = ToolboxCustomizeDone;

  gCSSPrefListener = new nsButtonPrefListener();

  // hide Highlight button if we are in an HTML editor with CSS mode off
  var cmd = document.getElementById("cmd_highlight");
  if (cmd) {
    var prefs = GetPrefs();
    var useCSS = prefs.getBoolPref("editor.use_css");
    if (!useCSS && is_HTMLEditor) {
      cmd.collapsed = true;
    }
  }

  //
  // Get url for editor content and load it.
  // the editor gets instantiated by the edittingSession when the URL has finished loading.
  /*
   *var url = document.getElementById("args").getAttribute("value");
   *try {
   *  var charset = document.getElementById("args").getAttribute("charset");
   *  var contentViewer = GetCurrentEditorElement().docShell.contentViewer;
   *  contentViewer.QueryInterface(Components.interfaces.nsIMarkupDocumentViewer);
   *  contentViewer.defaultCharacterSet = charset;
   *  contentViewer.forceCharacterSet = charset;
   *} catch (e) {
   *  dump(" EditorStartup failed: "+e+"\n");
   *}
   */
  var url = null;

  // Kaze: use nsICommandLine instead of docShell
  // taken from http://xulfr.org/wiki/RessourcesLibs/BrowserXulRunner
  // TODO: open one tab for each URL
  if ("arguments" in window && window.arguments.length > 0 && window.arguments[0]) try {
    var nsCommandLine = window.arguments[0].QueryInterface(Components.interfaces.nsICommandLine);
    if (nsCommandLine.length) {
      var argNr = 0;
      while (!url) {
        url = nsCommandLine.getArgument(argNr);
        if (url.substring(0, 1) == "-") // ignore "dashUnknown" arguments
          url = null;
        argNr++;
      }
    }
  } catch(e) {
    //url = window.arguments[0];
  }

  // Kaze: discard URL if it starts with a dash (= unrecognized argument)
  if (url && url.substring(0,1) == "-")
    url = null;

  // Kaze: if no URL is passed, use the default blank page (not in the core any more)
  if (!url || !url.length) try {
    url  = gPrefs.getCharPref("editor.default.doctype") == "xhtml" ? "about:x" : "about:";
    url += gPrefs.getBoolPref("editor.default.strictness") ? "strictblank" : "blank";
  } catch(e) {
    // default is HTML 4.01 Strict if case the prefs aren't available for any reason
    url = "about:strictblank";
  }

  // go, go, go!
  EditorLoadUrl(url);
}

function EditorLoadUrl(url)
{
  try {
    if (url && url.length)
    {
      url = NormalizeURL(url);

      GetCurrentEditorElement().webNavigation.loadURI(url, // uri string
             nsIWebNavigation.LOAD_FLAGS_BYPASS_CACHE,     // load flags
             null,                                         // referrer
             null,                                         // post-data stream
             null);
    }
  } catch (e) {
    dump(" EditorLoadUrl failed: "+e+"\n");
  }
}

// This should be called by all Composer types
function EditorSharedStartup()
{
  // Just for convenience
  gContentWindow = window.content;

  // Set up the mime type and register the commands.
  if (IsHTMLEditor())
    SetupHTMLEditorCommands();
  else
    SetupTextEditorCommands();

  // add observer to be called when document is really done loading 
  // and is modified
  // Note: We're really screwed if we fail to install this observer!
  try {
    var commandManager = GetCurrentCommandManager();
    commandManager.addCommandObserver(gEditorDocumentObserver, "obs_documentCreated");
    commandManager.addCommandObserver(gEditorDocumentObserver, "cmd_setDocumentModified");
    commandManager.addCommandObserver(gEditorDocumentObserver, "obs_documentWillBeDestroyed");
    commandManager.addCommandObserver(gEditorDocumentObserver, "obs_documentLocationChanged");

    // Until nsIControllerCommandGroup-based code is implemented,
    //  we will observe just the bold command to trigger update of
    //  all toolbar style items
    commandManager.addCommandObserver(gEditorDocumentObserver, "cmd_bold");
  } catch (e) { dump(e); }

  var isMac = (GetOS() == gMac);

  // Set platform-specific hints for how to select cells
  // Mac uses "Cmd", all others use "Ctrl"
  var tableKey = GetString(isMac ? "XulKeyMac" : "TableSelectKey");
  var dragStr = tableKey+GetString("Drag");
  var clickStr = tableKey+GetString("Click");

  var delStr = GetString(isMac ? "Clear" : "Del");

  SafeSetAttribute("menu_SelectCell", "acceltext", clickStr);
  SafeSetAttribute("menu_SelectRow", "acceltext", dragStr);
  SafeSetAttribute("menu_SelectColumn", "acceltext", dragStr);
  SafeSetAttribute("menu_SelectAllCells", "acceltext", dragStr);
  // And add "Del" or "Clear"
  SafeSetAttribute("menu_DeleteCellContents", "acceltext", delStr);

  // Set text for indent, outdent keybinding

  // hide UI that we don't have components for
  RemoveInapplicableUIElements();

  gPrefs = GetPrefs();

  // Use browser colors as initial values for editor's default colors
  var BrowserColors = GetDefaultBrowserColors();
  if (BrowserColors)
  {
    gDefaultTextColor = BrowserColors.TextColor;
    gDefaultBackgroundColor = BrowserColors.BackgroundColor;
  }

  // For new window, no default last-picked colors
  gColorObj.LastTextColor = "";
  gColorObj.LastBackgroundColor = "";
  gColorObj.LastHighlightColor = "";
}

// This method is only called by Message composer when recycling a compose window
function EditorResetFontAndColorAttributes()
{
  try {  
    document.getElementById("cmd_fontFace").setAttribute("state", "");
    EditorRemoveTextProperty("font", "color");
    EditorRemoveTextProperty("font", "bgcolor");
    EditorRemoveTextProperty("font", "size");
    EditorRemoveTextProperty("small", "");
    EditorRemoveTextProperty("big", "");
    var bodyelement = GetBodyElement();
    if (bodyelement)
    {
      var editor = GetCurrentEditor();
      // remove all the existing attributes on the body element
      // by creating a dummy body element and cloning the attributes
      // see bug #249882 for more details
      editor.cloneAttributes(bodyelement, editor.document.createElement("body"));
    }
    gColorObj.LastTextColor = "";
    gColorObj.LastBackgroundColor = "";
    gColorObj.LastHighlightColor = "";
    document.getElementById("cmd_fontColor").setAttribute("state", "");
    document.getElementById("cmd_backgroundColor").setAttribute("state", "");
    UpdateDefaultColors();
  } catch (e) {}
}

function EditorShutdown()
{
  SetUnicharPref("editor.zoom_factor",getMarkupDocumentViewer().textZoom);

  RemoveToolbarPrefListener();
  gCSSPrefListener.shutdown();

  try {
    var commandManager = GetCurrentCommandManager();
    commandManager.removeCommandObserver(gEditorDocumentObserver, "obs_documentCreated");
    commandManager.removeCommandObserver(gEditorDocumentObserver, "obs_documentWillBeDestroyed");
    commandManager.removeCommandObserver(gEditorDocumentObserver, "obs_documentLocationChanged");
  } catch (e) { dump (e); }   
}

function SafeSetAttribute(nodeID, attributeName, attributeValue)
{
    var theNode = document.getElementById(nodeID);
    if (theNode)
        theNode.setAttribute(attributeName, attributeValue);
}

function DocumentHasBeenSaved()
{
  var fileurl = "";
  try {
    fileurl = GetDocumentUrl();
  } catch (e) {
    return false;
  }

  if (!fileurl || IsUrlAboutBlank(fileurl))
    return false;

  // We have a file URL already
  return true;
}

function CheckAndSaveDocument(command, allowDontSave)
{
  var document;
  try {
    // if we don't have an editor or an document, bail
    var editor = GetCurrentEditor();
    document = editor.document;
    if (!document)
      return true;
  } catch (e) { return true; }

  if (!IsDocumentModified() && !IsHTMLSourceChanged())
    return true;

  // call window.focus, since we need to pop up a dialog
  // and therefore need to be visible (to prevent user confusion)
  top.document.commandDispatcher.focusedWindow.focus();  

  var scheme = GetScheme(GetDocumentUrl());
  var doPublish = (scheme && scheme != "file");

  var strID;
  switch (command)
  {
    case "cmd_close":
      strID = "BeforeClosing";
      break;
    case "cmd_preview":
      strID = "BeforePreview";
      break;
    case "cmd_editSendPage":
      strID = "SendPageReason";
      break;
    case "cmd_validate":
      strID = "BeforeValidate";
      break;
  }
    
  var reasonToSave = strID ? GetString(strID) : "";

  var title = document.title;
  if (!title)
    title = GetString("untitled");

  var dialogTitle = GetString(doPublish ? "PublishPage" : "SaveDocument");
  var dialogMsg = GetString(doPublish ? "PublishPrompt" : "SaveFilePrompt");
  dialogMsg = (dialogMsg.replace(/%title%/,title)).replace(/%reason%/,reasonToSave);

  var promptService = GetPromptService();
  if (!promptService)
    return false;

  var result = {value:0};
  var promptFlags = promptService.BUTTON_TITLE_CANCEL * promptService.BUTTON_POS_1;
  var button1Title = null;
  var button3Title = null;

  if (doPublish)
  {
    promptFlags += promptService.BUTTON_TITLE_IS_STRING * promptService.BUTTON_POS_0;
    button1Title = GetString("Publish");
    button3Title = GetString("DontPublish");    
  }
  else
  {
    promptFlags += promptService.BUTTON_TITLE_SAVE * promptService.BUTTON_POS_0;
  }

  // If allowing "Don't..." button, add that
  if (allowDontSave)
    promptFlags += doPublish ?
        (promptService.BUTTON_TITLE_IS_STRING * promptService.BUTTON_POS_2)
        : (promptService.BUTTON_TITLE_DONT_SAVE * promptService.BUTTON_POS_2);
  
  result = promptService.confirmEx(window, dialogTitle, dialogMsg, promptFlags,
                          button1Title, null, button3Title, null, {value:0});

  if (result == 0)
  {
    // Save, but first finish HTML source mode
    if (IsHTMLSourceChanged()) {
      try {
        FinishHTMLSource();
      } catch (e) { return false;}
    }

    if (doPublish)
    {
      // We save the command the user wanted to do in a global
      // and return as if user canceled because publishing is asynchronous
      // This command will be fired when publishing finishes
      gCommandAfterPublishing = command;
      goDoCommand("cmd_publish");
      return false;
    }

    // Save to local disk
    var contentsMIMEType;
    if (IsHTMLEditor())
      /*if (IsXHTMLDocument())
        contentsMIMEType = kXMLMimeType;
      else*/
        contentsMIMEType = kHTMLMimeType;
    else
      contentsMIMEType = kTextMimeType;
    var success, nvusave;
    // XX - Nvu Save Extension change
    // If the extension is installed, call our version of Save Document
    try {
      nvusave = saveExtensionOn;
    }
    catch (e)  {
      nvusave = false;   // not defined
    }
    if (nvusave)
      success = NvuSaveDocument(false, false, contentsMIMEType);
    else
      success = SaveDocument(false, false, contentsMIMEType);
    return success;
  }

  if (result == 2) // "Don't Save"
    return true;

  // Default or result == 1 (Cancel)
  return false;
}

// --------------------------- File menu ---------------------------


// used by openLocation. see openLocation.js for additional notes.
function delayedOpenWindow(chrome, flags, url, extra, dtime)
{
  if (!dtime)
    dtime = 10;
  if (extra)
    setTimeout("window.openDialog('" + 
               chrome +
               "','_blank','" +
               flags +
               "','" +
               url +
               "','" +
               extra +
               "')", dtime);
  else
    setTimeout("window.openDialog('" + 
               chrome +
               "','_blank','" +
               flags +
               "','" +
               url +
               "')", dtime);
}

function EditorNewPlaintext()
{
  window.openDialog( "chrome://editor/content/TextEditorAppShell.xul",
                     "_blank",
                     "chrome,dialog=no,all",
                     "about:blank");
}

// Check for changes to document and allow saving before closing
// This is hooked up to the OS's window close widget (e.g., "X" for Windows)
function EditorCanClose()
{
  return CloseWindow(false);
}

// --------------------------- View menu ---------------------------

// used by viewZoomOverlay.js
function getMarkupDocumentViewer()
{
  var contentViewer = GetCurrentEditorElement().docShell.contentViewer;
  contentViewer.QueryInterface(Components.interfaces.nsIMarkupDocumentViewer);
  return contentViewer;
}

function setZoom()
{
  var zoomfactor = 1.0;
  try {
    var zoomstr;
    zoomstr = gPrefs.getCharPref("editor.zoom_factor");
    zoomfactor = parseFloat(zoomstr);
  }
  catch(ex) {
    dump("\nfailed to get zoom_factor pref!\n");
  }
  getMarkupDocumentViewer().textZoom = zoomfactor;
}


function EditorSetDocumentCharacterSet(aCharset)
{
  try {
    var editor = GetCurrentEditor();
    editor.documentCharacterSet = aCharset;
    var docUrl = GetDocumentUrl();
    if( !IsUrlAboutBlank(docUrl))
    {
      // reloading the document will reverse any changes to the META charset, 
      // we need to put them back in, which is achieved by a dedicated listener
      editor.addDocumentStateListener( DocumentReloadListener );
      EditorLoadUrl(docUrl);
    }
  } catch (e) {}
}

// ------------------------------------------------------------------
function updateCharsetPopupMenu(menuPopup)
{
  if (IsDocumentModified() && !IsDocumentEmpty())
  {
    for (var i = 0; i < menuPopup.childNodes.length; i++)
    {
      var menuItem = menuPopup.childNodes[i];
      menuItem.setAttribute('disabled', 'true');
    }
  }
}

// --------------------------- Text style ---------------------------

function onParagraphFormatChange(paraMenuList, commandID)
{
  if (!paraMenuList)
    return;

  var commandNode = document.getElementById(commandID);
  var state = commandNode.getAttribute("state");

  // force match with "normal"
  if (state == "body")
    state = "";

  if (state == "mixed")
  {
    //Selection is the "mixed" ( > 1 style) state
    paraMenuList.selectedItem = null;
    paraMenuList.setAttribute("label",GetString('Mixed'));
  }
  else
  {
    var menuPopup = document.getElementById("ParagraphPopup");
    var menuItems = menuPopup.childNodes;
    for (var i=0; i < menuItems.length; i++)
    {
      var menuItem = menuItems.item(i);
      if ("value" in menuItem && menuItem.value == state)
      {
        paraMenuList.selectedItem = menuItem;
        menuItem.checked = true;
        break;
      }
    }
  }
}

function onFontFaceChange(fontFaceMenuList, commandID)
{
  var commandNode = document.getElementById(commandID);
  var state = commandNode.getAttribute("state");

  if (state == "mixed")
  {
    //Selection is the "mixed" ( > 1 style) state
    fontFaceMenuList.selectedItem = null;
    fontFaceMenuList.setAttribute("label",GetString('Mixed'));
  }
  else
  {
    var menuPopup = document.getElementById("FontFacePopup");
    var menuItems = menuPopup.childNodes;
    for (var i=0; i < menuItems.length; i++)
    {
      var menuItem = menuItems.item(i);
      if (menuItem.getAttribute("label") && ("value" in menuItem && menuItem.value.toLowerCase() == state.toLowerCase()))
      {
        fontFaceMenuList.selectedItem = menuItem;
        break;
      }
    }
  }
}

function EditorSelectFontSize()
{
  var select = document.getElementById("FontSizeSelect");
  if (select)
  {
    if (select.selectedIndex == -1)
      return;

    EditorSetFontSize(gFontSizeNames[select.selectedIndex]);
  }
}

function onFontSizeChange(fontSizeMenulist, commandID)
{
  // If we don't match anything, set to "0 (normal)"
  var newIndex = 2;
  var size = fontSizeMenulist.getAttribute("size");
  if ( size == "mixed")
  {
    // No single type selected
    newIndex = -1;
  }
  else
  {
    for (var i = 0; i < gFontSizeNames.length; i++)
    {
      if( gFontSizeNames[i] == size )
      {
        newIndex = i;
        break;
      }
    }
  }
  if (fontSizeMenulist.selectedIndex != newIndex)
    fontSizeMenulist.selectedIndex = newIndex;
}

function EditorSetFontSize(size)
{
  if( size == "0" || size == "normal" ||
      size == "medium" )
  {
    EditorRemoveTextProperty("font", "size");
    // Also remove big and small,
    //  else it will seem like size isn't changing correctly
    EditorRemoveTextProperty("small", "");
    EditorRemoveTextProperty("big", "");
  } else {
    // Temp: convert from new CSS size strings to old HTML size strings
    switch (size)
    {
      case "xx-small":
      case "x-small":
        size = "-2";
        break;
      case "small":
        size = "-1";
        break;
      case "large":
        size = "+1";
        break;
      case "x-large":
        size = "+2";
        break;
      case "xx-large":
        size = "+3";
        break;
    }
    EditorSetTextProperty("font", "size", size);
  }
  gContentWindow.focus();
}

function initFontFaceMenu(menuPopup)
{
  initLocalFontFaceMenu(menuPopup);

  if (menuPopup)
  {
    var children = menuPopup.childNodes;
    if (!children) return;

    var firstHas = { value: false };
    var anyHas = { value: false };
    var allHas = { value: false };

    // we need to set or clear the checkmark for each menu item since the selection
    // may be in a new location from where it was when the menu was previously opened

    // Fixed width (second menu item) is special case: old TT ("teletype") attribute
    EditorGetTextProperty("tt", "", "", firstHas, anyHas, allHas);
    children[1].setAttribute("checked", allHas.value);

    if (!anyHas.value)
      EditorGetTextProperty("font", "face", "", firstHas, anyHas, allHas);

    children[0].setAttribute("checked", !anyHas.value);

    // Skip over default, TT, and separator
    for (var i = 3; i < children.length; i++)
    {
      var menuItem = children[i];
      var faceType = menuItem.getAttribute("value");

      if (faceType)
      {
        EditorGetTextProperty("font", "face", faceType, firstHas, anyHas, allHas);

        // Check the menuitem only if all of selection has the face
        if (allHas.value)
        {
          menuItem.setAttribute("checked", "true");
          break;
        }

        // in case none match, make sure we've cleared the checkmark
        menuItem.removeAttribute("checked");
      }
    }
  }
}

const kFixedFontFaceMenuItems = 7; // number of fixed font face menuitems

function initLocalFontFaceMenu(menuPopup)
{
  // fill in the menu only once...
  var callingId = menuPopup.parentNode.id;
  if (gFontMenuOk[callingId ])
    return;
  gFontMenuOk[callingId ] = callingId ;

  if (!gLocalFonts)
  {
    // Build list of all local fonts once per editor
    try 
    {
      var enumerator = Components.classes["@mozilla.org/gfx/fontenumerator;1"]
                                 .getService(Components.interfaces.nsIFontEnumerator);
      var localFontCount = { value: 0 }
      gLocalFonts = enumerator.EnumerateAllFonts(localFontCount);
    }
    catch(e) { }
  }
  
  var useRadioMenuitems = (menuPopup.parentNode.localName == "menu"); // don't do this for menulists  
  if (menuPopup.childNodes.length == kFixedFontFaceMenuItems) 
  {
    if (gLocalFonts.length == 0) {
      menuPopup.childNodes[kFixedFontFaceMenuItems - 1].hidden = true;
    }
    for (var i = 0; i < gLocalFonts.length; ++i)
    {
      if (gLocalFonts[i] != "")
      {
        var itemNode = document.createElementNS(XUL_NS, "menuitem");
        itemNode.setAttribute("label", gLocalFonts[i]);
        itemNode.setAttribute("value", gLocalFonts[i]);
        if (useRadioMenuitems) {
          itemNode.setAttribute("type", "radio");
          itemNode.setAttribute("name", "2");
          itemNode.setAttribute("observes", "cmd_renderedHTMLEnabler");
        }
        menuPopup.appendChild(itemNode);
      }
    }
  }
}
 

function initFontSizeMenu(menuPopup)
{
  if (menuPopup)
  {
    var children = menuPopup.childNodes;
    if (!children) return;

    var firstHas = { value: false };
    var anyHas = { value: false };
    var allHas = { value: false };

    var sizeWasFound = false;

    // we need to set or clear the checkmark for each menu item since the selection
    // may be in a new location from where it was when the menu was previously opened

    // First 2 items add <small> and <big> tags
    // While it would be better to show the number of levels,
    //  at least this tells user if either of them are set
    var menuItem = children[0];
    if (menuItem)
    {
      EditorGetTextProperty("small", "", "", firstHas, anyHas, allHas);
      menuItem.setAttribute("checked", allHas.value);
      sizeWasFound = anyHas.value;
    }

    menuItem = children[1];
    if (menuItem)
    {
      EditorGetTextProperty("big", "", "", firstHas, anyHas, allHas);
      menuItem.setAttribute("checked", allHas.value);
      sizeWasFound |= anyHas.value;
    }

    // Fixed size items start after menu separator
    var menuIndex = 3;
    // Index of the medium (default) item
    var mediumIndex = 5;

    // Scan through all supported "font size" attribute values
    for (var i = -2; i <= 3; i++)
    {
      menuItem = children[menuIndex];

      // Skip over medium since it'll be set below.
      // If font size=0 is actually set, we'll toggle it off below if
      // we enter this loop in this case.
      if (menuItem && (i != 0))
      {
        var sizeString = (i <= 0) ? String(i) : ("+" + String(i));
        EditorGetTextProperty("font", "size", sizeString, firstHas, anyHas, allHas);
        // Check the item only if all of selection has the size...
        menuItem.setAttribute("checked", allHas.value);
        // ...but remember if ANY of of selection had size set
        sizeWasFound |= anyHas.value;
      }
      menuIndex++;
    }

    // if no size was found, then check default (medium)
    // note that no item is checked in the case of "mixed" selection
    children[mediumIndex].setAttribute("checked", !sizeWasFound);
  }
}

function onHighlightColorChange()
{
  var commandNode = document.getElementById("cmd_highlight");
  if (commandNode)
  {
    var color = commandNode.getAttribute("state");
    var button = document.getElementById("HighlightColorButton");
    var buttonIcon = document.getAnonymousElementByAttribute(button, "class", "toolbarbutton-icon");
    if (buttonIcon)
    {
      // No color set - get color set on page or other defaults
      if (!color)
        color = "transparent" ;

      buttonIcon.setAttribute("style", "background-color:"+color+" !important");
    }
  }
}

function onFontColorChange()
{
  var commandNode = document.getElementById("cmd_fontColor");
  if (commandNode)
  {
    var color = commandNode.getAttribute("state");
    var button = document.getElementById("TextColorButton");
    if (button)
    {
      // No color set - get color set on page or other defaults
      if (!color)
        color = gDefaultTextColor;
      button.setAttribute("style", "background-color:"+color);
    }
  }
}

function onBackgroundColorChange()
{
  var commandNode = document.getElementById("cmd_backgroundColor");
  if (commandNode)
  {
    var color = commandNode.getAttribute("state");
    var button = document.getElementById("BackgroundColorButton");
    if (button)
    {
      if (!color)
        color = gDefaultBackgroundColor;

      button.setAttribute("style", "background-color:"+color);
    }
  }
}

// Call this when user changes text and/or background colors of the page
function UpdateDefaultColors()
{
  var BrowserColors = GetDefaultBrowserColors();
  var bodyelement = GetBodyElement();
  var defTextColor = gDefaultTextColor;
  var defBackColor = gDefaultBackgroundColor;

  if (bodyelement)
  {
    var color = bodyelement.getAttribute("text");
    if (color)
      gDefaultTextColor = color;
    else if (BrowserColors)
      gDefaultTextColor = BrowserColors.TextColor;

    color = bodyelement.getAttribute("bgcolor");
    if (color)
      gDefaultBackgroundColor = color;
    else if (BrowserColors)
      gDefaultBackgroundColor = BrowserColors.BackgroundColor;
  }

  // Trigger update on toolbar
  if (defTextColor != gDefaultTextColor)
  {
    goUpdateCommandState("cmd_fontColor");
    onFontColorChange();
  }
  if (defBackColor != gDefaultBackgroundColor)
  {
    goUpdateCommandState("cmd_backgroundColor");
    onBackgroundColorChange();
  }
}

function GetBackgroundElementWithColor()
{
  var editor = GetCurrentTableEditor();
  if (!editor)
    return null;

  gColorObj.Type = "";
  gColorObj.PageColor = "";
  gColorObj.TableColor = "";
  gColorObj.CellColor = "";
  gColorObj.BackgroundColor = "";
  gColorObj.SelectedType = "";

  var tagNameObj = { value: "" };
  var element;
  try {
    element = editor.getSelectedOrParentTableElement(tagNameObj, {value:0});
  }
  catch(e) {}

  if (element && tagNameObj && tagNameObj.value)
  {
    gColorObj.BackgroundColor = GetHTMLOrCSSStyleValue(element, "bgcolor", "background-color");
    gColorObj.BackgroundColor = ConvertRGBColorIntoHEXColor(gColorObj.BackgroundColor);
    if (tagNameObj.value.toLowerCase() == "td")
    {
      gColorObj.Type = "Cell";
      gColorObj.CellColor = gColorObj.BackgroundColor;

      // Get any color that might be on parent table
      var table = GetParentTable(element);
      gColorObj.TableColor = GetHTMLOrCSSStyleValue(table, "bgcolor", "background-color");
      gColorObj.TableColor = ConvertRGBColorIntoHEXColor(gColorObj.TableColor);
    }
    else
    {
      gColorObj.Type = "Table";
      gColorObj.TableColor = gColorObj.BackgroundColor;
    }
    gColorObj.SelectedType = gColorObj.Type;
  }
  else
  {
    var prefs = GetPrefs();
    var IsCSSPrefChecked = prefs.getBoolPref("editor.use_css");
    if (IsCSSPrefChecked && IsHTMLEditor())
    {
      var selection = editor.selection;
      if (selection)
      {
        element = selection.focusNode;
        while (!editor.nodeIsBlock(element))
          element = element.parentNode;
      }
      else
      {
        element = GetBodyElement();
      }
    }
    else
    {
      element = GetBodyElement();
    }
    if (element)
    {
      gColorObj.Type = "Page";
      gColorObj.BackgroundColor = GetHTMLOrCSSStyleValue(element, "bgcolor", "background-color");
      if (gColorObj.BackgroundColor == "")
      {
        gColorObj.BackgroundColor = "transparent";
      }
      else
      {
        gColorObj.BackgroundColor = ConvertRGBColorIntoHEXColor(gColorObj.BackgroundColor);
      }
      gColorObj.PageColor = gColorObj.BackgroundColor;
    }
  }
  return element;
}

function SetSmiley(smileyText)
{
  try {
    GetCurrentEditor().insertText(smileyText);
    gContentWindow.focus();
  }
  catch(e) {}
}

function EditorSelectColor(colorType, mouseEvent, launcher)
{
  var editor = GetCurrentEditor();
  if (!editor || !gColorObj)
    return;

  if (launcher && launcher.getAttribute("disabled"))
    return;

  // Shift + mouse click automatically applies last color, if available
  var useLastColor = mouseEvent ? ( mouseEvent.button == 0 && mouseEvent.shiftKey ) : false;
  var element;
  var table;
  var currentColor = "";
  var commandNode;

  if (!colorType)
    colorType = "";

  if (colorType == "Text")
  {
    gColorObj.Type = colorType;

    // Get color from command node state
    commandNode = document.getElementById("cmd_fontColor");
    currentColor = commandNode.getAttribute("state");
    currentColor = ConvertRGBColorIntoHEXColor(currentColor);
    gColorObj.TextColor = currentColor;

    if (useLastColor && gColorObj.LastTextColor )
      gColorObj.TextColor = gColorObj.LastTextColor;
    else
      useLastColor = false;
  }
  else if (colorType == "Highlight")
  {
    gColorObj.Type = colorType;

    // Get color from command node state
    commandNode = document.getElementById("cmd_highlight");
    currentColor = commandNode.getAttribute("state");
    currentColor = ConvertRGBColorIntoHEXColor(currentColor);
    gColorObj.HighlightColor = currentColor;

    if (useLastColor && gColorObj.LastHighlightColor )
      gColorObj.HighlightColor = gColorObj.LastHighlightColor;
    else
      useLastColor = false;
  }
  else
  {
    element = GetBackgroundElementWithColor();
    if (!element)
      return;

    // Get the table if we found a cell
    if (gColorObj.Type == "Table")
      table = element;
    else if (gColorObj.Type == "Cell")
      table = GetParentTable(element);

    // Save to avoid resetting if not necessary
    currentColor = gColorObj.BackgroundColor;

    if (colorType == "TableOrCell" || colorType == "Cell")
    {
      if (gColorObj.Type == "Cell")
        gColorObj.Type = colorType;
      else if (gColorObj.Type != "Table")
        return;
    }
    else if (colorType == "Table" && gColorObj.Type == "Page")
      return;

    if (colorType == "" && gColorObj.Type == "Cell")
    {
      // Using empty string for requested type means
      //  we can let user select cell or table
      gColorObj.Type = "TableOrCell";
    }

    if (useLastColor && gColorObj.LastBackgroundColor )
      gColorObj.BackgroundColor = gColorObj.LastBackgroundColor;
    else
      useLastColor = false;
  }
  // Save the type we are really requesting
  colorType = gColorObj.Type;

  if (!useLastColor)
  {
    // Avoid the JS warning
    gColorObj.NoDefault = false;

    // Launch the ColorPicker dialog
    // TODO: Figure out how to position this under the color buttons on the toolbar
    window.openDialog("chrome://editor/content/EdColorPicker.xul", "_blank", "chrome,close,titlebar,modal", "", gColorObj);

    // User canceled the dialog
    if (gColorObj.Cancel)
      return;
  }

  if (gColorObj.Type == "Text")
  {
    if (currentColor != gColorObj.TextColor)
    {
      if (gColorObj.TextColor)
        EditorSetTextProperty("font", "color", gColorObj.TextColor);
      else
        EditorRemoveTextProperty("font", "color");
    }
    // Update the command state (this will trigger color button update)
    goUpdateCommandState("cmd_fontColor");
  }
  else if (gColorObj.Type == "Highlight")
  {
    if (currentColor != gColorObj.HighlightColor)
    {
      if (gColorObj.HighlightColor)
        EditorSetTextProperty("font", "bgcolor", gColorObj.HighlightColor);
      else
        EditorRemoveTextProperty("font", "bgcolor");
    }
    // Update the command state (this will trigger color button update)
    goUpdateCommandState("cmd_highlight");
  }
  else if (element)
  {
    if (gColorObj.Type == "Table")
    {
      // Set background on a table
      // Note that we shouldn't trust "currentColor" because of "TableOrCell" behavior
      if (table)
      {
        var bgcolor = table.getAttribute("bgcolor");
        if (bgcolor != gColorObj.BackgroundColor)
        try {
          if (gColorObj.BackgroundColor)
            editor.setAttributeOrEquivalent(table, "bgcolor", gColorObj.BackgroundColor, false);
          else
            editor.removeAttributeOrEquivalent(table, "bgcolor", false);
        } catch (e) {}
      }
    }
    else if (currentColor != gColorObj.BackgroundColor && IsHTMLEditor())
    {
      editor.beginTransaction();
      try
      {
        editor.setBackgroundColor(gColorObj.BackgroundColor);

        if (gColorObj.Type == "Page" && gColorObj.BackgroundColor)
        {
          // Set all page colors not explicitly set,
          //  else you can end up with unreadable pages
          //  because viewer's default colors may not be same as page author's
          var bodyelement = GetBodyElement();
          if (bodyelement)
          {
            var defColors = GetDefaultBrowserColors();
            if (defColors)
            {
              if (!bodyelement.getAttribute("text"))
                editor.setAttributeOrEquivalent(bodyelement, "text", defColors.TextColor, false);

              // The following attributes have no individual CSS declaration counterparts
              // Getting rid of them in favor of CSS implies CSS rules management
              if (!bodyelement.getAttribute("link"))
                editor.setAttribute(bodyelement, "link", defColors.LinkColor);

              if (!bodyelement.getAttribute("alink"))
                editor.setAttribute(bodyelement, "alink", defColors.ActiveLinkColor);

              if (!bodyelement.getAttribute("vlink"))
                editor.setAttribute(bodyelement, "vlink", defColors.VisitedLinkColor);
            }
          }
        }
      }
      catch(e) {}

      editor.endTransaction();
    }

    goUpdateCommandState("cmd_backgroundColor");
  }
  gContentWindow.focus();
}

function GetParentTable(element)
{
  var node = element;
  while (node)
  {
    if (node.nodeName.toLowerCase() == "table")
      return node;

    node = node.parentNode;
  }
  return node;
}

function GetParentTableCell(element)
{
  var node = element;
  while (node)
  {
    if (node.nodeName.toLowerCase() == "td" || node.nodeName.toLowerCase() == "th")
      return node;

    node = node.parentNode;
  }
  return node;
}

function EditorDblClick(event)
{
  // We check event.explicitOriginalTarget here because .target will never
  // be a textnode (bug 193689)
  if (event.explicitOriginalTarget)
  {
    // Only bring up properties if clicked on an element or selected link
    var element;
    try {
      element = event.explicitOriginalTarget.QueryInterface(
                    Components.interfaces.nsIDOMElement);
    } catch (e) {}

     //  We use "href" instead of "a" to not be fooled by named anchor
    if (!element)
      try {
        element = GetCurrentEditor().getSelectedElement("href");
      } catch (e) {}

    if (element)
    {
      goDoCommand("cmd_objectProperties");  
      event.preventDefault();
    }
  }
}

function EditorClick2(event)
{
  if (!event)
    return;

}

function EditorClick(event)
{
  if (!event)
    return;

  if (event.detail == 2)
  {
    EditorDblClick(event);
    return;
  }

  // For Web Composer: In Show All Tags Mode,
  // single click selects entire element,
  //  except for body and table elements
  if (IsWebComposer() && event.explicitOriginalTarget && IsHTMLEditor() &&
      gEditorDisplayMode == kDisplayModeAllTags)
  {
    try
    {
      // We check event.explicitOriginalTarget here because .target will never
      // be a textnode (bug 193689)
      var element = event.explicitOriginalTarget.QueryInterface(
                        Components.interfaces.nsIDOMElement);
      var name = element.localName.toLowerCase();
      if (name != "body" && name != "table" &&
          name != "td" && name != "th" && name != "caption" && name != "tr")
      {          
        GetCurrentEditor().selectElement(event.explicitOriginalTarget);
        event.preventDefault();
      }
    } catch (e) {}
  }
}

/*TODO: We need an oncreate hook to do enabling/disabling for the
        Format menu. There should be code like this for the
        object-specific "Properties" item
*/
// For property dialogs, we want the selected element,
//  but will accept a parent link, list, or table cell if inside one
function GetObjectForProperties()
{
  var editor = GetCurrentEditor();
  if (!editor || !IsHTMLEditor())
    return null;

  var element;
  try {
    element = editor.getSelectedElement("");
  } catch (e) {}
  if (element)
    return element;

  // Find nearest parent of selection anchor node
  //   that is a link, list, table cell, or table

  var anchorNode
  var node;
  try {
    anchorNode = editor.selection.anchorNode;
    if (anchorNode.firstChild)
    {
      // Start at actual selected node
      var offset = editor.selection.anchorOffset;
      // Note: If collapsed, offset points to element AFTER caret,
      //  thus node may be null
      node = anchorNode.childNodes.item(offset);
    }
    if (!node)
      node = anchorNode;
  } catch (e) {}

  while (node)
  {
    if (node.nodeName)
    {
      var nodeName = node.nodeName.toLowerCase();

      // Done when we hit the body
      if (nodeName == "body") break;

      if ((nodeName == "a" && node.href) ||
          nodeName == "ol" || nodeName == "ul" || nodeName == "dl" ||
          nodeName == "td" || nodeName == "th" ||
          nodeName == "table")
      {
        return node;
      }
    }
    node = node.parentNode;
  }
  return null;
}

function SetEditMode(mode)
{
  if (!IsHTMLEditor())
    return;

  var bodyElement = GetBodyElement();
  if (!bodyElement)
  {
    dump("SetEditMode: We don't have a body node!\n");
    return;
  }

  // must have editor if here!
  var editor = GetCurrentEditor();

  // Switch the UI mode before inserting contents
  //   so user can't type in source window while new window is being filled
  //var previousMode = gEditorDisplayMode;
  var previousMode = gEditorEditMode;
  //if (!SetDisplayMode(mode))
  if (!SetEditUI(mode))
    return;

  window.setCursor("wait");

  if (mode == kEditModeSource)
  {
    // Display the DOCTYPE as a non-editable string above edit area
    var domdoc;
    try { domdoc = editor.document; } catch (e) { dump( e + "\n");}
    if (domdoc)
    {
      var doctypeNode = document.getElementById("doctype-text");
      var dt = domdoc.doctype;
      if (doctypeNode)
      {
        if (dt)
        {
          doctypeNode.collapsed = false;
          var doctypeText = "<!DOCTYPE " + domdoc.doctype.name;
          if (dt.publicId)
            doctypeText += " PUBLIC \"" + domdoc.doctype.publicId;
          if (dt.systemId)
            doctypeText += " "+"\"" + dt.systemId;
          doctypeText += "\">"
          doctypeNode.setAttribute("value", doctypeText);
        }
        // XXX HACK ALERT Glazou
        else if (!kColoredSourceView)
          doctypeNode.collapsed = true;
      }
    }

    // Get the entire document's source string
    var flags = (editor.documentCharacterSet == "ISO-8859-1")
      ? 32768  // OutputEncodeLatin1Entities
      : 16384; // OutputEncodeBasicEntities
    try { 
      var encodeEntity = gPrefs.getCharPref("editor.encode_entity");
      var dontEncodeGT = gPrefs.getBoolPref("editor.encode.noGT");
      switch (encodeEntity) { //OutputEncodeCharacterEntities =
        case "basic"   : flags = 16384;  break; // OutputEncodeBasicEntities
        case "latin1"  : flags = 32768;  break; // OutputEncodeLatin1Entities
        case "html"    : flags = 65536;  break; // OutputEncodeHTMLEntities
        case "unicode" : flags = 262144; break;
        case "none"    : flags = 0;      break;
      }
      if (dontEncodeGT)
        flags |= (1 << 21); // DontEncodeGreatherThan
    } catch (e) { }

    // Kaze: always reformat the HTML code for the "source" view
    //~ try { 
      //~ var prettyPrint = gPrefs.getBoolPref("editor.prettyprint");
      //~ if (prettyPrint)
      //~ {
        flags |= 2;      // OutputFormatted
      //~ }
    //~ } catch (e) {}

    flags |= 1 << 5; // OutputRaw
    flags |= 1024;   // OutputLFLineBreak

    if (kColoredSourceView) { // Nvu
      //flags |= 131072; // colored source view

      NotifyProcessors(kProcessorsBeforeGettingSource, editor.document);

      var mimeType = kHTMLMimeType;
      /*if (IsXHTMLDocument())
        mimeType = kXMLMimeType;*/
      var source = editor.outputToString(mimeType, flags);
      var start = source.search(/\<span class='/i);
      if (start == -1) start = 0;
      gSourceTextEditor.selectAll();
      // gSourceTextEditor.insertText(source.slice(start));

      if (false /*IsXHTMLDocument()*/)
      {
        source = source.replace( /\n$/gi , String(""));
        source = source.slice(start).replace( /\n/gi , String("</li><li>"));
      }
      else
      {
        source = source.replace( /<br>$/gi , String("")).replace( /\n$/gi , String(""));
        source = source.slice(start).replace( /<br>/gi , String("</li><li>")).replace( /\n/gi , String("</li><li>"));
      }

      source = "<ol><li>" + source + "</li></ol>";
      InsertColoredSourceView(gSourceTextEditor, source);

      //InsertColoredSourceView(gSourceTextEditor, source.slice(start));
    }
    else { // Composer
      var source = editor.outputToString(kHTMLMimeType, flags);
      var start = source.search(/<html/i);
      if (start == -1) start = 0;
      gSourceTextEditor.selectAll();
      gSourceTextEditor.insertText(source.slice(start));
    }

    gSourceTextEditor.resetModificationCount();
    gSourceTextEditor.addDocumentStateListener(gSourceTextListener);
    gSourceTextEditor.enableUndo(true);
    gSourceContentWindow.commandManager.addCommandObserver(gSourceTextObserver, "cmd_undo");
    gSourceContentWindow.contentWindow.focus();
    goDoCommand("cmd_moveTop");

    if (kColoredSourceView) { // Nvu
      // let's show the preserved selection :-)
      var sourceDoc = gSourceTextEditor.document;
      var startSel  = sourceDoc.getElementById("start-selection");
      var endSel    = sourceDoc.getElementById("end-selection");
      if (startSel)
      {
        var sourceSel = gSourceTextEditor.selection;
        sourceSel.removeAllRanges();
        var range = gSourceTextEditor.document.createRange();
        if (endSel && (endSel != startSel))
        {
          range.setStartBefore(startSel);
          // <Kaze>
          //range.setEndAfter(endSel);
          try { // sometimes 'endSel' is out of bonds
            range.setEndAfter(endSel);
          } catch(e) {
            range.setEndAfter(startSel);
          }
          // </Kaze>
        }
        else
        {
          range.setStartAfter(startSel);
          range.setEndAfter(startSel);
        }
        sourceSel.addRange(range);

        setTimeout("gSourceTextEditor.scrollSelectionIntoView(true)", 100)
      }
      else
        gSourceTextEditor.beginningOfDocument()
    }
  }
  else if (previousMode == kEditModeSource)
  {

    // Only rebuild document if a change was made in source window
    if (IsHTMLSourceChanged())
    {
      // Reduce the undo count so we don't use too much memory
      //   during multiple uses of source window 
      //   (reinserting entire doc caches all nodes)
      try {
        editor.transactionManager.maxTransactionCount = 1;
      } catch (e) {}

      editor.beginTransaction();
      try {
        // We are coming from edit source mode,
        //   so transfer that back into the document
        var flags = 1024; // nsIDocumentEncoder::OutputLFLineBreak 
        flags |= 524288;  // nsIDocumentEncoder::OutputLineBreaksWhenClosingLI
        source = gSourceTextEditor.outputToString(kTextMimeType, flags);
        editor.rebuildDocumentFromSource(source);

        // Get the text for the <title> from the newly-parsed document
        // (must do this for proper conversion of "escaped" characters)
        var title = "";
        var titlenodelist = editor.document.getElementsByTagName("title");
        if (titlenodelist)
        {
          var titleNode = titlenodelist.item(0);
          if (titleNode && titleNode.firstChild && titleNode.firstChild.data)
            title = titleNode.firstChild.data;
          // XXX HACK glazou
          if (title == "\n")
            title = "";
        }
        if (editor.document.title != title)
          SetDocumentTitle(title);

      } catch (ex) {
        dump(ex);
      }
      editor.endTransaction();

      // Restore unlimited undo count
      try {
        editor.transactionManager.maxTransactionCount = -1;
      } catch (e) {}
    }

    NotifyProcessors(kProcessorsBeforeBackToNormal, editor.document);

    // Clear out the string buffers
    gSourceContentWindow.commandManager.removeCommandObserver(gSourceTextObserver, "cmd_undo");
    gSourceTextEditor.removeDocumentStateListener(gSourceTextListener);
    gSourceTextEditor.enableUndo(false);
    if (!kColoredSourceView) { // Composer
      gSourceTextEditor.selectAll();
      gSourceTextEditor.deleteSelection(gSourceTextEditor.eNone);
    }
    gSourceTextEditor.resetModificationCount();

    gContentWindow.focus();
  }

  window.setCursor("auto");
}

function SetEditUI(mode)
{ // Kaze: this function has been adapted from the former "SetDisplayMode" one
  if (!IsHTMLEditor())
    return false;

  // Already in requested mode:
  //  return false to indicate we didn't switch
  if (mode == gEditorEditMode)
    return false;

  GetCurrentEditorElement().setAttribute("displaymode", mode);

  NotifyProcessors(kProcessorsWhenDisplayModeChanges, mode);

  var previousMode = gEditorEditMode;
  gEditorEditMode = mode;

  // Load/unload appropriate override style sheet
  try {
    var editor = GetCurrentEditor();
    editor.QueryInterface(nsIEditorStyleSheets);
    editor instanceof Components.interfaces.nsIHTMLObjectResizer;

    // <Kaze> implement "design" and "split" modes
    var splitter    = document.getElementById("browser-splitter");
    var displayTabs = document.getElementById("DisplayModeTabs")

    switch (mode) {
      case kEditModeDesign:
      case kEditModeSource:
        displayTabs.hidden = (mode == kEditModeSource);
        gSourceBrowserDeck.setAttribute("collapsed", "true");
        splitter.setAttribute("state", "collapsed");
        splitter.setAttribute("hidden", "true");
        break;

      case kEditModeSplit:
        displayTabs.hidden = false;
        gSourceBrowserDeck.removeAttribute("collapsed");
        splitter.setAttribute("state", "expand");
        splitter.setAttribute("hidden", "false");
        // display the current node's source
        viewNodeSource(gLastFocusNode);
        break;
    }
    // </Kaze>
  } catch(e) {}

  ResetStructToolbar();
  if (mode == kEditModeSource)
  {
    // we need to disable inline spell checking
    gWasInlineSpellCheckerEnabled = gPrefs.getBoolPref("spellchecker.enablerealtimespell");
    gPrefs.setBoolPref("spellchecker.enablerealtimespell", false);  

    // Switch to the sourceWindow (second in the deck)
    gContentWindowDeck.selectedIndex = 1;

    // Hide the formatting toolbar if not already hidden
    gFormatToolbarHidden1      = gFormatToolbar1.hidden;
    gFormatToolbarHidden2      = gFormatToolbar2.hidden;
    gFormatToolbar1.disabled   = true;
    gFormatToolbar2.disabled   = true;
    gViewFormatToolbar1.hidden = true;
    gViewFormatToolbar2.hidden = true;

    gSourceContentWindow.contentWindow.focus();
  }
  else
  {
    // do we need to re-enable inline spell checking ?
    if (previousMode == kEditModeSource)
    {
      var showDisableSpellCheckWarning = gPrefs.getBoolPref("editor.showDisableSpellCheckWarning");
      if (showDisableSpellCheckWarning)
      {
        var isSpellCheckerEnabled = gPrefs.getBoolPref("spellchecker.enablerealtimespell");
        if (gWasInlineSpellCheckerEnabled || isSpellCheckerEnabled)
          window.openDialog("chrome://editor/content/confirmInlineSpellChecking.xul", "_blank", "chrome,close=no,titlebar,modal", "");
      }
      else
        gPrefs.setBoolPref("spellchecker.enablerealtimespell", gWasInlineSpellCheckerEnabled)
    }

    // Save the last non-source mode so we can cancel source editing easily
    gPreviousNonSourceEditMode = mode;

    // Switch to the normal editor (first in the deck)
    gContentWindowDeck.selectedIndex = 0;

    // Restore menus and toolbars
    gViewFormatToolbar1.hidden = false;
    gViewFormatToolbar2.hidden = false;

    gContentWindow.focus();
  }

  // update commands to disable or re-enable stuff
  window.updateCommands("mode_switch");

  // Set the selected tab at bottom of window:
  // (Note: Setting "selectedIndex = mode" won't redraw tabs when menu is used.)
  document.getElementById("EditModeTabs").selectedItem = document.getElementById(kEditModeTabIDS[mode]);

  // Uncheck previous menuitem and set new check since toolbar may have been used
  if (previousMode >= 0)
    document.getElementById(kEditModeMenuIDs[previousMode]).setAttribute("checked","false");
  document.getElementById(kEditModeMenuIDs[mode]).setAttribute("checked","true");
  

  return true;
}

function CancelHTMLSource()
{
  // Don't convert source text back into the DOM document
  gSourceTextEditor.resetModificationCount();
  SetEditMode(gPreviousNonSourceEditMode);
}

function FinishHTMLSource()
{
  // Here we need to check whether the HTML source contains <head> and <body> tags
  // or RebuildDocumentFromSource() will fail.
  if (IsInHTMLSourceMode())
  {
    var htmlSource = gSourceTextEditor.outputToString(kTextMimeType, 1024); // OutputLFLineBreak
    if (htmlSource.length > 0)
    {
      var beginHead = htmlSource.indexOf("<head");
      if (beginHead == -1)
      {
        AlertWithTitle(GetString("Alert"), GetString("NoHeadTag"));
        //cheat to force back to Source Mode
        // Kaze
        //gEditorDisplayMode = kDisplayModePreview;
        //SetDisplayMode(kEditModeSource);
        gEditorEditMode = kEditModeDesign;
        SetEditMode(kEditModeSource);
        throw Components.results.NS_ERROR_FAILURE;
      }

      var beginBody = htmlSource.indexOf("<body");
      if (beginBody == -1)
      {
        AlertWithTitle(GetString("Alert"), GetString("NoBodyTag"));
        //cheat to force back to Source Mode
        // Kaze
        //gEditorDisplayMode = kDisplayModePreview;
        //SetDisplayMode(kEditModeSource);
        gEditorEditMode = kEditModeDesign;
        SetEditMode(kEditModeSource);
        throw Components.results.NS_ERROR_FAILURE;
      }
    }
  }

  // Switch edit modes -- converts source back into DOM document
  SetEditMode(gPreviousNonSourceEditMode);
}

function SetDisplayMode(mode)
{
  if (!IsHTMLEditor())
    return false;

  // Already in requested mode:
  //  return false to indicate we didn't switch
  if (mode == gEditorDisplayMode)
    return false;

  GetCurrentEditorElement().setAttribute("displaymode", mode);

  NotifyProcessors(kProcessorsWhenDisplayModeChanges, mode);

  var previousMode = gEditorDisplayMode;
  gEditorDisplayMode = mode;

  // Save the last non-source mode so we can cancel source editing easily
  gPreviousNonSourceDisplayMode = mode;

  // Load/unload appropriate override style sheet
  try {
    var editor = GetCurrentEditor();
    editor.QueryInterface(nsIEditorStyleSheets);
    editor instanceof Components.interfaces.nsIHTMLObjectResizer;

    switch (mode)
    {
      case kDisplayModePreview:
        // Disable all extra "edit mode" style sheets 
        editor.enableStyleSheet(kNormalStyleSheet, false);
        editor.enableStyleSheet(kAllTagsStyleSheet, false);
        editor.isImageResizingEnabled = true;
        break;

      case kDisplayModeNormal:
        editor.addOverrideStyleSheet(kNormalStyleSheet);
        // Disable ShowAllTags mode
        editor.enableStyleSheet(kAllTagsStyleSheet, false);
        editor.isImageResizingEnabled = true;
        break;

      case kDisplayModeAllTags:
        editor.addOverrideStyleSheet(kNormalStyleSheet);
        editor.addOverrideStyleSheet(kAllTagsStyleSheet);
        // don't allow resizing in AllTags mode because the visible tags
        // change the computed size of images and tables...
        if (editor.resizedObject) {
          editor.hideResizers();
        }
        editor.isImageResizingEnabled = false;
        break;
    }
  } catch(e) {}

  // update commands to disable or re-enable stuff
  //window.updateCommands("mode_switch");

  // Set the selected tab at bottom of window:
  // (Note: Setting "selectedIndex = mode" won't redraw tabs when menu is used.)
  document.getElementById("DisplayModeTabs").selectedItem = document.getElementById(kDisplayModeTabIDS[mode]);

  // Uncheck previous menuitem and set new check since toolbar may have been used
  if (previousMode >= 0)
    document.getElementById(kDisplayModeMenuIDs[previousMode]).setAttribute("checked","false");
  document.getElementById(kDisplayModeMenuIDs[mode]).setAttribute("checked","true");

  return true;
}

function EditorToggleStyleSheet(ref)
{
  var id = "", sheet = "";
  switch (ref) {
    case "paragraphMarks":
      id    = "viewParagraphMarks";
      sheet = kParagraphMarksStyleSheet;
      break;
    case "blockOutlines":
      id    = "blockOutlines";
      sheet = kBlockOutlinesStyleSheet;
      break;
    default:
      // we should never run this...
      dump("EditorToggleStyleSheet(): unknown stylesheet reference " + ref + "\n");
      break;
  }
  if (!id)
    return;

  var menuItem = document.getElementById(id);
  if (menuItem)
  {
    // Note that the 'type="checbox"' mechanism automatically
    //  toggles the "checked" state before the oncommand is called,
    //  so if "checked" is true now, it was just switched to that mode
    var checked = menuItem.getAttribute("checked");
    try {
      var element = GetCurrentEditorElement();
      var editor  = GetCurrentEditor();
      editor.QueryInterface(nsIEditorStyleSheets);

      if (checked == "true")
      {
        editor.addOverrideStyleSheet(sheet);
        element.setAttribute(kBlockOutlinesAttr, true);
      }
      else
      {
        editor.enableStyleSheet(sheet, false);
        element.removeAttribute(kBlockOutlinesAttr);
      }
    }
    catch(e) { return; }
  }
}

function InitPasteAsMenu()
{
  var menuItem = document.getElementById("menu_pasteTable")
  if(menuItem)
  {
    menuItem.IsInTable  
    menuItem.setAttribute("label", GetString(IsInTable() ? "NestedTable" : "Table"));
   // menuItem.setAttribute("accesskey",GetString("ObjectPropertiesAccessKey"));
  }
  // TODO: Do enabling based on what is in the clipboard
}

function UpdateWindowTitle()
{
  try {
    var windowTitle = GetDocumentTitle();
    if (!windowTitle)
      windowTitle = GetString("untitled");

    // Append just the 'leaf' filename to the Doc. Title for the window caption
    var docUrl = GetDocumentUrl();
    if (docUrl && !IsUrlAboutBlank(docUrl))
    {
      var scheme = GetScheme(docUrl);
      var filename = GetFilename(docUrl);
      if (filename)
        windowTitle += " [" + scheme + ":/.../" + filename + "]";

      // Save changed title in the recent pages data in prefs
      SaveRecentFilesPrefs();
    }
    // Set window title with " - Composer" appended
    var xulWin = document.documentElement;
    document.title = windowTitle + xulWin.getAttribute("titlemenuseparator") + 
                   xulWin.getAttribute("titlemodifier");
  } catch (e) { dump(e); }
}

function BuildRecentPagesMenu()
{
  var editor = GetCurrentEditor();
  if (!editor || !gPrefs)
    return;

  var popup = document.getElementById("menupopup_RecentFiles");
  if (!popup || !editor.document)
    return;

  // Delete existing menu
  while (popup.firstChild)
    popup.removeChild(popup.firstChild);

  // Current page is the "0" item in the list we save in prefs,
  //  but we don't include it in the menu.
  var curUrl = StripPassword(GetDocumentUrl());
  var historyCount = 10;
  try {
    historyCount = gPrefs.getIntPref("editor.history.url_maximum");
  } catch(e) {}
  var menuIndex = 1;

  for (var i = 0; i < historyCount; i++)
  {
    var url = GetUnicharPref("editor.history_url_"+i);

    // Skip over current url
    if (url && url != curUrl)
    {
      // Build the menu
      var title = GetUnicharPref("editor.history_title_"+i);
      AppendRecentMenuitem(popup, title, url, menuIndex);
      menuIndex++;
    }
  }
}

function SaveRecentFilesPrefs()
{
  // Can't do anything if no prefs
  if (!gPrefs) return;

  var curUrl = StripPassword(GetDocumentUrl());
  var historyCount = 10;
  try {
    historyCount = gPrefs.getIntPref("editor.history.url_maximum"); 
  } catch(e) {}

  var titleArray = [];
  var urlArray = [];

  if (historyCount && !IsUrlAboutBlank(curUrl) &&  GetScheme(curUrl) != "data")
  {
    titleArray.push(GetDocumentTitle());
    urlArray.push(curUrl);
  }

  for (var i = 0; i < historyCount && urlArray.length < historyCount; i++)
  {
    var url = GetUnicharPref("editor.history_url_"+i);

    // Continue if URL pref is missing because 
    //  a URL not found during loading may have been removed

    // Skip over current an "data" URLs
    if (url && url != curUrl && GetScheme(url) != "data")
    {
      var title = GetUnicharPref("editor.history_title_"+i);
      titleArray.push(title);
      urlArray.push(url);
    }
  }

  // Resave the list back to prefs in the new order
  for (i = 0; i < urlArray.length; i++)
  {
    SetUnicharPref("editor.history_title_"+i, titleArray[i]);
    SetUnicharPref("editor.history_url_"+i, urlArray[i]);
  }
}

function AppendRecentMenuitem(menupopup, title, url, menuIndex)
{
  if (menupopup)
  {
    var menuItem = document.createElementNS(XUL_NS, "menuitem");
    if (menuItem)
    {
      var accessKey;
      if (menuIndex <= 9)
        accessKey = String(menuIndex);
      else if (menuIndex == 10)
        accessKey = "0";
      else
        accessKey = " ";

      var itemString = accessKey+" ";

      // Show "title [url]" or just the URL
      if (title)
      {
       itemString += title;
       itemString += " [";
      }
      itemString += url;
      if (title)
        itemString += "]";

      menuItem.setAttribute("label", itemString);
      menuItem.setAttribute("crop", "center");
      menuItem.setAttribute("value", url);
      if (accessKey != " ")
        menuItem.setAttribute("accesskey", accessKey);
      menupopup.appendChild(menuItem);
    }
  }
}

function EditorInitFileMenu()
{
  // Disable "Save" menuitem when editing remote url. User should use "Save As"
  var docUrl = GetDocumentUrl();
  var scheme = GetScheme(docUrl);
  if (scheme && scheme != "file")
    SetElementEnabledById("saveMenuitem", false);

  // Enable recent pages submenu if there are any history entries in prefs
  var historyUrl = "";

  var historyCount = 10;
  try { historyCount = gPrefs.getIntPref("editor.history.url_maximum"); } catch(e) {}
  if (historyCount)
  {
    historyUrl = GetUnicharPref("editor.history_url_0");
    
    // See if there's more if current file is only entry in history list
    if (historyUrl && historyUrl == docUrl)
      historyUrl = GetUnicharPref("editor.history_url_1");
  }
  SetElementEnabledById("menu_RecentFiles", historyUrl != "");
}

function EditorInitFormatMenu()
{
  try {
    InitObjectPropertiesMenuitem("objectProperties");
    InitRemoveStylesMenuitems("removeStylesMenuitem", "removeLinksMenuitem", "removeNamedAnchorsMenuitem");
  } catch(ex) {}
}

function InitObjectPropertiesMenuitem(id)
{
  // Set strings and enable for the [Object] Properties item
  // Note that we directly do the enabling instead of
  //  using goSetCommandEnabled since we already have the menuitem
  var menuItem = document.getElementById(id);
  if (!menuItem) return null;

  var element;
  var menuStr = GetString("AdvancedProperties");
  var name;

  if (IsEditingRenderedHTML())
    element = GetObjectForProperties();

  if (element && element.nodeName)
  {
    var objStr = "";
    menuItem.setAttribute("disabled", "");
    name = element.nodeName.toLowerCase();
    switch (name)
    {
      case "img":
        // Check if img is enclosed in link
        //  (use "href" to not be fooled by named anchor)
        try
        {
          if (GetCurrentEditor().getElementOrParentByTagName("href", element))
            objStr = GetString("ImageAndLink");
        } catch(e) {}
        
        if (objStr == "")
          objStr = GetString("Image");
        break;
      case "hr":
        objStr = GetString("HLine");
        break;
      case "table":
        objStr = GetString("Table");
        break;
      case "th":
        name = "td";
      case "td":
        objStr = GetString("TableCell");
        break;
      case "ol":
      case "ul":
      case "dl":
        objStr = GetString("List");
        break;
      case "li":
        objStr = GetString("ListItem");
        break;
      case "form":
        objStr = GetString("Form");
        break;
      case "input":
        var type = element.getAttribute("type");
        if (type && type.toLowerCase() == "image")
          objStr = GetString("InputImage");
        else
          objStr = GetString("InputTag");
        break;
      case "textarea":
        objStr = GetString("TextArea");
        break;
      case "select":
        objStr = GetString("Select");
        break;
      case "button":
        objStr = GetString("Button");
        break;
      case "label":
        objStr = GetString("Label");
        break;
      case "fieldset":
        objStr = GetString("FieldSet");
        break;
      case "a":
        if (element.name)
        {
          objStr = GetString("NamedAnchor");
          name = "anchor";
        }
        else if(element.href)
        {
          objStr = GetString("Link");
          name = "href";
        }
        break;
    }
    if (objStr)
      menuStr = GetString("ObjectProperties").replace(/%obj%/,objStr);
  }
  else
  {
    // We show generic "Properties" string, but disable menu item
    menuItem.setAttribute("disabled","true");
  }
  menuItem.setAttribute("label", menuStr);
  menuItem.setAttribute("accesskey",GetString("ObjectPropertiesAccessKey"));
  return name;
}

function InitParagraphMenu()
{
  var mixedObj = { value: null };
  var state;
  try {
    state = GetCurrentEditor().getParagraphState(mixedObj);
  }
  catch(e) {}
  var IDSuffix;

  // PROBLEM: When we get blockquote, it masks other styles contained by it
  // We need a separate method to get blockquote state

  // We use "x" as uninitialized paragraph state
  if (!state || state == "x")
    IDSuffix = "bodyText" // No paragraph container
  else
    IDSuffix = state;

  // Set "radio" check on one item, but...
  var menuItem = document.getElementById("menu_"+IDSuffix);
  menuItem.setAttribute("checked", "true");

  // ..."bodyText" is returned if mixed selection, so remove checkmark
  if (mixedObj.value)
    menuItem.setAttribute("checked", "false");
}

function GetListStateString()
{
  try {
    var editor = GetCurrentEditor();

    var mixedObj = { value: null };
    var hasOL = { value: false };
    var hasUL = { value: false };
    var hasDL = { value: false };
    editor.getListState(mixedObj, hasOL, hasUL, hasDL);

    if (mixedObj.value)
      return "mixed";
    if (hasOL.value)
      return "ol";
    if (hasUL.value)
      return "ul";

    if (hasDL.value)
    {
      var hasLI = { value: false };
      var hasDT = { value: false };
      var hasDD = { value: false };
      editor.getListItemState(mixedObj, hasLI, hasDT, hasDD);
      if (mixedObj.value)
        return "mixed";
      if (hasLI.value)
        return "li";
      if (hasDT.value)
        return "dt";
      if (hasDD.value)
        return "dd";
    }
  } catch (e) {}

  // return "noList" if we aren't in a list at all
  return "noList";
}

function InitListMenu()
{
  if (!IsHTMLEditor())
    return;

  var IDSuffix = GetListStateString();

  // Set enable state for the "None" menuitem
  goSetCommandEnabled("cmd_removeList", IDSuffix != "noList");

  // Set "radio" check on one item, but...
  // we won't find a match if it's "mixed"
  var menuItem = document.getElementById("menu_"+IDSuffix);
  if (menuItem)
    menuItem.setAttribute("checked", "true");
}

function GetAlignmentString()
{
  var mixedObj = { value: null };
  var alignObj = { value: null };
  try {
    GetCurrentEditor().getAlignment(mixedObj, alignObj);
  } catch (e) {}

  if (mixedObj.value)
    return "mixed";
  if (alignObj.value == nsIHTMLEditor.eLeft)
    return "left";
  if (alignObj.value == nsIHTMLEditor.eCenter)
    return "center";
  if (alignObj.value == nsIHTMLEditor.eRight)
    return "right";
  if (alignObj.value == nsIHTMLEditor.eJustify)
    return "justify";

  // return "left" if we got here
  return "left";
}

function InitAlignMenu()
{
  if (!IsHTMLEditor())
    return;

  var IDSuffix = GetAlignmentString();

  // we won't find a match if it's "mixed"
  var menuItem = document.getElementById("menu_"+IDSuffix);
  if (menuItem)
    menuItem.setAttribute("checked", "true");
}

function EditorSetDefaultPrefsAndDoctype()
{
  var editor = GetCurrentEditor();

  var domdoc;
  try { 
    domdoc = editor.document;
  } catch (e) { dump( e + "\n"); }
  if ( !domdoc )
  {
    dump("EditorSetDefaultPrefsAndDoctype: EDITOR DOCUMENT NOT FOUND\n");
    return;
  }

  // Insert a doctype element 
  // if it is missing from existing doc
  if (!domdoc.doctype)
  {
    var newdoctype = domdoc.implementation.createDocumentType("HTML", "-//W3C//DTD HTML 4.01 Transitional//EN","");
    if (newdoctype)
      domdoc.insertBefore(newdoctype, domdoc.firstChild);
  }
  
  // search for head; we'll need this for meta tag additions
  var headelement = 0;
  var headnodelist = domdoc.getElementsByTagName("head");
  if (headnodelist)
  {
    var sz = headnodelist.length;
    if ( sz >= 1 )
      headelement = headnodelist.item(0);
  }
  else
  {
    headelement = domdoc.createElement("head");
    if (headelement)
      domdoc.insertAfter(headelement, domdoc.firstChild);
  }

  /* only set default prefs for new documents */
  if (!IsUrlAboutBlank(GetDocumentUrl()))
    return;

  // search for author meta tag.
  // if one is found, don't do anything.
  // if not, create one and make it a child of the head tag
  //   and set its content attribute to the value of the editor.author preference.

  var nodelist = domdoc.getElementsByTagName("meta");
  if ( nodelist )
  {
    // we should do charset first since we need to have charset before
    // hitting other 8-bit char in other meta tags
    // grab charset pref and make it the default charset
    var element;
    var prefCharsetString = 0;
    try
    {
      prefCharsetString = gPrefs.getCharPref("editor.custom_charset");
    }
    catch (ex) {}
    if (!prefCharsetString)
    {
      try
      {
        prefCharsetString = gPrefs.getComplexValue("intl.charset.default",
                                                   Components.interfaces.nsIPrefLocalizedString).data;
      }
      catch (ex) {}
    }   
    if ( prefCharsetString && prefCharsetString != 0)
    {
        element = domdoc.createElement("meta");
        if ( element )
        {
          element.setAttribute("http-equiv", "content-type");
          element.setAttribute("content", "text/html; charset=" + prefCharsetString);
          headelement.insertBefore( element, headelement.firstChild );
        }
    }

    var node = 0;
    var listlength = nodelist.length;

    // let's start by assuming we have an author in case we don't have the pref
    var authorFound = false;
    for (var i = 0; i < listlength && !authorFound; i++)
    {
      node = nodelist.item(i);
      if ( node )
      {
        var value = node.getAttribute("name");
        if (value && value.toLowerCase() == "author")
        {
          authorFound = true;
        }
      }
    }

    var prefAuthorString = 0;
    try
    {
      prefAuthorString = gPrefs.getComplexValue("editor.author",
                                                Components.interfaces.nsISupportsString).data;
    }
    catch (ex) {}
    if ( prefAuthorString && prefAuthorString != 0)
    {
      if ( !authorFound && headelement)
      {
        /* create meta tag with 2 attributes */
        element = domdoc.createElement("meta");
        if ( element )
        {
          element.setAttribute("name", "author");
          element.setAttribute("content", prefAuthorString);
          headelement.appendChild( element );
        }
      }
    }
  }

  // add title tag if not present
  var titlenodelist = editor.document.getElementsByTagName("title");
  if (headelement && titlenodelist && titlenodelist.length == 0)
  {
     titleElement = domdoc.createElement("title");
     if (titleElement)
       headelement.appendChild(titleElement);
  }

  // Get editor color prefs
  var use_custom_colors = false;
  try {
    use_custom_colors = gPrefs.getBoolPref("editor.use_custom_colors");
  }
  catch (ex) {}

  // find body node
  var bodyelement = GetBodyElement();
  if (bodyelement)
  {
    if ( use_custom_colors )
    {
      // try to get the default color values.  ignore them if we don't have them.
      var text_color;
      var link_color;
      var active_link_color;
      var followed_link_color;
      var background_color;

      try { text_color = gPrefs.getCharPref("editor.text_color"); } catch (e) {}
      try { link_color = gPrefs.getCharPref("editor.link_color"); } catch (e) {}
      try { active_link_color = gPrefs.getCharPref("editor.active_link_color"); } catch (e) {}
      try { followed_link_color = gPrefs.getCharPref("editor.followed_link_color"); } catch (e) {}
      try { background_color = gPrefs.getCharPref("editor.background_color"); } catch(e) {}

      // add the color attributes to the body tag.
      // and use them for the default text and background colors if not empty
      try {
        if (text_color)
        {
          editor.setAttributeOrEquivalent(bodyelement, "text", text_color, true);
          gDefaultTextColor = text_color;
        }
        if (background_color)
        {
          editor.setAttributeOrEquivalent(bodyelement, "bgcolor", background_color, true);
          gDefaultBackgroundColor = background_color
        }

        if (link_color)
          bodyelement.setAttribute("link", link_color);
        if (active_link_color)
          bodyelement.setAttribute("alink", active_link_color);
        if (followed_link_color)
          bodyelement.setAttribute("vlink", followed_link_color);
      } catch (e) {}
    }
    // Default image is independent of Custom colors???
    try {
      var background_image = gPrefs.getCharPref("editor.default_background_image");
      if (background_image)
        editor.setAttributeOrEquivalent(bodyelement, "background", background_image, true);
    } catch (e) {dump("BACKGROUND EXCEPTION: "+e+"\n"); }

  }
  // auto-save???
}

function GetBodyElement()
{
  try {
    return GetCurrentEditor().rootElement;
  }
  catch (ex) {
    dump("no body tag found?!\n");
    //  better have one, how can we blow things up here?
  }
  return null;
}

// --------------------------- Logging stuff ---------------------------

function EditorGetNodeFromOffsets(offsets)
{
  var node = null;
  try {
    node = GetCurrentEditor().document;

    for (var i = 0; i < offsets.length; i++)
      node = node.childNodes[offsets[i]];
  } catch (e) {}
  return node;
}

function EditorSetSelectionFromOffsets(selRanges)
{
  try {
    var editor = GetCurrentEditor();
    var selection = editor.selection;
    selection.removeAllRanges();

    var rangeArr, start, end, node, offset;
    for (var i = 0; i < selRanges.length; i++)
    {
      rangeArr = selRanges[i];
      start    = rangeArr[0];
      end      = rangeArr[1];

      var range = editor.document.createRange();

      node   = EditorGetNodeFromOffsets(start[0]);
      offset = start[1];

      range.setStart(node, offset);

      node   = EditorGetNodeFromOffsets(end[0]);
      offset = end[1];

      range.setEnd(node, offset);

      selection.addRange(range);
    }
  } catch (e) {}
}

//--------------------------------------------------------------------
function initFontStyleMenu(menuPopup)
{
  for (var i = 0; i < menuPopup.childNodes.length; i++)
  {
    var menuItem = menuPopup.childNodes[i];
    var theStyle = menuItem.getAttribute("state");
    if (theStyle)
    {
      menuItem.setAttribute("checked", theStyle);
    }
  }
}

//--------------------------------------------------------------------
function onButtonUpdate(button, commmandID)
{
  var commandNode = document.getElementById(commmandID);
  var state = commandNode.getAttribute("state");
  button.checked = state == "true";
}

//--------------------------------------------------------------------
function onStateButtonUpdate(button, commmandID, onState)
{
  var commandNode = document.getElementById(commmandID);
  var state = commandNode.getAttribute("state");

  button.checked = state == onState;
}

// --------------------------- Status calls ---------------------------
function getColorAndSetColorWell(ColorPickerID, ColorWellID)
{
  var colorWell;
  if (ColorWellID)
    colorWell = document.getElementById(ColorWellID);

  var colorPicker = document.getElementById(ColorPickerID);
  if (colorPicker)
  {
    // Extract color from colorPicker and assign to colorWell.
    var color = colorPicker.getAttribute("color");

    if (colorWell && color)
    {
      // Use setAttribute so colorwell can be a XUL element, such as button
      colorWell.setAttribute("style", "background-color: " + color);
    }
  }
  return color;
}

//-----------------------------------------------------------------------------------
function IsSpellCheckerInstalled()
{
  return "@mozilla.org/spellchecker;1" in Components.classes;
}

//-----------------------------------------------------------------------------------
function IsFindInstalled()
{
  return "@mozilla.org/embedcomp/rangefind;1" in Components.classes
          && "@mozilla.org/find/find_service;1" in Components.classes;
}

//-----------------------------------------------------------------------------------
function RemoveInapplicableUIElements()
{
  // For items that are in their own menu block, remove associated separator
  // (we can't use "hidden" since class="hide-in-IM" CSS rule interferes)

   // if no find, remove find ui
  if (!IsFindInstalled())
  {
    HideItem("menu_find");
    HideItem("menu_findnext");
    HideItem("menu_replace");
    HideItem("menu_find");
    RemoveItem("sep_find");
  }

   // if no spell checker, remove spell checker ui
  if (!IsSpellCheckerInstalled())
  {
    SetElementEnabled(document.getElementById("spellingButton"), false);
    HideItem("menu_checkspelling");
    RemoveItem("sep_checkspelling");
  }
  else
  {
    SetElementEnabled(document.getElementById("menu_checkspelling"), true);
    SetElementEnabled(document.getElementById("spellingButton"), true);
    SetElementEnabled(document.getElementById("checkspellingkb"), true);
  }

  // Remove menu items (from overlay shared with HTML editor) in non-HTML.
  if (!IsHTMLEditor())
  {
    HideItem("insertAnchor");
    HideItem("insertImage");
    HideItem("insertHline");
    HideItem("insertTable");
    HideItem("insertHTML");
    HideItem("insertFormMenu");
    HideItem("fileExportToText");
    HideItem("viewFormatToolbar1");
    HideItem("viewFormatToolbar2");
    HideItem("viewEditModeToolbar");
  }
}

function HideItem(id)
{
  var item = document.getElementById(id);
  if (item)
    item.hidden = true;
}

function RemoveItem(id)
{
  var item = document.getElementById(id);
  if (item)
    item.parentNode.removeChild(item);
}

// Command Updating Strategy:
//   Don't update on on selection change, only when menu is displayed,
//   with this "oncreate" hander:
function EditorInitTableMenu()
{
  try {
    InitJoinCellMenuitem("menu_JoinTableCells");
  } catch (ex) {}

  // Set enable states for all table commands
  goUpdateTableMenuItems(document.getElementById("composerTableMenuItems"));
}

function InitJoinCellMenuitem(id)
{
  // Change text on the "Join..." item depending if we
  //   are joining selected cells or just cell to right
  // TODO: What to do about normal selection that crosses
  //       table border? Try to figure out all cells
  //       included in the selection?
  var menuText;
  var menuItem = document.getElementById(id);
  if (!menuItem) return;

  // Use "Join selected cells if there's more than 1 cell selected
  var numSelected;
  var foundElement;
  
  try {
    var tagNameObj = {};
    var countObj = {value:0}
    foundElement = GetCurrentTableEditor().getSelectedOrParentTableElement(tagNameObj, countObj);
    numSelected = countObj.value
  }
  catch(e) {}
  if (foundElement && numSelected > 1)
    menuText = GetString("JoinSelectedCells");
  else
    menuText = GetString("JoinCellToRight");

  menuItem.setAttribute("label",menuText);
  menuItem.setAttribute("accesskey",GetString("JoinCellAccesskey"));
}

function InitRemoveStylesMenuitems(removeStylesId, removeLinksId, removeNamedAnchorsId)
{
  var editor = GetCurrentEditor();
  if (!editor)
    return;

  // Change wording of menuitems depending on selection
  var stylesItem = document.getElementById(removeStylesId);
  var linkItem = document.getElementById(removeLinksId);

  var isCollapsed = editor.selection.isCollapsed;
  if (stylesItem)
  {
    stylesItem.setAttribute("label", isCollapsed ? GetString("StopTextStyles") : GetString("RemoveTextStyles"));
    stylesItem.setAttribute("accesskey", GetString("RemoveTextStylesAccesskey"));
  }
  if (linkItem)
  {
    linkItem.setAttribute("label", isCollapsed ? GetString("StopLinks") : GetString("RemoveLinks"));
    linkItem.setAttribute("accesskey", GetString("RemoveLinksAccesskey"));
    // Note: disabling text style is a pain since there are so many - forget it!

    // Disable if not in a link, but always allow "Remove"
    //  if selection isn't collapsed since we only look at anchor node
    try {
      SetElementEnabled(linkItem, !isCollapsed ||
                      editor.getElementOrParentByTagName("href", null));
    } catch(e) {}      
  }
  // Disable if selection is collapsed
  SetElementEnabledById(removeNamedAnchorsId, !isCollapsed);
}

function goUpdateTableMenuItems(commandset)
{
  var editor = GetCurrentTableEditor();
  if (!editor)
  {
    dump("goUpdateTableMenuItems: too early, not initialized\n");
    return;
  }

  var enabled = false;
  var enabledIfTable = false;

  var flags = editor.flags;
  if (!(flags & nsIPlaintextEditor.eEditorReadonlyMask) &&
      IsEditingRenderedHTML())
  {
    var tagNameObj = { value: "" };
    var element;
    try {
      element = editor.getSelectedOrParentTableElement(tagNameObj, {value:0});
    }
    catch(e) {}

    if (element)
    {
      // Value when we need to have a selected table or inside a table
      enabledIfTable = true;

      // All others require being inside a cell or selected cell
      enabled = (tagNameObj.value == "td");
    }
  }

  // Loop through command nodes
  for (var i = 0; i < commandset.childNodes.length; i++)
  {
    var commandID = commandset.childNodes[i].getAttribute("id");
    if (commandID)
    {
      if (commandID == "cmd_InsertTable" ||
          commandID == "cmd_JoinTableCells" ||
          commandID == "cmd_SplitTableCell" ||
          commandID == "cmd_ConvertToTable")
      {
        // Call the update method in the command class
        goUpdateCommand(commandID);
      }
      // Directly set with the values calculated here
      else if (commandID == "cmd_DeleteTable" ||
               commandID == "cmd_NormalizeTable" ||
               commandID == "cmd_editTable" ||
               commandID == "cmd_TableOrCellColor" ||
               commandID == "cmd_SelectTable")
      {
        goSetCommandEnabled(commandID, enabledIfTable);
      } else {
        goSetCommandEnabled(commandID, enabled);
      }
    }
  }
}

//-----------------------------------------------------------------------------------
// Helpers for inserting and editing tables:

function IsInTable()
{
  var editor = GetCurrentEditor();
  try {
    var flags = editor.flags;
    return (IsHTMLEditor() &&
            !(flags & nsIPlaintextEditor.eEditorReadonlyMask) &&
            IsEditingRenderedHTML() &&
            null != editor.getElementOrParentByTagName("table", null));
  } catch (e) {}
  return false;
}

function IsInTableCell()
{
  try {
    var editor = GetCurrentEditor();
    var flags = editor.flags;
    return (IsHTMLEditor() &&
            !(flags & nsIPlaintextEditor.eEditorReadonlyMask) && 
            IsEditingRenderedHTML() &&
            null != editor.getElementOrParentByTagName("td", null));
  } catch (e) {}
  return false;

}

function IsSelectionInOneCell()
{
  try {
    var editor = GetCurrentEditor();
    var selection = editor.selection;

    if (selection.rangeCount == 1)
    {
      // We have a "normal" single-range selection
      if (!selection.isCollapsed &&
         selection.anchorNode != selection.focusNode)
      {
        // Check if both nodes are within the same cell
        var anchorCell = editor.getElementOrParentByTagName("td", selection.anchorNode);
        var focusCell = editor.getElementOrParentByTagName("td", selection.focusNode);
        return (focusCell != null && anchorCell != null && (focusCell == anchorCell));
      }
      // Collapsed selection or anchor == focus (thus must be in 1 cell)
      return true;
    }
  } catch (e) {}
  return false;
}

// Call this with insertAllowed = true to allow inserting if not in existing table,
//   else use false to do nothing if not in a table
function EditorInsertOrEditTable(insertAllowed)
{
  if (IsInTable())
  {
    // Edit properties of existing table
    window.openDialog("chrome://editor/content/EdTableProps.xul", "_blank", "chrome,close,titlebar,modal", "","TablePanel");
    gContentWindow.focus();
  } 
  else if (insertAllowed)
  {
    try {
      if (GetCurrentEditor().selection.isCollapsed)
        // If we have a caret, insert a blank table...
        EditorInsertTable();
      else
        // else convert the selection into a table
        goDoCommand("cmd_ConvertToTable");
    } catch (e) {}
  }
}

function EditorInsertTable()
{
  // Insert a new table
  window.openDialog("chrome://editor/content/EdInsertTable.xul", "_blank", "chrome,close,titlebar,modal", "");
  gContentWindow.focus();
}

function EditorTableCellProperties()
{
  if (!IsHTMLEditor())
    return;

  try {
    var cell = GetCurrentEditor().getElementOrParentByTagName("td", null);
    if (cell) {
      // Start Table Properties dialog on the "Cell" panel
      window.openDialog("chrome://editor/content/EdTableProps.xul", "_blank", "chrome,close,titlebar,modal", "", "CellPanel");
      gContentWindow.focus();
    }
  } catch (e) {}
}

function GetNumberOfContiguousSelectedRows()
{
  if (!IsHTMLEditor())
    return 0;

  var rows = 0;
  try {
    var editor = GetCurrentTableEditor();
    var rowObj = { value: 0 };
    var colObj = { value: 0 };
    var cell = editor.getFirstSelectedCellInTable(rowObj, colObj);
    if (!cell)
      return 0;

    // We have at least one row
    rows++;

    var lastIndex = rowObj.value;
    do {
      cell = editor.getNextSelectedCell({value:0});
      if (cell)
      {
        editor.getCellIndexes(cell, rowObj, colObj);
        var index = rowObj.value;
        if (index == lastIndex + 1)
        {
          lastIndex = index;
          rows++;
        }
      }
    }
    while (cell);
  } catch (e) {}

  return rows;
}

function GetNumberOfContiguousSelectedColumns()
{
  if (!IsHTMLEditor())
    return 0;

  var columns = 0;
  try {
    var editor = GetCurrentTableEditor();
    var colObj = { value: 0 };
    var rowObj = { value: 0 };
    var cell = editor.getFirstSelectedCellInTable(rowObj, colObj);
    if (!cell)
      return 0;

    // We have at least one column
    columns++;

    var lastIndex = colObj.value;
    do {
      cell = editor.getNextSelectedCell({value:0});
      if (cell)
      {
        editor.getCellIndexes(cell, rowObj, colObj);
        var index = colObj.value;
        if (index == lastIndex +1)
        {
          lastIndex = index;
          columns++;
        }
      }
    }
    while (cell);
  } catch (e) {}

  return columns;
}

function EditorOnFocus()
{
  gEditorFocus = true; // Kaze

  // Current window already has the InsertCharWindow
  if ("InsertCharWindow" in window && window.InsertCharWindow) return;

  // Find window with an InsertCharsWindow and switch association to this one
  var windowWithDialog = FindEditorWithInsertCharDialog();
  if (windowWithDialog)
  {
    // Switch the dialog to current window
    // this sets focus to dialog, so bring focus back to editor window
    if (SwitchInsertCharToThisWindow(windowWithDialog))
      top.document.commandDispatcher.focusedWindow.focus();
  }
}

function SwitchInsertCharToThisWindow(windowWithDialog)
{
  if (windowWithDialog && "InsertCharWindow" in windowWithDialog &&
      windowWithDialog.InsertCharWindow)
  {
    // Move dialog association to the current window
    window.InsertCharWindow = windowWithDialog.InsertCharWindow;
    windowWithDialog.InsertCharWindow = null;

    // Switch the dialog's opener to current window's
    window.InsertCharWindow.opener = window;

    // Bring dialog to the forground
    window.InsertCharWindow.focus();
    return true;
  }
  return false;
}

function FindEditorWithInsertCharDialog()
{
  try {
    // Find window with an InsertCharsWindow and switch association to this one
    var windowManager = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService();
    var windowManagerInterface = windowManager.QueryInterface( Components.interfaces.nsIWindowMediator);
    var enumerator = windowManagerInterface.getEnumerator( null );

    while ( enumerator.hasMoreElements()  )
    {
      var tempWindow = enumerator.getNext();

      if (tempWindow != window && "InsertCharWindow" in tempWindow &&
          tempWindow.InsertCharWindow)
      {
        return tempWindow;
      }
    }
  }
  catch(e) {}
  return null;
}

function EditorFindOrCreateInsertCharWindow()
{
  if ("InsertCharWindow" in window && window.InsertCharWindow)
    window.InsertCharWindow.focus();
  else
  {
    // Since we switch the dialog during EditorOnFocus(),
    //   this should really never be found, but it's good to be sure
    var windowWithDialog = FindEditorWithInsertCharDialog();
    if (windowWithDialog)
    {
      SwitchInsertCharToThisWindow(windowWithDialog);
    }
    else
    {
      // The dialog will set window.InsertCharWindow to itself
      window.openDialog("chrome://editor/content/EdInsertChars.xul", "_blank", "chrome,close,titlebar", "");
    }
  }
}

// Find another HTML editor window to associate with the InsertChar dialog
//   or close it if none found  (May be a mail composer)
function SwitchInsertCharToAnotherEditorOrClose()
{
  if ("InsertCharWindow" in window && window.InsertCharWindow)
  {
    var windowManager = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService();
    var enumerator;
    try {
      var windowManagerInterface = windowManager.QueryInterface( Components.interfaces.nsIWindowMediator);
      enumerator = windowManagerInterface.getEnumerator( null );
    }
    catch(e) {}
    if (!enumerator) return;

    // TODO: Fix this to search for command controllers and look for "cmd_InsertChars"
    // For now, detect just Web Composer and HTML Mail Composer
    while ( enumerator.hasMoreElements()  )
    {
      var  tempWindow = enumerator.getNext();
      if (tempWindow != window && tempWindow != window.InsertCharWindow &&
          "GetCurrentEditor" in tempWindow && tmpWindow.GetCurrentEditor())
      {
        tempWindow.InsertCharWindow = window.InsertCharWindow;
        window.InsertCharWindow = null;
        tempWindow.InsertCharWindow.opener = tempWindow;
        return;
      }
    }
    // Didn't find another editor - close the dialog
    window.InsertCharWindow.close();
  }
}

function ResetStructToolbar()
{
  gLastFocusNode = null;
  UpdateStructToolbar();
}

function newCommandListener(element)
{
  return function() { return SelectFocusNodeAncestor(element); };
}

function newContextmenuListener(button, element)
{
  return function() { return InitStructBarContextMenu(button, element); };
}

function UpdatePITargetContents(t)
{
  if (!gLastFocusNode)
    return;
  var node = gLastFocusNode.firstChild.nextSibling;
  node.data = t.value;
  gLastFocusNode.title = node.target + " " + t.value;
}

function UpdateCommentOrPHPPIContents(t)
{
  if (!gLastFocusNode)
    return;
  var node = gLastFocusNode.firstChild.nextSibling;
  node.data = t.value;
  if (gLastFocusNode.nodeName == "php" || gLastFocusNode.nodeName == "pi")
    gLastFocusNode.title = node.target + " " + t.value;
  else
    gLastFocusNode.title = t.value;
}

function UpdateStructToolbar()
{
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

    button = document.createElementNS(XUL_NS, "toolbarbutton");
    button.setAttribute("label",   "<" + tag + ">");
    button.setAttribute("value",   tag);
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

function SelectFocusNodeAncestor(element)
{
  var editor = GetCurrentEditor();
  if (editor) {
    if (element == GetBodyElement())
      editor.selectAll();
    else
      editor.selectElement(element);
  }
  ResetStructToolbar();
}

function GetSelectionContainer()
{
  var editor = GetCurrentEditor();
  if (!editor) return null;

  try {
    var selection = editor.selection;
    if (!selection) return null;
  }
  catch (e) { return null; }

  var result = { oneElementSelected:false };

  if (selection.isCollapsed) {
    result.node = selection.focusNode;
  }
  else {
    var rangeCount = selection.rangeCount;
    if (rangeCount == 1) {
      result.node = editor.getSelectedElement("");
      var range = selection.getRangeAt(0);

      // check for a weird case : when we select a piece of text inside
      // a text node and apply an inline style to it, the selection starts
      // at the end of the text node preceding the style and ends after the
      // last char of the style. Assume the style element is selected for
      // user's pleasure
      if (!result.node &&
          range.startContainer.nodeType == Node.TEXT_NODE &&
          range.startOffset == range.startContainer.length &&
          range.endContainer.nodeType == Node.TEXT_NODE &&
          range.endOffset == range.endContainer.length &&
          range.endContainer.nextSibling == null &&
          range.startContainer.nextSibling == range.endContainer.parentNode)
        result.node = range.endContainer.parentNode;

      if (!result.node) {
        // let's rely on the common ancestor of the selection
        result.node = range.commonAncestorContainer;
      }
      else {
        result.oneElementSelected = true;
      }
    }
    else {
      // assume table cells !
      var i, container = null;
      for (i = 0; i < rangeCount; i++) {
        range = selection.getRangeAt(i);
        if (!container) {
          container = range.startContainer;
        }
        else if (container != range.startContainer) {
          // all table cells don't belong to same row so let's
          // select the parent of all rows
          result.node = container.parentNode;
          break;
        }
        result.node = container;
      }
    }
  }

  // make sure we have an element here
  while (result.node.nodeType != Node.ELEMENT_NODE)
    result.node = result.node.parentNode;

  // and make sure the element is not a special editor node like
  // the <br> we insert in blank lines
  // and don't select anonymous content !!! (fix for bug 190279)
  while (result.node.hasAttribute("_moz_editor_bogus_node") ||
         editor.isAnonymousElement(result.node))
    result.node = result.node.parentNode;

  return result;
}

function FillInHTMLTooltip(tooltip)
{
  const XLinkNS = "http://www.w3.org/1999/xlink";
  var tooltipText = null;
  var node;
  if (gEditorDisplayMode == kDisplayModePreview) {
    for (node = document.tooltipNode; node; node = node.parentNode) {
      if (node.nodeType == Node.ELEMENT_NODE) {
        tooltipText = node.getAttributeNS(XLinkNS, "title");
        if (tooltipText && /\S/.test(tooltipText)) {
          tooltip.setAttribute("label", tooltipText);
          return true;
        }
        tooltipText = node.getAttribute("title");
        if (tooltipText && /\S/.test(tooltipText)) {
          tooltip.setAttribute("label", tooltipText);
          return true;
        }
      }
    }
  } else {
    for (node = document.tooltipNode; node; node = node.parentNode) {
      if (node instanceof Components.interfaces.nsIDOMHTMLImageElement ||
          node instanceof Components.interfaces.nsIDOMHTMLInputElement) {
        if (node.parentNode && node.parentNode.namespaceURI == NVU_NS)
          tooltipText = node.parentNode.getAttribute("title");
        else
          tooltipText = node.getAttribute("src");
      }
      else if (node instanceof Components.interfaces.nsIDOMHTMLAnchorElement)
        tooltipText = node.getAttribute("href") || node.name;
      if (tooltipText) {
        tooltip.setAttribute("label", tooltipText);
        return true;
      }
    }
  }
  return false;
}

function UpdateTOC()
{
  window.openDialog("chrome://editor/content/EdInsertTOC.xul",
                    "_blank", "chrome,close,modal,titlebar");
  window.content.focus();
}

function InitTOCMenu()
{
  var elt = GetCurrentEditor().document.getElementById("mozToc");
  var createMenuitem = document.getElementById("insertTOCMenuitem");
  var updateMenuitem = document.getElementById("updateTOCMenuitem");
  var removeMenuitem = document.getElementById("removeTOCMenuitem");
  if (removeMenuitem && createMenuitem && updateMenuitem) {
    if (elt) {
      createMenuitem.setAttribute("disabled", "true");
      updateMenuitem.removeAttribute("disabled");
      removeMenuitem.removeAttribute("disabled");
    }
    else {
      createMenuitem.removeAttribute("disabled");
      removeMenuitem.setAttribute("disabled", "true");
      updateMenuitem.setAttribute("disabled", "true");
    }
  }
}

function RemoveTOC()
{
  var theDocument = GetCurrentEditor().document;
  var elt = theDocument.getElementById("mozToc");
  if (elt) {
    elt.parentNode.removeChild(elt);
  }

  function acceptNode(node)
  {
    if (node.nodeName.toLowerCase() == "a" &&
        node.hasAttribute("name") &&
        node.getAttribute("name").substr(0, 8) == "mozTocId") {
      return NodeFilter.FILTER_ACCEPT;
    }
    return NodeFilter.FILTER_SKIP;
  }

  var treeWalker = theDocument.createTreeWalker(theDocument.documentElement,
                                                NodeFilter.SHOW_ELEMENT,
                                                acceptNode,
                                                true);
  if (treeWalker) {
    var anchorNode = treeWalker.nextNode();
    while (anchorNode) {
      var tmp = treeWalker.nextNode();
      anchorNode.parentNode.removeChild(anchorNode);
      anchorNode = tmp;
    }
  }
}

function doOpenSiteManager()
{
  window.openDialog("chrome://editor/content/sitemanager.xul","_blank", 
                    "chrome,close,titlebar,modal,resizable=yes", "", "", null);
}

function FillToolbarList(e)
{
  // first clean up this menupopup
  var child = e.lastChild;
  while (child)
  {
    var tmp = child.previousSibling;
    e.removeChild(child);
    child = tmp;
  }

  var toolbarList = document.getElementsByTagName("toolbar");
  var count = toolbarList.length, i;
  var toolbarsArray = new Array();
  for (i=0; i<count; i++)
  {
    var toolbar = toolbarList[i];
    if (toolbar.getAttribute("customizable"))
    {
      var toolbarName = toolbar.getAttribute("toolbarname");
      // is that toolbar already listed in the menu ?
      if (!(toolbarName in toolbarsArray))
      {
        // no it's not, let's create a new menu item
        var item = document.createElementNS(XUL_NS, "menuitem");
        item.setAttribute("label", GetString(toolbarName + "Toolbar"));
        var toolbox = toolbar.parentNode;
        item.setAttribute("oncommand", "CustomizeToolbar(\"" + toolbox.id + "\")" );
        toolbarsArray[toolbarName] = true;

        e.appendChild(item);
      }
    }
  }
}

function loadExternalURLPref( urlPref )
{
  var url;
  dump("loadExternalURLPref: " + urlPref + "\n");
  try {
    var pref = Components.classes["@mozilla.org/preferences-service;1"]
                           .getService(Components.interfaces.nsIPrefBranch);
    url = pref.getComplexValue(urlPref, Components.interfaces.nsIPrefLocalizedString).data;
  }

  catch(e) {
    url = null;
  }

  loadExternalURL(url);
}

function loadExternalURL( url )
{
  if (url)
  {
    // <Kaze>
    gHelpers.OpenUrlWith(url, "browser");
    return;
    // </Kaze>
 
    var ioService = Components.classes["@mozilla.org/network/io-service;1"]
                              .getService(Components.interfaces.nsIIOService);
    var uri = ioService.newURI(url, null, null);
    var extProtocolSvc = Components.classes["@mozilla.org/uriloader/external-protocol-service;1"]
                                   .getService(Components.interfaces.nsIExternalProtocolService);

    // <Kaze> on Linux, extProtocolSvc won't work if the corresponding prefs aren't set
    /* TODO: open a dialog to define a default browser
    var scheme = GetScheme(url);
    if (!extProtocolSvc.externalProtocolHandlerExists(scheme)) { 
      // this scheme isn't handled yet: ask user to select a browser
      alert("No application is defined for " + scheme + "yet.\nSelect your preferred browser...");
      var pref = Components.classes["@mozilla.org/preferences-service;1"]
                           .getService(Components.interfaces.nsIPrefBranch).getBranch("network.protocol-handler.app.");
      try {
        // define a file picker for executable files
        // var nsIFilePicker = Components.interfaces.nsIFilePicker;
        var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
        //fp.init(window, hcGetBundle("ChooseBrowser"), nsIFilePicker.modeOpen);
        fp.init(window, "Select your preferred browser...", nsIFilePicker.modeOpen);
        fp.appendFilters(64); // executable files only
        // open file picker
        if (fp.show() == nsIFilePicker.returnOK) {
          // store the browser path in the user prefs
          pref.setCharPref("file" , fp.file.path);
          pref.setCharPref("http" , fp.file.path);
          pref.setCharPref("https", fp.file.path);
          pref.setCharPref("ftp"  , fp.file.path);
        }
      } catch(e) {}
    } */
    // </Kaze>

    extProtocolSvc.loadUrl(uri);
  }
}

function initClassMenu(menuPopup)
{
  cleanPopup(menuPopup);

  /* Kaze: get the current element's classes
  var mixedObj = new Object();
  var classes  = GetCurrentEditor().getClass(mixedObj);
  */
  var classes  = GetEditorClasses(GetSelectionContainer().node).classes;
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
      //menuEntry.setAttribute("class",   "menuitem-iconic");
      //menuEntry.setAttribute("style", '-moz-binding: url("chrome://global/content/bindings/menu.xml#menuitem-iconic") !important');
      menuPopup.appendChild(menuEntry);
    }
  }

  /* Kaze: use a BlueGriffons's JS resource to avoid patching the core
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
  */
  // Get all available classes (as defined in all included/linked stylesheets)
  var classListArray = CssUtils.getAllClassesForDocument(GetCurrentEditor().document);
  if (classListArray && classListArray.length) {
    var classListLength = classListArray.length;
    if (classesArrayLength)
    {
      var menuSep = document.createElementNS(XUL_NS, "menuseparator");
      menuPopup.appendChild(menuSep);
    }

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
  else
  {
    // no class defined in the document
    menuEntry = document.createElementNS(XUL_NS, "menuitem");
    menuEntry.setAttribute("type",    "checkbox");
    menuEntry.setAttribute("label",   GetString("NoClassAvailable"));
    menuPopup.appendChild(menuEntry);
  }
}

function onClassChange(classMenuList, commandID)
{
  var commandNode = document.getElementById(commandID);
  var state = commandNode.getAttribute("state");
  classMenuList.setAttribute("label", state);
}

function addMadeWithNvuButton()
{
  // <Kaze>
  //~ const kMadeWithNvuURL = "http://www.nvu.com";
  //~ const kMadeWithNvuImageURL = "http://www.nvu.com/images/madewithNvu80x15clear.png";
  //~ const kMadeWithNvuAlt = "Document made with Nvu";
  const kMadeWithNvuURL      = "http://kompozer.net/";
  const kMadeWithNvuImageURL = "http://kompozer.sourceforge.net/images/kompozer_80x15.png";
  const kMadeWithNvuAlt      = "Document made with KompoZer";
  // </Kaze>

  var editor = GetCurrentEditor();
  if (!editor)
    return;

  editor.beginTransaction();

  var linkElement = editor.createElementWithDefaults("a");
  linkElement.setAttribute("href", kMadeWithNvuURL);
  linkElement.setAttribute("title", kMadeWithNvuAlt); // Kaze
  var imgElement  = editor.createElementWithDefaults("img");
  imgElement.setAttribute("src", kMadeWithNvuImageURL);
  imgElement.setAttribute("alt", kMadeWithNvuAlt);
  imgElement.setAttribute("border", "0");
  linkElement.appendChild(imgElement);

  editor.insertElementAtSelection(linkElement, true);

  editor.endTransaction();
}

function InitWritingDirectionMenu()
{
  var mixedObj = { value: null };
  var state;
  try {
    state = GetCurrentEditor().getWritingDirection(mixedObj);
  }
  catch(e) {}
  var IDSuffix;

  if (!state || state == "none")
    IDSuffix = "noDir"
  else
    IDSuffix = state;

  var menuItem = document.getElementById("menu_"+IDSuffix);
  menuItem.setAttribute("checked", "true");
}


function goToggleRulers( id, elementID )
{
  var xulElt = document.getElementById( id );

  var element = document.getElementById( elementID );

  if ( xulElt )
  {
    var attribValue = xulElt.getAttribute("collapserulers") ;

    if ( attribValue == "true" )
    {
      xulElt.setAttribute("collapserulers", "false");
      if ( element )
        element.setAttribute("checked", "true")
    }
    else
    {
      xulElt.setAttribute("collapserulers", "true");
      if ( element )
        element.setAttribute("checked", "false")
    }
    document.persist(id, 'collapserulers');
    document.persist(elementID, 'checked');
  }
}

function UpdateRulerRequestListener(event)
{
  if (!event)
    return;
  if (gUpdateRulerTimeOutId)
  {
    clearTimeout(gUpdateRulerTimeOutId);
  }
  gUpdateRulerTimeOutId = setTimeout("_UpdateRulerRequestListener()", 500);
}

function _UpdateRulerRequestListener()
{
  clearTimeout(gUpdateRulerTimeOutId);
  gUpdateRulerTimeOutId = null;

  // Kaze: this looks like it's not enough, see editorRulers.js line 75
  if (document.getElementById("tabeditor").getAttribute("collapserulers") == "true" ||
      gEditorEditMode == kEditModeSource)
    return; // early way out if the rulers are hidden...

  var editor = GetCurrentEditor();
  if (!editor) return;

  var mixed = GetSelectionContainer();
  if (!mixed) return;
  var element = mixed.node;
  UpdateRulers(element);
}

function InsertColoredSourceView(editor, source)
{
  var sourceDoc = editor.document;
  // clean source view first
  var bodySourceDoc = sourceDoc.documentElement.firstChild.nextSibling;
  while (bodySourceDoc.lastChild)
    bodySourceDoc.removeChild(bodySourceDoc.lastChild);

  // the following is ugly but working VERY well
  var styleElt = sourceDoc.getElementById("moz_sourceview_css");
  if (!styleElt)
  {
    var heads = sourceDoc.getElementsByTagName("head");
    var headElement;
    if (!heads)
    {
      headElement = sourceDoc.createElement("head");
      bodySourceDoc.parentNode.insertBefore(headElement, bodySourceDoc);
    }
    else
      headElement = heads.item(0);
    var styleElt = sourceDoc.createElement("style");
    styleElt.setAttribute("id", "moz_sourceview_css");
    styleElt.setAttribute("type", "text/css");
    var sheet = sourceDoc.createTextNode('@import url("resource://gre/res/viewsource.css");ol {margin: 0;margin-left:2em}li{*padding-left: 1em; background-color: white}');
    styleElt.appendChild(sheet);
    headElement.appendChild(styleElt);
  }
  bodySourceDoc.innerHTML = source;
}

/* PINGER */

function StreamListener(channel, url)
{
    this.channel = channel;
    this.data = "";
    this.url = url;
}

StreamListener.prototype.onStartRequest =
function (request, context)
{
}

StreamListener.prototype.onStopRequest =
function (request, context, status)
{
    // close the channel
    this.channel.cancel(0x804b0002); // NS_BINDING_ABORTED
}

StreamListener.prototype.onDataAvailable =
function (request, context, inStr, sourceOffset, count)
{
    var sis = 
        Components.classes[SIS_CTRID].createInstance(cnsIScriptableInputStream);
    sis.init(inStr);
    this.data += sis.read(count);
}

function OpenExtensions(aOpenMode)
{
/*
 *  const EMTYPE = "Extension:Manager";
 *  
 *  var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
 *                     .getService(Components.interfaces.nsIWindowMediator);
 *  var needToOpen = true;
 *  var windowType = EMTYPE + "-" + aOpenMode;
 *  var windows = wm.getEnumerator(windowType);
 *  while (windows.hasMoreElements()) {
 *    var theEM = windows.getNext().QueryInterface(Components.interfaces.nsIDOMWindowInternal);
 *    if (theEM.document.documentElement.getAttribute("windowtype") == windowType) {
 *      theEM.focus();
 *      needToOpen = false;
 *      break;
 *    }
 *  }
 *
 *  if (needToOpen) {
 *    const EMURL = "chrome://mozapps/content/extensions/extensions.xul?type=" + aOpenMode;
 *    const EMFEATURES = "chrome,dialog=no,resizable";
 *    window.openDialog(EMURL, "", EMFEATURES);
 *  }
 */

  // Kaze: use Firefox 2 code base
  const EMTYPE = "Extension:Manager";
  var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                     .getService(Components.interfaces.nsIWindowMediator);
  var theEM = wm.getMostRecentWindow(EMTYPE);
  if (theEM) {
    theEM.focus();
    return;
  }
  const EMURL      = "chrome://mozapps/content/extensions/extensions.xul";
  const EMFEATURES = "chrome,menubar,extra-chrome,toolbar,dialog=no,resizable";
  window.openDialog(EMURL, "", EMFEATURES);
}

