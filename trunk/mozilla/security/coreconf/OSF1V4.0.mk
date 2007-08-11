#
# The contents of this file are subject to the Mozilla Public
# License Version 1.1 (the "License"); you may not use this file
# except in compliance with the License. You may obtain a copy of
# the License at http://www.mozilla.org/MPL/
# 
# Software distributed under the License is distributed on an "AS
# IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
# implied. See the License for the specific language governing
# rights and limitations under the License.
# 
# The Original Code is the Netscape security libraries.
# 
# The Initial Developer of the Original Code is Netscape
# Communications Corporation.  Portions created by Netscape are 
# Copyright (C) 1994-2000 Netscape Communications Corporation.  All
# Rights Reserved.
# 
# Contributor(s):
# 
# Alternatively, the contents of this file may be used under the
# terms of the GNU General Public License Version 2 or later (the
# "GPL"), in which case the provisions of the GPL are applicable 
# instead of those above.  If you wish to allow use of your 
# version of this file only under the terms of the GPL and not to
# allow others to use your version of this file under the MPL,
# indicate your decision by deleting the provisions above and
# replace them with the notice and other provisions required by
# the GPL.  If you do not delete the provisions above, a recipient
# may use your version of this file under either the MPL or the
# GPL.
#
# On OSF1 V4.0, pthreads is the default implementation strategy.
# Classic nspr is also available.
#
ifneq ($(OS_RELEASE),V3.2)
	USE_PTHREADS = 1
	ifeq ($(CLASSIC_NSPR), 1)
		USE_PTHREADS =
		IMPL_STRATEGY := _CLASSIC
	endif
endif

#
# Config stuff for DEC OSF/1 V4.0
#
include $(CORE_DEPTH)/coreconf/OSF1.mk

ifeq ($(OS_RELEASE),V4.0)
	OS_CFLAGS += -DOSF1V4
endif