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
 * The Original Code is Mozilla.org.
 *
 * The Initial Developer of the Original Code is
 * Neil Marshall.
 * Portions created by the Initial Developer are Copyright (C) 2003
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Neil Marshall (neil.marshall@sympatico.ca), Original author
 *   Daniel Glazman (glazman@disruptive-innovations.com), on behalf of Linspire Inc.
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

var colours;
var satSlider = new objColour();
var hexChars = "0123456789ABCDEF";
var selectedColour = 0;
var mouseDown = false;
var eventInitiator = null;
var mouseX, mouseY, offsetLeft, offsetTop;

var gColor = "";
var LastPickedColor = "";
var ColorType = "Text";
var TextType = false;
var HighlightType = false;
var TableOrCell = false;
var LastPickedIsDefault = false;
var NoDefault = false;
var gColorObj;

var namedColorsArray = [
  { name:"aqua",     value:"#00ffff" },
  { name:"black",    value:"#000000" },
  { name:"blue",     value:"#0000ff" },
  { name:"fuchsia",  value:"#ff00ff" },
  { name:"gray",     value:"#808080" },
  { name:"green",    value:"#008000" },
  { name:"lime",     value:"#00ff00" },
  { name:"maroon",   value:"#800000" },
  { name:"navy",     value:"#000080" },
  { name:"olive",    value:"#808000" },
  /* { name:"orange",   value:"#FFA500" },   Kaze: 'orange' is not a standard HTML 4 color */ 
  { name:"purple",   value:"#800080" },
  { name:"red",      value:"#ff0000" },
  { name:"silver",   value:"#c0c0c0" },
  { name:"teal",     value:"#008080" },
  { name:"white",    value:"#ffffff" },
  { name:"yellow",   value:"#ffff00" }
  ];

// Kaze: refer to this array to transform non-HTML4 colors into hex values
var namedColorsArrayNonStandard = [
  { name:"AliceBlue",             value:"#F0F8FF" },
  { name:"AntiqueWhite",          value:"#FAEBD7" },
  { name:"Aqua",                  value:"#00FFFF" },
  { name:"Aquamarine",            value:"#7FFFD4" },
  { name:"Azure",                 value:"#F0FFFF" },
  { name:"Beige",                 value:"#F5F5DC" },
  { name:"Bisque",                value:"#FFE4C4" },
  { name:"Black",                 value:"#000000" },
  { name:"BlanchedAlmond",        value:"#FFEBCD" },
  { name:"Blue",                  value:"#0000FF" },
  { name:"BlueViolet",            value:"#8A2BE2" },
  { name:"Brown",                 value:"#A52A2A" },
  { name:"BurlyWood",             value:"#DEB887" },
  { name:"CadetBlue",             value:"#5F9EA0" },
  { name:"Chartreuse",            value:"#7FFF00" },
  { name:"Chocolate",             value:"#D2691E" },
  { name:"Coral",                 value:"#FF7F50" },
  { name:"CornflowerBlue",        value:"#6495ED" },
  { name:"Cornsilk",              value:"#FFF8DC" },
  { name:"Crimson",               value:"#DC143C" },
  { name:"Cyan",                  value:"#00FFFF" },
  { name:"DarkBlue",              value:"#00008B" },
  { name:"DarkCyan",              value:"#008B8B" },
  { name:"DarkGoldenRod",         value:"#B8860B" },
  { name:"DarkGray",              value:"#A9A9A9" },
  { name:"DarkGreen",             value:"#006400" },
  { name:"DarkKhaki",             value:"#BDB76B" },
  { name:"DarkMagenta",           value:"#8B008B" },
  { name:"DarkOliveGreen",        value:"#556B2F" },
  { name:"Darkorange",            value:"#FF8C00" },
  { name:"DarkOrchid",            value:"#9932CC" },
  { name:"DarkRed",               value:"#8B0000" },
  { name:"DarkSalmon",            value:"#E9967A" },
  { name:"DarkSeaGreen",          value:"#8FBC8F" },
  { name:"DarkSlateBlue",         value:"#483D8B" },
  { name:"DarkSlateGray",         value:"#2F4F4F" },
  { name:"DarkTurquoise",         value:"#00CED1" },
  { name:"DarkViolet",            value:"#9400D3" },
  { name:"DeepPink",              value:"#FF1493" },
  { name:"DeepSkyBlue",           value:"#00BFFF" },
  { name:"DimGray",               value:"#696969" },
  { name:"DodgerBlue",            value:"#1E90FF" },
  { name:"Feldspar",              value:"#D19275" },
  { name:"FireBrick",             value:"#B22222" },
  { name:"FloralWhite",           value:"#FFFAF0" },
  { name:"ForestGreen",           value:"#228B22" },
  { name:"Fuchsia",               value:"#FF00FF" },
  { name:"Gainsboro",             value:"#DCDCDC" },
  { name:"GhostWhite",            value:"#F8F8FF" },
  { name:"Gold",                  value:"#FFD700" },
  { name:"GoldenRod",             value:"#DAA520" },
  { name:"Gray",                  value:"#808080" },
  { name:"Green",                 value:"#008000" },
  { name:"GreenYellow",           value:"#ADFF2F" },
  { name:"HoneyDew",              value:"#F0FFF0" },
  { name:"HotPink",               value:"#FF69B4" },
  { name:"IndianRed ",            value:"#CD5C5C" },
  { name:"Indigo ",               value:"#4B0082" },
  { name:"Ivory",                 value:"#FFFFF0" },
  { name:"Khaki",                 value:"#F0E68C" },
  { name:"Lavender",              value:"#E6E6FA" },
  { name:"LavenderBlush",         value:"#FFF0F5" },
  { name:"LawnGreen",             value:"#7CFC00" },
  { name:"LemonChiffon",          value:"#FFFACD" },
  { name:"LightBlue",             value:"#ADD8E6" },
  { name:"LightCoral",            value:"#F08080" },
  { name:"LightCyan",             value:"#E0FFFF" },
  { name:"LightGoldenRodYellow",  value:"#FAFAD2" },
  { name:"LightGrey",             value:"#D3D3D3" },
  { name:"LightGreen",            value:"#90EE90" },
  { name:"LightPink",             value:"#FFB6C1" },
  { name:"LightSalmon",           value:"#FFA07A" },
  { name:"LightSeaGreen",         value:"#20B2AA" },
  { name:"LightSkyBlue",          value:"#87CEFA" },
  { name:"LightSlateBlue",        value:"#8470FF" },
  { name:"LightSlateGray",        value:"#778899" },
  { name:"LightSteelBlue",        value:"#B0C4DE" },
  { name:"LightYellow",           value:"#FFFFE0" },
  { name:"Lime",                  value:"#00FF00" },
  { name:"LimeGreen",             value:"#32CD32" },
  { name:"Linen",                 value:"#FAF0E6" },
  { name:"Magenta",               value:"#FF00FF" },
  { name:"Maroon",                value:"#800000" },
  { name:"MediumAquaMarine",      value:"#66CDAA" },
  { name:"MediumBlue",            value:"#0000CD" },
  { name:"MediumOrchid",          value:"#BA55D3" },
  { name:"MediumPurple",          value:"#9370D8" },
  { name:"MediumSeaGreen",        value:"#3CB371" },
  { name:"MediumSlateBlue",       value:"#7B68EE" },
  { name:"MediumSpringGreen",     value:"#00FA9A" },
  { name:"MediumTurquoise",       value:"#48D1CC" },
  { name:"MediumVioletRed",       value:"#C71585" },
  { name:"MidnightBlue",          value:"#191970" },
  { name:"MintCream",             value:"#F5FFFA" },
  { name:"MistyRose",             value:"#FFE4E1" },
  { name:"Moccasin",              value:"#FFE4B5" },
  { name:"NavajoWhite",           value:"#FFDEAD" },
  { name:"Navy",                  value:"#000080" },
  { name:"OldLace",               value:"#FDF5E6" },
  { name:"Olive",                 value:"#808000" },
  { name:"OliveDrab",             value:"#6B8E23" },
  { name:"Orange",                value:"#FFA500" },
  { name:"OrangeRed",             value:"#FF4500" },
  { name:"Orchid",                value:"#DA70D6" },
  { name:"PaleGoldenRod",         value:"#EEE8AA" },
  { name:"PaleGreen",             value:"#98FB98" },
  { name:"PaleTurquoise",         value:"#AFEEEE" },
  { name:"PaleVioletRed",         value:"#D87093" },
  { name:"PapayaWhip",            value:"#FFEFD5" },
  { name:"PeachPuff",             value:"#FFDAB9" },
  { name:"Peru",                  value:"#CD853F" },
  { name:"Pink",                  value:"#FFC0CB" },
  { name:"Plum",                  value:"#DDA0DD" },
  { name:"PowderBlue",            value:"#B0E0E6" },
  { name:"Purple",                value:"#800080" },
  { name:"Red",                   value:"#FF0000" },
  { name:"RosyBrown",             value:"#BC8F8F" },
  { name:"RoyalBlue",             value:"#4169E1" },
  { name:"SaddleBrown",           value:"#8B4513" },
  { name:"Salmon",                value:"#FA8072" },
  { name:"SandyBrown",            value:"#F4A460" },
  { name:"SeaGreen",              value:"#2E8B57" },
  { name:"SeaShell",              value:"#FFF5EE" },
  { name:"Sienna",                value:"#A0522D" },
  { name:"Silver",                value:"#C0C0C0" },
  { name:"SkyBlue",               value:"#87CEEB" },
  { name:"SlateBlue",             value:"#6A5ACD" },
  { name:"SlateGray",             value:"#708090" },
  { name:"Snow",                  value:"#FFFAFA" },
  { name:"SpringGreen",           value:"#00FF7F" },
  { name:"SteelBlue",             value:"#4682B4" },
  { name:"Tan",                   value:"#D2B48C" },
  { name:"Teal",                  value:"#008080" },
  { name:"Thistle",               value:"#D8BFD8" },
  { name:"Tomato",                value:"#FF6347" },
  { name:"Turquoise",             value:"#40E0D0" },
  { name:"Violet",                value:"#EE82EE" },
  { name:"VioletRed",             value:"#D02090" },
  { name:"Wheat",                 value:"#F5DEB3" },
  { name:"White",                 value:"#FFFFFF" },
  { name:"WhiteSmoke",            value:"#F5F5F5" },
  { name:"Yellow",                value:"#FFFF00" },
  { name:"YellowGreen",           value:"#9ACD32" }
 ];

// * utility function to convert predefined HTML4 color names
//   into their #rrggbb equivalent and back
function getHexColorFromColorName(color)
{
  color = color.toLowerCase();
  for (var i=0; i< namedColorsArray.length; i++) {
    if (color == namedColorsArray[i].name) {
      return namedColorsArray[i].value;
    }
  }
  // <Kaze> look in the non-standard array as well
  for (i=0; i< namedColorsArrayNonStandard.length; i++) {
    if (color == namedColorsArrayNonStandard[i].name.toLowerCase()) {
      return namedColorsArrayNonStandard[i].value.toLowerCase();
    }
  }
  // </Kaze>
  return null;
}

function getColorNameFromHexColor(color)
{
  color = color.toLowerCase();
  for (var i=0; i< namedColorsArray.length; i++) {
    if (color == namedColorsArray[i].value) {
      return namedColorsArray[i].name;
    }
  }
  return null;
}

function makeDraggable(obj)
{
   obj.onmousedown = startDrag;
   obj.onmousemove = moveDrag;
   obj.onmouseup = endDrag;
}

function computeOffsets(t)
{
  offsetLeft = 0;
  offsetTop = 0;
  while (t && !(t instanceof XULElement))
  {
    offsetLeft += t.offsetLeft;
    offsetTop  += t.offsetTop;
    t = t.parentNode;
  }
}

function startDrag(e)
{
   mouseDown = true;

   var target = e.target;
   if (target.id == "hueAndSaturationCrosshair")
     target = target.parentNode;

   eventInitiator = target;
   computeOffsets(target);
   mouseX = e.clientX - offsetLeft + 1;
   mouseY = e.clientY - offsetTop + 1;

   handleValueChange(target);
   e.preventDefault();

}

function moveDrag(e)
{
   var target = e.target;
   if (target.id == "hueAndSaturationCrosshair")
     target = target.parentNode;

   if (mouseDown && target == eventInitiator)
   {
      computeOffsets(target);
      mouseX = e.clientX - offsetLeft  + 1;
      mouseY = e.clientY - offsetTop  + 1;

      mouseX = Math.max(0, Math.min(mouseX, 199));
      mouseY = Math.max(0, Math.min(mouseY, 199));

      handleValueChange(target);
   }
}

function endDrag(e)
{

   mouseDown = false;
   eventInitiator = null;
   handleValueChange(e.target);
   e.preventDefault();
}

function handleValueChange(obj)
{
   var sWidth = 200;

   if (obj.id == "brightnessImg")
   { 
         bVal = mouseX * 255 / sWidth;
         h = colours.getHue();
         s = colours.getSaturation();
         colours.setHSB(h, s, bVal);
         redrawEverything();
   }
   else if (obj.id == "hueAndSaturationImg")
   {
         hVal = mouseX * 360 / sWidth;
         sVal = (200 - mouseY) * 100 / sWidth;
         b = colours.getBrightness();
         if (!b)
           b = 1;
         colours.setHSB(hVal, sVal/100, b);
         redrawEverything();
   }
}

function checkRange(value, min, max)
{
  return Math.max(min, Math.min(value, max));
}

// the user has changed the RGB textboxes
function changeRGB()
{

   var red   = gDialog.red;
   var green = gDialog.green;
   var blue  = gDialog.blue;

   // XXX Check for numbers
   red.value   = checkRange(red.value, 0, 255);
   green.value = checkRange(green.value, 0, 255);
   blue.value  = checkRange(blue.value, 0, 255);

   colours.setRGB(red.value, green.value, blue.value);
   redrawEverything();
}

function changeHSB()
{
   var hue        = gDialog.hue;
   var saturation = gDialog.saturation;
   var brightness = gDialog.brightness;

   // XXX Check for letters
   brightness.value = checkRange(brightness.value, 0, 255);
   saturation.value = checkRange(saturation.value, 0, 100);

   var sat = saturation.value / 100;

   // Hue is a degree from 0-360
   // XXX Maybe rotate it back until it's 0-360
   hue.value = checkRange(hue.value, 0, 359);

   colours.setHSB(hue.value, sat, brightness.value);
   redrawEverything();
}

function SetCurrentColor(color)
{
  if (!color)
    color = "transparent";

  if (color == "transparent")
    gDialog.transparencyCheckbox.checked = true;
  else
  {
    var hexCol = getHexColorFromColorName(color);
    if (hexCol)
      color = hexCol;
    gDialog.hexColour.value = color;
    changeHex();
  }
  ToggleTransparency(gDialog.transparencyCheckbox);
}

function changeHex()
{
  var hex = gDialog.hexColour.value;

  // XXX Check to see if they are hex digits
  // <Kaze>
  //~ if (hex.length < 6)
  //~ {
    //~ alert("Color is not made of a hash ('#') followed by six hex digits");
    //~ return;
  //~ }
  if (!/^#[0-9A-F]{6}$/i.test(hex)) {
    AlertWithTitle(GetString("UnknownColor"), GetString("UnknownColorError"));
    return;
  }
  // </Kaze>
  
  colours.setHex(hex.toUpperCase().substr(1, hex.length-1));
  redrawEverything();
}

function StartUp()
{

  if (!window.arguments[1])
  {
    dump("colourPicker: Missing color object param\n");
    return;
  }

  // window.arguments[1] is object to get initial values and return color data
  gColorObj = window.arguments[1];
  gColorObj.Cancel = false;

  gDialog.red              = document.getElementById("red");
  gDialog.blue             = document.getElementById("blue");
  gDialog.green            = document.getElementById("green");
  gDialog.hue              = document.getElementById("hue");
  gDialog.saturation       = document.getElementById("saturation");
  gDialog.brightness       = document.getElementById("brightness");
  gDialog.hexColour        = document.getElementById("hexColour");
  gDialog.nameColour       = document.getElementById("nameColour");

  gDialog.redLabel = document.getElementById("redLabel");
  gDialog.blueLabel = document.getElementById("blueLabel");
  gDialog.greenLabel = document.getElementById("greenLabel");
  gDialog.hueLabel = document.getElementById("hueLabel");
  gDialog.saturationLabel = document.getElementById("saturationLabel");
  gDialog.brightnessLabel = document.getElementById("brightnessLabel");
  gDialog.hexColourLabel = document.getElementById("hexColourLabel");
  gDialog.nameColourLabel = document.getElementById("nameColourLabel");

  gDialog.hueAndSaturationImg =
       document.getElementById("hueAndSaturationImg");
  gDialog.hueAndSaturationCrosshair =
       document.getElementById("hueAndSaturationCrosshair");
  gDialog.brightnessImg    = document.getElementById("brightnessImg");
  gDialog.swatch           = document.getElementById("swatch");
  gDialog.brightnessArrow  = document.getElementById("brightnessArrow");
  gDialog.colorpicker      = document.getElementById("colorpicker");
  gDialog.Ok                 = document.documentElement.getButton("accept");
  gDialog.transparencyCheckbox = document.getElementById("transparencyCheckbox");

  gDialog.CellOrTableGroup = document.getElementById("CellOrTableGroup");
  gDialog.TableRadio       = document.getElementById("TableRadio");
  gDialog.CellRadio        = document.getElementById("CellRadio");
  gDialog.LastPickedColor  = document.getElementById("LastPickedColor");

  // The type of color we are setting: 
  //  text: Text, Link, ActiveLink, VisitedLink, 
  //  or background: Page, Table, or Cell
  var prefs = GetPrefs();
  if (gColorObj.Type)
  {
    ColorType = gColorObj.Type;
    // Get string for dialog title from passed-in type 
    //   (note constraint on editor.properties string name)
    var IsCSSPrefChecked = prefs.getBoolPref("editor.use_css");

    if (GetCurrentEditor())
    {
      document.title = GetString(ColorType+"Color");
      if (ColorType == "Page" && IsCSSPrefChecked && IsHTMLEditor())
        document.title = GetString("BlockColor");
    }
  }
  if (!document.title)
    document.title = GetString("Color");

  colours = new objColour();

  makeDraggable(gDialog.hueAndSaturationImg);
  makeDraggable(gDialog.hueAndSaturationCrosshair);
  makeDraggable(gDialog.brightnessImg);

  gDialog.hexColour.value = "";
  var tmpColor;
  var haveTableRadio = false;
  var showTransparencyCheckbox = false;

  switch (ColorType)
  {
    case "Page":
      tmpColor = gColorObj.PageColor;
      if (tmpColor && tmpColor.toLowerCase() != "window")
        gColor = tmpColor;
      showTransparencyCheckbox = true;
      break;
    case "Table":
      if (gColorObj.TableColor)
        gColor = gColorObj.TableColor;
      break;
    case "Cell":
      if (gColorObj.CellColor)
        gColor = gColorObj.CellColor;
      break;
    case "TableOrCell":
      TableOrCell = true;
      document.getElementById("TableOrCellGroup").collapsed = false;
      showTransparencyCheckbox = true;
      haveTableRadio = true;
      if (gColorObj.SelectedType == "Cell")
      {
        gColor = gColorObj.CellColor;
        gDialog.CellOrTableGroup.selectedItem = gDialog.CellRadio;
        gDialog.CellRadio.focus();
      }
      else
      {
        gColor = gColorObj.TableColor;
        gDialog.CellOrTableGroup.selectedItem = gDialog.TableRadio;
        gDialog.TableRadio.focus();
      }
      break;
    case "Highlight":
      HighlightType = true;
      if (gColorObj.HighlightColor)
        gColor = gColorObj.HighlightColor;
      showTransparencyCheckbox = true;
      break;
    default:
      // Any other type will change some kind of text,
      TextType = true;
      tmpColor = gColorObj.TextColor;
      if (tmpColor && tmpColor.toLowerCase() != "windowtext")
        gColor = gColorObj.TextColor;
      break;
  }

  if (!gColor)
  {
    var useCustomColors = prefs.getBoolPref("editor.use_custom_colors");
    switch (ColorType)
    {
      case "Page":
      case "Highlight":
        if (useCustomColors)
          gColor = prefs.getCharPref("editor.background_color");
        else
        {
          gColor = prefs.getCharPref("browser.display.background_color");
        }
        break;
      case "Table":
      case "Cell":
      case "TableOrCell":
        gColor = "transparent";
        showTransparencyCheckbox = true;
        break;
      default:
        if (useCustomColors)
          gColor = prefs.getCharPref("editor.text_color");
        else
        {
          gColor = prefs.getCharPref("browser.display.foreground_color");
        }
        break;
    }
  }

  if (!showTransparencyCheckbox)
    gDialog.transparencyCheckbox.setAttribute("hidden", true);

  // Use last-picked colors passed in, or those persistent on dialog
  if (TextType)
  {
    if ( !("LastTextColor" in gColorObj) || !gColorObj.LastTextColor)
      gColorObj.LastTextColor = gDialog.LastPickedColor.getAttribute("LastTextColor");
    LastPickedColor = gColorObj.LastTextColor;
  }
  else if (HighlightType)
  {
    if ( !("LastHighlightColor" in gColorObj) || !gColorObj.LastHighlightColor)
      gColorObj.LastHighlightColor = gDialog.LastPickedColor.getAttribute("LastHighlightColor");
    LastPickedColor = gColorObj.LastHighlightColor;
  }
  else
  {
    if ( !("LastBackgroundColor" in gColorObj) || !gColorObj.LastBackgroundColor)
      gColorObj.LastBackgroundColor = gDialog.LastPickedColor.getAttribute("LastBackgroundColor");
    LastPickedColor = gColorObj.LastBackgroundColor;
  }
  gDialog.LastPickedColor.setAttribute("style","background-color: "+LastPickedColor);

  // Set initial color in input field and in the colorpicker
  SetCurrentColor(gColor);
  if (!showTransparencyCheckbox)
    gDialog.colorpicker.initColor(gColor);

  // Caller can prevent user from submitting an empty, i.e., default color
  NoDefault = gColorObj.NoDefault;
  if (NoDefault)
  {
    // Hide the "Default button -- user must pick a color
    var defaultColorButton = document.getElementById("DefaultColorButton");
    if (defaultColorButton)
      defaultColorButton.collapsed = true;
  }

  // Set focus to colorpicker if not set to table radio buttons above
  if (!haveTableRadio)
    gDialog.colorpicker.focus();

  SetWindowLocation();
}


function redrawEverything()
{
   gDialog.transparencyCheckbox.checked = false;
   ToggleTransparency(gDialog.transparencyCheckbox);

   LastPickedIsDefault = false;  

   redisplaySwatches();
   redisplayHexValue();
   redisplayRGBValues();
   redisplayHSBValues();

   redisplayColorName();
   redisplayBrightness();
}

function redisplayBrightness()
{
   sat = gDialog.brightnessImg;
   h = colours.getHue();
   s = colours.getSaturation();
   satSlider.setHSB(h, s, 255);
   sat.setAttribute("style",
     sat.getAttribute("style") + ";background-color: #" + satSlider.getHex());
}

function redisplaySaturation()
{
   sat = gDialog.saturationImg;
   h = colours.getHue();
   b = colours.getBrightness();
   satSlider.setHSB(h, 1, b);
   sat.setAttribute("style",
     sat.getAttribute("style") + ";background-color: #" + satSlider.getHex());
}

function redisplaySwatches()
{
  gDialog.swatch.style.backgroundColor = "#" + colours.getHex();
}

function redisplayHexValue()
{
   gDialog.hexColour.value = "#" + colours.getHex();
}

function redisplayColorName()
{
   var color = getColorNameFromHexColor("#" + colours.getHex());
   if (color)
     gDialog.nameColour.value = color;
   else
     gDialog.nameColour.value = "";
}

function redisplayRGBValues()
{
   gDialog.red.value   = Math.round(colours.getRed());
   gDialog.green.value = Math.round(colours.getGreen());
   gDialog.blue.value  = Math.round(colours.getBlue());
}

function redisplayHSBValues()
{
  var h = Math.round(colours.getHue());
  var s = Math.round(colours.getSaturation() * 100);
  var b = Math.round(colours.getBrightness());

  gDialog.hue.value        = h;
  gDialog.saturation.value = s;
  gDialog.brightness.value = b;

  computeOffsets(gDialog.hueAndSaturationCrosshair.parentNode);

  var arrow = gDialog.brightnessArrow;
  arrow.setAttribute("style",
    arrow.getAttribute("style") + ";left: " + (b/255*200 + 2) + "px");

  var crosshair = gDialog.hueAndSaturationCrosshair;
  crosshair.setAttribute("style",
    crosshair.getAttribute("style") + ";left: " + (h/360*200 + 4) + "px"
                                    + ";top:  " + ((100-s)/100*200 +4) + "px");

}


// The object that stores the colours in ram
function objColour()
{

 this.r = 128;
 this.g = (128 + (Math.random() * 100));
 this.b = 128;

 // Returns the hex value
 this.getHex = function()
 {
   var c = new Array();
   c[0] = dec2hex(Math.floor(this.r / 16));
   c[1] = dec2hex(this.r % 16);
   c[2] = dec2hex(Math.floor(this.g / 16));
   c[3] = dec2hex(this.g % 16);
   c[4] = dec2hex(Math.floor(this.b / 16));
   c[5] = dec2hex(this.b % 16);
   return c.join("");
 }
 this.getRed = function()
 {
   return this.r;
 }
 this.getGreen = function()
 {
   return this.g;
 }
 this.getBlue = function()
 {
   return this.b;
 }
 this.getBrightness = function()
 {
   // find the min and max rgb values
   max1 = Math.max(this.r, this.g);
   max2 = Math.max(max1, this.b);
   return max2;
 }
 this.getSaturation = function()
 {
   // find the min and max rgb values
   min1 = Math.min(this.r, this.g);
   min2 = Math.min(min1, this.b);
   max1 = Math.max(this.r, this.g);
   max2 = Math.max(max1, this.b); // v

   delta = max2 - min2;
   var sat = 0;
   if (max2 != 0)
   {
      sat = delta / max2;
   }
   return sat;
 }

 this.getHue = function()
 {
   var hue = 0;
   // If all the values are the same, there is no hue, just brightness
   if (this.r == this.g && this.g == this.b)
   {
      hue = 0;
      return hue;
   }

   // find the min and max rgb values
   min1 = Math.min(this.r, this.g);
   min2 = Math.min(min1, this.b);
   max1 = Math.max(this.r, this.g);
   max2 = Math.max(max1, this.b); // v

   delta = max2 - min2;

   if (max2 == 0)
   {
      hue = 0;
      return hue; // Saturation is undefined, so there is no hue
   }

   if (this.r == max2)
   {
      hue = (this.g - this.b) / delta; // It's between yellow and magenta
   }
   else if (this.g == max2)
   {
      hue = 2 + (this.b - this.r) / delta; // It's between cyan and yellow
   }
   else
   {
      hue = 4 + (this.r - this.g) / delta; // It's between magenta and cyan
   }

   hue *= 60; // Get it in degrees
   if (hue < 0)
   {
      hue += 360;
   }
   if (!hue)
   {
      hue = 0;
   }
   return hue;
 }

 this.setRGB = function(r, g, b)
 {
    this.r = r;
    this.g = g;
    this.b = b;
 }

 this.setHSB = function(h, s, b)
 {

    if (s == 0)
    {
       // Set it to a grey based on the brightness
       this.r = b;
       this.g = b;
       this.b = b;
       return;
    }

    h /= 60; // Get it out of degrees

    i = Math.floor(h);
    f = h - i; // Grab the decimal part
    p = b * (1 - s);
    q = b * (1 - s * f);
    t = b * (1 - s * (1 - f));

    switch (i)
    {
       case 0:
          this.r = b;
          this.g = t;
          this.b = p;
          break;
       case 1:
          this.r = q;
          this.g = b;
          this.b = p;
          break;
       case 2:
          this.r = p;
          this.g = b;
          this.b = t;
          break;
       case 3:
          this.r = p;
          this.g = q;
          this.b = b;
          break;
       case 4:
          this.r = t;
          this.g = p;
          this.b = b;
          break;
       default:
          this.r = b;
          this.g = p;
          this.b = q;
          break;
    }
 }

 this.setHex = function(hex)
 {
    c = hex.split("");
    red = hex2dec(c[0]) * 16 + hex2dec(c[1]);
    green = hex2dec(c[2]) * 16 + hex2dec(c[3]);
    blue = hex2dec(c[4]) * 16 + hex2dec(c[5]);
    this.r = red;
    this.g = green;
    this.b = blue;
 }
}


// Returns the decimal value of a hex character
function hex2dec(hex)
{
   return hexChars.indexOf(hex);
}

// return the hexidecimal value of a decimal digit from 1-16
function dec2hex(dec)
{
   return hexChars.charAt(dec);
}

function SelectColor()
{
  var color = gDialog.colorpicker.color;
  if (color)
  {
    colours.setHex(color.toUpperCase().substr(1, color.length-1));
    redrawEverything();
  }
}

function ValidateData()
{
  if (gDialog.transparencyCheckbox.checked)
    gColor = "transparent";
  else if (LastPickedIsDefault)
    gColor = LastPickedColor;
  else
    gColor = gDialog.hexColour.value;

  if (ColorType == "TableOrCell" &&
      gColor == "transparent")
    gColor = "";
  gColor = TrimString(gColor).toLowerCase();

  // TODO: Validate the color string!

  if (NoDefault && !gColor)
  {
    ShowInputErrorMessage(GetString("NoColorError"));
    SetTextboxFocus(gDialog.hexColour);
    return false;   
  }
  return true;
}

function onAccept()
{
  if (!ValidateData())
    return false;

  // Kaze: convert hex value to a standard named color if possible
  var color = getColorNameFromHexColor(gColor);
  if (color)
    gColor = color;

  // Set return values and save in persistent color attributes
  if (TextType)
  {
    gColorObj.TextColor = gColor;
    if (gColor.length > 0)
    {
      gDialog.LastPickedColor.setAttribute("LastTextColor", gColor);
      gColorObj.LastTextColor = gColor;
    }
  }
  else if (HighlightType)
  {
    gColorObj.HighlightColor = gColor;
    if (gColor.length > 0)
    {
      gDialog.LastPickedColor.setAttribute("LastHighlightColor", gColor);
      gColorObj.LastHighlightColor = gColor;
    }
  }
  else
  {
    gColorObj.BackgroundColor = gColor;
    if (gColor.length > 0)
    {
      gDialog.LastPickedColor.setAttribute("LastBackgroundColor", gColor);
      gColorObj.LastBackgroundColor = gColor;
    }
    // If table or cell requested, tell caller which element to set on
    if (TableOrCell && gDialog.TableRadio.selected)
      gColorObj.Type = "Table";
  }
  SaveWindowLocation();

  return true; // do close the window
}

function onCancelColor()
{
  // Tells caller that user canceled
  gColorObj.Cancel = true;
  SaveWindowLocation();
  return true;
}

function IncreaseTextboxValue(id, maxValue)
{
  var e = document.getElementById(id);
  if (e)
  {
    var newValue = Math.min(maxValue, Number(e.value) + 1);
    if (newValue != e.value)
      redrawEverythingAfterTexboxValueChanged(id);
    e.value = newValue;
  }
}

function DecreaseTextboxValue(id, minValue)
{
  var e = document.getElementById(id);
  if (e)
  {
    var newValue = Math.max(minValue, Number(e.value) - 1);
    if (newValue != e.value)
      redrawEverythingAfterTexboxValueChanged(id);
    e.value = newValue;
  }
}

function redrawEverythingAfterTexboxValueChanged(id)
{
  if (id == "hue" ||
      id == "saturation" ||
      id == "brightness")
  {
    var h = gDialog.hue.value;
    var s = gDialog.saturation.value;
    var b = gDialog.brightness.value;
    colours.setHSB(h, s/100, b);
  }
  else
  {
    var r = gDialog.red.value;
    var g = gDialog.green.value;
    var b = gDialog.blue.value;
    colours.setRGB(r, g, b);
  }
  redrawEverything();
}

function onTextboxValueChanged(e, id)
{
  forceInteger(id);
  var v = e.value;
  switch (id)
  {
    case "hue":
      v = checkRange(v, 0, 359);
      break;
    case "brightness":
    case "red":
    case "green":
    case "blue":
      v = checkRange(v, 0, 255);
      break;
    case "saturation":
      v = checkRange(v, 0, 100);
      break;
  }
  e.value = v;
  redrawEverythingAfterTexboxValueChanged(id);
}

function ToggleTransparency(elt)
{
  if (elt.checked)
  {
    gDialog.red.setAttribute("disabled", true);
    gDialog.blue.setAttribute("disabled", true);
    gDialog.green.setAttribute("disabled", true);
    gDialog.hue.setAttribute("disabled", true);
    gDialog.saturation.setAttribute("disabled", true);
    gDialog.brightness.setAttribute("disabled", true);
    gDialog.hexColour.setAttribute("disabled", true);
    gDialog.nameColour.setAttribute("disabled", true);
    gDialog.redLabel.setAttribute("disabled", true);
    gDialog.blueLabel.setAttribute("disabled", true);
    gDialog.greenLabel.setAttribute("disabled", true);
    gDialog.hueLabel.setAttribute("disabled", true);
    gDialog.saturationLabel.setAttribute("disabled", true);
    gDialog.brightnessLabel.setAttribute("disabled", true);
    gDialog.hexColourLabel.setAttribute("disabled", true);
    gDialog.nameColourLabel.setAttribute("disabled", true);

    gDialog.swatch.style.backgroundColor = "#ffffff";
  }
  else
  {
    gDialog.red.removeAttribute("disabled");
    gDialog.blue.removeAttribute("disabled");
    gDialog.green.removeAttribute("disabled");
    gDialog.hue.removeAttribute("disabled");
    gDialog.saturation.removeAttribute("disabled");
    gDialog.brightness.removeAttribute("disabled");
    gDialog.hexColour.removeAttribute("disabled");
    gDialog.nameColour.removeAttribute("disabled");
    gDialog.redLabel.removeAttribute("disabled");
    gDialog.blueLabel.removeAttribute("disabled");
    gDialog.greenLabel.removeAttribute("disabled");
    gDialog.hueLabel.removeAttribute("disabled");
    gDialog.saturationLabel.removeAttribute("disabled");
    gDialog.brightnessLabel.removeAttribute("disabled");
    gDialog.hexColourLabel.removeAttribute("disabled");
    gDialog.nameColourLabel.removeAttribute("disabled");

    gDialog.swatch.style.backgroundColor = "#" + colours.getHex();
  }
}

function onNamedColourChanged(elt)
{
  var namedColour = elt.value;
  var i, l = namedColorsArray.length;
  for (i=0; i<l; i++)
  {
    if (namedColorsArray[i].name == namedColour)
    {
      gDialog.hexColour.value = namedColorsArray[i].value;
      changeHex();
      return;
    }
  }
}

function SelectLastPickedColor()
{
  SetCurrentColor(LastPickedColor);
  LastPickedIsDefault = true;  
  if ( onAccept() )
    //window.close();
    return true;

  return false;
}
