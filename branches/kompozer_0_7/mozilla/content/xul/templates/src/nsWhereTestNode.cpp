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

#include "nsWhereTestNode.h"
#include "nsConflictSet.h"
#include "nsString.h"
#include "nsUnicharUtils.h"
#include "nsReadableUtils.h"
#include "nsXULContentUtils.h"
#include "nsIRDFLiteral.h"

#include "prlog.h"
#ifdef PR_LOGGING
extern PRLogModuleInfo* gXULTemplateLog;
#endif

nsWhereTestNode::nsWhereTestNode(InnerNode* aParent,
                                 nsIRDFDataSource* aDataSource,
                                 PRInt32 aSourceVariable,
                                 nsAString& aRelation,
                                 PRInt32 aTargetVariable,
                                 PRBool aIgnoreCase,
                                 PRBool aNegate)
    : nsRDFTestNode(aParent),
      mDataSource(aDataSource),
      mSourceVariable(aSourceVariable),
      mSource(nsnull),
      mTargetVariable(aTargetVariable),
      mIgnoreCase(aIgnoreCase),
      mNegate(aNegate)
{
    SetRelation(aRelation);

#ifdef PR_LOGGING
    if (PR_LOG_TEST(gXULTemplateLog, PR_LOG_DEBUG)) {

        PR_LOG(gXULTemplateLog, PR_LOG_DEBUG,
               ("nsWhereTestNode[%p]: parent=%p source=%d relation=%s target=%d",
                this, aParent, aSourceVariable, NS_ConvertUCS2toUTF8(aRelation).get(),
                aTargetVariable));
    }
#endif
}


nsWhereTestNode::nsWhereTestNode(InnerNode* aParent,
                                 nsIRDFDataSource* aDataSource,
                                 nsIRDFNode* aSource,
                                 nsAString& aRelation,
                                 PRInt32 aTargetVariable,
                                 PRBool aIgnoreCase,
                                 PRBool aNegate)
    : nsRDFTestNode(aParent),
      mDataSource(aDataSource),
      mSourceVariable(0),
      mSource(aSource),
      mTargetVariable(aTargetVariable),
      mIgnoreCase(aIgnoreCase),
      mNegate(aNegate)
{
    SetRelation(aRelation);

#ifdef PR_LOGGING
    if (PR_LOG_TEST(gXULTemplateLog, PR_LOG_DEBUG)) {
        nsAutoString source;
        nsXULContentUtils::GetTextForNode(aSource, source);

        PR_LOG(gXULTemplateLog, PR_LOG_DEBUG,
               ("nsWhereTestNode[%p]: parent=%p source=%s relation=%s target=%d",
                this, NS_ConvertUCS2toUTF8(source).get(),
                NS_ConvertUCS2toUTF8(aRelation).get(), aTargetVariable));
    }
#endif
}


nsWhereTestNode::nsWhereTestNode(InnerNode* aParent,
                                 nsIRDFDataSource* aDataSource,
                                 PRInt32 aSourceVariable,
                                 nsAString& aRelation,
                                 nsAString& aTargets,
                                 PRBool aIgnoreCase,
                                 PRBool aNegate,
                                 PRBool aIsMultiple)
    : nsRDFTestNode(aParent),
      mDataSource(aDataSource),
      mSourceVariable(aSourceVariable),
      mSource(nsnull),
      mTargetVariable(0),
      mIgnoreCase(aIgnoreCase),
      mNegate(aNegate)
{
    SetRelation(aRelation);

    if (aIsMultiple) {
        PRInt32 start = 0, end = 0;
        while ((end = aTargets.FindChar(',',start)) >= 0) {
            if (end > start) {
                nsAutoString str(Substring(aTargets,start,end - start));
                mTargetList.AppendString(str);
            }
            start = end + 1;
        }
        if (start < (PRInt32)aTargets.Length()) {
            nsAutoString str(Substring(aTargets,start));
            mTargetList.AppendString(str);
        }
    }
    else {
        mTargetList.AppendString(aTargets);
    }

#ifdef PR_LOGGING
    if (PR_LOG_TEST(gXULTemplateLog, PR_LOG_DEBUG)) {
        PR_LOG(gXULTemplateLog, PR_LOG_DEBUG,
               ("nsWhereTestNode[%p]: parent=%p source=%s relation=%s targets=%d",
                this, aSourceVariable, NS_ConvertUCS2toUTF8(aRelation).get(),
                NS_ConvertUCS2toUTF8(aTargets).get()));
    }
#endif
}

nsresult
nsWhereTestNode::SetRelation(nsAString& aRelation)
{
    if (aRelation.Equals(NS_LITERAL_STRING("equals")) || aRelation.IsEmpty())
        mRelation = RELATION_EQUALS;
    else if (aRelation.Equals(NS_LITERAL_STRING("less")))
        mRelation = RELATION_LESS;
    else if (aRelation.Equals(NS_LITERAL_STRING("greater")))
        mRelation = RELATION_GREATER;
    else if (aRelation.Equals(NS_LITERAL_STRING("startswith")))
        mRelation = RELATION_STARTSWITH;
    else if (aRelation.Equals(NS_LITERAL_STRING("endswith")))
        mRelation = RELATION_ENDSWITH;
    else if (aRelation.Equals(NS_LITERAL_STRING("contains")))
        mRelation = RELATION_CONTAINS;
    else
        mRelation = RELATION_UNKNOWN;

    return NS_OK;
}

nsresult
nsWhereTestNode::CheckMatch(nsIRDFNode* left, nsAString &rightstr, PRBool* match) const
{
    PRBool found = PR_FALSE;

    *match = PR_FALSE;

    // do integer check for integer literals
    if ((mRelation == RELATION_EQUALS) ||
        (mRelation == RELATION_LESS) ||
        (mRelation == RELATION_GREATER)) {

      nsCOMPtr<nsIRDFInt> leftInteger = do_QueryInterface(left);
      if (leftInteger) {
        nsresult rv;
        PRInt32 leftValue;
        rv = leftInteger->GetValue(&leftValue);
        if (NS_FAILED(rv)) return rv;

        PRInt32 rightValue, err;
        rightValue = nsAutoString(rightstr).ToInteger(&err);
        if (NS_FAILED(err)) return NS_OK; // never match if the right side isn't an integer

        if (mRelation == RELATION_EQUALS) {
          found = PR_TRUE;
          if (leftValue == rightValue)
            *match = PR_TRUE;
        }
        else if (mRelation == RELATION_LESS) {
          found = PR_TRUE;
          if (leftValue < rightValue)
            *match = PR_TRUE;
        }
        else if (mRelation == RELATION_GREATER) {
          found = PR_TRUE;
          if (leftValue > rightValue)
            *match = PR_TRUE;
        }
      }
    }

    // if the subject is not an integer literal or not an equals, less, or greater
    // comparison, do a string comparison

    if (!found){
      nsAutoString leftstr;

      nsXULContentUtils::GetTextForNode(left,leftstr);

      switch (mRelation) {
          case RELATION_EQUALS:
              if (mIgnoreCase)
                  *match = leftstr.Equals(rightstr,nsCaseInsensitiveStringComparator());
              else
                  *match = leftstr.Equals(rightstr);
              break;

          case RELATION_LESS:
              if (mIgnoreCase)
                  *match = (Compare(leftstr,rightstr,nsCaseInsensitiveStringComparator()) < 0);
              else
                  *match = (leftstr < rightstr);
              break;

          case RELATION_GREATER:
              if (mIgnoreCase)
                  *match = (Compare(leftstr,rightstr,nsCaseInsensitiveStringComparator()) > 0);
              else
                  *match = (leftstr > rightstr);
              break;

          case RELATION_STARTSWITH:
              if (mIgnoreCase)
                  *match = (StringBeginsWith(leftstr,rightstr,nsCaseInsensitiveStringComparator()));
              else
                  *match = (StringBeginsWith(leftstr,rightstr));
              break;

          case RELATION_ENDSWITH:
              if (mIgnoreCase)
                  *match = (StringEndsWith(leftstr,rightstr,nsCaseInsensitiveStringComparator()));
              else
                  *match = (StringEndsWith(leftstr,rightstr));
              break;

          case RELATION_CONTAINS:
          {
              nsAString::const_iterator start, end;
              leftstr.BeginReading(start);
              leftstr.EndReading(end);
              if (mIgnoreCase)
                  *match = CaseInsensitiveFindInReadable(rightstr,start,end);
              else
                  *match = FindInReadable(rightstr,start,end);
              break;
          }

          default:
              break;
      }
    }

    if (mNegate) *match = !*match;

    return NS_OK;
}

/*
 * Iterate over the instantiations (current results), and evaluate the where
 * clause for each one. For those where the condition matches, let them
 * continue to the next condition. Remove those where the condition does not
 * match.
 */
nsresult
nsWhereTestNode::FilterInstantiations(InstantiationSet& aInstantiations, void* aClosure) const
{
    // Iterate over the available results

    InstantiationSet::Iterator last = aInstantiations.Last();
    for (InstantiationSet::Iterator inst = aInstantiations.First(); inst != last; ++inst) {
        PRBool hasSourceBinding;
        Value sourceValue;

        if (mSource) {
            // an RDF resource or literal was specified as the source
            hasSourceBinding = PR_TRUE;
            sourceValue = mSource;
        }
        else {
            // translate the source variable ?var into an RDF node
            hasSourceBinding = inst->mAssignments.GetAssignmentFor(mSourceVariable, &sourceValue);
        }

        PRBool hasRDFValue = PR_FALSE;
        PRBool hasTargetBinding;
        Value targetValue;

        if (mTargetList.Count() > 0) {
            // a literal was specified as the target
            hasTargetBinding = PR_TRUE;
        }
        else {
            // translate the target variable ?var into an RDF node
            hasTargetBinding = inst->mAssignments.GetAssignmentFor(mTargetVariable, &targetValue);
            hasRDFValue = PR_TRUE;
        }

#ifdef PR_LOGGING
        if (PR_LOG_TEST(gXULTemplateLog, PR_LOG_DEBUG)) {
            const char* source = "(unbound)";
            if (hasSourceBinding)
                VALUE_TO_IRDFRESOURCE(sourceValue)->GetValueConst(&source);

            nsAutoString target(NS_LITERAL_STRING("(value)"));
            if (hasTargetBinding && hasRDFValue)
                nsXULContentUtils::GetTextForNode(VALUE_TO_IRDFNODE(targetValue), target);

            PR_LOG(gXULTemplateLog, PR_LOG_DEBUG,
                   ("nsWhereTestNode[%p]: FilterInstantiations() source=[%s] target=[%s]",
                    this, source, NS_ConvertUCS2toUTF8(target).get()));
        }
#endif

        // there is a value for both the source and target
        if (hasSourceBinding && hasTargetBinding) {
            nsresult rv;
            PRBool match;

            if (hasRDFValue) {
                // translate the target from an RDF node into a string
                nsAutoString rdfvalue;
                nsXULContentUtils::GetTextForNode(VALUE_TO_IRDFNODE(targetValue),rdfvalue);

                rv = CheckMatch(VALUE_TO_IRDFNODE(sourceValue),rdfvalue,&match);
                if (NS_FAILED(rv)) return rv;
            }
            else {
                // iterate over the strings in the target and determine
                // whether there is a match.
                PRInt32 length = mTargetList.Count();
                for (PRInt32 t = 0; t < length; t++) {
                    rv = CheckMatch(VALUE_TO_IRDFNODE(sourceValue),*mTargetList[t],&match);
                    if (NS_FAILED(rv)) return rv;

                    // stop once a match is found. In negate mode, stop once a
                    // target does not match.
                    if (match != mNegate) break;
                }
            }

#ifdef PR_LOGGING
            PR_LOG(gXULTemplateLog, PR_LOG_DEBUG,
                   ("    consistency check => %s", match ? "passed" : "failed"));
#endif

            if (!match) {
                // it's inconsistent. remove it.
                aInstantiations.Erase(inst--);
            }
        }
        else {
            // This will occur if a variable used either in the source or
            // target has no value. The where condition cannot be used to do
            // queries, only to filter out mismatches.
            NS_ERROR("can't do queries on where clauses.");
            return NS_ERROR_UNEXPECTED;
        }
    }

    return NS_OK;
}

nsresult
nsWhereTestNode::GetAncestorVariables(VariableSet& aVariables) const
{
    nsresult rv;

    if (mSourceVariable) {
        rv = aVariables.Add(mSourceVariable);
        if (NS_FAILED(rv)) return rv;
    }

    if (mTargetVariable) {
        rv = aVariables.Add(mTargetVariable);
        if (NS_FAILED(rv)) return rv;
    }

    return TestNode::GetAncestorVariables(aVariables);
}

PRBool
nsWhereTestNode::CanPropagate(nsIRDFResource* aSource,
                                    nsIRDFResource* aProperty,
                                    nsIRDFNode* aTarget,
                                    Instantiation& aInitialBindings) const
{
    return PR_FALSE;
}

void
nsWhereTestNode::Retract(nsIRDFResource* aSource,
                         nsIRDFResource* aProperty,
                         nsIRDFNode* aTarget,
                         nsTemplateMatchSet& aFirings,
                         nsTemplateMatchSet& aRetractions) const
{
}
