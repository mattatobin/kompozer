var remoteTree = {
  data        : new Array(),
  displayData : new Array(),
  rowCount    : 0,
  remoteSize  : 0,
  searchMode  : 0,

  getParentIndex      : function(row)               { return -1; },
  getLevel            : function(row)               { return 0;  },
  getRowProperties    : function(row, props)        { },
  getColumnProperties : function(colid, col, props) { },
  isContainer         : function(row)               { return false; },
  isSeparator         : function(row)               { return false; },
  isSorted            : function(row)               { return false; },
  setTree             : function(treebox)           { this.treebox = treebox; },

  getCellText         : function(row, column)       {                                          // text for the files
    if (row >= 0 && row < this.data.length) {
      switch (column.id) {
        case "remotename":
          return this.searchMode == 2 ? this.displayData[row].path : this.displayData[row].leafName;
        case "remotesize":
          return this.displayData[row].fileSize;
        case "remotedate":
          return this.displayData[row].date;
        case "remotetype":
          return this.displayData[row].extension;
        case "remoteattr":
          return this.displayData[row].attr;
        default:
          return " ";
      }
    }

    return "";
  },

  getImageSrc : function(row, col) {
    return row >= 0 && row < this.data.length && col.id == "remotename" && this.displayData[row].icon ? this.displayData[row].icon : "";
  },

  cycleHeader : function(col) {
    var sortDirection = col.element.getAttribute("sortDirection") == "ascending"
                     || col.element.getAttribute("sortDirection") == "natural"  ? "descending" : "ascending";
    $('remotename').setAttribute("sortDirection", "natural");
    $('remotesize').setAttribute("sortDirection", "natural");
    $('remotedate').setAttribute("sortDirection", "natural");
    $('remotetype').setAttribute("sortDirection", "natural");
    $('remoteattr').setAttribute("sortDirection", "natural");
    col.element.setAttribute(    "sortDirection", sortDirection);
    this.sort();
  },

  getCellProperties : function(row, col, props)   {
    if (row >= 0 && row < this.data.length) {
      if (col.id == "remotename") {
        if (this.data[row].isDirectory()) {
          props.AppendElement(gAtomService.getAtom("isFolder"));
        } else if (this.data[row].isSymlink()) {
          props.AppendElement(gAtomService.getAtom("isLink"));
        }

        props.AppendElement(gAtomService.getAtom("nameCol"));
      }

      if (dragObserver.overName) {
        props.AppendElement(gAtomService.getAtom("overName"));        
      }

      if (!gFtp.isConnected) {
        props.AppendElement(gAtomService.getAtom("disconnected"));        
      }
    }
  },

  // ****************************************************** updateView ***************************************************

  updateView : function(skipCache) {
    gFtp.list(gRemotePath.value, "remoteTree.updateView2()", skipCache);
  },

  updateView2 : function(files) {
    var remoteTreeItems;
    var firstSearch;

    if (!files) {
      this.searchMode = 0;
      gRemoteTreeChildren.removeAttribute('search')

      remoteTreeItems    = gFtp.listData;
      this.remoteSize    = 0;                                                                     // get directory size

      for (var x = 0; x < remoteTreeItems.length; ++x) {
        this.remoteSize += parseInt(remoteTreeItems[x].fileSize);
      }

      this.remoteSize    = parseSize(this.remoteSize);
      this.data          = remoteTreeItems;
    } else {
      if (this.remoteSize != -1) {
        this.data = new Array();
      }

      files.sort(compareName);

      for (var x = 0; x < files.length; ++x) {
        this.data.push(files[x]);
      }

      this.remoteSize  = -1;
      this.searchMode  = this.searchMode ? this.searchMode : (gSearchRecursive ? 2 : 1);
      gRemoteTreeChildren.setAttribute('search', true);
    }

    this.sort();                                                                                // update remoteTree

    var index = remoteDirTree.indexOfPath(gRemotePath.value);                                   // select directory in remoteDirTree
    remoteDirTree.selection.select(index);
    remoteDirTree.treebox.ensureRowIsVisible(index);

    if (this.data.length) {
      this.selection.select(0);                                                                 // select first element in remoteTree
    }

    this.mouseOver(null);

    if (files) {
      return;
    }

    var anyFolders = false;                                                                     // see if the folder has any subfolders
    for (var x = 0; x < this.data.length; ++x) {
      if (this.data[x].isDirectory()) {
        anyFolders = true;
        break;
      }
    }

    if (!anyFolders) {                                                                          // and if there are no subfolders then update our tree
      if (remoteDirTree.data[index].open) {                                                     // if remoteDirTree is open
        remoteDirTree.toggleOpenState(index);
      }

      remoteDirTree.data[index].empty     = true;
      remoteDirTree.data[index].open      = false;
      remoteDirTree.data[index].children  = null;

      for (var x = 0; x < remoteDirTree.dirtyList.length; ++x) {
        if (remoteDirTree.dirtyList[x] == gRemotePath.value) {
          remoteDirTree.dirtyList.splice(x, 1);
          break;
        }
      }
    } else if (anyFolders && remoteDirTree.data[index].empty) {
      remoteDirTree.data[index].empty     = false;
    }

    remoteDirTree.treebox.invalidateRow(index);
  },

  sort : function() {
    this.sortHelper($('remotename'), this.searchMode == 2 ? directorySort2 : compareName);
    this.sortHelper($('remotesize'), compareSize);
    this.sortHelper($('remotedate'), compareDate);
    this.sortHelper($('remotetype'), compareType);
    this.sortHelper($('remoteattr'), compareRemoteAttr);

    this.displayData = new Array();

    for (var row = 0; row < this.data.length; ++row) {
      this.displayData.push({ leafName : this.data[row].leafName,
                              fileSize : this.getFormattedFileSize(row),
                              date     : this.data[row].date,
                              extension: this.data[row].isDirectory() ? "" : this.getExtension(this.data[row].leafName),
                              attr     : this.data[row].permissions,
                              icon     : this.getFileIcon(row),
                              path     : this.data[row].path });
    }

    this.treebox.rowCountChanged(0, -this.rowCount);
    this.rowCount = this.data.length;
    this.treebox.rowCountChanged(0, this.rowCount);
  },

  sortHelper : function(el, sortFunc) {
    if (el.getAttribute("sortDirection") && el.getAttribute("sortDirection") != "natural") {
      this.data.sort(sortFunc);

      if (el.getAttribute("sortDirection") == "ascending") {
        this.data.reverse();
      }
    }
  },

  getFormattedFileSize : function(row) {
    if (this.data[row].fileSize == '0') {
      return "0" + (gBytesMode ? "  " : " KB  ");
    }

    if (gBytesMode) {
      return this.data[row].fileSize + "  ";
    }

    return commas(Math.floor(this.data[row].fileSize / 1024) + 1) + " KB  ";
  },

  getExtension : function(leafName) {
    return leafName.lastIndexOf(".") != -1 ? leafName.substring(leafName.lastIndexOf(".") + 1, leafName.length).toLowerCase() : "";
  },

  getFileIcon : function(row) {
    return this.data[row].isDirectory() || this.data[row].isSymlink() ? "" :  "moz-icon://" + this.data[row].leafName + "?size=16";
  },

  // ****************************************************** refresh ***************************************************

  refresh : function() {
    if (!gFtp.isConnected) {
      return;
    }

    this.data = null;                                                                           // clear remoteTree to make it look like it's refreshing
    this.treebox.rowCountChanged(0, -this.rowCount);
    this.rowCount = 0;

    if (remoteDirTree.selection.currentIndex == -1) {
      return;
    }

    if (remoteDirTree.data[remoteDirTree.selection.currentIndex].open) {                        // if remoteDirTree is open
      remoteDirTree.toggleOpenState(remoteDirTree.selection.currentIndex);                      // close it up
      remoteDirTree.data[remoteDirTree.selection.currentIndex].children = null;                 // reset its children
      gFtp.removeCacheEntry(remoteDirTree.data[remoteDirTree.selection.currentIndex].path);     // clear out cache entry
      remoteDirTree.updateViewAfter = true;                                                     // refresh remoteTree afterwards
      remoteDirTree.toggleOpenState(remoteDirTree.selection.currentIndex);                      // and open it up again
    } else {
      remoteDirTree.data[remoteDirTree.selection.currentIndex].empty    = false;                // not empty anymore
      remoteDirTree.data[remoteDirTree.selection.currentIndex].children = null;                 // reset its children
      remoteDirTree.treebox.invalidateRow(remoteDirTree.selection.currentIndex);
      this.updateView(true);
    }
  },

  // ************************************************* file functions ***************************************************

  openContainingFolder : function() {
    if (!gFtp.isReady || this.selection.currentIndex < 0 || this.selection.currentIndex >= this.rowCount) {
      return;
    }

    remoteDirTree.changeDir(this.data[this.selection.currentIndex].parent.path);
  },

  viewOnTheWeb : function() {
    if (!gFtp.isConnected || this.selection.count == 0) {
      return;
    }

    if (!gWebHost) {
      doAlert(gStrbundle.getString("fillInWebHost"));
      return;
    }

    if (this.selection.currentIndex < 0 || this.selection.currentIndex >= this.rowCount) {
      this.selection.currentIndex = this.rowCount - 1;
    }

    var path = this.data[this.selection.currentIndex].path;

    if (gPrefix && path.indexOf(gPrefix) == 0) {
      path = path.substring(gPrefix.length);
    }

    runInFirefox(gWebHost + escape(gFtp.fromUTF8.ConvertFromUnicode(path) + gFtp.fromUTF8.Finish()));
  },

  copyUrl : function(http, login) {
    if (!gFtp.isConnected || this.selection.count == 0) {
      return;
    }

    if (http && !gWebHost) {
      doAlert(gStrbundle.getString("fillInWebHost"));
      return;
    }

    if (this.selection.currentIndex < 0 || this.selection.currentIndex >= this.rowCount) {
      this.selection.currentIndex = this.rowCount - 1;
    }

    var path = this.data[this.selection.currentIndex].path;

    if (http && gPrefix && path.indexOf(gPrefix) == 0) {
      path = path.substring(gPrefix.length);
    }

    var clipboard = Components.classes["@mozilla.org/widget/clipboardhelper;1"].createInstance(Components.interfaces.nsIClipboardHelper);
    clipboard.copyString(http ? gWebHost + escape(gFtp.fromUTF8.ConvertFromUnicode(path) + gFtp.fromUTF8.Finish())
                              : 'ftp://' + (login ? encodeURIComponent(gFtp.login) + ':' + gFtp.password + '@' : '')
                                         + gFtp.host + (gFtp.port == 21 ? '' : ':' + gFtp.port) + path);
  },

  createDirectory : function() {
    if (!gFtp.isConnected || !gFtp.isReady || this.searchMode == 2) {
      return;
    }

    var dir = window.prompt(gStrbundle.getString("directoryName"), "", gStrbundle.getString("newDirectory"));

    if (!dir) {
      return;
    }

    gFtp.makeDirectory(gFtp.constructPath(gRemotePath.value, dir), gRefreshMode ? "remoteTree.refresh()" : "");
  },

  remove : function() {
    if (!gFtp.isConnected || !gFtp.isReady || this.selection.count == 0 || this.rowCount == 0) {
      return;
    }

    if (gRemoteTree.view.selection.count > 1) {                                                 // deleting multiple
      if (!window.confirm(gStrbundle.getString("confirmDelete") + " "  + gRemoteTree.view.selection.count
                  + " " + gStrbundle.getString("confirmDelete2"))) {
        return;
      }
    } else if (this.data[gRemoteTree.view.selection.currentIndex].isDirectory()) {              // deleting a directory
      if (!window.confirm(gStrbundle.getString("confirmDelete") + " '" + this.data[gRemoteTree.view.selection.currentIndex].leafName
                 + "' " + gStrbundle.getString("confirmDelete3"))) {
        return;
      }
    } else {                                                                                    // deleting a file
      if (!window.confirm(gStrbundle.getString("confirmDelete") + " '" + this.data[gRemoteTree.view.selection.currentIndex].leafName
                  + "'" + gStrbundle.getString("confirmDelete4"))) {
        return;
      }
    }

    var last  = true;

    gFtp.beginCmdBatch();

    for (var x = 0; x < this.rowCount; ++x) {
      if (this.selection.isSelected(x)) {
        if (last) {
          gFtp.changeWorkingDirectory(gRemotePath.value);
        }

        gFtp.remove(this.data[x].isDirectory(),
                    this.data[x].path,
                    (last && gRefreshMode) ? "remoteTree.refresh()" : "");
        last = false;
      }
    }

    gFtp.endCmdBatch();
  },

  rename : function() {
    if (!gFtp.isConnected || !gFtp.isReady || this.selection.count == 0 || this.rowCount == 0) {
      return;
    }

    if (this.selection.currentIndex < 0 || this.selection.currentIndex >= this.rowCount) {
      this.selection.currentIndex = this.rowCount - 1;
    }

    var path = this.data[this.selection.currentIndex].path;

    var newName = window.prompt(gStrbundle.getString("renameTo"), path.substring(path.lastIndexOf('/') + 1), gStrbundle.getString("rename"));

    if (!newName) {
      return;
    }

    for (var x = 0; x < this.rowCount; ++x) {
      if (this.data[x].leafName == newName) {
        error(gStrbundle.getString("renameFail"));
        return;
      }
    }

    if (path.charAt(path.length - 1) == '/') {
      path = path.substring(path.length - 1);
    }

    newName = path.substring(0, path.lastIndexOf('/')) + '/' + newName;

    gFtp.rename(path, newName, gRefreshMode ? "remoteTree.refresh()" : "", this.data[this.selection.currentIndex].isDirectory());
  },

  showProperties : function(recursive) {
    if (!gFtp.isConnected || !gFtp.isReady || this.selection.count == 0 || this.rowCount == 0) {
      return;
    }

    if (this.selection.currentIndex < 0 || this.selection.currentIndex >= this.rowCount) {
      this.selection.currentIndex = this.rowCount - 1;
    }

    this.recursiveFolderData = { type: "remote", nFolders: 0, nFiles: 0, nSize: 0, files: new Array() };

    if (this.selection.count > 1) {                                                             // multiple files
      var last = true;

      for (var x = 0; x < this.rowCount; ++x) {
        if (this.selection.isSelected(x)) {
          if (this.data[x].isDirectory()) {
            ++this.recursiveFolderData.nFolders;

            if (recursive) {
              var remotePath = this.data[x].path;

              if (last) {
                gFtp.beginCmdBatch();
              }

              gFtp.list(remotePath, "remoteTree.getRecursiveFolderData('" + remotePath.replace(/'/g, "\\'") + "'," + last + ")", true, true);
              last = false;
            }

          } else {
            ++this.recursiveFolderData.nFiles;
          }

          this.recursiveFolderData.files.push(this.data[x]);
          this.recursiveFolderData.nSize += parseInt(this.data[x].fileSize);
        }
      }

      if (last) {
        this.showMultipleProperties();
      } else {
        gFtp.endCmdBatch();
      }

      return;
    }

    var index = this.selection.currentIndex;
    var path  = this.data[index].path;

    if (this.data[index].isDirectory() && recursive) {                                          // directory
      gFtp.list(path, "remoteTree.getRecursiveFolderData('" + path.replace(/'/g, "\\'") + "', true, true)", true);
      this.recursiveFolderData.nSize += parseInt(this.data[index].fileSize);
      return;
    }

    var params = { path            : path,
                   leafName        : this.data[index].leafName,
                   fileSize        : this.data[index].fileSize,
                   date            : this.data[index].date,
                   origPermissions : this.data[index].permissions,
                   writable        : 'disabled',
                   hidden          : 'disabled',
                   isDirectory     : this.data[index].isDirectory(),
                   user            : this.data[index].user,
                   group           : this.data[index].group,
                   permissions     : "",
                   webHost         : gWebHost,
                   prefix          : gPrefix,
                   isSymlink       : this.data[index].isSymlink(),
                   symlink         : this.data[index].symlink };

    window.openDialog("chrome://fireftp/content/properties.xul", "properties", "chrome,modal,dialog,resizable,centerscreen", params);

    if (params.permissions && gFtp.isConnected && gFtp.isReady) {                               // permissions were changed; CHMOD!
      gFtp.changePermissions(params.permissions, path, gRefreshMode ? "remoteTree.refresh()" : "");
    }
  },

  recursiveFolderData    : new Object(),
  getRecursiveFolderData : function(parent, last, showDir) {
    var files = gFtp.listData;

    for (var x = 0; x < files.length; ++x) {
      var remotePath = gFtp.constructPath(parent, files[x].leafName);

      if (files[x].isDirectory()) {
        ++this.recursiveFolderData.nFolders;
        gFtp.list(remotePath, "remoteTree.getRecursiveFolderData('" + remotePath.replace(/'/g, "\\'") + "'," + last + "," + showDir + ")", true, true);
        last = false;
      } else {
        ++this.recursiveFolderData.nFiles;
      }

      this.recursiveFolderData.files.push(files[x]);
      this.recursiveFolderData.nSize += parseInt(files[x].fileSize);
    }

    if (last) {
      this.showMultipleProperties(showDir);
    }
  },

  showMultipleProperties : function(dir) {
    var params;
    var path;

    if (dir) {
      var index = this.selection.currentIndex;
      path      = this.data[index].path;

      params = { path                : path,
                 leafName            : this.data[index].leafName,
                 fileSize            : 0,
                 date                : this.data[index].date,
                 origPermissions     : this.data[index].permissions,
                 writable            : 'disabled',
                 hidden              : 'disabled',
                 isDirectory         : this.data[index].isDirectory(),
                 user                : this.data[index].user,
                 group               : this.data[index].group,
                 permissions         : "",
                 isSymlink           : this.data[index].isSymlink(),
                 symlink             : this.data[index].symlink,
                 multipleFiles       : false,
                 recursiveFolderData : this.recursiveFolderData,
                 applyTo             : { type: "remote", thisFile: true, folders: false, files: false } };
    } else {
      params = { multipleFiles       : true,
                 recursiveFolderData : this.recursiveFolderData,
                 permissions         : "",
                 applyTo             : { folders: false, files: true } };
    }

    window.openDialog("chrome://fireftp/content/properties.xul", "properties", "chrome,modal,dialog,resizable,centerscreen", params);

    if (params.permissions && gFtp.isConnected) {                                               // permissions were changed; CHMOD!
      var last = true;

      gFtp.beginCmdBatch();

      if (dir && params.applyTo.thisFile) {
        gFtp.changePermissions(params.permissions, path, gRefreshMode ? "remoteTree.refresh()" : "");
        last = false;
      }

      for (var x = 0; x < this.recursiveFolderData.files.length; ++x) {
        if ((this.recursiveFolderData.files[x].isDirectory() && params.applyTo.folders)
        || (!this.recursiveFolderData.files[x].isDirectory() && params.applyTo.files)) {
          gFtp.changePermissions(params.permissions, this.recursiveFolderData.files[x].path, (last && gRefreshMode) ? "remoteTree.refresh()" : "");
          last = false;
        }
      }

      gFtp.endCmdBatch();
    }
  },

  // ************************************************* mouseEvent *****************************************************

  dblClick : function(event) {
    if (!gFtp.isConnected || event.button != 0 || event.originalTarget.localName != "treechildren" || this.selection.count == 0) {
      return;
    }

    if (this.selection.currentIndex < 0 || this.selection.currentIndex >= this.rowCount) {
      this.selection.currentIndex = this.rowCount - 1;
    }

    if (this.data[this.selection.currentIndex].isDirectory()) {                                 // if it's a directory
      if (!gFtp.isReady) {
        return;
      }
                                                                                                // navigate to it
      remoteDirTree.changeDir(this.data[this.selection.currentIndex].path);
    } else if (this.data[this.selection.currentIndex].isSymlink()) {                            // if it's a symbolic link
      if (gFtp.isListing()) {
        return;
      }

      var linkedPath = this.data[this.selection.currentIndex].path;
      var linkedFile = this.data[this.selection.currentIndex].symlink;
      var parentPath = gRemotePath.value;

      while (linkedFile.indexOf("./") == 0 || linkedFile.indexOf("../") == 0) {
        if (linkedFile.indexOf("./") == 0) {
          linkedFile = linkedFile.substring(2);
        } else {
          linkedFile = linkedFile.substring(3);
          parentPath = parentPath.substring(0, parentPath.lastIndexOf('/') ? parentPath.lastIndexOf('/') : 1);
        }
      }

      if (linkedFile.indexOf("/") != 0) {
        linkedFile = gFtp.constructPath(parentPath, linkedFile);
      }

      parentPath = linkedFile.substring(0, linkedFile.lastIndexOf('/') ? linkedFile.lastIndexOf('/') : 1);

      var self    = this;
      var cwdFunc = function(success) {
        if (success) {
          return;
        }

        var cwd2Func = function(success2) {
          var listFunc = function() {
            for (var x = 0; x < gFtp.listData.length; ++x) {
              if (gFtp.listData[x].path == linkedFile) {
                new transfer().start(true, gFtp.listData[x], '', parentPath);
                return;
              }
            }

            gFtp.changeWorkingDirectory(linkedPath);
          };

          if (success2) {
            gFtp.list(parentPath, listFunc);
          } else {
            gFtp.changeWorkingDirectory(linkedPath);
          }
        };

        if (gFtp.currentWorkingDir != parentPath) {
          gFtp.changeWorkingDirectory(parentPath, cwd2Func);
        } else {
          cwd2Func(true);
        }
      };

      if (gFtp.currentWorkingDir != linkedFile) {
        gFtp.changeWorkingDirectory(linkedFile, cwdFunc);
      } else {
        remoteDirTree.changeDir(gFtp.currentWorkingDir);
      }
    } else {
      new transfer().start(true);                                                               // else download the file
    }
  },

  click : function(event) {
    if (gFtp.isConnected && event.button == 1 && !$('remotePasteContext').disabled) {           // middle-click paste
      this.paste();
    }
  },

  createContextMenu : function() {
    if (this.selection.currentIndex < 0 || this.selection.currentIndex >= this.rowCount) {
      this.selection.currentIndex = this.rowCount - 1;
    }

    for (var x = $('remoteOpenWithMenu').childNodes.length - 1; x >= 0; --x) {                  // clear out the menu
      $('remoteOpenWithMenu').removeChild($('remoteOpenWithMenu').childNodes.item(x));
    }

    $('remoteOpenCont').collapsed    =               this.searchMode != 2;
    $('remoteOpenContSep').collapsed =               this.searchMode != 2;
    $('remoteCutContext').setAttribute("disabled",   this.searchMode == 2);
    $('remotePasteContext').setAttribute("disabled", this.searchMode == 2 || !this.pasteFiles.length);
    $('remoteCreateDir').setAttribute("disabled",    this.searchMode == 2);

    if (this.selection.currentIndex == -1) {
      return;
    }

    var hasDir = false;
    for (var x = 0; x < this.rowCount; ++x) {
      if (this.selection.isSelected(x)) {
        if (this.data[x].isDirectory()) {
          hasDir = true;
          break;
        }
      }
    }

    $('remoteRecursiveProperties').setAttribute("disabled", !hasDir);

    var extension = this.getExtension(this.data[this.selection.currentIndex].leafName);
    var item;
    var found     = false;

    var self = this;
    var contextMenuHelper = function(x, y) {
      found = true;
      var program = localFile.init(gPrograms[x].programs[y].executable);

      if (!program) {
        return;
      }

      var fileURI = gIos.newFileURI(program);
      item        = document.createElement("menuitem");
      item.setAttribute("class",     "menuitem-iconic");
      item.setAttribute("image",     "moz-icon://" + fileURI.spec + "?size=16");
      item.setAttribute("label",     gPrograms[x].programs[y].name);
      item.setAttribute("oncommand", "remoteLaunchProgram(" + x + ", " + y + ", " + self.selection.currentIndex + ")");
      $('remoteOpenWithMenu').appendChild(item);
    };

    for (var x = 0; x < gPrograms.length; ++x) {
      if (gPrograms[x].extension.toLowerCase() == extension.toLowerCase()) {
        for (var y = 0; y < gPrograms[x].programs.length; ++y) {
          contextMenuHelper(x, y);
        }

        break;
      }
    }

    for (var x = 0; x < gPrograms.length; ++x) {
      if (gPrograms[x].extension == "*.*") {
        for (var y = 0; y < gPrograms[x].programs.length; ++y) {
          contextMenuHelper(x, y);
        }

        break;
      }
    }

    if (found) {
      item = document.createElement("menuseparator");
      $('remoteOpenWithMenu').appendChild(item);
    }

    item = document.createElement("menuitem");
    item.setAttribute("label", gStrbundle.getString("chooseProgram"));
    item.setAttribute("oncommand", "chooseProgram()");
    $('remoteOpenWithMenu').appendChild(item);
  },

  mouseOver : function(event) {                                                                 // display remote folder info
    if (this.rowCount) {
      $('statustxt').label = gStrbundle.getString("remoteListing") + " " + this.rowCount + " "
                           + gStrbundle.getString("objects")       + (this.remoteSize < 0 ? "" : ", " + commas(this.remoteSize));
    } else {
      $('statustxt').label = gStrbundle.getString("remoteListingNoObjects");
    }
  },

  // ************************************************* keyEvent *****************************************************

  keyPress : function(event) {
    if (!gFtp.isConnected) {
      return;
    }

    if (this.selection.currentIndex < 0 || this.selection.currentIndex >= this.rowCount) {
      this.selection.currentIndex = this.rowCount - 1;
    }

    if (event.keyCode == 13 && this.selection.count != 0) {                                     // enter
      if (this.selection.count == 1 && this.data[this.selection.currentIndex].isDirectory()) {  // if it's a directory
        if (!gFtp.isReady) {
          return;
        }
                                                                                                // navigate to it
        remoteDirTree.changeDir(this.data[this.selection.currentIndex].path);
      } else {
        new transfer().start(true);                                                             // else retrieve a file
      }
    } else if (event.ctrlKey && (event.which == 65 || event.which == 97)) {
      event.preventDefault();                                                                   // ctrl-a: select all
      this.selection.selectAll();
    } else if (event.ctrlKey && event.which == 32 && this.selection.count != 0) {               // ctrl-space, select or deselect
      this.selection.toggleSelect(this.selection.currentIndex);
    } else if (event.keyCode  == 8) {                                                           // backspace
      event.preventDefault();
      remoteDirTree.cdup();
    } else if (event.keyCode  == 116) {                                                         // F5
      event.preventDefault();
      this.refresh();
    } else if (event.keyCode  == 113 && this.selection.count != 0) {                            // F2
      this.rename();
    } else if (event.charCode == 100 && event.ctrlKey) {                                        // ctrl-d
      event.preventDefault();
      this.createDirectory();
    } else if (event.keyCode  == 46 && this.selection.count != 0) {                             // del
      this.remove();
    } else if (event.keyCode  == 93) {                                                          // display context menu
      var x = {};    var y = {};    var width = {};    var height = {};
      this.treebox.getCoordsForCellItem(this.selection.currentIndex, this.treebox.columns["remotename"], "text", x, y, width, height);
      $('remotemenu').showPopup(gRemoteTreeChildren, gRemoteTreeChildren.boxObject.x + 75, gRemoteTreeChildren.boxObject.y + y.value + 5, "context");
    } else if (event.charCode == 112 && event.ctrlKey && this.selection.count != 0) {           // ctrl-p
      event.preventDefault();
      this.showProperties(false);
    } else if (event.charCode == 120 && event.ctrlKey && this.selection.count != 0) {           // ctrl-x
      event.preventDefault();
      this.cut();
    } else if (event.charCode == 118 && event.ctrlKey) {                                        // ctrl-v
      event.preventDefault();
      this.paste();
    } else if (event.charCode == 111 && event.ctrlKey) {                                        // ctrl-o
      event.preventDefault();
      this.viewOnTheWeb();
    } else if (event.charCode == 117 && event.ctrlKey) {                                        // ctrl-u
      event.preventDefault();
      this.copyUrl(true);
    }
  },

  // ************************************************* cut, copy, paste *****************************************************

  pasteFiles : new Array(),
  oldParent  : "",

  cut : function() {
    if (!gFtp.isConnected || this.selection.count == 0 || this.searchMode == 2) {
      return;
    }

    this.pasteFiles = new Array();
    this.oldParent  = gRemotePath.value;

    for (var x = 0; x < this.rowCount; ++x) {                                                   // put files to be cut/copied in an array to be pasted
      if (this.selection.isSelected(x)) {
        this.pasteFiles.push(this.data[x]);
      }
    }

    $('remotePasteContext').setAttribute("disabled", false);                                    // enable pasting
  },

  paste : function(dest) {
    if (!gFtp.isConnected || this.pasteFiles.length == 0 || this.searchMode == 2) {
      return;
    }

    var newParent = dest ? dest          : gRemotePath.value;
    var files     = dest ? gFtp.listData : this.data;

    for (var x = 0; x < this.pasteFiles.length; ++x) {
      var newParentSlash = newParent               + (newParent.charAt(newParent.length - 1)                             != "/" ? "/" : '');
      var pasteFileSlash = this.pasteFiles[x].path + (this.pasteFiles[x].path.charAt(this.pasteFiles[x].path.length - 1) != "/" ? "/" : '');

      if (this.pasteFiles[x].isDirectory() && newParentSlash.indexOf(pasteFileSlash) == 0) {    // can't copy into a subdirectory of itself
        doAlert(gStrbundle.getString("copySubdirectory"));
        return;
      }
    }

    var prompt     = true;
    var skipAll    = false;
    var anyFolders = false;

    gFtp.beginCmdBatch();

    if (!dest) {
      gFtp.changeWorkingDirectory(newParent);
    }

    for (var x = 0; x < this.pasteFiles.length; ++x) {
      var newPath     = gFtp.constructPath(newParent, this.pasteFiles[x].leafName);
      var exists      = false;
      var isDirectory = false;
      var newFile;

      if (this.pasteFiles[x].isDirectory()) {
        anyFolders = true;
      }

      for (var y = 0; y < files.length; ++y) {
        if (files[y].leafName == this.pasteFiles[x].leafName) {
          exists      = true;
          newFile     = files[y];
          isDirectory = files[y].isDirectory();
          break;
        }
      }

      if (exists && skipAll) {
        continue;
      }

      if (exists && (isDirectory || this.pasteFiles[x].isDirectory())) {
        error(gStrbundle.getString("pasteErrorFile") + ' ' + this.pasteFiles[x].path + '.');
        continue;
      }

      if (exists && prompt) {
        var params = { response         : 0,
                       fileName         : newPath,
                       resume           : true,
                       replaceResume    : true,
                       existingSize     : newFile.fileSize,
                       existingDate     : newFile.lastModifiedTime,
                       newSize          : this.pasteFiles[x].fileSize,
                       newDate          : this.pasteFiles[x].lastModifiedTime,
                       timerEnable      : false };

        window.openDialog("chrome://fireftp/content/confirmFile.xul", "confirmFile", "chrome,modal,dialog,resizable,centerscreen", params);

        if (params.response == 2) {
          prompt = false;
        } else if (params.response == 3) {
          continue;
        } else if (params.response == 4 || params.response == 0) {
          return;
        } else if (params.response == 5) {
          skipAll = true;
          continue;
        }
      }

      if (exists) {
        gFtp.remove(false, newPath);
      }

      var self          = this;
      var oldParent     = this.oldParent;
      var pasteCallback = function() { self.pasteCallback(oldParent, newParent, anyFolders, dest); };
      gFtp.rename(this.pasteFiles[x].path, newPath, x == this.pasteFiles.length - 1 && gRefreshMode ? pasteCallback : "", this.pasteFiles[x].isDirectory());
    }

    this.pasteFiles = new Array();
    $('remotePasteContext').setAttribute("disabled", true);

    gFtp.endCmdBatch();
  },

  pasteCallback : function(oldParent, newParent, anyFolders, dest) {
    remoteDirTree.addDirtyList(oldParent);
    remoteDirTree.addDirtyList(newParent);

    if (anyFolders) {
      var refreshIndex = dest ? remoteDirTree.indexOfPath(newParent) : remoteDirTree.indexOfPath(oldParent);

      if (refreshIndex != -1) {
        if (remoteDirTree.data[refreshIndex].open) {
          var self           = this;
          var pasteCallback2 = function() { self.pasteCallback2(oldParent, newParent, dest); };
          remoteDirTree.extraCallback = pasteCallback2;

          remoteDirTree.toggleOpenState(refreshIndex, true);                                       // close it up
          remoteDirTree.data[refreshIndex].children = null;                                        // reset its children
          remoteDirTree.toggleOpenState(refreshIndex);                                             // and open it up again
          return;
        } else {
          remoteDirTree.data[refreshIndex].children = null;                                        // reset its children
          remoteDirTree.data[refreshIndex].empty    = false;
          remoteDirTree.treebox.invalidateRow(refreshIndex);
        }

        var refreshIndex2 = dest ? remoteDirTree.indexOfPath(oldParent) : remoteDirTree.indexOfPath(newParent);

        if (refreshIndex2 == -1) {
          remoteDirTree.changeDir(dest ? oldParent : newParent);
          return;
        } else {
          remoteDirTree.selection.select(refreshIndex2);
        }
      }
    }

    remoteTree.refresh();
  },

  pasteCallback2 : function(oldParent, newParent, dest) {
    var refreshIndex2 = dest ? remoteDirTree.indexOfPath(oldParent) : remoteDirTree.indexOfPath(newParent);

    if (refreshIndex2 == -1) {
      remoteDirTree.changeDir(dest ? oldParent : newParent);
      return;
    } else {
      remoteDirTree.selection.select(refreshIndex2);
    }

    remoteTree.refresh();
  },

  canDrop : function(index, orient) {
    if (!gFtp.isConnected || index == -1 || !this.data[index].isDirectory() || !dragObserver.origin) {
      return false;
    }

    if (dragObserver.origin == 'remotetreechildren') {                                          // don't drag onto itself
      for (var x = 0; x < this.rowCount; ++x) {
        if (this.selection.isSelected(x) && index == x) {
          return false;
        }
      }
    }

    return true;
  },

  drop : function(index, orient) {
    if (dragObserver.origin == 'remotetreechildren') {
      this.cut();

      var self = this;
      var path = this.data[index].path;
      var func = function() { self.paste(path); };
      gFtp.list(this.data[index].path, func, true);
    } else if (dragObserver.origin == 'localtreechildren') {
      if (!dragObserver.overName || index == -1 || !this.data[index].isDirectory()) {
        new transfer().start(false);
      } else {
        var self                  = this;
        var path                  = this.data[index].path;
        var transferObj           = new transfer();
        transferObj.remoteRefresh = gRemotePath.value;
        var func                  = function() { transferObj.start(false, '', '', path); };
        gFtp.list(this.data[index].path, func, true);
      }
    } else if (dragObserver.origin == 'external') {
      var regular               = !dragObserver.overName || index == -1 || !this.data[index].isDirectory();
      var transferObj           = new transfer();
      transferObj.remoteRefresh = gRemotePath.value;

      for (var x = 0; x < dragObserver.externalFiles.length; ++x) {
        var droppedFile    = dragObserver.externalFiles[x];
        var fileParent     = droppedFile.parent ? droppedFile.parent.path : "";

        if (regular) {
          transferObj.start(false, droppedFile, fileParent, gRemotePath.value);
        } else {
          this.dropHelper(transferObj, droppedFile, fileParent, index);
        }

        if (transferObj.cancel) {
          break;
        }
      }
    }
  },

  dropHelper : function(transferObj, droppedFile, fileParent, index) {
    var self       = this;
    var remotePath = this.data[index].path;
    var func       = function() { transferObj.start(false, droppedFile, fileParent, remotePath); };
    gFtp.list(this.data[index].path, func, true);
  }
};
