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
 * The Original Code is mozilla.org code.
 *
 * The Initial Developer of the Original Code is 
 * Netscape Communications Corporation.
 * Portions created by the Initial Developer are Copyright (C) 1998-1999
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
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

#include "InsertElementTxn.h"
#include "nsISelection.h"
#include "nsIContent.h"
#include "nsIDOMNodeList.h"
#include "nsReadableUtils.h"
#include "nsIDOMElement.h"
#include "nsIDOMDocument.h"
#include "nsIDOMNamedNodeMap.h"
#include "nsIDOMAttr.h"
#include "nsReadableUtils.h"
#include "nsUnicharUtils.h"

#define NVU_NS NS_LITERAL_STRING("http://disruptive-innovations.com/zoo/nvu")

#ifdef NS_DEBUG
static PRBool gNoisy = PR_FALSE;
#endif


InsertElementTxn::InsertElementTxn()
  : EditTxn()
{
}

NS_IMETHODIMP InsertElementTxn::Init(nsIDOMNode *aNode,
                                     nsIDOMNode *aParent,
                                     PRInt32     aOffset,
                                     nsIEditor  *aEditor)
{
  NS_ASSERTION(aNode && aParent && aEditor, "bad arg");
  if (!aNode || !aParent || !aEditor)
    return NS_ERROR_NULL_POINTER;

  mNode = do_QueryInterface(aNode);
  mParent = do_QueryInterface(aParent);
  mOffset = aOffset;
  mEditor = aEditor;
  if (!mNode || !mParent || !mEditor)
    return NS_ERROR_INVALID_ARG;
  return NS_OK;
}


InsertElementTxn::~InsertElementTxn()
{
}

NS_IMETHODIMP InsertElementTxn::DoTransaction(void)
{
#ifdef NS_DEBUG
  if (gNoisy) 
  { 
    nsCOMPtr<nsIContent>nodeAsContent = do_QueryInterface(mNode);
    nsCOMPtr<nsIContent>parentAsContent = do_QueryInterface(mParent);
    nsString namestr;
    mNode->GetNodeName(namestr);
    char* nodename = ToNewCString(namestr);
    printf("%p Do Insert Element of %p <%s> into parent %p at offset %d\n", 
           this, nodeAsContent.get(), nodename,
           parentAsContent.get(), mOffset); 
    nsMemory::Free(nodename);
  }
#endif

  if (!mNode || !mParent) return NS_ERROR_NOT_INITIALIZED;

  nsCOMPtr<nsIDOMNodeList> childNodes;
  nsresult result = mParent->GetChildNodes(getter_AddRefs(childNodes));
  if (NS_FAILED(result)) return result;
  nsCOMPtr<nsIDOMNode>refNode;
  if (childNodes)
  {
    PRUint32 count;
    childNodes->GetLength(&count);
    if (mOffset>(PRInt32)count) mOffset = count;
    // -1 is sentinel value meaning "append at end"
    if (mOffset == -1) mOffset = count;
    result = childNodes->Item(mOffset, getter_AddRefs(refNode));
    if (NS_FAILED(result)) return result; 
    // note, it's ok for mRefNode to be null.  that means append
  }

  nsCOMPtr<nsIDOMElement> elt = do_QueryInterface(mNode);
  if (elt)
  {
    nsAutoString xmlns;
    result = elt->GetAttribute(NS_LITERAL_STRING("xmlns"), xmlns);
    if (NS_SUCCEEDED(result) && xmlns.Equals(NVU_NS))
    {
      nsCOMPtr<nsIDOMDocument> domDoc;
      result = elt->GetOwnerDocument(getter_AddRefs(domDoc));
      if (NS_SUCCEEDED(result) && domDoc)
      {
        nsAutoString tagName;
        mNode->GetNodeName(tagName);
        ToLowerCase(tagName);

        nsCOMPtr<nsIDOMElement> newElement;
        result = domDoc->CreateElementNS(NVU_NS, tagName, getter_AddRefs(newElement));
        nsCOMPtr<nsIDOMNode> newNode = do_QueryInterface(newElement);
        if (NS_FAILED(result))
          return result;
        // move all children
        nsCOMPtr<nsIDOMNode> child;
        result = mNode->GetFirstChild(getter_AddRefs(child));
        while (child)
        {
          nsCOMPtr<nsIDOMNode> tmp, junk;
          result = child->GetNextSibling(getter_AddRefs(tmp));
          newNode->AppendChild(child, getter_AddRefs(junk));
          child = tmp;
        }
        // and copy all attributes
        nsCOMPtr<nsIDOMNamedNodeMap> sourceAttributes;
        elt->GetAttributes(getter_AddRefs(sourceAttributes));
        nsCOMPtr<nsIDOMNamedNodeMap> destAttributes;
        newElement->GetAttributes(getter_AddRefs(destAttributes));
        if (!sourceAttributes || !destAttributes)
          return NS_ERROR_FAILURE;

        PRUint32 sourceCount;
        sourceAttributes->GetLength(&sourceCount);
        PRUint32 i, destCount;
        destAttributes->GetLength(&destCount);
        nsCOMPtr<nsIDOMNode> attrNode;

        for (i = 0; i < sourceCount; i++)
        {
          if( NS_SUCCEEDED(sourceAttributes->Item(i, getter_AddRefs(attrNode))) && attrNode)
          {
            nsCOMPtr<nsIDOMAttr> sourceAttribute = do_QueryInterface(attrNode);
            if (sourceAttribute)
            {
              nsAutoString sourceAttrName;
              if (NS_SUCCEEDED(sourceAttribute->GetName(sourceAttrName)))
              {
                nsAutoString sourceAttrValue;
                if (NS_SUCCEEDED(sourceAttribute->GetValue(sourceAttrValue)))
                {
                  newElement->SetAttribute(sourceAttrName, sourceAttrValue);
                } else {
                  // do we ever end here ?...
                }
              }        
            }
          }
        }

        mNode = newNode;
        newNode = nsnull;
      }
    }
  }

  mEditor->MarkNodeDirty(mNode);

  nsCOMPtr<nsIDOMNode> resultNode;
  result = mParent->InsertBefore(mNode, refNode, getter_AddRefs(resultNode));
  if (NS_FAILED(result)) return result;
  if (!resultNode) return NS_ERROR_NULL_POINTER;

  // only set selection to insertion point if editor gives permission
  PRBool bAdjustSelection;
  mEditor->ShouldTxnSetSelection(&bAdjustSelection);
  if (bAdjustSelection)
  {
    nsCOMPtr<nsISelection> selection;
    result = mEditor->GetSelection(getter_AddRefs(selection));
    if (NS_FAILED(result)) return result;
    if (!selection) return NS_ERROR_NULL_POINTER;
    // place the selection just after the inserted element
    selection->Collapse(mParent, mOffset+1);
  }
  else
  {
    // do nothing - dom range gravity will adjust selection
  }
  return result;
}

NS_IMETHODIMP InsertElementTxn::UndoTransaction(void)
{
#ifdef NS_DEBUG
  if (gNoisy) { printf("%p Undo Insert Element of %p into parent %p at offset %d\n", 
                       this, mNode.get(), mParent.get(), mOffset); }
#endif

  if (!mNode || !mParent) return NS_ERROR_NOT_INITIALIZED;

  nsCOMPtr<nsIDOMNode> resultNode;
  return mParent->RemoveChild(mNode, getter_AddRefs(resultNode));
}

NS_IMETHODIMP InsertElementTxn::Merge(nsITransaction *aTransaction, PRBool *aDidMerge)
{
  if (aDidMerge)
    *aDidMerge = PR_FALSE;
  return NS_OK;
}

NS_IMETHODIMP InsertElementTxn::GetTxnDescription(nsAString& aString)
{
  aString.Assign(NS_LITERAL_STRING("InsertElementTxn"));
  return NS_OK;
}
