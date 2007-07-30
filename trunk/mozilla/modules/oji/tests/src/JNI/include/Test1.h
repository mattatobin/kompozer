/* -*- Mode: C++; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4 -*-
 * The contents of this file are subject to the Mozilla Public
 * License Version 1.1 (the "License"); you may not use this file
 * except in compliance with the License. You may obtain a copy of
 * the License at http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS
 * IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing
 * rights and limitations under the License.
 *
 * The Original Code is mozilla.org code.
 *
 * The Initial Developer of the Original Code is Sun Microsystems,
 * Inc. Portions created by Sun are
 * Copyright (C) 1999 Sun Microsystems, Inc. All
 * Rights Reserved.
 *
 * Contributor(s): 
 */
/* DO NOT EDIT THIS FILE - it is machine generated */
//#include <jni.h>
/* Header for class Test1 */

#ifndef _Included_Test1
#define _Included_Test1
#ifdef __cplusplus
extern "C" {
#endif
/* Inaccessible static: protected_static_super_int */
/* Inaccessible static: public_static_super_int */
/* Inaccessible static: public_static_super_object */
#undef Test1_static_final_int
#define Test1_static_final_int 11L
/* Inaccessible static: static_name_int */
/* Inaccessible static: static_name_object */
/* Inaccessible static: static_name_int_nomodifiers */
/* Inaccessible static: static_name_int_private */
/* Inaccessible static: static_name_int_protected */
/* Inaccessible static: static_name_bool */
/* Inaccessible static: static_name_int_arr */
/* Inaccessible static: static_name_long */
/* Inaccessible static: static_name_double */
/* Inaccessible static: static_name_float */
/* Inaccessible static: static_name_short */
/* Inaccessible static: static_name_byte */
/* Inaccessible static: static_name_string */
/* Inaccessible static: static_name_char */
/*
 * Class:     Test1
 * Method:    mprint
 * Signature: (I)V
 */
JNIEXPORT void JNICALL Java_Test1_mprint
  (JNIEnv *, jobject, jint);

/*
 * Class:     Test1
 * Method:    mprint_static
 * Signature: (I)V
 */
JNIEXPORT void JNICALL Java_Test1_mprint_1static
  (JNIEnv *, jclass, jint);

/*
 * Class:     Test1
 * Method:    Test1_method3_native
 * Signature: (ZBCSIJFDLjava/lang/String;[Ljava/lang/String;)I
 */
JNIEXPORT jint JNICALL Java_Test1_Test1_1method3_1native
  (JNIEnv *, jobject, jboolean, jbyte, jchar, jshort, jint, jlong, jfloat, jdouble, jstring, jobjectArray);

/*
 * Class:     Test1
 * Method:    Test1_method3_native_static
 * Signature: (ZBCSIJFDLjava/lang/String;[Ljava/lang/String;)I
 */
JNIEXPORT jint JNICALL Java_Test1_Test1_1method3_1native_1static
  (JNIEnv *, jobject, jboolean, jbyte, jchar, jshort, jint, jlong, jfloat, jdouble, jstring, jobjectArray);

#ifdef __cplusplus
}
#endif
#endif
