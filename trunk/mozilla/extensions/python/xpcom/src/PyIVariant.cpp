/*
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with the
 * License. You may obtain a copy of the License at http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License for
 * the specific language governing rights and limitations under the License.
 *
 * The Original Code is the Python XPCOM language bindings.
 *
 * The Initial Developer of the Original Code is Mark Hammond
 * Portions created by Mark Hammond are Copyright (C) 2000, 2001
 * Mark Hammond.  All Rights Reserved.
 *
 * Contributor(s): Mark Hammond <mhammond@skippinet.com.au> (original author)
 *
 */

// This code is part of the XPCOM extensions for Python.
//
// Written April 2002

#include "PyXPCOM_std.h"
#include "nsIVariant.h"

// Prevents us needing to use an nsIScriptableInputStream
// (and even that can't read binary data!!!)

static nsIVariant *GetI(PyObject *self) {
	nsIID iid = NS_GET_IID(nsIVariant);

	if (!Py_nsISupports::Check(self, iid)) {
		PyErr_SetString(PyExc_TypeError, "This object is not the correct interface");
		return NULL;
	}
	return (nsIVariant *)Py_nsISupports::GetI(self);
}

static PyObject *MyBool( PRBool v) {
	PyObject *ret = v ? Py_True : Py_False;
	Py_INCREF(ret);
	return ret;
}
static PyObject *MyChar( char c) {
	return PyString_FromStringAndSize(&c, 1);
}
static PyObject *MyUChar( PRUnichar c) {
	return PyUnicodeUCS2_FromUnicode(&c, 1);
}
static PyObject *MyUnicode( PRUnichar *p) {
	return PyUnicodeUCS2_FromUnicode(p, nsCRT::strlen(p));
}
static PyObject *MyISupports( nsISupports *p) {
	return Py_nsISupports::PyObjectFromInterface(p, NS_GET_IID(nsISupports), PR_FALSE);
}

#define GET_SIMPLE(Type, FuncGet, FuncConvert) \
static PyObject *FuncGet(PyObject *self, PyObject *args) { \
	nsIVariant *pI = GetI(self); \
	if (pI==NULL) return NULL; \
	if (!PyArg_ParseTuple(args, ":" #FuncGet)) return NULL; \
	Type t; \
	nsresult nr = pI->FuncGet(&t); \
	if (NS_FAILED(nr)) return PyXPCOM_BuildPyException(nr); \
	return FuncConvert(t); \
}

#define GET_ALLOCATED(Type, FuncGet, FuncConvert, FuncFree) \
static PyObject *FuncGet(PyObject *self, PyObject *args) { \
	nsIVariant *pI = GetI(self); \
	if (pI==NULL) return NULL; \
	if (!PyArg_ParseTuple(args, ":" #FuncGet)) return NULL; \
	Type t; \
	nsresult nr = pI->FuncGet(&t); \
	if (NS_FAILED(nr)) return PyXPCOM_BuildPyException(nr); \
	PyObject *ret = FuncConvert(t); \
	FuncFree(t); \
	return ret; \
}

#define GET_ALLOCATED_SIZE(Type, FuncGet, FuncConvert, FuncFree) \
static PyObject *FuncGet(PyObject *self, PyObject *args) { \
	nsIVariant *pI = GetI(self); \
	if (pI==NULL) return NULL; \
	if (!PyArg_ParseTuple(args, ":" #FuncGet)) return NULL; \
	Type t; PRUint32 size; \
	nsresult nr = pI->FuncGet(&size, &t); \
	if (NS_FAILED(nr)) return PyXPCOM_BuildPyException(nr); \
	PyObject *ret = FuncConvert(t, size); \
	FuncFree(t); \
	return ret; \
}

GET_SIMPLE(PRUint8, GetAsInt8, PyInt_FromLong);
GET_SIMPLE(PRUint8, GetAsUint8, PyInt_FromLong);
GET_SIMPLE(PRInt16, GetAsInt16, PyInt_FromLong);
GET_SIMPLE(PRUint16, GetAsUint16, PyInt_FromLong);
GET_SIMPLE(PRInt32, GetAsInt32, PyInt_FromLong);
GET_SIMPLE(PRUint32, GetAsUint32, PyInt_FromLong);
GET_SIMPLE(PRInt64, GetAsInt64, PyLong_FromLongLong);
GET_SIMPLE(PRUint64, GetAsUint64, PyLong_FromUnsignedLongLong);
GET_SIMPLE(float, GetAsFloat, PyFloat_FromDouble);
GET_SIMPLE(double, GetAsDouble, PyFloat_FromDouble);
GET_SIMPLE(PRBool, GetAsBool, MyBool);
GET_SIMPLE(char, GetAsChar, MyChar);
GET_SIMPLE(PRUnichar, GetAsWChar, MyUChar);
GET_SIMPLE(nsISupports *, GetAsISupports, MyISupports);
GET_SIMPLE(nsIID, GetAsID, Py_nsIID::PyObjectFromIID);

GET_ALLOCATED(char *, GetAsString, PyString_FromString, nsMemory::Free);
GET_ALLOCATED(PRUnichar *, GetAsWString, MyUnicode, nsMemory::Free);
GET_ALLOCATED_SIZE(char *, GetAsStringWithSize, PyString_FromStringAndSize, nsMemory::Free);
GET_ALLOCATED_SIZE(PRUnichar *, GetAsWStringWithSize, PyUnicodeUCS2_FromUnicode, nsMemory::Free);

static PyObject *GetAsInterface(PyObject *self, PyObject *args) {
	nsIVariant *pI = GetI(self);
	if (pI==NULL) return NULL;
	if (!PyArg_ParseTuple(args, ":GetAsInterface")) return NULL;
	nsISupports *p;
	nsIID *iid;
	nsresult nr = pI->GetAsInterface(&iid, (void **)&p);
	if (NS_FAILED(nr)) return PyXPCOM_BuildPyException(nr);
	return Py_nsISupports::PyObjectFromInterface(p, *iid, PR_FALSE);
}

extern PyObject *PyObject_FromVariantArray( nsIVariant *v);

static PyObject *GetAsArray(PyObject *self, PyObject *args) {
	nsIVariant *pI = GetI(self);
	if (pI==NULL) return NULL;
	if (!PyArg_ParseTuple(args, ":GetAsArray")) return NULL;
	return PyObject_FromVariantArray(pI);
}

struct PyMethodDef 
PyMethods_IVariant[] =
{
	{ "getAsInt8", GetAsInt8, 1},
	{ "getAsUint8", GetAsUint8, 1},
	{ "getAsInt16", GetAsInt16, 1},
	{ "getAsUint16", GetAsUint16, 1},
	{ "getAsInt32", GetAsInt32, 1},
	{ "getAsUint32", GetAsUint32, 1},
	{ "getAsInt64", GetAsInt64, 1},
	{ "getAsUint64", GetAsUint64, 1},
	{ "getAsFloat", GetAsFloat, 1},
	{ "getAsDouble", GetAsDouble, 1},
	{ "getAsBool", GetAsBool, 1},
	{ "getAsChar", GetAsChar, 1},
	{ "getAsWChar", GetAsWChar, 1},
	{ "getAsString", GetAsString, 1},
	{ "getAsWString", GetAsWString, 1},
	{ "getAsStringWithSize", GetAsStringWithSize, 1},
	{ "getAsWStringWithSize", GetAsWStringWithSize, 1},
	{ "getAsISupports", GetAsISupports, 1},
	{ "getAsInterface", GetAsInterface, 1},
	{ "getAsArray", GetAsArray, 1},
	{ "getAsID", GetAsID, 1},
	{NULL}
};

PyObject *
Py_nsIVariant::getattr(const char *name)
{

	PyObject *ret = NULL;
	if (strcmp(name, "dataType")==0) {
        nsIVariant *pI = ::GetI(this);
        if (pI) {
            PRUint16 dt;
            nsresult nr = pI->GetDataType(&dt);
            if (NS_FAILED(nr)) return PyXPCOM_BuildPyException(nr);
            ret = PyInt_FromLong(dt);
        }
	} else {
		ret = Py_nsISupports::getattr(name);
	}
	return ret;
}

int
Py_nsIVariant::setattr(const char *name, PyObject *v)
{
	return Py_nsISupports::setattr(name, v);
}
