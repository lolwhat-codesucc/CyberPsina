"use strict";
const TARGET_CLASS_NAME = "ui-dialog ui-widget ui-widget-content ui-corner-all ui-draggable ui-resizable ui-dialog-buttons";

function onError(error){
  console.log(error);
}

function inputHandler(target) {
  const input = target.getElementsByTagName("input")[0];
  const button = target.getElementsByTagName("button")[0];
  let type = "";
  let isLastMessage = false;

  switch(target.getElementsByTagName("strong")[0].innerText) {
    case "BONUS TO ROLL:":
      type = "bonusToHit";
    case "# УРОН:":
      type = "bonusToDice";
      break;
    case "BONUS TO DAMAGE:":
      type = "bonusToDamage";
      isLastMessage = true;
      break;
  };

  const baseStats = {
    "bonusToDamage":0,
    "bonusToDice":1,
    "bonusToHit":0
  };

  let storageKeysToGet = Object.keys(baseStats);
  storageKeysToGet.push("addedStats");
  
  browser.storage.local.get(storageKeysToGet).then((loadedStats) => {
    if(Object.keys(loadedStats).length != storageKeysToGet.length) {
      console.log("Loading failed");
      return;
    };
    input.value = parseInt(input.value) + parseInt(loadedStats[type]) + baseStats[type] + loadedStats["addedStats"][type];
    button.click();

    if(isLastMessage) portFromPopUp.postMessage({
      name: "lastInputGiven",
      text: "Last input was given. Attack finished. Proceed to post-attack effects",
      sender: "editor"
    });
  },onError);
}

let portFromPopUp;

function connectionReciever(port) {
  if(port.name != "connectToEditor") return;
  portFromPopUp = port;
  console.log("Connection from popup recieved. Responding")
  portFromPopUp.postMessage({greeting:"Editor script responded"});
  portFromPopUp.onMessage.addListener(messageReciever);
}

function messageReciever(message) {
  console.log(message);
}

const bodyObserverTargetNode = document.body;
const bodyObserverConfig = { childList: true };
const bodyObserverCallback = (mutationList, observer) => {
  for (const mutation of mutationList) {
    const change = mutation.addedNodes[0];
    if(!change) continue;
    if(change.className === TARGET_CLASS_NAME) inputHandler(change);
  }
}
const bodyObserver = new MutationObserver(bodyObserverCallback);
bodyObserver.observe(bodyObserverTargetNode, bodyObserverConfig);

browser.runtime.onConnect.addListener(connectionReciever);