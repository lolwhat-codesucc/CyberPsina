"use strict";
const DEFAULT_OPTION_INT = 0;
const DEFAULT_OPTION_BOOL = false;

class toggleElementStats {
    bonusToDamage = 0;
    bonusToDice = 0;
    bonusToHit = 0;
    addedEffects = "";

    constructor(bonusToDamage,bonusToDice,bonusToHit,addedEffects){
        this.bonusToDamage = bonusToDamage;
        this.bonusToDice = bonusToDice;
        this.bonusToHit = bonusToHit;
        this.addedEffects = addedEffects;
    }
}

let toggleElementsParametersList = {
    "arcaneCascade": new toggleElementStats(2,0,0),
    "turn": new toggleElementStats(0,1,0,"fireDamage"),
    "zoneAttack": new toggleElementStats(0,0,-5),
    "enlarge": new toggleElementStats(4,0,0),
    "drawTheLightning": new toggleElementStats(0,0,0,"lightningDamage")
}

function onError(error){
    console.log(error);
}

function getStatInfoElements() {
    let divs = document.getElementsByClassName("stat-info");
    let inputs = [];
    for (const div of divs){
        inputs.push(div.firstElementChild);
    }
    return inputs;
}
function getToggleElements() {
    let divs = document.getElementsByClassName("toggle");
    let inputs = [];
    for (const div of divs){
        inputs.push(div.firstElementChild.firstElementChild);
    }
    return inputs;
}

function getAddedStatInfoElements() {
    let divs = document.getElementsByClassName("stat-info");
    let paras = [];
    for (const div of divs) {
        paras.push(div.getElementsByTagName("p")[0]);
    }
    return paras;
}

const toggleElements = getToggleElements();
const statElements = getStatInfoElements();
const addedStatElements = getAddedStatInfoElements();
const infoList = document.getElementById("info").getElementsByTagName("ul")[0];

function setToggles(loadedToggles) {
    if(Object.keys(loadedToggles).length != toggleElements.length){
        console.log(`Error during toggles loading.\n Restoring defaults...`);
        restoreDefaultOptions();
        return;
    }
    Object.keys(loadedToggles).forEach(loadedToggle => {
        toggleElements.find((x) => x.id == loadedToggle).checked = loadedToggles[loadedToggle];
    });
    saveAndRecalculateAddedStats();
}

function setStats(loadedStats) {
    if(Object.keys(loadedStats).length != statElements.length){
        console.log(`Error during stats loading.\n Restoring defaults...`);
        restoreDefaultOptions();
        return;
    }
    Object.keys(loadedStats).forEach(loadedStat => {
        statElements.find((x) => x.name == loadedStat).value = loadedStats[loadedStat];
    });
}

function loadOptions() {
    let toggleNames = [];
    let statNames = [];

    toggleElements.forEach(toggle => {
        toggleNames.push(toggle.id);
    });
    statElements.forEach(stat => {
        statNames.push(stat.name);
    });
    
    browser.storage.local.get(toggleNames).then(setToggles,onError).finally(console.log("Toggles loaded!"));
    browser.storage.local.get(statNames).then(setStats,onError).finally(console.log("Stats loaded!"));

    connectToEditor();
    connectToCharlist();
}

let portToEditor;
let portToCharlist;

function connectToEditor(tabs) {
    if(!tabs) {
        let activeTabs = browser.tabs.query({
        currentWindow: true,
        active: true,
        });
    activeTabs.then(connectToEditor,onError);
    return;
    };
    if(tabs.length <= 0) return;
    console.log("Connecting to editor script");
    let port = browser.tabs.connect(tabs[0].id, {
        name: "connectToEditor",
    });
    port.onMessage.addListener(messageReciever);
    portToEditor = port;
}

function connectToCharlist(tabs) {
    if(!tabs) {
        let activeTabs = browser.tabs.query({
        url:"https://app.roll20.net/editor/character/*"
        });
        activeTabs.then(connectToCharlist,onError);
        return;
    };
    if(tabs.length <= 0) return;
    console.log("Connecting to charlist script");
    let port = browser.tabs.connect(tabs[0].id, {
        name: "connectToCharlist",
    });
    port.onMessage.addListener(messageReciever);
    portToCharlist = port;
}

function messageReciever(message) {
    if (message.greeting) console.log(message.greeting);
    if (message.text) console.log(`Message from ${message.sender}: ${message.text}`);

    switch(message.name) {
        case "lastInputGiven":
            let activeEffects = [];
            for(let toggle of toggleElements) {
                if(toggle.checked && toggleElementsParametersList[toggle.id].addedEffects)
                    activeEffects.push(toggleElementsParametersList[toggle.id].addedEffects)
            }
            portToCharlist.postMessage({
                name: "lastInputGiven",
                text: "Last input was given. Attack finished. Proceed to post-attack effects",
                sender: "popup",
                effects: activeEffects
            });
            break;
    }
}

function saveOptions() {
    let toggles = {};
    toggleElements.forEach(toggle => {
        toggles[toggle.id] = toggle.checked;
    });
    browser.storage.local.set(toggles).catch(onError);

    let stats = {};
    getStatInfoElements().forEach(stat => {
        stats[stat.name] = stat.value;
    });
    browser.storage.local.set(stats).catch(onError);

    console.log("Options saved!");
    saveAndRecalculateAddedStats();
}

function restoreDefaultOptions() {
    toggleElements.forEach(toggle => {
        toggle.checked = DEFAULT_OPTION_BOOL;
    });
    statElements.forEach(stat => {
        stat.value = DEFAULT_OPTION_INT;
    });
    console.log("Restored defaults");
    saveOptions();
}

function saveAndRecalculateAddedStats() {
    console.log("Recalculating stats");
    let addedStats = new toggleElementStats(0,0,0);

    for(let toggle of toggleElements) {
        if (toggle.checked && toggleElementsParametersList[toggle.id]) {
            addedStats.bonusToDamage += toggleElementsParametersList[toggle.id].bonusToDamage;
            addedStats.bonusToDice += toggleElementsParametersList[toggle.id].bonusToDice;
            addedStats.bonusToHit += toggleElementsParametersList[toggle.id].bonusToHit;
        }
    }
    browser.storage.local.set({"addedStats":addedStats}).catch(onError);
    for(let statElement of addedStatElements) {
        statElement.textContent = addedStats[statElement.id.replace("added","")];
    }
}

console.log("Popup opened");
document.addEventListener("DOMContentLoaded",loadOptions);

toggleElements.forEach(toggle => {
    toggle.addEventListener("change",saveOptions);
});
statElements.forEach(stat => {
    stat.addEventListener("change",saveOptions);
});