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
# The Original Code is this file as it was released upon August 6, 1998.
#
# The Initial Developer of the Original Code is Christopher
# Seawood. Portions created by Christopher Seawood are
# Copyright (C) 1998 Christopher Seawood. All
# Rights Reserved.
#
# Contributor(s): 

# A netscape style .mk file for autoconf builds

INCLUDED_AUTOCONF_MK = 1
USE_AUTOCONF 	= 1
MOZILLA_CLIENT	= 1
BUILD_MODULES	= all
MOZILLA_VERSION = 1.7.5
MOZ_APP_NAME	= kompozer
MOZ_APP_VERSION = 0.7.9
MOZ_APP_DISPLAYNAME = KompoZer

prefix		= /usr/local
exec_prefix	= ${prefix}
bindir		= ${exec_prefix}/bin
includedir	= ${prefix}/include/$(MOZ_APP_NAME)-$(MOZ_APP_VERSION)
libdir		= ${exec_prefix}/lib
datadir		= ${prefix}/share
mandir		= ${prefix}/man
idldir		= ${prefix}/share/idl/$(MOZ_APP_NAME)-$(MOZ_APP_VERSION)

mozappdir	= $(libdir)/$(MOZ_APP_NAME)-$(MOZ_APP_VERSION)
mredir		= $(libdir)/mre/mre-$(MOZ_APP_VERSION)
mrelibdir	= $(mredir)/lib

DIST		= $(DEPTH)/dist

MOZ_CHROME_FILE_FORMAT	= jar

MOZ_WIDGET_TOOLKIT	= gtk2
MOZ_GFX_TOOLKIT	= $(MOZ_WIDGET_TOOLKIT)

MOZ_JS_LIBS		   = -L$(DIST)/bin -lmozjs

MOZ_GFX_TOOLKIT_LDFLAGS     = -lgfx_$(MOZ_WIDGET_TOOLKIT) $(MOZ_XLIBRGB_LDFLAGS)
MOZ_WIDGET_TOOLKIT_LDFLAGS  = -lwidget_$(MOZ_WIDGET_TOOLKIT)

MOZ_DEBUG	= 
MOZ_DEBUG_MODULES = 
MOZ_PROFILE_MODULES = 
MOZ_DEBUG_ENABLE_DEFS		= -DDEBUG -D_DEBUG -DDEBUG_kaze -DTRACING
MOZ_DEBUG_DISABLE_DEFS	= -DNDEBUG -DTRIMMED
MOZ_DEBUG_FLAGS	= -g -fno-inline
MOZ_DEBUG_LDFLAGS=
MOZ_DBGRINFO_MODULES	= 
MOZ_EXTENSIONS  = wallet xml-rpc xmlextras pref universalchardet spellcheck
MOZ_IMG_DECODERS= png gif jpeg bmp
MOZ_JSDEBUGGER  = 1
MOZ_PERF_METRICS = 
MOZ_LEAKY	= 
MOZ_JPROF       = 
MOZ_XPCTOOLS    = 
ENABLE_EAZEL_PROFILER=
EAZEL_PROFILER_CFLAGS=
EAZEL_PROFILER_LIBS=
GC_LEAK_DETECTOR = 
NS_TRACE_MALLOC = 
USE_ELF_DYNSTR_GC = 1
USE_PREBINDING = 
INCREMENTAL_LINKER = 
MACOS_DEPLOYMENT_TARGET = 
MOZ_UI_LOCALE = en-US
MOZ_MAIL_NEWS	= 
MOZ_CALENDAR	= 
MOZ_PLAINTEXT_EDITOR_ONLY = 
MOZ_COMPOSER = 1
BUILD_SHARED_LIBS = 1
BUILD_STATIC_LIBS = 
MOZ_STATIC_COMPONENT_LOADER = 1
MOZ_STATIC_COMPONENTS = 
MOZ_META_COMPONENTS = 
MOZ_STATIC_COMPONENT_LIBS = 
ENABLE_TESTS	= 
IBMBIDI = 1
SUNCTL = 
ACCESSIBILITY = 1
MOZ_VIEW_SOURCE = 1
MOZ_XPINSTALL = 1
MOZ_JSLOADER  = 1
MOZ_USE_NATIVE_UCONV = 
MOZ_SINGLE_PROFILE = 1
MOZ_LDAP_XPCOM = 
MOZ_LDAP_XPCOM_EXPERIMENTAL = 
MOZ_USE_OFFICIAL_BRANDING=
XPCOM_USE_LEA = 
JS_ULTRASPARC_OPTS = 
MOZ_ENABLE_POSTSCRIPT = 1
MOZ_INSTALLER	= 
MOZ_NO_ACTIVEX_SUPPORT = 1
MOZ_ACTIVEX_SCRIPTING_SUPPORT = 
XPC_IDISPATCH_SUPPORT = 
MOZ_XPFE_COMPONENTS = 1
MOZ_IPCD = 
MOZ_PROFILESHARING = 
MOZ_PROFILELOCKING = 1

MOZ_COMPONENTS_VERSION_SCRIPT_LDFLAGS = -Wl,--version-script -Wl,$(BUILD_TOOLS)/gnu-ld-scripts/components-version-script
MOZ_COMPONENT_NSPR_LIBS=-L$(DIST)/bin $(NSPR_LIBS)
MOZ_COMPONENT_XPCOM_LIBS=$(XPCOM_LIBS)
XPCOM_LIBS=-L$(DIST)/bin -lxpcom 
MOZ_REORDER=
MOZ_TIMELINE=

ENABLE_STRIP	= 

ClientWallet=1
CookieManagement=1
SingleSignon=1

MOZ_OJI		= 
MOZ_PLUGINS	= 1

MOZ_POST_DSO_LIB_COMMAND = 
MOZ_POST_PROGRAM_COMMAND = 

MOZ_BUILD_ROOT             = /mnt/Documents/kompozer/mozilla

MOZ_XUL                    = 1

NECKO_PROTOCOLS = http ftp file jar viewsource res data
NECKO_DISK_CACHE = 
NECKO_SMALL_BUFFERS = 
NECKO_COOKIES = 1

MOZ_NATIVE_ZLIB	= 1
MOZ_NATIVE_JPEG	= 
MOZ_NATIVE_PNG	= 

MOZ_INTERNAL_LIBART_LGPL = 

MOZ_UPDATE_XTERM = 
MOZ_MATHML = 
MOZ_SVG = 
MOZ_SVG_RENDERER_GDIPLUS = 
MOZ_SVG_RENDERER_LIBART = 
MOZ_SVG_RENDERER_CAIRO = 
MOZ_LIBART_CFLAGS = 
MOZ_CAIRO_CFLAGS = 
TX_EXE = 

# Mac's don't like / in a #include, so we include the libart
# headers locally if we're using the external library
ifdef MOZ_LIBART_CFLAGS
ifndef MOZ_INTERNAL_LIBART_LGPL
MOZ_LIBART_CFLAGS := $(MOZ_LIBART_CFLAGS)/libart_lgpl
endif
endif
MOZ_LIBART_LIBS = 
MOZ_CAIRO_LIBS = 

MOZ_GNOMEVFS_CFLAGS = -pthread -DORBIT2=1 -I/usr/include/gnome-vfs-2.0 -I/usr/lib/gnome-vfs-2.0/include -I/usr/include/gconf/2 -I/usr/include/orbit-2.0 -I/usr/include/glib-2.0 -I/usr/lib/glib-2.0/include -I/usr/include/gnome-vfs-module-2.0  
MOZ_GNOMEVFS_LIBS = -pthread -lgnomevfs-2 -lgconf-2 -lgmodule-2.0 -ldl -lORBit-2 -lgthread-2.0 -lrt -lgobject-2.0 -lglib-2.0  

MOZ_GCONF_CFLAGS = -DORBIT2=1 -pthread -I/usr/include/gconf/2 -I/usr/include/orbit-2.0 -I/usr/include/glib-2.0 -I/usr/lib/glib-2.0/include  
MOZ_GCONF_LIBS = -pthread -lgconf-2 -lORBit-2 -lgthread-2.0 -lrt -lgobject-2.0 -lglib-2.0  

MOZ_LIBGNOME_CFLAGS = -DORBIT2=1 -pthread -I/usr/include/libgnome-2.0 -I/usr/include/orbit-2.0 -I/usr/include/gconf/2 -I/usr/include/gnome-vfs-2.0 -I/usr/lib/gnome-vfs-2.0/include -I/usr/include/glib-2.0 -I/usr/lib/glib-2.0/include -I/usr/include/libbonobo-2.0 -I/usr/include/bonobo-activation-2.0  
MOZ_LIBGNOME_LIBS = -Wl,--export-dynamic -pthread -lgnome-2 -lpopt -lbonobo-2 -lbonobo-activation -lgmodule-2.0 -ldl -lORBit-2 -lgthread-2.0 -lrt -lgobject-2.0 -lglib-2.0  

MOZ_ENABLE_GNOME_COMPONENT = 1

MOZ_INSURE = 
MOZ_INSURIFYING = 
MOZ_INSURE_DIRS = 
MOZ_INSURE_EXCLUDE_DIRS = 

MOZ_NATIVE_NSPR = 

CROSS_COMPILE   = 

OS_CPPFLAGS	=  
OS_CFLAGS	= $(OS_CPPFLAGS) -Wall -W -Wno-unused -Wpointer-arith -Wcast-align -Wno-long-long -pthread -pipe
OS_CXXFLAGS	= $(OS_CPPFLAGS) -fno-rtti -fno-exceptions -Wall -Wconversion -Wpointer-arith -Wcast-align -Woverloaded-virtual -Wsynth -Wno-ctor-dtor-privacy -Wno-non-virtual-dtor -Wno-long-long -fshort-wchar -pthread -pipe
OS_LDFLAGS	= 

OS_COMPILE_CFLAGS = $(OS_CPPFLAGS) -include $(DEPTH)/mozilla-config.h -DMOZILLA_CLIENT $(filter-out %/.pp,-Wp,-MD,$(MDDEPDIR)/$(*F).pp)
OS_COMPILE_CXXFLAGS = $(OS_CPPFLAGS) -DMOZILLA_CLIENT -include $(DEPTH)/mozilla-config.h $(filter-out %/.pp,-Wp,-MD,$(MDDEPDIR)/$(*F).pp)

OS_INCLUDES	= $(NSPR_CFLAGS) $(JPEG_CFLAGS) $(PNG_CFLAGS) $(ZLIB_CFLAGS)
OS_LIBS		= -ldl -lm 
ACDEFINES	= -DMOZILLA_VERSION=\"1.7.5\" -DD_INO=d_ino -DSTDC_HEADERS=1 -DHAVE_ST_BLKSIZE=1 -DHAVE_SIGINFO_T=1 -DHAVE_INT16_T=1 -DHAVE_INT32_T=1 -DHAVE_INT64_T=1 -DHAVE_UINT=1 -DHAVE_UNAME_DOMAINNAME_FIELD=1 -DHAVE_VISIBILITY_ATTRIBUTE=1 -DHAVE_DIRENT_H=1 -DHAVE_GETOPT_H=1 -DHAVE_SYS_BITYPES_H=1 -DHAVE_MEMORY_H=1 -DHAVE_UNISTD_H=1 -DHAVE_GNU_LIBC_VERSION_H=1 -DHAVE_NL_TYPES_H=1 -DHAVE_MALLOC_H=1 -DHAVE_X11_XKBLIB_H=1 -DHAVE_SYS_STATVFS_H=1 -DHAVE_SYS_STATFS_H=1 -DHAVE_SYS_CDEFS_H=1 -DHAVE_LIBM=1 -DHAVE_LIBDL=1 -DFUNCPROTO=15 -DHAVE_XSHM=1 -D_REENTRANT=1 -DHAVE_RANDOM=1 -DHAVE_STRERROR=1 -DHAVE_LCHOWN=1 -DHAVE_FCHMOD=1 -DHAVE_SNPRINTF=1 -DHAVE_MEMMOVE=1 -DHAVE_RINT=1 -DHAVE_FLOCKFILE=1 -DHAVE_LOCALTIME_R=1 -DHAVE_STRTOK_R=1 -DHAVE_RES_NINIT=1 -DHAVE_GNU_GET_LIBC_VERSION=1 -DHAVE_LANGINFO_CODESET=1 -DVA_COPY=va_copy -DHAVE_VA_COPY=1 -DHAVE_I18N_LC_MESSAGES=1 -DMOZ_DEFAULT_TOOLKIT=\"gtk2\" -DMOZ_WIDGET_GTK2=1 -DMOZ_ENABLE_XREMOTE=1 -DMOZ_X11=1 -DMOZ_DISTRIBUTION_ID_UNQUOTED=org.mozilla -DMOZ_DISTRIBUTION_ID=\"org.mozilla\" -DMOZ_STANDALONE_COMPOSER=1 -DMOZ_XUL_APP=1 -DMOZ_APP_NAME=\"kompozer\" -DMOZ_ENABLE_XFT=1 -DMOZ_ENABLE_COREXFONTS=1 -DMOZ_EXTRA_X11CONVERTERS=1 -DIBMBIDI=1 -DMOZ_VIEW_SOURCE=1 -DACCESSIBILITY=1 -DMOZ_XPINSTALL=1 -DMOZ_JSLOADER=1 -DMOZ_LOGGING=1 -DMOZ_ENABLE_OLD_ABI_COMPAT_WRAPPERS=1 -DHAVE___CXA_DEMANGLE=1 -DMOZ_USER_DIR=\".mozilla\" -DMOZ_XUL=1 -DMOZ_PROFILELOCKING=1 -DMOZ_DLL_SUFFIX=\".so\" -DXP_UNIX=1 -DUNIX_ASYNC_DNS=1 -DJS_THREADSAFE=1 -DNS_PRINT_PREVIEW=1 -DNS_PRINTING=1 -DMOZ_ACCESSIBILITY_ATK=1 -DMOZILLA_LOCALE_VERSION=\"1.7\" -DMOZILLA_REGION_VERSION=\"1.7\" -DMOZILLA_SKIN_VERSION=\"1.5\" 

MOZ_OPTIMIZE	= 1
MOZ_OPTIMIZE_FLAGS = -O
MOZ_OPTIMIZE_LDFLAGS = 

PROFILE_GEN_CFLAGS = -fprofile-generate
PROFILE_USE_CFLAGS = -fprofile-use

XCFLAGS		= 
XLDFLAGS	= 
XLIBS		= -lX11 

CYGWIN_WRAPPER	= 
CYGDRIVE_MOUNT	= 
AR		= ar
AR_FLAGS	= cr $@
AR_EXTRACT	= $(AR) x
AR_LIST		= $(AR) t
AR_DELETE	= $(AR) d
AS		= $(CC)
ASFLAGS		= 
AS_DASH_C_FLAG	= -c
LD		= ld
RC		= 
RCFLAGS		= 
WINDRES		= :
USE_SHORT_LIBNAME = 
IMPLIB		= 
FILTER		= 
BIN_FLAGS	= 
MIDL		= 
MIDL_FLAGS	= 

DLL_PREFIX	= lib
LIB_PREFIX	= lib
OBJ_SUFFIX	= o
LIB_SUFFIX	= a
DLL_SUFFIX	= .so
BIN_SUFFIX	= 
ASM_SUFFIX	= s
IMPORT_LIB_SUFFIX = 
USE_N32		= 
HAVE_64BIT_OS	= 

# Temp hack.  It is not my intention to leave this crap in here for ever.
# Im talking to fur right now to solve the problem without introducing 
# NS_USE_NATIVE to the build system -ramiro.
NS_USE_NATIVE = 

CC		    = gcc
CXX		    = c++

GNU_AS		= 1
GNU_LD		= 1
GNU_CC		= 1
GNU_CXX		= 1
HAVE_GCC3_ABI	= 1

HOST_CC		= gcc
HOST_CXX	= c++
HOST_CFLAGS	=  -DXP_UNIX
HOST_CXXFLAGS	= 
HOST_OPTIMIZE_FLAGS = -O3
HOST_NSPR_MDCPUCFG = \"md/_linux.cfg\"
HOST_AR		= ar
HOST_LD		= 
HOST_RANLIB	= ranlib
HOST_BIN_SUFFIX	= 

HOST_LIBIDL_CONFIG = 
HOST_LIBIDL_CFLAGS = 
HOST_LIBIDL_LIBS   = 

TARGET_NSPR_MDCPUCFG = \"md/_linux.cfg\"
TARGET_CPU	= i686
TARGET_VENDOR	= pc
TARGET_OS	= linux-gnu
TARGET_MD_ARCH	= unix

AUTOCONF	= /usr/bin/autoconf
PERL		= /usr/bin/perl
RANLIB		= ranlib
WHOAMI		= /usr/bin/whoami
UNZIP		= /usr/bin/unzip
ZIP		= /usr/bin/zip
XARGS		= /usr/bin/xargs
STRIP		= strip
DOXYGEN		= :
MAKE		= /usr/bin/gmake
PBBUILD_BIN	= 
SDP		= @SDP@

ifdef MOZ_NATIVE_JPEG
JPEG_CFLAGS	= 
JPEG_LIBS	= 
JPEG_REQUIRES	=
else
JPEG_CFLAGS	= 
JPEG_LIBS	= -L$(DIST)/lib -lmozjpeg
JPEG_REQUIRES	= jpeg
endif

ifdef MOZ_NATIVE_ZLIB
ZLIB_CFLAGS	= 
ZLIB_LIBS	= -lz 
ZLIB_REQUIRES	=
else
ZLIB_CFLAGS	= 
ZLIB_LIBS	= -L$(DIST)/lib -lmozz
ZLIB_REQUIRES	= zlib
endif

ifdef MOZ_NATIVE_PNG
PNG_CFLAGS	= 
PNG_LIBS	= 
PNG_REQUIRES	=
else
PNG_CFLAGS	= 
PNG_LIBS	= -L$(DIST)/lib -lmozpng
PNG_REQUIRES	= png
endif

NSPR_CFLAGS = -I/mnt/Documents/kompozer/mozilla/dist/include/nspr 
NSPR_LIBS = -L/mnt/Documents/kompozer/mozilla/dist/lib -lplds4 -lplc4 -lnspr4 -lpthread -ldl 

LDAP_CFLAGS	= 
LDAP_LIBS	= 
XPCOM_GLUE_LIBS	= -L${DIST}/bin -L${DIST}/lib -lxpcomglue -lstring_s
MOZ_XPCOM_OBSOLETE_LIBS = -L$(DIST)/lib -lxpcom_compat

USE_DEPENDENT_LIBS = 1

# UNIX98 iconv support
LIBICONV = 

# MKSHLIB_FORCE_ALL is used to force the linker to include all object
# files present in an archive. MKSHLIB_UNFORCE_ALL reverts the linker
# to normal behavior. Makefile's that create shared libraries out of
# archives use these flags to force in all of the .o files in the
# archives into the shared library.
WRAP_MALLOC_LIB         = 
WRAP_MALLOC_CFLAGS      = 
DSO_CFLAGS              = 
DSO_PIC_CFLAGS          = -fPIC
MKSHLIB                 = $(CXX) $(CXXFLAGS) $(DSO_PIC_CFLAGS) $(DSO_LDOPTS) -o $@
MKCSHLIB                = $(CC) $(CFLAGS) $(DSO_PIC_CFLAGS) $(DSO_LDOPTS) -o $@
MKSHLIB_FORCE_ALL       = -Wl,--whole-archive
MKSHLIB_UNFORCE_ALL     = -Wl,--no-whole-archive
DSO_LDOPTS              = -shared -Wl,-h -Wl,$@
DLL_SUFFIX              = .so

NO_LD_ARCHIVE_FLAGS     = 

GTK_CONFIG	= 
TK_CFLAGS	= $(MOZ_GTK2_CFLAGS)
TK_LIBS		= $(MOZ_GTK2_LIBS)

MOZ_TOOLKIT_REGISTRY_CFLAGS = \
	-DWIDGET_DLL=\"libwidget_$(MOZ_WIDGET_TOOLKIT)$(DLL_SUFFIX)\" \
	-DGFXWIN_DLL=\"libgfx_$(MOZ_GFX_TOOLKIT)$(DLL_SUFFIX)\" \
	$(TK_CFLAGS)

MOZ_ENABLE_GTK		= 
MOZ_ENABLE_GTK2		= 1
MOZ_ENABLE_XLIB		= 
MOZ_ENABLE_PHOTON	= 
MOZ_ENABLE_COCOA	= 
MOZ_ENABLE_XREMOTE	= 1

MOZ_GTK_CFLAGS		= 
MOZ_GTK_LDFLAGS		= 

MOZ_GTK2_CFLAGS		= -I/usr/include/gtk-2.0 -I/usr/lib/gtk-2.0/include -I/usr/include/atk-1.0 -I/usr/include/cairo -I/usr/include/pango-1.0 -I/usr/include/glib-2.0 -I/usr/lib/glib-2.0/include -I/usr/include/freetype2 -I/usr/include/libpng12  
MOZ_GTK2_LIBS		= -lgtk-x11-2.0 -lgdk-x11-2.0 -latk-1.0 -lgdk_pixbuf-2.0 -lpng12 -lm -lpangocairo-1.0 -lpango-1.0 -lcairo -lgobject-2.0 -lgmodule-2.0 -ldl -lglib-2.0  

MOZ_XLIB_CFLAGS		= 
MOZ_XLIB_LDFLAGS	= 

MOZ_XPRINT_CFLAGS	= 
MOZ_XPRINT_LDFLAGS	=   -lXext -lX11
MOZ_ENABLE_XPRINT	= 

MOZ_ENABLE_FREETYPE2   = 
FT2_CFLAGS             = -I/usr/include/freetype2
FT2_LIBS               = -lfreetype -lz

MOZ_ENABLE_XFT		= 1
MOZ_XFT_CFLAGS		= -I/usr/include/freetype2  
MOZ_XFT_LIBS		= -lXft -lXrender -lfontconfig -lfreetype -lz -lX11  
MOZ_ENABLE_COREXFONTS	= 1

MOZ_EXTRA_X11CONVERTERS	= 1

MOZ_ENABLE_XINERAMA	= 
MOZ_XINERAMA_LIBS	= -lXinerama

MOZ_XIE_LIBS		= 
XT_LIBS			= -lXt

GLIB_CFLAGS	= -I/usr/include/glib-2.0 -I/usr/lib/glib-2.0/include  
GLIB_LIBS	= -lglib-2.0  
GLIB_GMODULE_LIBS	= 
LIBIDL_CFLAGS = -I/usr/include/libIDL-2.0 -I/usr/include/glib-2.0 -I/usr/lib/glib-2.0/include  
LIBIDL_LIBS = -lIDL-2 -lglib-2.0  

MOZ_NATIVE_MAKEDEPEND	= /usr/bin/makedepend

# Used for LD_LIBRARY_PATH
LIBS_PATH       = 

MOZ_AUTO_DEPS	= 1
COMPILER_DEPEND = 1
MDDEPDIR        := .deps

MOZ_DEMANGLE_SYMBOLS = 

# XXX - these need to be cleaned up and have real checks added -cls
CM_BLDTYPE=dbg
AWT_11=1
MOZ_BITS=32
OS_TARGET=Linux
OS_ARCH=Linux
OS_RELEASE=2.6.21.3
OS_TEST=i686

# For AIX build
AIX_OBJMODEL = 

# For OS/2 build
MOZ_OS2_TOOLS = 
MOZ_OS2_EMX_OBJECTFORMAT = 

HAVE_XIE=

MOZ_MOVEMAIL=1
MOZ_PSM=1

# Gssapi (krb5) libraries and headers for the Negotiate auth method
GSSAPI_INCLUDES = 
GSSAPI_LIBS	= 

# for Qt build
MOC=

# Win32 options
MOZ_PROFILE	= 
MOZ_COVERAGE	= 
MOZ_BROWSE_INFO	= 
MOZ_TOOLS_DIR	= 
MOZ_DEBUG_SYMBOLS = 
MOZ_QUANTIFY	= 

# Codesighs tools option, enables win32 mapfiles.
MOZ_MAPINFO	= 

MOZ_PHOENIX	= 
MOZ_XUL_APP	= 1
MOZ_THUNDERBIRD = 
MOZ_STANDALONE_COMPOSER= 1
MOZ_STATIC_MAIL_BUILD = 

MINIMO		= 

MOZ_COMPONENTLIB = 
MACOS_SDK_DIR	= 

# Nvu options
LINSPIRE        = 
SITE_MANAGER_KDE_ICON_STYLE = 
