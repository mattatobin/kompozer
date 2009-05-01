/* -*- Mode: C++; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4 -*- */
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
 * The Original Code is Mozilla Communicator client code.
 *
 * The Initial Developer of the Original Code is
 * Netscape Communications Corporation.
 * Portions created by the Initial Developer are Copyright (C) 2004
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Neil Deakin (enndeakin@sympatico.ca)
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

#ifndef nsWhereTestNode_h__
#define nsWhereTestNode_h__

#include "nscore.h"
#include "nsFixedSizeAllocator.h"
#include "nsRDFTestNode.h"
#include "nsIRDFDataSource.h"
#include "nsIRDFResource.h"
#include "nsVoidArray.h"

class nsConflictSet;

class nsWhereTestNode : public nsRDFTestNode
{
public:
    /**
     * Both source and target unbound (?source ^rel ?target)
     */
    nsWhereTestNode(InnerNode* aParent,
                    nsIRDFDataSource* aDataSource,
                    PRInt32 aSourceVariable,
                    nsAString& aRelation,
                    PRInt32 aTargetVariable,
                    PRBool aIgnoreCase,
                    PRBool aNegate);

    /**
     * Source bound, target unbound (source ^rel ?target)
     */
    nsWhereTestNode(InnerNode* aParent,
                    nsIRDFDataSource* aDataSource,
                    nsIRDFNode* aSource,
                    nsAString& aRelation,
                    PRInt32 aTargetVariable,
                    PRBool aIgnoreCase,
                    PRBool aNegate);

    /**
     * Source unbound, target bound to a list of values (?source ^rel targets)
     */
    nsWhereTestNode(InnerNode* aParent,
                    nsIRDFDataSource* aDataSource,
                    PRInt32 aSourceVariable,
                    nsAString& aRelation,
                    nsAString& aTargets,
                    PRBool aIgnoreCase,
                    PRBool aNegate,
                    PRBool aIsMultiple);

    nsresult SetRelation(nsAString& aRelation);

    nsresult CheckMatch(nsIRDFNode* left, nsAString &rightstr, PRBool* match) const;

    virtual nsresult FilterInstantiations(InstantiationSet& aInstantiations, void* aClosure) const;

    virtual nsresult GetAncestorVariables(VariableSet& aVariables) const;

    virtual PRBool
    CanPropagate(nsIRDFResource* aSource,
                 nsIRDFResource* aProperty,
                 nsIRDFNode* aTarget,
                 Instantiation& aInitialBindings) const;

    virtual void
    Retract(nsIRDFResource* aSource,
            nsIRDFResource* aProperty,
            nsIRDFNode* aTarget,
            nsTemplateMatchSet& aFirings,
            nsTemplateMatchSet& aRetractions) const;

protected:

    enum RelationType {
      RELATION_UNKNOWN,
      RELATION_EQUALS,
      RELATION_LESS,
      RELATION_GREATER,
      RELATION_STARTSWITH,
      RELATION_ENDSWITH,
      RELATION_CONTAINS
    };

    nsCOMPtr<nsIRDFDataSource> mDataSource;
    PRInt32                    mSourceVariable;
    nsCOMPtr<nsIRDFNode>       mSource;
    RelationType               mRelation;
    PRInt32                    mTargetVariable;
    nsStringArray              mTargetList;
    PRBool                     mIgnoreCase;
    PRBool                     mNegate;
};

#endif // nsWhereTestNode_h__
