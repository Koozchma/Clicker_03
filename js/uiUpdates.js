// js/uiUpdates.js

function formatNumber(num, decimals = 2) {
    if (num === undefined || num === null) return "0";
    if (num === 0) return "0";

    const absNum = Math.abs(num);
    const sign = num < 0 ? "-" : "";

    if (absNum < 0.01 && absNum !== 0) return sign + absNum.toExponential(1);

    const suffixes = ["", "k", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];
    let tier = 0;
    let tempNum = absNum;

    // Determine tier only for numbers >= 1000
    if (absNum >= 1000) {
        tier = Math.floor(Math.log10(absNum) / 3);
    }

    if (tier === 0) return sign + absNum.toFixed(decimals).replace(/\.00$/, ""); // Remove .00 for whole numbers

    const suffix = suffixes[tier] || ""; // Fallback if tier is too high
    const scale = Math.pow(10, tier * 3);
    const scaled = absNum / scale;

    return sign + scaled.toFixed(decimals).replace(/\.00$/, "") + suffix;
}


function updateResourceDisplay() {
    document.getElementById('currentEnergy').textContent = formatNumber(gameData.currentEnergy);
    document.getElementById('currentCredits').textContent = formatNumber(gameData.credits);
    document.getElementById('currentMaterial').textContent = formatNumber(gameData.material);
    document.getElementById('currentResearch').textContent = formatNumber(gameData.research);

    // Calculate total energy production (vault + buildings)
    const totalEnergyProduction = gameData.productionRates.energyFromVault + gameData.productionRates.energyFromBuildings;
    const netEnergyRate = totalEnergyProduction - gameData.upkeepRates.energy;
    const netCreditsRate = gameData.productionRates.credits - gameData.upkeepRates.credits;
    const netMaterialRate = gameData.productionRates.material - (gameData.upkeepRates.material || 0);
    const netResearchRate = gameData.productionRates.research - (gameData.upkeepRates.research || 0);

    document.getElementById('energyNetRate').textContent = `${formatNumber(netEnergyRate)} (${formatNumber(totalEnergyProduction,1)} - ${formatNumber(gameData.upkeepRates.energy,1)})`;
    document.getElementById('vaultBonusRate').textContent = formatNumber(gameData.productionRates.energyFromVault); // This is vault's contribution

    document.getElementById('creditsNetRate').textContent = `${formatNumber(netCreditsRate)} (${formatNumber(gameData.productionRates.credits,1)} - ${formatNumber(gameData.upkeepRates.credits,1)})`;
    document.getElementById('materialNetRate').textContent = `${formatNumber(netMaterialRate)} (${formatNumber(gameData.productionRates.material,1)} - ${formatNumber(gameData.upkeepRates.material || 0,1)})`;
    document.getElementById('researchNetRate').textContent = `${formatNumber(netResearchRate)} (${formatNumber(gameData.productionRates.research,1)} - ${formatNumber(gameData.upkeepRates.research || 0,1)})`;

    document.getElementById('vaultMultiplierDisplay').textContent = gameData.vaultMultiplierPercent.toFixed(2);
    document.getElementById('vaultPassiveGenerationDisplay').textContent = formatNumber(gameData.productionRates.energyFromVault);
}

function updateInteractionArea() {
    document.getElementById('clickPowerDisplay').textContent = formatNumber(gameData.clickPower, 0);
    document.getElementById('totalClicksDisplay').textContent = formatNumber(gameData.totalClicks, 0);
    document.getElementById('promotionLevelDisplay').textContent = formatNumber(gameData.promotionLevel, 0);
    document.getElementById('promotionBonusDisplay').textContent = formatNumber(gameData.promotionLevel * gameData.promotionBaseBonus, 0);
}

// Helper for canAffordBuilding with dynamic cost updates for UI disabling
function canAffordBuildingWithAdjustedCost(buildingId) {
    const building = buildingTypes[buildingId];
    if (!building) return false;
    const adjustedCost = getAdjustedBuildingCost(buildingId); // getAdjustedBuildingCost is in science.js
    if (!adjustedCost) return false; // Should not happen if building exists

    return gameData.currentEnergy >= adjustedCost.energy &&
           gameData.material >= adjustedCost.material &&
           gameData.credits >= adjustedCost.credits;
}

function updateBuildingList() {
    const buildingListDiv = document.getElementById('building-list');
    if (!buildingListDiv) return; // Guard if the element isn't found
    buildingListDiv.innerHTML = '';

    for (const id in buildingTypes) {
        const building = buildingTypes[id];
        const isUnlocked = !building.unlockedByScience || gameData.unlockedScience[building.unlockedByScience];
        const adjustedCost = getAdjustedBuildingCost(id); // From science.js

        if (!isUnlocked && !(gameData.ownedBuildings[id] > 0)) {
            // Optionally show locked buildings:
            // const itemDiv = document.createElement('div');
            // itemDiv.classList.add('building-item', 'locked');
            // itemDiv.innerHTML = `<h3>${building.name} (Locked)</h3><p>Requires: ${scienceTree[building.unlockedByScience]?.name || 'Research'}</p>`;
            // buildingListDiv.appendChild(itemDiv);
            continue;
        }

        const itemDiv = document.createElement('div');
        itemDiv.classList.add('building-item');
        if (!isUnlocked) itemDiv.style.opacity = "0.6";

        let costString = `Cost: `;
        if(adjustedCost.energy > 0) costString += `${formatNumber(adjustedCost.energy,0)}E `;
        if(adjustedCost.material > 0) costString += `${formatNumber(adjustedCost.material,0)}M `;
        if(adjustedCost.credits > 0) costString += `${formatNumber(adjustedCost.credits,0)}C`;
        if (costString === `Cost: `) costString = 'Cost: Free';


        let productionString = 'Produces: ';
        if(building.production) {
            if(building.production.energy) productionString += `${formatNumber(building.production.energy,1)}E/s `;
            if(building.production.material) productionString += `${formatNumber(building.production.material,1)}M/s `;
            if(building.production.credits && !building.specialBehavior) productionString += `${formatNumber(building.production.credits,1)}C/s `;
            if(building.production.research) productionString += `${formatNumber(building.production.research,1)}R/s `;
        }
        if(building.specialBehavior) productionString += `(Special Credit Gen) `;
        if (productionString === 'Produces: ') productionString = 'No direct production.';


        let upkeepString = 'Upkeep: ';
        if(building.upkeep) {
            if(building.upkeep.energy) upkeepString += `${formatNumber(building.upkeep.energy,1)}E/s `;
            if(building.upkeep.credits) upkeepString += `${formatNumber(building.upkeep.credits,1)}C/s `;
        }
        if (upkeepString === 'Upkeep: ') upkeepString = 'No upkeep.';


        itemDiv.innerHTML = `
            <h3>${building.name} (Owned: ${formatNumber(gameData.ownedBuildings[id] || 0, 0)}${building.maxOwned ? '/' + building.maxOwned : ''})</h3>
            <p>${building.description}</p>
            <p>${costString}</p>
            <p>${productionString}</p>
            <p>${upkeepString}</p>
            <button id="buy-${id}" ${!isUnlocked ? 'disabled' : ''}>Build</button>
        `;
        buildingListDiv.appendChild(itemDiv);

        const button = document.getElementById(`buy-${id}`);
        if (button) {
            button.onclick = () => buyBuilding(id); // buyBuilding is in buildings.js
            button.disabled = !isUnlocked || !canAffordBuildingWithAdjustedCost(id) || (building.maxOwned && (gameData.ownedBuildings[id] || 0) >= building.maxOwned);
        }
    }
}


function updateScienceList() {
    const scienceListDiv = document.getElementById('science-list');
    if (!scienceListDiv) return; // Guard
    scienceListDiv.innerHTML = '';

    const sortedScienceIds = Object.keys(scienceTree).sort((a, b) => {
        const techA = scienceTree[a];
        const techB = scienceTree[b];
        if ((techA.tier || 0) < (techB.tier || 0)) return -1;
        if ((techA.tier || 0) > (techB.tier || 0)) return 1;
        return techA.name.localeCompare(techB.name);
    });

    for (const id of sortedScienceIds) {
        const tech = scienceTree[id];
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('science-item');

        if (gameData.unlockedScience[id]) {
            itemDiv.style.borderLeftColor = "#4CAF50";
            itemDiv.style.opacity = "0.7";
        }

        let costString = `Cost: `;
        if(tech.cost.research > 0) costString += `${formatNumber(tech.cost.research,0)}R `;
        if(tech.cost.energy > 0) costString += `${formatNumber(tech.cost.energy,0)}E `;
        if(tech.cost.material > 0) costString += `${formatNumber(tech.cost.material,0)}M `;
        if(tech.cost.credits > 0) costString += `${formatNumber(tech.cost.credits,0)}C`;
        if (costString === `Cost: `) costString = 'Cost: Free';

        let prereqString = 'Prerequisites: ';
        if (tech.prerequisites && tech.prerequisites.length > 0) {
            prereqString += tech.prerequisites.map(pId => {
                const prereqTech = scienceTree[pId];
                return prereqTech ? (gameData.unlockedScience[pId] ? `<span style="color:lightgreen">${prereqTech.name}</span>` : `<span style="color:lightcoral">${prereqTech.name}</span>`) : 'Unknown';
            }).join(', ');
        } else {
            prereqString += 'None';
        }

        itemDiv.innerHTML = `
            <h3>${tech.name}</h3>
            <p>${tech.description}</p>
            <p>${costString}</p>
            <p>${prereqString}</p>
            <button id="research-${id}" ${gameData.unlockedScience[id] ? 'disabled' : ''}>
                ${gameData.unlockedScience[id] ? 'Researched' : 'Research'}
            </button>
        `;
        scienceListDiv.appendChild(itemDiv);

        const button = document.getElementById(`research-${id}`);
        if (button && !gameData.unlockedScience[id]) {
            button.onclick = () => researchTech(id); // researchTech is in science.js
            let canResearch = canAffordScience(id); // canAffordScience is in science.js
            if (tech.prerequisites) {
                for (const prereqId of tech.prerequisites) {
                    if (!gameData.unlockedScience[prereqId]) {
                        canResearch = false;
                        break;
                    }
                }
            }
            button.disabled = !canResearch;
        }
    }
}

function updateAllUIDisplays() {
    updateResourceDisplay();
    updateInteractionArea();
    updateBuildingList();
    updateScienceList();
}