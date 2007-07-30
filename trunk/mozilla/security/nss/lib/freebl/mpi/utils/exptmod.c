/*
 *  exptmod.c
 *
 * Command line tool to perform modular exponentiation on arbitrary
 * precision integers.
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
 * The Original Code is the MPI Arbitrary Precision Integer Arithmetic
 * library.
 *
 * The Initial Developer of the Original Code is Michael J. Fromberger.
 * Portions created by Michael J. Fromberger are 
 * Copyright (C) 1998, 1999, 2000 Michael J. Fromberger. 
 * All Rights Reserved.
 *
 * Contributor(s):
 *
 * Alternatively, the contents of this file may be used under the
 * terms of the GNU General Public License Version 2 or later (the
 * "GPL"), in which case the provisions of the GPL are applicable
 * instead of those above.  If you wish to allow use of your
 * version of this file only under the terms of the GPL and not to
 * allow others to use your version of this file under the MPL,
 * indicate your decision by deleting the provisions above and
 * replace them with the notice and other provisions required by
 * the GPL.  If you do not delete the provisions above, a recipient
 * may use your version of this file under either the MPL or the GPL.
 *
 * $Id: exptmod.c,v 1.1 2000/07/14 00:44:55 nelsonb%netscape.com Exp $ 
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "mpi.h"

int main(int argc, char *argv[])
{
  mp_int  a, b, m;
  mp_err  res;
  char   *str;
  int     len, rval = 0;

  if(argc < 3) {
    fprintf(stderr, "Usage: %s <a> <b> <m>\n", argv[0]);
    return 1;
  }

  mp_init(&a); mp_init(&b); mp_init(&m);
  mp_read_radix(&a, argv[1], 10);
  mp_read_radix(&b, argv[2], 10);
  mp_read_radix(&m, argv[3], 10);

  if((res = mp_exptmod(&a, &b, &m, &a)) != MP_OKAY) {
    fprintf(stderr, "%s: error: %s\n", argv[0], mp_strerror(res));
    rval = 1;
  } else {
    len = mp_radix_size(&a, 10);
    str = calloc(len, sizeof(char));
    mp_toradix(&a, str, 10);

    printf("%s\n", str);

    free(str);
  }

  mp_clear(&a); mp_clear(&b); mp_clear(&m);

  return rval;
}
