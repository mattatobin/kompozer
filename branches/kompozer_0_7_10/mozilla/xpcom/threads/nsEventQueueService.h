/* -*- Mode: C++; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
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
 * The Original Code is Mozilla Communicator client code.
 *
 * The Initial Developer of the Original Code is 
 * Netscape Communications Corporation.
 * Portions created by the Initial Developer are Copyright (C) 1998
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
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

#ifndef nsEventQueueService_h__
#define nsEventQueueService_h__

#include "nsIEventQueueService.h"
#include "nsInterfaceHashtable.h"
#include "nsHashKeys.h"
#include "nsIEventQueue.h"

////////////////////////////////////////////////////////////////////////////////

class nsEventQueueServiceImpl : public nsIEventQueueService
{
public:
  nsEventQueueServiceImpl();

  nsresult Init();

  // nsISupports interface...
  NS_DECL_ISUPPORTS

  // nsIEventQueueService interface...
  NS_DECL_NSIEVENTQUEUESERVICE

private:
  ~nsEventQueueServiceImpl();

             /* Create a queue for the given thread if one does not exist.
                Addref the descriptor in any case. parameter aNative is
                ignored if the queue already exists. */
  NS_IMETHOD CreateEventQueue(PRThread *aThread, PRBool aNative);
  NS_IMETHOD MakeNewQueue(PRThread* thread, PRBool aNative, nsIEventQueue **aQueue);
  inline nsresult GetYoungestEventQueue(nsIEventQueue *queue, nsIEventQueue **aResult);

  nsInterfaceHashtable<nsVoidPtrHashKey, nsIEventQueue> mEventQTable;
  PRMonitor *mEventQMonitor;
};

////////////////////////////////////////////////////////////////////////////////

#endif // nsEventQueueService_h__
