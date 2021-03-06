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
 *   Original author: Fabien Cazenave <kaze@kompozer.net>
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

function cssStartup() {
  // startup
  Startup();
  gDialog.bundle  = document.getElementById("cascadesBundle");
  gDialog.cssTBox = document.getElementById("cssTBox");

  // show the tag name and id/class attribute values
  var tag = gDialog.selectedObject.tagName.toUpperCase();
  if (gDialog.selectedObject.hasAttribute("id"))
    tag += ' id="' + gDialog.selectedObject.getAttribute("id") + '"';
  if (gDialog.selectedObject.hasAttribute("class"))
    tag += ' class="' + gDialog.selectedObject.getAttribute("class") + '"';
  document.getElementById("tagLabel").value = "<" + tag + ">";

  // show the current CSS
  InitGeneralTabPanel();
}

function InitGeneralTabPanel() {
  var style = gDialog.selectedObject.getAttribute("style");

  gDialog.selectedTab = GENERAL_TAB;
  if (style && style.length) {
    gDialog.cssTBox.value = PrettyPrintCSS(style);
  } else {
    gDialog.cssTBox.value = "";
  }

  // Enable 'ExtractInlineStyles' if "style" attribute not empty
  SetElementEnabledById("makeCSSRule", style);
}

function UpdateCSS() {
  gDialog.selectedObject.setAttribute("style", gDialog.cssTBox.value);
}

function ExtractInlineStyles() {
  window.ExtractStyles = false;

  window.openDialog("chrome://cascades/content/ExtractStyles.xul","_blank", 
    "chrome,close,modal,titlebar", gDialog.selectedObject);
  //~ window._content.focus();

  if (window.ExtractStyles)
  {
    // Remove current style properties
    //~ gDialog.selectedObject.removeAttribute("style");
    //~ gDialog.selectedObject.setAttribute("style", "");
    //~ InitGeneralTabPanel();
    window.opener.ResetStructToolbar(); // Kaze
    window.close();
  }
}
