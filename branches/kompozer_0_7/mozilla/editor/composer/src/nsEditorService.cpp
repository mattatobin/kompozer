/* -*- Mode: C++; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* ***** BEGIN LICENSE BLOCK *****
 * Version: NPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Netscape Public License
 * Version 1.1 (the "License"); you may not use this file except in
 * compliance with the License. You may obtain a copy of the License at
 * http://www.mozilla.org/NPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is mozilla.org code.
 *
 * The Initial Developer of the Original Code is 
 * Netscape Communications Corporation.
 * Portions created by the Initial Developer are Copyright (C) 1998
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 * Seth Spitzer <sspitzer@netscape.com>
 *
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the NPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the NPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

#include "nsEditorService.h"
#include "nsString.h"
#include "plstr.h"

#include "nsIPrefBranch.h"
#include "nsIPrefService.h"
#include "nsIServiceManager.h"

#include "nsCRT.h"

nsEditorService::nsEditorService()
{
  PRBool strictDTDPreferred = PR_FALSE;
  nsXPIDLCString doctype;
  doctype = "html";

  nsresult result;
  nsCOMPtr<nsIPrefBranch> prefBranch =
    do_GetService(NS_PREFSERVICE_CONTRACTID, &result);
  if (NS_SUCCEEDED(result) && prefBranch)
  {
    result = prefBranch->GetBoolPref("editor.default.strictness", &strictDTDPreferred);
    if (NS_FAILED(result))
      strictDTDPreferred = PR_FALSE;

    result = prefBranch->GetCharPref("editor.default.doctype",
                                      getter_Copies(doctype));
    if (NS_FAILED(result))
      doctype = "html";
  }

  nsString doctypeStr = NS_ConvertASCIItoUCS2(doctype);
  PRBool htmlPreferred = doctypeStr.Equals(NS_LITERAL_STRING("html"));
  if (strictDTDPreferred)
  {
    if (htmlPreferred)
      this->mInitialUrl = nsCRT::strdup("about:strictblank");
    else
      this->mInitialUrl = nsCRT::strdup("about:xstrictblank");
  }
  else
  {
    if (htmlPreferred)
      this->mInitialUrl = nsCRT::strdup("about:blank");
    else
      this->mInitialUrl = nsCRT::strdup("about:xblank");
  }
}

nsEditorService::~nsEditorService()
{
}

NS_IMPL_ISUPPORTS1(nsEditorService, nsICmdLineHandler) 

CMDLINEHANDLER_IMPL(nsEditorService,"-edit","general.startup.editor","chrome://editor/content/editor.xul","Start with editor.","@mozilla.org/commandlinehandler/general-startup;1?type=editor","Editor Startup Handler", PR_TRUE,this->mInitialUrl, PR_TRUE)
