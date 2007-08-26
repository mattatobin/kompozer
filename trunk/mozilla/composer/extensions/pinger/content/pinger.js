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
 * The Original Code is Nvu.
 *
 * The Initial Developer of the Original Code is
 * Linspire Inc.
 * Portions created by the Initial Developer are Copyright (C) 2004
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Daniel Glazman (glazman@disruptive-innovations.com), Original author
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

const IOSERVICE_CTRID           = "@mozilla.org/network/io-service;1";
const cnsIIOService             = Components.interfaces.nsIIOService;

var gPrefs;
var url = "http://www.disruptive-innovations.com/zoo/pings/nvu_ping.php?v=";

function StartUp()
{
  gPrefs = window.GetPrefs();
  var pinged = " ";
  try {
    pinged = gPrefs.getCharPref("pinger.pinged");
  }
  catch(e) { pinged = " "; }

  var appVersion = gPrefs.getCharPref("general.useragent.vendorSub");

  if (pinged.indexOf(" "+appVersion+" ") != -1)
  {
    window.close();
    return;
  }

  url += appVersion;
  gPrefs.setCharPref("pinger.pinged", pinged + appVersion + " ");

  SetWindowLocation();
}


function onAccept()
{
  loadURLAsync(url);

  SaveWindowLocation();
  return true;
}

function _getChannelForURL (url)
{
    var serv = Components.classes[IOSERVICE_CTRID].getService(cnsIIOService);
    if (!serv)
        return null;
    
    return serv.newChannel(url, null, null);

}

function loadURLAsync(url)
{
  var chan = _getChannelForURL(url);
  chan.loadFlags |= Components.interfaces.nsIRequest.LOAD_BYPASS_CACHE;
  chan = chan.QueryInterface(Components.interfaces.nsIHttpChannel);
  chan.requestMethod = "GET";

  return chan.asyncOpen(new window.opener.StreamListener(chan, url), null);
}