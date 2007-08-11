#!/usr/local/bin/perl
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
# The Original Code is IBM code.
#
# The Initial Developer of the Original Code is IBM.
# Portions created by IBM are
# Copyright (C) International Business Machines
# Corporation, 2000.  All Rights Reserved.
#
# Contributor(s): Simon Montagu
#

# This program generates the header file symmtable.h from the Unicode
# informative data file BidiMirroring.txt.
# See the comments in that file for details of its structure and contents.
#
# At the moment we only handle cases where there is another Unicode
# character whose glyph can serve as at least an adequate version of
# the mirror image of the original character's glyph. This leaves open
# the problem of how to provide mirrored glyphs for characters where
# this is not the case.

# Process the input file
$ucp = "[0-9a-fA-F]{4}";               # Unicode code point (4 successive hex digits) as a pattern to match
open ( UNICODATA , "< BidiMirroring.txt") 
   || die "Cannot find BidiMirroring.txt.\
The file should be avaiable here:\
http://www.unicode.org/Public/UNIDATA/BidiMirroring.txt\n";

while (<UNICODATA>) {
	chop;
  if (/^($ucp); ($ucp) # (.+)/) {      # If the line looks like this pattern
                                       # (example: 0028; 0029 # LEFT PARENTHESIS)
    @table[hex($1)]=hex($1) ^ hex($2); # Enter the character XOR its symmetric pair in the table
    @isblock[hex(substr($1, 0, 2))]=1; # Remember this block
  }
}
close(UNICODATA);

# Generate license and header
open ( OUT , "> ../base/src/symmtable.h") 
  || die "cannot open output ../base/src/symmtable.h file";
$npl = <<END_OF_NPL;
/* -*- Mode: C; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 2 -*-
 *
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
 * The Original Code is IBM code.
 * 
 * The Initial Developer of the Original Code is IBM.
 * Portions created by IBM are
 * Copyright (C) International Business Machines
 * Corporation, 2000.  All Rights Reserved.
 */
/* 
    DO NOT EDIT THIS DOCUMENT !!! THIS DOCUMENT IS GENERATED BY
    mozilla/intl/unicharutil/tools/gensymmtable.pl
 */
END_OF_NPL
print OUT $npl;

# Generate data tables
foreach $block (0 .. 0xff) {
  if (@isblock[$block]) {
    printf OUT "\n/* Block U%02X__ */\n", $block;
    printf OUT "const static PRUint8 symmtable_%02X[256] = {\n", $block;
    print OUT "/*      ";
    foreach $byte (0 .. 0xf) {
      printf OUT "   _%X ", $byte;
    }
    print OUT "*/\n";
    foreach $row (0 .. 0xf) {
      printf OUT "/* %X_ */ ", $row;
      foreach $byte (0 .. 0xf) {
         $ix = ($block << 8) | ($row << 4) | ($byte);
         printf OUT ("%#4x, ", @table[$ix]);
      }
      print OUT "\n";
    }
    print OUT "};\n";
  }
}

# Generate conversion method
print OUT "\nstatic PRUint32 Mirrored(PRUint32 u)\n{\n";
print OUT "  switch (u & 0xFFFFFF00) {\n";
print OUT "    // XOR the character with the bitmap in the conversion table to give the symmetric equivalent\n";
foreach $block (0 .. 0xff) {
  if (1==@isblock[$block]) {
    printf OUT "    case %#x:\n", $block * 256;
    printf OUT "      u ^= symmtable_%02X[u & 0xff];\n", $block;
    print  OUT "      break;\n";
  }
}
print OUT "  }\n  return u;\n}\n";
close(OUT);