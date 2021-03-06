var timeDisplay, language, bgImage, sunnahTimes, settings, weather, delays, 
calculationMethod;
var lat,lon;

window.addEventListener('DOMContentLoaded', () => { 
  loadSettings()
  setNumberLimit(document.getElementById("latInput"));
  setNumberLimit(document.getElementById("lonInput"));
  setTZlist();
  returnButton();
  addThemeListener()
  setKeyPress();
  addLangListener()
  loadFont()
})

/**
* Saves all settings to the store
*/
async function saveSettings(){
  await saveTimeDateFormat()
  //Values that might change too much should not be saved automaticaly (no saver)
  await window.api.setToStore('latitude', document.getElementById("latInput").value);
  await window.api.setToStore('longitude', document.getElementById("lonInput").value);
  await window.api.setToStore("timezone", document.getElementById("tzlist").value)
  await window.api.setToStore("language", document.getElementById("langlist").value)
  await window.api.setToStore('darkMode', document.getElementById("darkModeCheck").checked)
  await window.api.setToStore("timeDisplay.showSeconds", document.getElementById("showSeconds").checked)

  var newCalculationMethod = {
    calcMethod: document.getElementById("calcMethodList").value,
    madhab: document.getElementById("madhabList").value,
    hlr: document.getElementById("highLatitudeRuleList").value,
    pcr: document.getElementById("polarCircleResolutionList").value,
    shafaq:  document.getElementById("shafaqList").value
  }

  var newSettings = {
    notifCheck: document.getElementById("notifCheck").checked,
    systray: document.getElementById("systrayCheck").checked,
    autoStart: document.getElementById("autoStartCheck").checked,
    minStart: document.getElementById("minStartCheck").checked
  }

  var newSunnahTimes = {
    motn: document.getElementById("MOTNCheck").checked,
    totn: document.getElementById("TOTNCheck").checked
  }

  var newWeather = {
    enabled: document.getElementById("weatherCheck").checked,
    units: document.getElementById("unitList").value
  }

  var newDelays = [
    document.getElementById("fajrDelayInput").value,
    document.getElementById("dhuhrDelayInput").value,
    document.getElementById("asrDelayInput").value,
    document.getElementById("maghribDelayInput").value,
    document.getElementById("ishaDelayInput").value
  ]

  if (calculationMethod != newCalculationMethod) await window.api.setToStore("calculationMethod", newCalculationMethod)
  if (settings != newSettings) await window.api.setToStore("settings", newSettings)
  if (sunnahTimes != newSunnahTimes) await window.api.setToStore("sunnahTimes", newSunnahTimes)
  if (weather != newWeather) await window.api.setToStore("weather", newWeather)
  if (delays != newDelays) await window.api.setToStore("delays", newDelays)

  await saveBgImage()
  await saveAdjustments()
  await saveCustomSettings()
}

/**
* Loads all the settings from the store
*/
async function loadSettings(){
  lat = await window.api.getFromStore('latitude', 0.00);
  lon = await window.api.getFromStore('longitude', 0.00);
  var tzVal =  await window.api.getFromStore('timezone', 'US/Central');
  var darkMode = await window.api.getFromStore('darkMode', false);
  language = await window.api.getFromStore('language', 'en');

  sunnahTimes = await window.api.getFromStore("sunnahTimes", {
    motn: false,
    totn: false
  })

  timeDisplay = await window.api.getFromStore("timeDisplay", {
    clockFormat: 12,
    dateFormat: 'DD/MM/YYYY',
    showSeconds: true
  })

  settings = await window.api.getFromStore("settings", {
    notifCheck: true,
    systray: true,
    autoStart: true,
    minStart: false
  })

  weather = await window.api.getFromStore("weather", {
    enabled: true,
    units: "C"
  })

  calculationMethod = await window.api.getFromStore("calculationMethod", {
    calcMethod: 'MWL',
    madhab: 'Shafi',
    hlr: 'TA',
    pcr: 'CC',
    shafaq: 'shafaqG'
  })

  delays = await window.api.getFromStore("delays", [5, 10, 10, 5, 10])
  
  await loadCustomSettings()
  await loadAdjustments()

  document.getElementById("latInput").value = lat
  document.getElementById("lonInput").value = lon

  //Selects the loaded value from the lists
  selectFromList(document.getElementById('langlist'), language)
  selectFromList(document.getElementById("tzlist"), tzVal)
  selectFromList(document.getElementById("calcMethodList"), calculationMethod.calcMethod)
  selectFromList(document.getElementById("madhabList"), calculationMethod.madhab)
  selectFromList(document.getElementById("highLatitudeRuleList"), calculationMethod.hlr)
  selectFromList(document.getElementById("polarCircleResolutionList"), calculationMethod.pcr)
  selectFromList(document.getElementById("shafaqList"), calculationMethod.shafaq)
  
  document.getElementById("tzlist").value =  tzVal;
  document.getElementById("calcMethodList").value =  calculationMethod.calcMethod;
  document.getElementById("madhabList").value =  calculationMethod.madhab;
  document.getElementById("highLatitudeRuleList").value =  calculationMethod.hlr;
  document.getElementById("polarCircleResolutionList").value =  calculationMethod.pcr;
  document.getElementById("shafaqList").value =  calculationMethod.shafaq;

  document.getElementById("langlist").value = language;
  document.getElementById("unitList").value = weather.units;

  document.getElementById("darkModeCheck").checked = darkMode
  document.getElementById("notifCheck").checked = settings.notifCheck
  document.getElementById("systrayCheck").checked = settings.systray
  document.getElementById("autoStartCheck").checked = settings.autoStart
  document.getElementById("minStartCheck").checked = settings.minStart
  document.getElementById("MOTNCheck").checked = sunnahTimes.motn
  document.getElementById("TOTNCheck").checked = sunnahTimes.totn
  document.getElementById("showSeconds").checked = timeDisplay.showSeconds
  document.getElementById("weatherCheck").checked = weather.enabled

  document.getElementById("fajrDelayInput").value = delays[0]
  document.getElementById("dhuhrDelayInput").value = delays[1]
  document.getElementById("asrDelayInput").value = delays[2]
  document.getElementById("maghribDelayInput").value = delays[3]
  document.getElementById("ishaDelayInput").value = delays[4]

  window.api.setTheme(darkMode, "settings.css");
  addChangeListeners()
  setTimeDateFormat()
  loadLanguage(language)
  loadBgImage()
}


/**
* Sets the element to the value and adds a listener
* If the element changes, the value is directly sent to the store value (thanks to its name)
*
* @param element the UI element that gets the value and event listener.
* @param value if this one is defined
* @param name if this one is defined
*/
async function addSaverChecked(element, value, name){
  element.checked = value;
  element.addEventListener("change", async function(){
    await window.api.setToStore(name, element.checked)
    console.debug("Saved " + element.checked + " to store (from " + value + ")")
  })
}

/**
* Sets the element to the value and adds a listener
* If the element changes, the value is directly sent to the store value (thanks to its name)
*
* @param element the UI element that gets the value and event listener. 
* @param value if this one is defined
* @param name if this one is defined
*/
async function addSaverValue(element, value, name){
  element.value = value;
  element.addEventListener("change", async function(){
    await window.api.setToStore(name, element.value)
    console.debug("Saved " + element.value + " to store (from " + value + ")")
  })
}


/**
* Saves and brings you back to index.html when you click on the retrn button (adds listener)
*/
async function returnButton(){
  var set = document.getElementById("return");
  set.onclick= async function(){
    await saveSettings()
    window.api.send("settingsC");
      window.location.assign("../main/index.html");
  }
}

/**
* Saves and brings you back to index.html when you press the ESC key
*/
async function setKeyPress(){
  document.addEventListener('keydown', async function(key){
    console.debug("Pressed the: " + key.key + " key")
    if (key.key == "Escape"){
      await saveSettings()
      window.api.send("settingsC");
      window.location.assign("../main/index.html");
    }
  })
}

/**
 * Makes you unable to type out of bounds for the lat and lon fields
 */
function setNumberLimit(){
  var latInput = document.getElementById("latInput");
  var latOldValue = latInput.value;
  latInput.addEventListener("focus", function(){
    latOldValue = latInput.value;
  });
  latInput.addEventListener("input", function(){
    if (latInput.value > 90 || latInput.value < -90 || latInput.value.length > 7){
      latInput.value = latOldValue;
    }
    else{
      latOldValue = latInput.value;
    }
  });

  var lonInput = document.getElementById("lonInput");
  var lonOldValue = lonInput.value;
  lonInput.addEventListener("focus", function(){
    lonOldValue = lonInput.value;
  });
  lonInput.addEventListener("input", function(){
    if (lonInput.value > 180 || lonInput.value < -180 || lonInput.value.length > 7){
      lonInput.value = lonOldValue;
    }
    else{
      lonOldValue = lonInput.value;
    }
  });
}

/**
* Loads all timezones, and adds them to the TZ list
*/
async function setTZlist(){
  const container = document.getElementById("tzlist");
  
  response = await fetch('../../ressources/timezones.json')
    .then(res => res.json())
    .then((json) => {
      for (zone of json){
        for (timezone of zone["utc"]){
          var option = document.createElement("option")
          option.id = timezone;
          option.value = timezone;
          option.innerText = timezone;
          container.appendChild(option)
        }
      }
      sortSelect(container)
    })
}

function sortSelect(selElem) { //Source https://stackoverflow.com/questions/278089/javascript-to-sort-contents-of-select-element
  var tmpAry = new Array();
  for (var i=0;i<selElem.options.length;i++) {
      tmpAry[i] = new Array();
      tmpAry[i][0] = selElem.options[i].text;
      tmpAry[i][1] = selElem.options[i].value;
  }
  tmpAry.sort();
  while (selElem.options.length > 0) {
      selElem.options[0] = null;
  }
  for (var i=0;i<tmpAry.length;i++) {
      var op = new Option(tmpAry[i][0], tmpAry[i][1]);
      selElem.options[i] = op;
  }
  return;
}



/**
 * Goes through the form/list and selects the val
 */
function selectFromList(list, val){
  list.childNodes.forEach(function(node){
    if (node.value == val){
      node.selected = true;
    }
  });

}


//Looks at the checkboxes/radios and sets the variables according to the formats
async function saveTimeDateFormat(){ 
  if (document.getElementById("24hTimeFormat").checked){
    timeDisplay.clockFormat = 24;
  }
  else {
    timeDisplay.clockFormat = 12;
  }
  /*if (document.getElementById("dateFormat1").checked){
    timeDisplay.dateFormat = "DD/MM/YYYY"
  }
  else if (document.getElementById("dateFormat2").checked){
    timeDisplay.dateFormat = "MM/DD/YYYY"
  }
  else{
    timeDisplay.dateFormat = "YYYY/MM/DD"
  }*/
  await window.api.setToStore('timeDisplay.clockFormat', timeDisplay.clockFormat);
  //await window.api.setToStore('timeDisplay.dateFormat', timeDisplay.dateFormat);
}


/**
* From the loaded values, checks and unchecks the time/formats checkboxes
*/
function setTimeDateFormat(){
  if (timeDisplay != undefined){
    document.getElementById("showSeconds").checked = timeDisplay.showSeconds;
    if (timeDisplay.clockFormat == 24){
      document.getElementById("24hTimeFormat").checked = true;
    } else{
      document.getElementById("12hTimeFormat").checked = true;
    }

    /*if(timeDisplay.dateFormat == "DD/MM/YYYY"){
      document.getElementById("dateFormat1").checked = true;
    }else if ( timeDisplay.dateFormat == "MM/DD/YYYY"){
      document.getElementById("dateFormat2").checked = true;
    }else{
      document.getElementById("dateFormat3").checked = true;
    }*/
  }
}


/**
* If val is defined, change the value of the element to @val
*
* @param element the element gets the value
* @param val if this one is defined
*/
function setSavedVal(element, val){
  if (val != undefined){
    element.value = val;
  }
}

/**
* Event listener in case the darkmode check changes
*/
function addThemeListener(){
  var darkTheme = document.getElementById("darkModeCheck")
  darkTheme.addEventListener('change', function(){
    window.api.setTheme(darkTheme.checked, "settings.css");
  })
}


/**
* Reloads the stylesheet if @param darkmode changes
*
* @param  darkMode bool: if darkmode is enabled => true
*/
function toggleDarkMode(darkMode){
  var head = document.getElementsByTagName('HEAD')[0]; 
  var link = document.createElement('link');
  link.rel = 'stylesheet'; 
  link.type = 'text/css';
  if (darkMode){
    link.href = '../../node_modules/bootstrap-dark-5/dist/css/bootstrap-dark.css';
    //document.body.style.backgroundColor = "#0b5345 "
  }
  else{
    link.href = '../../node_modules/bootstrap/dist/css/bootstrap.css';
    //document.body.style.backgroundColor = "#85929e"
  }
  head.appendChild(link); 
}


/**
* Loads the background values (bool, source), and if true, sets the background + an event listener
*/
async function loadBgImage(){
  bgImage = await window.api.getFromStore('bgImage', [true, '../../ressources/images/bgImage.jpg']);
  var bgImageCheck = document.getElementById("bgImageCheck")
  bgImageCheck.checked  = bgImage[0];
  var file = document.getElementById("customBgImage")
  var fileButton = document.getElementById("customBgImageButton")
  fileButton.onclick = function() {
    file.click();
  };
  fileButton.value = shortenedString(bgImage[1].split("/")[bgImage[1].split("/").length - 1]) 
  if (!bgImageCheck.checked ){
    file.disabled = true;
    fileButton.disabled = true;
  }
  bgImageCheck.addEventListener('change', function(){
    if (!bgImageCheck.checked ){
      file.disabled = true;
      fileButton.disabled = true;
    }
    else{
      file.disabled = false;
      fileButton.disabled = false;
    }
  })
  file.addEventListener("change", function(){
    fileButton.value = shortenedString(file.files[0].path.split("/")[file.files[0].path.split("/").length - 1]) 
  })
}

/**
* Saves the background image values (bool, source)
*/
async function saveBgImage(){
  var bgImageCheck = document.getElementById("bgImageCheck").checked
  if (!bgImageCheck){
    await window.api.setToStore('bgImage', [false, '../../ressources/images/bgImage.jpg'])
  }
  else{
    var file = document.getElementById("customBgImage").files
    if (file != undefined && file.length != 0){
      await window.api.setToStore('bgImage', [true, file[0].path])
    }
    else{
      let darkmode = document.getElementById("darkModeCheck").checked
      if (darkmode && bgImage[1] == '../../ressources/images/bgImage.jpg'){
        await window.api.setToStore('bgImage', [true, '../../ressources/images/bgImage_dark.jpg'])
      }
      else if (!darkmode && bgImage[1] == '../../ressources/images/bgImage_dark.jpg'){
        await window.api.setToStore('bgImage', [true, '../../ressources/images/bgImage.jpg'])
      }
      else{
        await window.api.setToStore('bgImage', [true, bgImage[1]])
      }
    }
  }
}


function addLangListener(){
  var langList = document.getElementById('langlist')
  langList.addEventListener('change', function(){
    loadLanguage(langList.value)
  })
}

/**
* Changes the innerTexts of all the elements in the page
*
* @param  lang   the language selected by the user
*/
function loadLanguage(lang){
  document.title = window.api.getLanguage(lang, "muezzin") + " - " + window.api.getLanguage(lang, "settings");

  document.getElementById("v-pills-general-tab").innerHTML = '<i class="fa-solid fa-kaaba"></i>  ' +  window.api.getLanguage(lang, "general");
  document.getElementById("v-pills-location-tab").innerHTML = '<i class="fa-solid fa-location-dot"></i>  ' + window.api.getLanguage(lang, "location");
  document.getElementById("v-pills-appearance-tab").innerHTML = '<i class="fa-solid fa-palette"></i>  ' +  window.api.getLanguage(lang, "appearance");
  document.getElementById("v-pills-advanced-tab").innerHTML = '<i class="fa-solid fa-sliders"></i>  ' + window.api.getLanguage(lang, "advanced");
  document.getElementById("v-pills-adjustments-tab").innerHTML = '<i class="fa-solid fa-clock"></i>  ' + window.api.getLanguage(lang, "adjustements");

  document.getElementById("return").innerHTML = '<i class="fa fa-arrow-circle-left"></i>  ' + window.api.getLanguage(lang, "return");

  document.getElementById("langText").innerText = window.api.getLanguage(lang, "language");
  document.getElementById("settingsTitle").innerText = window.api.getLanguage(lang, "settings");
  document.getElementById("tfText").innerText = window.api.getLanguage(lang, "timeformat");
  document.getElementById("24hTimeFormatText").innerText = window.api.getLanguage(lang, "24hour");
  document.getElementById("12hTimeFormatText").innerText = window.api.getLanguage(lang, "12hour");
  document.getElementById("showSecondsText").innerText = window.api.getLanguage(lang, "showSseconds");
  /*document.getElementById("dfText").innerText = window.api.getLanguage(lang, "dateFormat");
  document.getElementById("df1Text").innerText = window.api.getLanguage(lang, "dateFormat1");
  document.getElementById("df2Text").innerText = window.api.getLanguage(lang, "dateFormat2");
  document.getElementById("df3Text").innerText = window.api.getLanguage(lang, "dateFormat3");*/
  document.getElementById("notifText").innerText = window.api.getLanguage(lang, "notifications");
  document.getElementById("notifCheckText").innerText = window.api.getLanguage(lang, "notifCheck");
  document.getElementById("coordinatesText").innerText = window.api.getLanguage(lang, "coordinates");
  document.getElementById("latText").innerText = window.api.getLanguage(lang, "latitude");
  document.getElementById("lonText").innerText = window.api.getLanguage(lang, "longitude");
  document.getElementById("tzText").innerText = window.api.getLanguage(lang, "timezone");
  document.getElementById("themeText").innerText = window.api.getLanguage(lang, "theme");
  document.getElementById("darkModeText").innerText = window.api.getLanguage(lang, "darkMode");
  document.getElementById("bgImageText").innerText = window.api.getLanguage(lang, "bgImage");
  document.getElementById("bgImageCheckText").innerText = window.api.getLanguage(lang, "bgImageCheck");
  document.getElementById("calcMethodsText").innerText = window.api.getLanguage(lang, "calcMethods");
  document.getElementById("MWL").innerText = window.api.getLanguage(lang, "mwl");
  document.getElementById("Egyptian").innerText = window.api.getLanguage(lang, "egyptian");
  document.getElementById("Karachi").innerText = window.api.getLanguage(lang, "karachi");
  document.getElementById("UAQ").innerText = window.api.getLanguage(lang, "uaq");
  document.getElementById("Dubai").innerText = window.api.getLanguage(lang, "dubai");
  document.getElementById("Qatar").innerText = window.api.getLanguage(lang, "qatar");
  document.getElementById("Kuwait").innerText = window.api.getLanguage(lang, "kuwait");
  document.getElementById("MC").innerText = window.api.getLanguage(lang, "mc");
  document.getElementById("Singapore").innerText = window.api.getLanguage(lang, "singapore");
  document.getElementById("Turkey").innerText = window.api.getLanguage(lang, "turkey");
  document.getElementById("Tehran").innerText = window.api.getLanguage(lang, "tehran");
  document.getElementById("ISNA").innerText = window.api.getLanguage(lang, "isna");
  document.getElementById("MadhabText").innerText = window.api.getLanguage(lang, "madhab");
  document.getElementById("Shafi").innerText = window.api.getLanguage(lang, "shafi");
  document.getElementById("Hanafi").innerText = window.api.getLanguage(lang, "hanafi");
  document.getElementById("hlrText").innerText = window.api.getLanguage(lang, "hlr");
  document.getElementById("MOTN").innerText = window.api.getLanguage(lang, "motn");
  document.getElementById("SOTN").innerText = window.api.getLanguage(lang, "sotn");
  document.getElementById("TA").innerText = window.api.getLanguage(lang, "ta");
  document.getElementById("pcrText").innerText = window.api.getLanguage(lang, "pcr");
  document.getElementById("CC").innerText = window.api.getLanguage(lang, "cc");
  document.getElementById("CD").innerText = window.api.getLanguage(lang, "cd");
  document.getElementById("UND").innerText = window.api.getLanguage(lang, "und");
  document.getElementById("ShafaqText").innerText = window.api.getLanguage(lang, "shafaq");
  document.getElementById("shafaqG").innerText = window.api.getLanguage(lang, "general");
  document.getElementById("shafaqR").innerText = window.api.getLanguage(lang, "ahmer");
  document.getElementById("shafaqW").innerText = window.api.getLanguage(lang, "abyad");
  document.getElementById("autoStartText").innerText = window.api.getLanguage(lang, "autoStart");
  document.getElementById("autoStartCheckText").innerText = window.api.getLanguage(lang, "startAtLaunch");
  document.getElementById("quote").innerText = window.api.getLanguage(lang, "quote");
  document.getElementById("source").innerText = window.api.getLanguage(lang, "source");
  document.getElementById("systrayText").innerText = window.api.getLanguage(lang, "sysTray");
  document.getElementById("systrayCheckText").innerText = window.api.getLanguage(lang, "minToTray");
  document.getElementById("customSettText").innerText = window.api.getLanguage(lang, "customSettings");
  document.getElementById("enableCalcText").innerText = window.api.getLanguage(lang, "enableCS");
  document.getElementById("fajrAngleText").innerText = window.api.getLanguage(lang, "fAngle");
  document.getElementById("maghribAngleText").innerText = window.api.getLanguage(lang, "mAngle");
  document.getElementById("ishaAngleText").innerText = window.api.getLanguage(lang, "iAngle");
  document.getElementById("delayText").innerText = window.api.getLanguage(lang, "delayAfterM");
  document.getElementById("delayFormText").innerText = window.api.getLanguage(lang, "delayMin");
  
  document.getElementById("adjustmentsText").innerHTML = window.api.getLanguage(lang, "adjustements");
  document.getElementById("adjCheckText").innerText = window.api.getLanguage(lang, "enableAdj");
  document.getElementById("fajrAdjText").innerText = window.api.getLanguage(lang, "fajrAdj");
  document.getElementById("dhuhrAdjText").innerText = window.api.getLanguage(lang, "dhuhrAdj");
  document.getElementById("asrAdjText").innerText = window.api.getLanguage(lang, "asrAdj");
  document.getElementById("maghribAdjText").innerText = window.api.getLanguage(lang, "maghribAdj");
  document.getElementById("ishaAdjText").innerText = window.api.getLanguage(lang, "ishaAdj");
  document.getElementById("sunnahTimesText").innerText = window.api.getLanguage(lang, "showSunnah");
  document.getElementById("MOTNCheckText").innerText = window.api.getLanguage(lang, "motn");
  document.getElementById("TOTNCheckText").innerText = window.api.getLanguage(lang, "totn");
  document.getElementById("minStartCheckText").innerText = window.api.getLanguage(lang, "minStart");


  document.getElementById("weatherText").innerHTML  = window.api.getLanguage(lang, "weather");
  document.getElementById("weatherCheckText").innerHTML  = window.api.getLanguage(lang, "showWeather");
  document.getElementById("unitListText").innerHTML  = window.api.getLanguage(lang, "units");
  document.getElementById("celsius").innerHTML  = window.api.getLanguage(lang, "celsius");
  document.getElementById("kelvin").innerHTML  = window.api.getLanguage(lang, "kelvin");
  document.getElementById("fahrenheit").innerHTML  = window.api.getLanguage(lang, "fahrenheit");  
}


async function loadCustomSettings(){
  var customValues = await window.api.getFromStore('customSettings', [false, 0,0,0]);
  var customCheck = document.getElementById('customCalcCheck');
  var fajrAngle = document.getElementById("fajrAngle");
  var maghribAngle = document.getElementById("maghribAngle");
  var ishaAngle = document.getElementById("ishaAngle");
  
  var delay = await window.api.getFromStore('delay', [false, 0]);
  var delayCheck = document.getElementById('delayCheck');
  var delayForm = document.getElementById('delayForm');

  if(customValues[0]){
    customCheck.checked = true;
    fajrAngle.value = customValues[1]
    maghribAngle.value = customValues[2]
    ishaAngle.value = customValues[3]
  }
  else{
    fajrAngle.disabled = true
    maghribAngle.disabled = true
    ishaAngle.disabled = true
    document.getElementById("calcMethodList").disabled = false;
  }

  customCheck.addEventListener('change', function(){
    if (customCheck.checked){
      fajrAngle.disabled = false
      maghribAngle.disabled = false
      ishaAngle.disabled = false
      document.getElementById("calcMethodList").disabled = true;
    }
    else{
      fajrAngle.disabled = true
      maghribAngle.disabled = true
      ishaAngle.disabled = true
      document.getElementById("calcMethodList").disabled = false;
    }
  })

  if (delay[0]){
    delayCheck.checked = true
    delayForm.value = delay[1]
  }else{
    delayForm.disabled = true;
  }

  delayCheck.addEventListener("change", function(){
    if(delayCheck.checked){
      delayForm.disabled = false;
    }
    else{
      delayForm.disabled = true;
    }
  })
}

async function saveCustomSettings(){
  var customCheck = document.getElementById('customCalcCheck');
  var delayCheck = document.getElementById('delayCheck');
  if(customCheck.checked){
    var fajrAngle = document.getElementById("fajrAngle");
    var maghribAngle = document.getElementById("maghribAngle");
    var ishaAngle = document.getElementById("ishaAngle");
    await window.api.setToStore('customSettings', [true, fajrAngle.value, maghribAngle.value, ishaAngle.value])
  }
  else{
    await window.api.setToStore('customSettings', [false, 0,0,0])
  }

  if(delayCheck.checked){
    var delayForm = document.getElementById('delayForm');
    await window.api.setToStore('delay', [true, delayForm.value])
  }
  else{
    await window.api.setToStore('delay', [false, 0])
  }
}

//Loads the prayer times adjustements from the store and adds an event listener for the adjustements check box
async function loadAdjustments(){
  var adjustements = await window.api.getFromStore('adj', [false, 0,0,0,0,0]);
  for (let i = 1; i <= 5; i++){
    if (adjustements[i] == undefined){
      adjustements[i] = 0;
    }
  }
  document.getElementById("adjCheck").checked = adjustements[0];
  document.getElementById("fajrAdjInput").value = adjustements[1];
  document.getElementById("dhuhrAdjInput").value = adjustements[2];
  document.getElementById("asrAdjInput").value = adjustements[3];
  document.getElementById("maghribAdjInput").value = adjustements[4];
  document.getElementById("ishaAdjInput").value = adjustements[5];

  enableAdjustements(document.getElementById("adjCheck").checked)
  
  document.getElementById("adjCheck").addEventListener("change", function(){
    enableAdjustements(document.getElementById("adjCheck").checked)
  })

  function enableAdjustements(boolean){
    document.getElementById("fajrAdjInput").disabled = !boolean;
    document.getElementById("dhuhrAdjInput").disabled = !boolean;
    document.getElementById("asrAdjInput").disabled = !boolean;
    document.getElementById("maghribAdjInput").disabled = !boolean;
    document.getElementById("ishaAdjInput").disabled = !boolean;
  }
}


//Rounds the adjustements (Math.round) and saves them to the store
async function saveAdjustments(){
  var adjCheck = document.getElementById("adjCheck").checked;  
  var fajrAdj = document.getElementById("fajrAdjInput").value;
  var dhuhrAdj = document.getElementById("dhuhrAdjInput").value;
  var asrAdj = document.getElementById("asrAdjInput").value;
  var maghribrAdj = document.getElementById("maghribAdjInput").value;
  var ishaAdj = document.getElementById("ishaAdjInput").value;

  var adjustements = [adjCheck, Math.round(fajrAdj),Math.round(dhuhrAdj),Math.round(asrAdj),Math.round(maghribrAdj),Math.round(ishaAdj)]
  
  await window.api.setToStore('adj', adjustements);
}

function addChangeListeners(){
  let weatherCheck = document.getElementById("weatherCheck")
  let unitList = document.getElementById("unitList");

  unitList.disabled = !weatherCheck.checked;
  weatherCheck.addEventListener("change", function(){
    unitList.disabled = !weatherCheck.checked;
  })
}

function loadFont(){
  if (language != "ar" && language != "bn"){
    document.body.style.fontFamily = 'quicksand'
  }
}

function shortenedString(text){
  if (text.length > 30) return text.substr(0,30);
  else return text
}