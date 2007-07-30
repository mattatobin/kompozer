/* -*- Mode: C++; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* The contents of this file are subject to the Netscape Public License
 * Version 1.1 (the "License"); you may not use this file except in
 * compliance with the License. You may obtain a copy of the License at
 * http://www.mozilla.org/NPL/ 
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License 
 * for the specific language governing rights and limitations under the 
 * License. 
 * 
 * The Original Code is Mozilla Communicator client code, released March
 * 31, 1998. 
 *
 * The Initial Developer of the Original Code is Netscape Communications
 * Corporation. Portions created by Netscape are Copyright (C) 1999
 * Netscape Communications Corporation. All Rights Reserved.  
 * 
 * Contributors:
 *     Samir Gehani <sgehani@netscape.com>
 */
 

#ifndef _NS_FILESELECTOR_H_
#define _NS_FILESELECTOR_H_
 
#include <Navigation.h>

class nsFileSelector
{

public: 
	nsFileSelector();
	~nsFileSelector();
	
	OSErr	SelectFile(FSSpecPtr aOutFile);
	OSErr	SelectFolder(FSSpecPtr aOutFolder);
	
private:
	OSErr	GetCWD(long *aOutDirID, short *aOutVRefNum);
	
	FSSpecPtr	mFile;
};


#ifdef __cplusplus
extern "C" {
#endif

pascal void
OurNavEventFunction(NavEventCallbackMessage callBackSelector, NavCBRecPtr callBackParms,
					NavCallBackUserData callBackUD);

#ifdef __cplusplus
}
#endif

#define ERR_CHECK(_func) 			\
			err = _func;			\
			if (err != noErr)		\
				return err;

#endif _NS_FILESELECTOR_H_