/* -*- Mode: C++; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
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
 * The Original Code is mozilla.org code.
 *
 * The Initial Developer of the Original Code is
 * Aaron Leventhal (aaronleventhal@moonset.net)
 * Portions created by the Initial Developer are Copyright (C) 2005
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either of the GNU General Public License Version 2 or later (the "GPL"),
 * or the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
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

#include "nsPLDOMEvent.h"
#include "nsEventQueueUtils.h"
#include "nsIDOMEvent.h"
#include "nsIPrivateDOMEvent.h"
#include "nsIDOMDocument.h"
#include "nsIDOMDocumentEvent.h"
#include "nsIDOMEventTarget.h"

void nsPLDOMEvent::HandleEvent()
{
  if (!mEventNode) {
    return;
  }
  
  nsCOMPtr<nsIDOMDocument> domDoc;
  mEventNode->GetOwnerDocument(getter_AddRefs(domDoc));
  nsCOMPtr<nsIDOMDocumentEvent> domEventDoc = do_QueryInterface(domDoc);
  if (domEventDoc) {
    nsCOMPtr<nsIDOMEvent> domEvent;
    domEventDoc->CreateEvent(NS_LITERAL_STRING("Events"),
                        getter_AddRefs(domEvent));

    nsCOMPtr<nsIPrivateDOMEvent> privateEvent(do_QueryInterface(domEvent));
    if (privateEvent && NS_SUCCEEDED(domEvent->InitEvent(mEventType, PR_TRUE, PR_TRUE))) {
      privateEvent->SetTrusted(PR_TRUE);

      nsCOMPtr<nsIDOMEventTarget> target = do_QueryInterface(mEventNode);
      PRBool defaultActionEnabled; // This is not used because the caller is async
      target->DispatchEvent(domEvent, &defaultActionEnabled);
    }
  }
}

nsresult nsPLDOMEvent::PostDOMEvent()
{
  nsCOMPtr<nsIEventQueue> eventQueue;
  nsresult rv = NS_GetCurrentEventQ(getter_AddRefs(eventQueue));
  if (NS_SUCCEEDED(rv)) {
    PL_InitEvent(this, nsnull, (PLHandleEventProc) ::HandlePLDOMEvent, (PLDestroyEventProc) ::DestroyPLDOMEvent);
    rv = eventQueue->PostEvent(this);
  }

  return rv;
}

static void PR_CALLBACK HandlePLDOMEvent(nsPLDOMEvent* aEvent)
{
  aEvent->HandleEvent();
}

static void PR_CALLBACK DestroyPLDOMEvent(nsPLDOMEvent* aEvent)
{
  delete aEvent;
}
