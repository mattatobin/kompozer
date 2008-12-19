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

#include "nsCOMPtr.h"

#include "nsString.h"
#include "nsIServiceManager.h"
#include "nsIEnumerator.h"
#include "nsUnicharUtils.h"
#include "nsReadableUtils.h"

#include "mozISpellI18NManager.h"
#include "mozRealTimeSpell.h"

#include "nsIPlaintextEditor.h"
#include "nsIDOMDocument.h"
#include "nsIDOMDocumentRange.h"
#include "nsIDOMNode.h"
#include "nsIDOMElement.h"
#include "nsIDOMText.h"
#include "nsIDOMNodeList.h"
#include "nsISelection.h"
#include "nsISelectionController.h"
#include "nsITextServicesDocument.h"
#include "nsITextServicesFilter.h"
#include "nsIDOMRange.h"
#include "nsIDOMNSRange.h"
#include "nsIDOMCharacterData.h"
#include "nsIDOMDocumentTraversal.h"
#include "nsIDOMNodeFilter.h"
#include "nsIContent.h"
#include "nsIContentIterator.h"
#include "nsIPrefBranch.h"
#include "nsIPrefBranchInternal.h"
#include "nsIPrefService.h"
#include "nsCRT.h"
#include "cattable.h"

#define PREF_ENABLEREALTIMESPELL "spellchecker.enablerealtimespell"

NS_IMPL_ISUPPORTS4(mozRealTimeSpell, mozIRealTimeSpell, nsIEditActionListener,
                   nsISupportsWeakReference, nsIObserver)

mozRealTimeSpell::mozRealTimeSpell() : mPrefsListenerInit(PR_FALSE), mEditor(nsnull) 
{
}

mozRealTimeSpell::~mozRealTimeSpell()
{
}

NS_IMETHODIMP
mozRealTimeSpell::Observe(nsISupports *aSubject,
                         const char *aTopic,
                         const PRUnichar *aData)
{
  nsresult res = NS_OK;
  PRBool enable;

  nsCOMPtr<nsIPrefBranch> prefBranch = do_QueryInterface(aSubject);
  if (prefBranch){
    prefBranch->GetBoolPref(NS_LossyConvertUTF16toASCII(aData).get(), &enable);
    res = EnableRealTimeSpell(enable);
    if (NS_SUCCEEDED(res) && enable){
      nsCOMPtr<nsIDOMElement> rootElem;
      res = mEditor->GetRootElement(getter_AddRefs(rootElem));
      if (NS_FAILED(res)) return res;

      res = SpellCheckBetweenNodes(rootElem,0,rootElem,-1,PR_FALSE,nsnull);
    }
  }

  return res;
}


NS_IMETHODIMP
mozRealTimeSpell::GetSpellChecker(nsIEditorSpellCheck **aSpellCheck)
{
  *aSpellCheck = mSpellCheck;
  NS_IF_ADDREF(*aSpellCheck);
  return NS_OK;
}

NS_IMETHODIMP
mozRealTimeSpell::Init(nsIEditor *aEditor)
{
  mEditor = aEditor;
  return NS_OK;
}

nsresult
mozRealTimeSpell::Destroy()
{
  nsCOMPtr<nsIPrefBranchInternal> pbi;
  nsCOMPtr<nsIPrefService> prefService = do_GetService(NS_PREFSERVICE_CONTRACTID);
  if (prefService){
    nsCOMPtr<nsIPrefBranch> prefBranch;
    prefService->GetBranch(nsnull, getter_AddRefs(prefBranch));
    if (prefBranch){
      pbi = do_QueryInterface(prefBranch);
      if (pbi){
        PRUint32 flags;
        mEditor->GetFlags(&flags);
        pbi->RemoveObserver(PREF_ENABLEREALTIMESPELL, this);
        mPrefsListenerInit = PR_FALSE;
      }
    }
  }

  mEditor = nsnull;

  return NS_OK;
}

NS_IMETHODIMP
mozRealTimeSpell::EnableRealTimeSpell(PRBool enable)
{
  nsresult res = NS_OK;

  PRBool isPrefEnabled = PR_FALSE;

  nsCOMPtr<nsIPrefBranchInternal> pbi;
  nsCOMPtr<nsIPrefService> prefService = do_GetService(NS_PREFSERVICE_CONTRACTID);
  if (prefService){
    nsCOMPtr<nsIPrefBranch> prefBranch;
    prefService->GetBranch(nsnull, getter_AddRefs(prefBranch));
    if (prefBranch){
      pbi = do_QueryInterface(prefBranch);

      PRUint32 flags;
      mEditor->GetFlags(&flags);
      prefBranch->GetBoolPref(PREF_ENABLEREALTIMESPELL,&isPrefEnabled);
      if (!mPrefsListenerInit && pbi){
        res = pbi->AddObserver(PREF_ENABLEREALTIMESPELL, this, PR_TRUE);
      }
    }
  }

  mPrefsListenerInit = PR_TRUE;

  if (enable && isPrefEnabled){
    if (!mSpellCheck){
      nsCOMPtr<nsIEditorSpellCheck> spellchecker;

      spellchecker = do_CreateInstance("@mozilla.org/editor/editorspellchecker;1",&res);
      if (NS_SUCCEEDED(res) && spellchecker){
        // XXX there is a separate mail filter
        nsCOMPtr<nsITextServicesFilter> filter =
          do_CreateInstance("@mozilla.org/editor/txtsrvfilter;1",&res);
        spellchecker->SetFilter(filter);
        res = spellchecker->InitSpellChecker(mEditor,PR_FALSE);

        nsCOMPtr<nsITextServicesDocument> tsDoc =
          do_CreateInstance("@mozilla.org/textservices/textservicesdocument;1", &res);
        if (NS_FAILED(res)) return res;
        if (!tsDoc) return NS_ERROR_NULL_POINTER;

        res = tsDoc->SetFilter(filter);
        if (NS_FAILED(res)) return res;

        res = tsDoc->InitWithEditor(mEditor);
        if (NS_FAILED(res)) return res;

        mTextServicesDocument = tsDoc;
        mSpellCheck = spellchecker;

        mEditor->AddEditActionListener(this);
      }
    }
  }
  else {
    nsCOMPtr<nsISelectionController> selcon;
    nsresult res = mEditor->GetSelectionController(getter_AddRefs(selcon));
    if (NS_FAILED(res)) return res;

    nsCOMPtr<nsISelection> spellCheckSelection;
    res = selcon->GetSelection(nsISelectionController::SELECTION_SPELLCHECK,
                               getter_AddRefs(spellCheckSelection));
    if (NS_FAILED(res)) return res;

    spellCheckSelection->RemoveAllRanges();

    mEditor->RemoveEditActionListener(this);

    mSpellCheck = nsnull;
  }

  return res;
}

NS_IMETHODIMP
mozRealTimeSpell::SpellCheckAfterEditorChange(PRInt32 action,
                                              nsISelection *aSelection,
                                              nsIDOMNode *previousSelectedNode,
                                              PRInt32 previousSelectedOffset,
                                              nsIDOMNode *aStartNode,
                                              PRInt32 aStartOffset,
                                              nsIDOMNode *aEndNode,
                                              PRInt32 aEndOffset)
{
#ifdef DEBUG_ndeakin
  printf("ACTION: %d\n",action);
#endif

  if (!mSpellCheck) return NS_ERROR_NOT_INITIALIZED;

  nsCOMPtr<nsIDOMNode> anchorNode;
  nsresult res = aSelection->GetAnchorNode(getter_AddRefs(anchorNode));
  if (NS_FAILED(res)) return res;

  PRInt32 anchorOffset;
  res = aSelection->GetAnchorOffset(&anchorOffset);
  if (NS_FAILED(res)) return res;

  nsCOMPtr<nsISelectionController> selcon;
  res = mEditor->GetSelectionController(getter_AddRefs(selcon));
  if (NS_FAILED(res)) return res;

  nsCOMPtr<nsISelection> spellCheckSelection;
  res = selcon->GetSelection(nsISelectionController::SELECTION_SPELLCHECK,
                             getter_AddRefs(spellCheckSelection));
  if (NS_FAILED(res)) return res;

#ifdef DEBUG_ndeakin
  DumpSelection(spellCheckSelection);
#endif

  CleanupRangesInSelection(spellCheckSelection);

  switch (action)
  {
    case kOpInsertBreak:
    {
      res = AdjustSpellHighlighting(anchorNode,anchorOffset,spellCheckSelection,PR_TRUE,PR_FALSE);
      break;
    }

    case kOpMakeList:
    case kOpIndent:
    case kOpOutdent:
    case kOpAlign:
    case kOpRemoveList:
    case kOpMakeDefListItem:
      res = SpellCheckBetweenNodes(aStartNode,aStartOffset,aEndNode,aEndOffset,
                                   PR_FALSE,spellCheckSelection);
      break;

    case kOpInsertText:
    case kOpInsertIMEText:
    case kOpHTMLPaste:
    {
      PRInt32 offset = previousSelectedOffset;

      if (anchorNode == previousSelectedNode){
        if (anchorOffset < previousSelectedOffset - 1){
          res = SpellCheckBetweenNodes(anchorNode,anchorOffset - 1,
                                       previousSelectedNode,previousSelectedOffset,
                                       PR_TRUE,spellCheckSelection);
        }
        else if (anchorOffset > previousSelectedOffset + 1){
          res = SpellCheckBetweenNodes(previousSelectedNode,previousSelectedOffset,
                                       anchorNode,anchorOffset,
                                       PR_TRUE,spellCheckSelection);
        }
        else {
          if (offset == anchorOffset) offset--;
          res = AdjustSpellHighlighting(anchorNode,offset,spellCheckSelection,PR_FALSE,PR_FALSE);
        }
      }
      else {
        offset = ((anchorOffset > 0) ? (anchorOffset - 1) : anchorOffset);
        res = AdjustSpellHighlighting(anchorNode,offset,spellCheckSelection,PR_TRUE,PR_FALSE);
      }

      break;
    }

    case kOpDeleteSelection:
    {
      // this is what happens when the delete or backspace key is pressed
      PRInt32 offset = (anchorOffset > 0) ? (anchorOffset - 1) : anchorOffset;
      res = AdjustSpellHighlighting(anchorNode,offset,spellCheckSelection,PR_FALSE,PR_TRUE);

      // XXX now check the next character to see if a range should be removed
      break;
    }

    case kOpInsertQuotation:
      // spell check the text at the previous caret position, but no need to
      // check the quoted text itself.
      res = AdjustSpellHighlighting(previousSelectedNode,previousSelectedOffset - 1,
                             spellCheckSelection,PR_FALSE,PR_FALSE);
      break;

    case kOpRemoveTextProperty:
    case kOpResetTextProperties:
      res = SpellCheckSelection(aSelection,spellCheckSelection);
      break;

    case kOpMakeBasicBlock:
      // this doesn't adjust the selection, nor add or insert any text, so
      // no words need to be spell-checked
      res = SpellCheckBetweenNodes(aStartNode,aStartOffset,aEndNode,aEndOffset,
                                   PR_FALSE,spellCheckSelection);
      break;

    case kOpLoadHTML:
      // XXX this should cause a spellcheck of the entire document
      break;

    case kOpInsertElement:
      PRBool iscollapsed;
      aSelection->GetIsCollapsed(&iscollapsed);
      if (iscollapsed){
        res = AdjustSpellHighlighting(anchorNode,anchorOffset,spellCheckSelection,PR_TRUE,PR_FALSE);
      }
      else {
        res = SpellCheckSelection(aSelection,spellCheckSelection);
      }
      break;

    case kOpSetTextProperty:
      // style change only. Only check the endpoints
      res = SpellCheckSelectionEndpoints(aSelection,spellCheckSelection);
      break;

    case kOpUndo:
    case kOpRedo:
      // XXX handling these cases is quite hard -- this isn't quite right
      if (anchorNode == previousSelectedNode){
        res = SpellCheckBetweenNodes(anchorNode,PR_MIN(anchorOffset,previousSelectedOffset),
                                     anchorNode,PR_MAX(anchorOffset,previousSelectedOffset),
                                     PR_FALSE,spellCheckSelection);
      }
      else {
        nsCOMPtr<nsIDOMElement> rootElem;
        res = mEditor->GetRootElement(getter_AddRefs(rootElem));
        if (NS_FAILED(res)) return res;

        res = SpellCheckBetweenNodes(rootElem,0,rootElem,-1,PR_FALSE,spellCheckSelection);
      }
      break;
  }

#ifdef DEBUG_ndeakin
  DumpSelection(spellCheckSelection);
#endif

  return res;
}

NS_IMETHODIMP
mozRealTimeSpell::SpellCheckRange(nsIDOMRange *aRange)
{
  if (!mSpellCheck) return NS_ERROR_NOT_INITIALIZED;

  nsCOMPtr<nsISelectionController> selcon;
  nsresult res = mEditor->GetSelectionController(getter_AddRefs(selcon));
  if (NS_FAILED(res)) return res;

  nsCOMPtr<nsISelection> spellCheckSelection;
  res = selcon->GetSelection(nsISelectionController::SELECTION_SPELLCHECK,
                             getter_AddRefs(spellCheckSelection));
  if (NS_FAILED(res)) return res;

  CleanupRangesInSelection(spellCheckSelection);

  return AdjustSpellHighlightingForRange(aRange,spellCheckSelection);
}

NS_IMETHODIMP
mozRealTimeSpell::GetMispelledWord(nsIDOMNode *aNode, PRInt32 aOffset, nsIDOMRange **newword)
{
  nsCOMPtr<nsISelectionController> selcon;
  nsresult res = mEditor->GetSelectionController(getter_AddRefs(selcon));
  if (NS_FAILED(res)) return res;

  nsCOMPtr<nsISelection> spellCheckSelection;
  res = selcon->GetSelection(nsISelectionController::SELECTION_SPELLCHECK,
                             getter_AddRefs(spellCheckSelection));
  if (NS_FAILED(res)) return res;

  return IsPointInSelection(spellCheckSelection, aNode, aOffset, newword);
}

NS_IMETHODIMP
mozRealTimeSpell::ReplaceWord(nsIDOMNode *aNode, PRInt32 aOffset, const nsAString &newword)
{
  if (!aNode) return NS_ERROR_NULL_POINTER;
  if (newword.Length() == 0) return NS_ERROR_FAILURE;

  nsCOMPtr<nsIDOMRange> range;
  nsresult res = GetMispelledWord(aNode,aOffset,getter_AddRefs(range));
  if (NS_FAILED(res)) return res;

  if (range){
    range->DeleteContents();

    nsCOMPtr<nsISelection> selection;
    res = mEditor->GetSelection(getter_AddRefs(selection));
    if (NS_FAILED(res)) return res;

    nsCOMPtr<nsIDOMNode> container;
    res = range->GetStartContainer(getter_AddRefs(container));
    if (NS_FAILED(res)) return res;

    nsCOMPtr<nsIDOMCharacterData> chars = do_QueryInterface(container);
    if (chars){
      PRInt32 offset;
      res = range->GetStartOffset(&offset);
      if (NS_FAILED(res)) return res;

      chars->InsertData(offset,newword);

      selection->Collapse(container, offset + newword.Length());
    }
    else {
      nsCOMPtr<nsIDOMDocument> doc;
      res = mEditor->GetDocument(getter_AddRefs(doc));
      if (NS_FAILED(res)) return res;

      nsCOMPtr<nsIDOMText> newtext;
      res = doc->CreateTextNode(newword,getter_AddRefs(newtext));
      if (NS_FAILED(res)) return res;

      res = range->InsertNode(newtext);
      if (NS_FAILED(res)) return res;

      selection->Collapse(newtext, newword.Length());
    }
  }

  return NS_OK;
}

NS_IMETHODIMP
mozRealTimeSpell::AddWordToDictionary(const nsAString &word)
{
  if (!mSpellCheck) return NS_ERROR_NOT_INITIALIZED;

  nsAutoString wordstr(word);
  nsresult res = mSpellCheck->AddWordToDictionary(wordstr.get());
  if (NS_FAILED(res)) return res;

  nsCOMPtr<nsIDOMElement> rootElem;
  res = mEditor->GetRootElement(getter_AddRefs(rootElem));
  if (NS_FAILED(res)) return res;

  return SpellCheckBetweenNodes(rootElem,0,rootElem,-1,PR_FALSE,NULL);
}

NS_IMETHODIMP
mozRealTimeSpell::WillCreateNode(const nsAString & aTag, nsIDOMNode *aParent, PRInt32 aPosition)
{
  return NS_OK;
}

NS_IMETHODIMP
mozRealTimeSpell::DidCreateNode(const nsAString & aTag, nsIDOMNode *aNode, nsIDOMNode *aParent,
                                PRInt32 aPosition, nsresult aResult)
{
  return NS_OK;
}

NS_IMETHODIMP mozRealTimeSpell::WillInsertNode(nsIDOMNode *aNode, nsIDOMNode *aParent,
                                               PRInt32 aPosition)
{
  return NS_OK;
}

NS_IMETHODIMP mozRealTimeSpell::DidInsertNode(nsIDOMNode *aNode, nsIDOMNode *aParent,
                                              PRInt32 aPosition, nsresult aResult)
{
  PRBool checkSpelling;

  CheckShouldSpellCheck(aNode,&checkSpelling);

  if (checkSpelling){
    return SpellCheckBetweenNodes(aNode,0,aNode,-1,PR_FALSE,NULL);
  }

  return NS_OK;
}

NS_IMETHODIMP mozRealTimeSpell::WillDeleteNode(nsIDOMNode *aChild)
{
  return NS_OK;
}

NS_IMETHODIMP mozRealTimeSpell::DidDeleteNode(nsIDOMNode *aChild, nsresult aResult)
{
  return NS_OK;
}

NS_IMETHODIMP mozRealTimeSpell::WillSplitNode(nsIDOMNode *aExistingRightNode, PRInt32 aOffset)
{
  return NS_OK;
}

NS_IMETHODIMP mozRealTimeSpell::DidSplitNode(nsIDOMNode *aExistingRightNode, PRInt32 aOffset,
                                             nsIDOMNode *aNewLeftNode, nsresult aResult)
{
  return SpellCheckBetweenNodes(aNewLeftNode,0,aNewLeftNode,0,PR_FALSE,NULL);
}

NS_IMETHODIMP mozRealTimeSpell::WillJoinNodes(nsIDOMNode *aLeftNode, nsIDOMNode *aRightNode,
                                              nsIDOMNode *aParent)
{
  return NS_OK;
}

NS_IMETHODIMP mozRealTimeSpell::DidJoinNodes(nsIDOMNode *aLeftNode, nsIDOMNode *aRightNode,
                                             nsIDOMNode *aParent, nsresult aResult)
{
  return SpellCheckBetweenNodes(aRightNode,0,aRightNode,0,PR_FALSE,NULL);
}

NS_IMETHODIMP mozRealTimeSpell::WillInsertText(nsIDOMCharacterData *aTextNode, PRInt32 aOffset,
                                               const nsAString & aString)
{
  return NS_OK;
}

NS_IMETHODIMP mozRealTimeSpell::DidInsertText(nsIDOMCharacterData *aTextNode, PRInt32 aOffset,
                                              const nsAString & aString, nsresult aResult)
{
  return NS_OK;
}

NS_IMETHODIMP mozRealTimeSpell::WillDeleteText(nsIDOMCharacterData *aTextNode, PRInt32 aOffset,
                                               PRInt32 aLength)
{
  return NS_OK;
}

NS_IMETHODIMP mozRealTimeSpell::DidDeleteText(nsIDOMCharacterData *aTextNode, PRInt32 aOffset,
                                              PRInt32 aLength, nsresult aResult)
{
  return NS_OK;
}

NS_IMETHODIMP mozRealTimeSpell::WillDeleteSelection(nsISelection *aSelection)
{
  return NS_OK;
}

NS_IMETHODIMP mozRealTimeSpell::DidDeleteSelection(nsISelection *aSelection)
{
  return NS_OK;
}

nsresult
mozRealTimeSpell::SpellCheckSelection(nsISelection *aSelection,
                                      nsISelection *aSpellCheckSelection)
{
  if (!mSpellCheck) return NS_ERROR_NOT_INITIALIZED;

  PRInt32 count;
  aSelection->GetRangeCount(&count);

  PRInt32 t;
  for (t=0; t<count; t++){
    nsCOMPtr<nsIDOMRange> checkrange;
    aSelection->GetRangeAt(t,getter_AddRefs(checkrange));

    if (checkrange){
      nsCOMPtr<nsIDOMNode> startNode;
      nsCOMPtr<nsIDOMNode> endNode;
      PRInt32 startOffset, endOffset;

      checkrange->GetStartContainer(getter_AddRefs(startNode));
      checkrange->GetEndContainer(getter_AddRefs(endNode));
      checkrange->GetStartOffset(&startOffset);
      checkrange->GetEndOffset(&endOffset);

      return SpellCheckBetweenNodes(startNode,startOffset,endNode,endOffset,
                                    PR_TRUE,aSpellCheckSelection);
    }
  }

  return NS_OK;
}

nsresult
mozRealTimeSpell::SpellCheckBetweenNodes(nsIDOMNode *aStartNode,
                                         PRInt32 aStartOffset,
                                         nsIDOMNode *aEndNode,
                                         PRInt32 aEndOffset,
                                         PRBool expandLetter,
                                         nsISelection *aSpellCheckSelection)
{
  nsCOMPtr<nsISelection> spellCheckSelection = aSpellCheckSelection;

  if (!spellCheckSelection){
    nsCOMPtr<nsISelectionController> selcon;
    nsresult res = mEditor->GetSelectionController(getter_AddRefs(selcon));
    if (NS_FAILED(res)) return res;

    res = selcon->GetSelection(nsISelectionController::SELECTION_SPELLCHECK,
                               getter_AddRefs(spellCheckSelection));
    if (NS_FAILED(res)) return res;
  }

  nsCOMPtr<nsIDOMDocument> doc;
  nsresult res = mEditor->GetDocument(getter_AddRefs(doc));
  if (NS_FAILED(res)) return res;

  nsCOMPtr<nsIDOMDocumentRange> docrange = do_QueryInterface(doc);
  if (!docrange) return NS_ERROR_FAILURE;

  nsCOMPtr<nsIDOMRange> range;
  res = docrange->CreateRange(getter_AddRefs(range));
  if (NS_FAILED(res)) return res;

  if (expandLetter){
    PRInt32 newStartOffset, newEndOffset;
    nsCOMPtr<nsIDOMNode> newStartNode;
    nsCOMPtr<nsIDOMNode> newEndNode;

    PRBool urlCheck = PR_TRUE;
    res = AdvanceLetter(aSpellCheckSelection,aStartNode,aStartOffset,-1,PR_FALSE,&urlCheck,
                        getter_AddRefs(newStartNode),&newStartOffset);
    if (NS_FAILED(res)) return res;

    res = AdvanceLetter(aSpellCheckSelection,aEndNode,aEndOffset,1,PR_FALSE,&urlCheck,
                        getter_AddRefs(newEndNode),&newEndOffset);
    if (NS_FAILED(res)) return res;

    if (!newEndOffset) newEndOffset = 1;

    range->SetStart(newStartNode,newStartOffset);

    if (newStartNode) range->SetEnd(newStartNode,newStartOffset);
    else range->SetEnd(aStartNode,aStartOffset);

    if (newEndNode) range->SetEnd(newEndNode,newEndOffset);
    else range->SetEnd(aEndNode,aEndOffset);
  }
  else {
    if (aEndOffset == -1){
      nsCOMPtr<nsIDOMNodeList> childNodes;
      res = aEndNode->GetChildNodes(getter_AddRefs(childNodes));
      if (NS_FAILED(res)) return res;

      PRUint32 childCount;
      res = childNodes->GetLength(&childCount);
      if (NS_FAILED(res)) return res;

      aEndOffset = childCount;
    }

    range->SetStart(aStartNode,aStartOffset);

    if (aEndOffset) range->SetEnd(aEndNode,aEndOffset);
    else range->SetEndAfter(aEndNode);
  }

  return AdjustSpellHighlightingForRange(range,spellCheckSelection);
}

nsresult
mozRealTimeSpell::SpellCheckSelectionEndpoints(nsISelection *aSelection,
                                               nsISelection *aSpellCheckSelection)
{
  nsresult res = NS_OK;

  PRInt32 count;
  aSelection->GetRangeCount(&count);
  if (count > 0){
    nsCOMPtr<nsIDOMRange> checkrange;
    aSelection->GetRangeAt(0,getter_AddRefs(checkrange));

    if (checkrange){
      PRInt32 start, end;
      checkrange->GetStartOffset(&start);
      checkrange->GetEndOffset(&end);

      nsCOMPtr<nsIDOMNode> startnode;
      res = checkrange->GetStartContainer(getter_AddRefs(startnode));
      if (NS_FAILED(res)) return res;

      nsCOMPtr<nsIDOMNode> endnode;
      res = checkrange->GetEndContainer(getter_AddRefs(endnode));
      if (NS_FAILED(res)) return res;

      if (startnode)
        AdjustSpellHighlighting(startnode,start,aSpellCheckSelection,PR_FALSE,PR_FALSE);
      if (endnode)
        AdjustSpellHighlighting(endnode,end,aSpellCheckSelection,PR_FALSE,PR_FALSE);
    }
  }

  return res;
}

static inline PRBool IsNonwordChar(PRUnichar chr)
{
  // a non-word character is one that can end a word, such as whitespace or
  // most punctuation.
  // XXX fix this
  return ((chr != '\'') && (GetCat(chr) != 5));
}

nsresult
mozRealTimeSpell::CheckShouldSpellCheck(nsIDOMNode *aNode, PRBool *checkSpelling)
{
  *checkSpelling = PR_TRUE;

  PRUint32 flags;
  mEditor->GetFlags(&flags);
  if (flags & nsIPlaintextEditor::eEditorMailMask)
  {
    nsCOMPtr<nsIDOMNode> parent;
    aNode->GetParentNode(getter_AddRefs(parent));

    while (parent)
    {
      nsCOMPtr<nsIDOMElement> parentelement = do_QueryInterface(parent);
      if (!parentelement) break;

      nsAutoString parenttagname;
      parentelement->GetTagName(parenttagname);

      if (parenttagname.Equals(NS_LITERAL_STRING("blockquote"),
          nsCaseInsensitiveStringComparator())){
        *checkSpelling = PR_FALSE;
        break;
      }
      else if (parenttagname.Equals(NS_LITERAL_STRING("pre"),
               nsCaseInsensitiveStringComparator())){
        nsAutoString classname;
        parentelement->GetAttribute(NS_LITERAL_STRING("class"),classname);
        if (classname.Equals(NS_LITERAL_STRING("moz-signature"))){
          *checkSpelling = PR_FALSE;
        }
      }

      nsCOMPtr<nsIDOMNode> nextparent;
      parent->GetParentNode(getter_AddRefs(nextparent));
      parent = nextparent;
    }
  }

  return NS_OK;
}

nsresult
mozRealTimeSpell::AdjustSpellHighlighting(nsIDOMNode *aNode,
                                          PRInt32 aOffset,
                                          nsISelection *aSpellCheckSelection,
                                          PRBool aCheckPreviousWord,
                                          PRBool isDeletion)
{
  if (!aNode) return NS_OK;

  do {
    PRUint16 nodeType;
    nsresult res = aNode->GetNodeType(&nodeType);
    if (NS_FAILED(res)) return res;

    if (nodeType == nsIDOMNode::TEXT_NODE) break;

    nsCOMPtr<nsIDOMNodeList> childNodes;
    res = aNode->GetChildNodes(getter_AddRefs(childNodes));
    if (NS_FAILED(res)) return res;

    nsCOMPtr<nsIDOMNode> child;
    res = childNodes->Item(aOffset,getter_AddRefs(child));
    if (NS_FAILED(res) || !child) return res;

    aNode = child;
    aOffset = 0;
  } while (1);

  PRBool urlCheck = PR_TRUE;
  PRInt32 useOffset;
  nsCOMPtr<nsIDOMNode> useNode;
  nsresult res = AdvanceLetter(aSpellCheckSelection,aNode,aOffset,1,PR_TRUE,&urlCheck,
                               getter_AddRefs(useNode),&useOffset);
  if (NS_FAILED(res) || !useNode || !urlCheck) return res;

  if ((aNode != useNode) || (useOffset > aOffset)){
    aCheckPreviousWord = PR_TRUE;
  }

  nsCOMPtr<nsIDOMDocument> doc;
  res = mEditor->GetDocument(getter_AddRefs(doc));
  if (NS_FAILED(res)) return res;

  nsCOMPtr<nsIDOMDocumentRange> docrange = do_QueryInterface(doc);
  if (!docrange) return NS_ERROR_FAILURE;

  nsCOMPtr<nsIDOMNode> startNode;
  nsCOMPtr<nsIDOMNode> endNode;
  nsCOMPtr<nsIDOMRange> range;

  PRInt32 startOffset, endOffset;
  PRBool isMispelled = PR_FALSE;

  do {
    PRBool checkSpelling;
    CheckShouldSpellCheck(useNode,&checkSpelling);
    if (!checkSpelling) return PR_FALSE;

    res = docrange->CreateRange(getter_AddRefs(range));
    if (NS_FAILED(res)) return res;

    range->SetStart(useNode,useOffset);
    range->SetEnd(useNode,useOffset);

    res = mTextServicesDocument->ExpandRangeToWordBoundaries(range);
    if (NS_FAILED(res)) return res;

    range->GetStartContainer(getter_AddRefs(startNode));
    range->GetEndContainer(getter_AddRefs(endNode));
    range->GetStartOffset(&startOffset);
    range->GetEndOffset(&endOffset);

    nsAutoString word;
    range->ToString(word);

    if (word.IsEmpty()) return NS_OK;
    res = mSpellCheck->CheckCurrentWordNoSuggest(word.get(),&isMispelled);
    if (NS_FAILED(res)) return res;

#ifdef DEBUG_ndeakin
    nsAutoString text;
    if (useNode){
      res = useNode->GetNodeValue(text);
      if (NS_FAILED(res)) return res;
    }

    printf("Text: '%s' ",NS_ConvertUCS2toUTF8(text).get());
    printf("%d %d %d %d %d - %s node\n",word.Length(),aOffset,useOffset,startOffset,endOffset,
                                    (startNode == endNode) ? "Same" : "Different");
    printf(isMispelled ? "Mispelled " : "Correct ");
    mEditor->DumpContentTree();
#endif

    nsCOMPtr<nsIDOMRange> currentrange;
    IsPointInSelection(aSpellCheckSelection, useNode, useOffset,
                       getter_AddRefs(currentrange));
    if (!currentrange){
      IsPointInSelection(aSpellCheckSelection, endNode, endOffset - 1,
                         getter_AddRefs(currentrange));
    }

    if (currentrange){
      // remove the old range first
      aSpellCheckSelection->RemoveRange(currentrange);
    }
    if (isMispelled){
      aSpellCheckSelection->AddRange(range);
      range = nsnull;
    }
    else if (isDeletion){
      // when deleting, the word after the deletion needs to be checked to
      // ensure that its highlighting is removed as well.
      nsCOMPtr<nsIDOMRange> starttodel;
      IsPointInSelection(aSpellCheckSelection, startNode, startOffset,
                         getter_AddRefs(starttodel));
      if (starttodel) aSpellCheckSelection->RemoveRange(starttodel);

      nsCOMPtr<nsIDOMRange> endtodel;
      IsPointInSelection(aSpellCheckSelection, endNode, endOffset - 1,
                         getter_AddRefs(endtodel));
      if (endtodel) aSpellCheckSelection->RemoveRange(endtodel);
    }

    if (aCheckPreviousWord){
      nsCOMPtr<nsIDOMNode> nextNode;
      res = AdvanceLetter(aSpellCheckSelection,aNode,aOffset,-1,PR_FALSE,&urlCheck,
                          getter_AddRefs(nextNode),&useOffset);
      if (NS_FAILED(res) || !nextNode || !urlCheck) return res;

      useNode = nextNode;
      aCheckPreviousWord = PR_FALSE;
    }
    else break;
  } while (1);

  return NS_OK;
}

nsresult
mozRealTimeSpell::AdjustSpellHighlightingForRange(nsIDOMRange *aRange,
                                                  nsISelection *aSpellCheckSelection)
{
  nsCOMPtr<nsIDOMRange> selectionRange;
  nsresult res = aRange->CloneRange(getter_AddRefs(selectionRange));
  if (NS_FAILED(res)) return res;

  PRBool iscollapsed;
  res = aRange->GetCollapsed(&iscollapsed);
  if (NS_FAILED(res)) return res;

  res = mTextServicesDocument->ExpandRangeToWordBoundaries(selectionRange);
  if (NS_FAILED(res)) return res;

  res = mTextServicesDocument->SetExtent(selectionRange);
  if (NS_FAILED(res)) return res;

  PRBool done, isMispelled;
  PRInt32 begin, end, startOffset, endOffset;
  PRUint32 selOffset = 0;
  nsCOMPtr<nsIDOMNode> startNode;
  nsCOMPtr<nsIDOMNode> endNode;

  if (!mConverter){
    nsCOMPtr<mozISpellI18NManager> manager(
      do_GetService("@mozilla.org/spellchecker/i18nmanager;1", &res));
    if (manager && NS_SUCCEEDED(res)){
      nsXPIDLString language;
      res = manager->GetUtil(language.get(),getter_AddRefs(mConverter));
    }
  }

  while (NS_SUCCEEDED(mTextServicesDocument->IsDone(&done)) && !done)
  {
    nsAutoString textblock;
    res = mTextServicesDocument->GetCurrentTextBlock(&textblock);
    if (NS_FAILED(res)) return res;

#ifdef DEBUG_ndeakin
    printf("Text: '%s' ",NS_ConvertUCS2toUTF8(textblock).get());
#endif

    do {
      const PRUnichar *textchrs = textblock.get();
      PRInt32 textlength = textblock.Length();

      res = mConverter->FindNextWord(textchrs,textlength,selOffset,&begin,&end);
      if (NS_SUCCEEDED(res) && (begin != -1)){
        const nsAString &word = Substring(textblock, begin, end - begin);
        res = mSpellCheck->CheckCurrentWordNoSuggest(PromiseFlatString(word).get(),&isMispelled);

#ifdef DEBUG_ndeakin
        printf(isMispelled ? "Mispelled " : "Correct ");
        printf("Word: '%s'\n",NS_ConvertUCS2toUTF8(word).get());
#endif

        nsCOMPtr<nsIDOMRange> wordrange;
        res = mTextServicesDocument->GetDOMRangeFor(begin, end - begin, getter_AddRefs(wordrange));

        wordrange->GetStartContainer(getter_AddRefs(startNode));
        wordrange->GetEndContainer(getter_AddRefs(endNode));
        wordrange->GetStartOffset(&startOffset);
        wordrange->GetEndOffset(&endOffset);

        // check if the text is in a URL. If so, return without advancing the cursor. This code
        // only handles HTTP URLs.
        PRInt32 linkOffset = begin;
        while ((linkOffset > 0) && (!nsCRT::IsAsciiSpace(textchrs[linkOffset]))) linkOffset--;
        if (linkOffset && (linkOffset < begin)) linkOffset++;

        if ((linkOffset <= begin) && ((linkOffset + 5) <= textlength) &&
            StringBeginsWith(Substring(textblock,linkOffset,5),NS_LITERAL_STRING("http:"))){
          nsCOMPtr<nsIDOMRange> selrange;
          IsPointInSelection(aSpellCheckSelection, startNode, linkOffset, getter_AddRefs(selrange));
          if (selrange) aSpellCheckSelection->RemoveRange(selrange);

          selOffset = end;
          continue;
        }

        PRBool checkSpelling;
        CheckShouldSpellCheck(startNode,&checkSpelling);
        if (!checkSpelling) break;

        nsCOMPtr<nsIDOMRange> currentrange;
        IsPointInSelection(aSpellCheckSelection, startNode, startOffset,
                           getter_AddRefs(currentrange));
        if (!currentrange){
          IsPointInSelection(aSpellCheckSelection, endNode, endOffset - 1,
                             getter_AddRefs(currentrange));
        }

        if (currentrange){
          // remove the old range first
          aSpellCheckSelection->RemoveRange(currentrange);
        }
        if (isMispelled){
          aSpellCheckSelection->AddRange(wordrange);
        }
      }
      selOffset = end;
    } while(end != -1);

    mTextServicesDocument->NextBlock();
    selOffset = 0;
  }

  return NS_OK;
}

nsresult
mozRealTimeSpell::AdvanceLetter(nsISelection *aSpellCheckSelection,
                                nsIDOMNode *aNode,
                                PRInt32 aOffset,
                                PRInt32 aDir,
                                PRBool skipSpacesOnly,
                                PRBool *urlCheck,
                                nsIDOMNode **aRetNode,
                                PRInt32 *aRetOffset)
{
  PRInt32 textlength = 0;
  const PRUnichar *textchrs = nsnull;
  nsAutoString text;

  PRUint16 nodeType;
  nsresult res = aNode->GetNodeType(&nodeType);
  if (NS_FAILED(res)) return res;

  if (nodeType == nsIDOMNode::TEXT_NODE){
    res = aNode->GetNodeValue(text);
    if (NS_FAILED(res)) return res;

    textchrs = text.get();
    textlength = text.Length();
    if (aOffset == -1) aOffset = textlength - 1;

    // check if the text is in a URL. If so, return without advancing the cursor. This code
    // only handles HTTP URLs.
    if (*urlCheck){
      PRInt32 linkOffset = aOffset;
      while ((linkOffset > 0) && (!nsCRT::IsAsciiSpace(textchrs[linkOffset]))) linkOffset--;
      if (linkOffset && (linkOffset < aOffset)) linkOffset++;
      if ((linkOffset <= aOffset) && ((linkOffset + 5) <= textlength) &&
          StringBeginsWith(Substring(text,linkOffset,5),NS_LITERAL_STRING("http:"))){

        PRInt32 linkEndOffset = linkOffset;
        while ((linkEndOffset < textlength) &&
               (!nsCRT::IsAsciiSpace(textchrs[linkEndOffset]))) linkEndOffset++;

        PRInt32 t, count;
        aSpellCheckSelection->GetRangeCount(&count);

        for (t=0; t<count; t++){
          nsCOMPtr<nsIDOMRange> checkrange;
          aSpellCheckSelection->GetRangeAt(t,getter_AddRefs(checkrange));
          nsCOMPtr<nsIDOMNSRange> nscheckrange = do_QueryInterface(checkrange);

          PRInt16 cpoint;
          nscheckrange->ComparePoint(aNode,linkOffset,&cpoint);
          if (cpoint != 1){
            nscheckrange->ComparePoint(aNode,linkEndOffset,&cpoint);
            if (cpoint != -1){
              aSpellCheckSelection->RemoveRange(checkrange);
              t--;
              count--;
            }
          }
        }

        *aRetNode = aNode;
        NS_ADDREF(*aRetNode);
        *aRetOffset = linkOffset;
        *urlCheck = PR_FALSE;
        return NS_OK;
      }
    }

    if (skipSpacesOnly){
      while (IsNonwordChar(textchrs[aOffset])){
        if (aDir > 0 && (++aOffset >= textlength)) break;
        if (aDir < 0 && (--aOffset <= 0)) break;
      }
    }
    else if (aDir > 0){
      while ((++aOffset < textlength) && IsNonwordChar(textchrs[aOffset]));
    }
    else {
      while ((aOffset-- > 0) && IsNonwordChar(textchrs[aOffset]));
    }
  }

  if (!textchrs || (aDir > 0 && (aOffset >= textlength)) || (aDir < 0 && (aOffset < 0))){
    if (!mTreeWalker){
      nsCOMPtr<nsIDOMDocument> doc;
      res = mEditor->GetDocument(getter_AddRefs(doc));
      if (NS_FAILED(res)) return res;

      nsCOMPtr<nsIDOMDocumentTraversal> doctraversal = do_QueryInterface(doc);
      if (!doctraversal) return NS_ERROR_FAILURE;

      nsCOMPtr<nsIDOMElement> rootelement;
      res = mEditor->GetRootElement(getter_AddRefs(rootelement));
      if (NS_FAILED(res)) return res;

      nsCOMPtr<nsIDOMNode> rootnode = do_QueryInterface(rootelement);
      res = doctraversal->CreateTreeWalker(rootnode,nsIDOMNodeFilter::SHOW_TEXT,nsnull,
                                         PR_FALSE,getter_AddRefs(mTreeWalker));
      if (NS_FAILED(res)) return res;
    }

    mTreeWalker->SetCurrentNode(aNode);
    if (aDir > 0){
      *aRetOffset = 0;
      return mTreeWalker->NextNode(aRetNode);
    }
    else {
      res = mTreeWalker->PreviousNode(aRetNode);
      if (NS_FAILED(res)) return res;

      nsCOMPtr<nsIDOMCharacterData> cdata = do_QueryInterface(*aRetNode);
      if (!cdata) return NS_ERROR_FAILURE;

      PRUint32 length;
      res = cdata->GetLength(&length);

      nsCOMPtr<nsIDOMNode> prevnode = *aRetNode;
      return AdvanceLetter(aSpellCheckSelection,prevnode,length - 1,aDir,skipSpacesOnly,urlCheck,
                           aRetNode,aRetOffset);
    }
  }

  *aRetNode = aNode;
  NS_ADDREF(*aRetNode);
  *aRetOffset = aOffset;
  return NS_OK;
}

nsresult
mozRealTimeSpell::IsPointInSelection(nsISelection *aSelection,
                                     nsIDOMNode *aNode,
                                     PRInt32 aOffset,
                                     nsIDOMRange **aRange)
{
  *aRange = NULL;

  PRInt32 count;
  aSelection->GetRangeCount(&count);

  PRInt32 t;
  for (t=0; t<count; t++){
    nsCOMPtr<nsIDOMRange> checkrange;
    aSelection->GetRangeAt(t,getter_AddRefs(checkrange));
    nsCOMPtr<nsIDOMNSRange> nscheckrange = do_QueryInterface(checkrange);

    PRInt32 start, end;
    checkrange->GetStartOffset(&start);
    checkrange->GetEndOffset(&end);

    PRBool isinrange;
    nscheckrange->IsPointInRange(aNode,aOffset,&isinrange);
    if (isinrange){
      *aRange = checkrange;
      NS_ADDREF(*aRange);
      break;
    }
  }

  return NS_OK;
}

nsresult
mozRealTimeSpell::CleanupRangesInSelection(nsISelection *aSelection)
{
  // integrity check - remove ranges that have collapsed to nothing. This
  // can happen if the node containing a highlighted word was removed.

  PRInt32 t, count;
  aSelection->GetRangeCount(&count);

  for (t = 0; t < count; t++){
    nsCOMPtr<nsIDOMRange> checkrange;
    aSelection->GetRangeAt(t,getter_AddRefs(checkrange));

    if (checkrange){
      PRBool collapsed;
      checkrange->GetCollapsed(&collapsed);
      if (collapsed){
        aSelection->RemoveRange(checkrange);
        t--;
        count--;
      }
    }
  }

  return NS_OK;
}

#ifdef DEBUG_ndeakin

nsresult
mozRealTimeSpell::DumpSelection(nsISelection *aSelection)
{
  PRInt32 count;
  aSelection->GetRangeCount(&count);

  printf("SPELL SELECTION:");

  PRInt32 t, start, end;
  for (t=0; t<count; t++){
    nsCOMPtr<nsIDOMRange> checkrange;
    aSelection->GetRangeAt(t,getter_AddRefs(checkrange));
    checkrange->GetStartOffset(&start);
    checkrange->GetEndOffset(&end);
    printf("[%d %d]",start,end);
  }
  printf("\n");

  return NS_OK;
}

#endif
