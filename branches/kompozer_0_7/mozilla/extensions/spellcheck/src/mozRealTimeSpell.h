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
 * The Original Code is Real-time Spellchecking
 *
 * The Initial Developer of the Original Code is Mozdev Group, Inc.
 * Portions created by the Initial Developer are Copyright (C) 2004
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s): Neil Deakin (neil@mozdevgroup.com)
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

#ifndef __realtimespell_h__
#define __realtimespell_h__

#include "nsIEditorSpellCheck.h"
#include "nsIEditActionListener.h"
#include "mozIRealTimeSpell.h"
#include "nsITextServicesDocument.h"
#include "nsIDOMTreeWalker.h"
#include "nsWeakReference.h"
#include "nsIObserver.h"
#include "nsIEditor.h"

class mozRealTimeSpell : public mozIRealTimeSpell, nsIEditActionListener,
                                nsIObserver, nsSupportsWeakReference
{
 private:

  PRBool mPrefsListenerInit;

  nsIEditor *mEditor; // weak pointer to the editor (nsIEditor)
  nsCOMPtr<nsIEditorSpellCheck> mSpellCheck;
  nsCOMPtr<nsITextServicesDocument> mTextServicesDocument;
  nsCOMPtr<nsIDOMTreeWalker> mTreeWalker;
  nsCOMPtr<mozISpellI18NUtil> mConverter;

  // these should be defined somewhere so that they don't have to be copied
  enum OperationID
  {
    kOpIgnore = -1,
    kOpNone = 0,
    kOpUndo,
    kOpRedo,
    kOpInsertNode,
    kOpCreateNode,
    kOpDeleteNode,
    kOpSplitNode,
    kOpJoinNode,
    kOpDeleteSelection,

    kOpInsertBreak    = 1000,
    kOpInsertText     = 1001,
    kOpInsertIMEText  = 1002,
    kOpDeleteText     = 1003,

    kOpMakeList            = 3001,
    kOpIndent              = 3002,
    kOpOutdent             = 3003,
    kOpAlign               = 3004,
    kOpMakeBasicBlock      = 3005,
    kOpRemoveList          = 3006,
    kOpMakeDefListItem     = 3007,
    kOpInsertElement       = 3008,
    kOpInsertQuotation     = 3009,
    kOpSetTextProperty     = 3010,
    kOpRemoveTextProperty  = 3011,
    kOpHTMLPaste           = 3012,
    kOpLoadHTML            = 3013,
    kOpResetTextProperties = 3014,
    kOpSetAbsolutePosition = 3015,
    kOpRemoveAbsolutePosition = 3016,
    kOpDecreaseZIndex      = 3017,
    kOpIncreaseZIndex      = 3018
  };

 public:

  NS_DECL_ISUPPORTS
  NS_DECL_NSIOBSERVER
  NS_DECL_NSIEDITACTIONLISTENER
  NS_DECL_MOZIREALTIMESPELL

  mozRealTimeSpell();
  virtual ~mozRealTimeSpell();

  nsresult SpellCheckSelection(nsISelection *aSelection,
                               nsISelection *aSpellCheckSelection);
  nsresult SpellCheckBetweenNodes(nsIDOMNode *aStartNode,
                                  PRInt32 aStartOffset,
                                  nsIDOMNode *aEndNode,
                                  PRInt32 aEndOffset,
                                  PRBool expandLetter,
                                  nsISelection *aSpellCheckSelection);
  nsresult SpellCheckSelectionEndpoints(nsISelection *aSelection,
                                        nsISelection *aSpellCheckSelection);
  nsresult GetWordEndpoints(const nsAString &str,
                            PRInt32 length,
                            PRInt32 offset,
                            PRInt32 *begin,
                            PRInt32 *end);
  nsresult CheckShouldSpellCheck(nsIDOMNode *aNode, PRBool *checkSpelling);
  nsresult AdjustSpellHighlighting(nsIDOMNode *aNode,
                                   PRInt32 aOffset,
                                   nsISelection *aSpellCheckSelection,
                                   PRBool aCheckPreviousWord,
                                   PRBool isDeletion);
  nsresult AdjustSpellHighlightingForRange(nsIDOMRange *aRange,
                                           nsISelection *aSpellCheckSelection);
  nsresult AdvanceLetter(nsISelection *aSpellCheckSelection,
                         nsIDOMNode *aNode,
                         PRInt32 aOffset,
                         PRInt32 aDir,
                         PRBool skipSpacesOnly,
                         PRBool *urlCheck,
                         nsIDOMNode **aRetNode,
                         PRInt32 *aRetOffset);
  nsresult IsPointInSelection(nsISelection *aSelection,
                              nsIDOMNode *aNode,
                              PRInt32 aOffset,
                              nsIDOMRange **aRange);
  nsresult CleanupRangesInSelection(nsISelection *aSelection);

#ifdef DEBUG_ndeakin
  nsresult DumpSelection(nsISelection *aSelection);
#endif

};

#endif
