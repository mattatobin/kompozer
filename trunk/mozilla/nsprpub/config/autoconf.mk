# -*- Mode: Makefile -*-

INCLUDED_AUTOCONF_MK = 1
USE_AUTOCONF	= 1

MOZILLA_CLIENT	= 1

prefix		= /usr/local
exec_prefix	= ${prefix}
bindir		= ${exec_prefix}/bin
includedir	= ${prefix}/include/nspr
libdir		= ${exec_prefix}/lib
datadir		= ${prefix}/share

dist_prefix	= /home/kaze/Documents/kompozer/mozilla/dist
dist_bindir	= ${dist_prefix}/bin
dist_includedir = ${dist_prefix}/include/nspr
dist_libdir	= ${dist_prefix}/lib

DIST		= $(dist_prefix)

RELEASE_OBJDIR_NAME = Linux2.6_x86_glibc_PTH_OPT.OBJ
OBJDIR_NAME	= .
OBJDIR		= .
OBJ_SUFFIX	= o
LIB_SUFFIX	= a
DLL_SUFFIX	= so
ASM_SUFFIX	= s
MOD_NAME	= nspr20

MOD_MAJOR_VERSION = 4
MOD_MINOR_VERSION = 5
MOD_PATCH_VERSION = 0

LIBNSPR		= -L$(dist_libdir) -lnspr$(MOD_MAJOR_VERSION)
LIBPLC		= -L$(dist_libdir) -lplc$(MOD_MAJOR_VERSION)

CROSS_COMPILE	= 
BUILD_OPT	= 1

USE_CPLUS	= 
USE_IPV6	= 
USE_N32		= 
USE_64		= 
GC_LEAK_DETECTOR = 
ENABLE_STRIP	= 

USE_PTHREADS	= 1
USE_BTHREADS	= 
PTHREADS_USER	= 
CLASSIC_NSPR	= 

AS		= $(CC)
ASFLAGS		= $(CFLAGS)
CC		= gcc
CCC		= c++
NS_USE_GCC	= 1
GCC_USE_GNU_LD	= 
AR		= /usr/bin/ar
AR_FLAGS	= cr $@
LD		= /usr/bin/ld
RANLIB		= ranlib
PERL		= /usr/bin/perl
RC		= 
RCFLAGS		= 
STRIP		= /usr/bin/strip
NSINSTALL	= $(MOD_DEPTH)/config/$(OBJDIR_NAME)/nsinstall
FILTER		= 
IMPLIB		= 
CYGWIN_WRAPPER	= 

OS_CPPFLAGS	= 
OS_CFLAGS	= $(OS_CPPFLAGS) -DDEBIAN -pipe -ansi -Wall -pthread -O2 $(DSO_CFLAGS)
OS_CXXFLAGS	= $(OS_CPPFLAGS) -DDEBIAN -pipe -ansi -Wall -pthread -O2 $(DSO_CFLAGS)
OS_LIBS         = -lpthread -ldl -lc -lpthread
OS_LDFLAGS	= 
OS_DLLFLAGS	= 
DLLFLAGS	= 
EXEFLAGS  = 
OPTIMIZER	= 

MKSHLIB		= $(CC) $(DSO_LDOPTS) -o $@
DSO_CFLAGS	= -fPIC
DSO_LDOPTS	= -shared -Wl,-soname -Wl,$(notdir $@)

RESOLVE_LINK_SYMBOLS = 

HOST_CC		= gcc
HOST_CFLAGS	= -DDEBIAN -DXP_UNIX

DEFINES		=  -UDEBUG -DMOZILLA_CLIENT=1 -DNDEBUG=1 -DXP_UNIX=1 -D_POSIX_SOURCE=1 -D_BSD_SOURCE=1 -D_SVID_SOURCE=1 -D_LARGEFILE64_SOURCE=1 -DHAVE_FCNTL_FILE_LOCKING=1 -DLINUX=1 -Di386=1 -DHAVE_LCHOWN=1 -DHAVE_STRERROR=1 -D_REENTRANT=1 

MDCPUCFG_H	= _linux.cfg
PR_MD_CSRCS	= linux.c
PR_MD_ASFILES	= os_Linux_x86.s
PR_MD_ARCH_DIR	= unix
CPU_ARCH	= x86

OS_TARGET	= Linux
OS_ARCH		= Linux
OS_RELEASE	= 2.6
OS_TEST		= i686

NOSUCHFILE	= /no-such-file
AIX_LINK_OPTS	= 
MOZ_OBJFORMAT	= 
ULTRASPARC_LIBRARY = 

OBJECT_MODE	= 
ifdef OBJECT_MODE
export OBJECT_MODE
endif
