"use strict";

let portFromPopUp;

function connectionReciever(port) {
  if(port.name != "connectToCharlist") return;
  portFromPopUp = port;
  console.log("Connection from popup recieved. Responding");
  portFromPopUp.postMessage({greeting:"Charlist script responded"});
  portFromPopUp.onMessage.addListener(messageReciever);
}

function messageReciever(message) {
    if (message.greeting) console.log(message.greeting);
    if (message.text) console.log(`Message from ${message.sender}: ${message.text}`);

    switch(message.name) {
        case "lastInputGiven":
            message.effects.forEach(effectHandler);
            break;
    }
}

function effectHandler(effect) {
    switch (effect) {
        case "fireDamage":
            actionButtons.find((x) => {return x.textContent.includes("огнем")}).click();
            break;
        case "lightningDamage":
            actionButtons.find((x) => {return x.textContent.includes("электричеством")}).click();
            break;
    }
}

let actionsContainer = Array.from(document.getElementsByClassName("repcontainer")).find((x) => {
    return x.getAttribute("data-groupname") == "repeating_actions";
});

let actionButtons = Array.from(actionsContainer.getElementsByTagName("button"))
.filter((x) => {
    return x.name == "roll_action";
})
.filter((x) => {
    return x.textContent.includes("(AUTO)");
});
browser.runtime.onConnect.addListener(connectionReciever);