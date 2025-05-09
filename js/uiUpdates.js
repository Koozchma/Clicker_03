// js/uiUpdates.js

function formatNumber(num, decimals = 2) {
    if (num === undefined || num === null || isNaN(num)) return "0"; // Added isNaN check
    if (num === 0) return "0";

    const absNum = Math.abs(num);
    const sign = num < 0 ? "-" : "";

    // Use scientific notation for very small non-zero numbers
    if (absNum < 0.01 && absNum !== 0) return sign + absNum.toExponential(1);

    const suffixes = ["", "k", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];
    let tier = 0;

    // Determine tier only for numbers >= 1000
    if (absNum >= 1000) {
        tier = Math.floor(Math.log10(absNum) / 3);
    }

    if (tier === 0) {
        let fixedNum = absNum.toFixed(decimals);
        // Remove trailing .00 or .0 for whole numbers or numbers with fewer decimal places than 'decimals'
        if (decimals > 0 && fixedNum.includes('.')) {
            fixedNum = fixedNum.replace(/\.?0+$/, "");
        }
        return sign + fixedNum;
    }

    const suffix = suffixes[tier] || ""; // Fallback if tier is too high
    const scale = Math.pow(10, tier * 3);
    const scaled = absNum / scale;

    let fixedScaledNum = scaled.toFixed(decimals);
    if (decimals > 0 && fixedScaledNum.includes('.')) {
        // Remove trailing .00 or .0
        fixedScaledNum = fixedScaledNum.replace(/\.?0+$/, "");
    }
    return sign + fixedScaledNum + suffix;
}


function updateResourceDisplay() {
    // --- ENERGY ---
    const currentEnergyVal = Number(gameData.currentEnergy) || 0;
    document.getElementById('currentEnergy').textContent = formatNumber(currentEnergyVal, 2); // Display current energy with up to 2 decimals

    const energyProdVault = Number(gameData.productionRates.energyFromVault) || 0;
    const energyProdBuildings = Number(gameData.productionRates.energyFromBuildings) || 0;
    const energyUpkeepTotal = Number(gameData.upkeepRates.energy) || 0;

    const totalGrossEnergyProduction = energyProdVault + energyProdBuildings;
    const netEnergyChangePerSecond = totalGrossEnergyProduction - energyUpkeepTotal;

    document.getElementById('energyNetChange').textContent = formatNumber(netEnergyChangePerSecond, 2);
    document.getElementById('energyProductionRate').textContent = formatNumber(totalGrossEnergyProduction, 2);
    document.getElementById('energyUpkeepRate').textContent = formatNumber(energyUpkeepTotal, 2);

    // --- CREDITS ---
    const currentCreditsVal = Number(gameData.credits) || 0;
    document.getElementById('currentCredits').textContent = formatNumber(currentCreditsVal, 2);

    const creditsProdTotal = Number(gameData.productionRates.credits) || 0;
    const creditsUpkeepTotal = Number(gameData.upkeepRates.credits) || 0;
    const netCreditsChangePerSecond = creditsProdTotal - creditsUpkeepTotal;

    document.getElementById('creditsNetChange').textContent = formatNumber(netCreditsChangePerSecond, 2);
    document.getElementById('creditsProductionRate').textContent = formatNumber(creditsProdTotal, 2);
    document.getElementById('creditsUpkeepRate').textContent = formatNumber(creditsUpkeepTotal, 2);

    // --- MATERIAL ---
    const currentMaterialVal = Number(gameData.material) || 0;
    document.getElementById('currentMaterial').textContent = formatNumber(currentMaterialVal, 2);

    const materialProdTotal = Number(gameData.productionRates.material) || 0;
    const materialUpkeepTotal = Number(gameData.upkeepRates.material) || 0;
    const netMaterialChangePerSecond = materialProdTotal - materialUpkeepTotal;

    document.getElementById('materialNetChange').textContent = formatNumber(netMaterialChangePerSecond, 2);
    document.getElementById('materialProductionRate').textContent = formatNumber(materialProdTotal, 2);
    document.getElementById('materialUpkeepRate').textContent = formatNumber(materialUpkeepTotal, 2);

    // --- RESEARCH ---
    const currentResearchVal = Number(gameData.research) || 0;
    document.getElementById('currentResearch').textContent = formatNumber(currentResearchVal, 2);

    const researchProdTotal = Number(gameData.productionRates.research) || 0;
    const researchUpkeepTotal = Number(gameData.upkeepRates.research) || 0;
    const netResearchChangePerSecond = researchProdTotal - researchUpkeepTotal;

    document.getElementById('researchNetChange').textContent = formatNumber(netResearchChangePerSecond, 2);
    document.getElementById('researchProductionRate').textContent = formatNumber(researchProdTotal, 2);
    document.getElementById('researchUpkeepRate').textContent = formatNumber(researchUpkeepTotal, 2);
}

function updateInteractionArea() {
    document.getElementById('clickPowerDisplay').textContent = formatNumber(gameData.clickPower, 0); // Possible line 97
    document.getElementById('totalClicksDisplay').textContent = formatNumber(gameData.totalClicks, 0); // Possible line
    document.getElementById('promotionLevelDisplay').textContent = formatNumber(gameData.promotionLevel, 0); // Possible line
    document.getElementById('promotionBonusDisplay').textContent = formatNumber(gameData.promotionLevel * gameData.promotionBaseBonus, 0); // Possible line
}

// Helper for canAffordBuilding with dynamic cost updates for UI disabling
// Assumes getAdjustedBuildingCost is available (defined in science.js)
function canAffordBuildingWithAdjustedCost(buildingId) {
    const building = buildingTypes[buildingId]; // Assumes buildingTypes is available (defined in buildings.js)
    if (!building) return false;
    const adjustedCost = getAdjustedBuildingCost(buildingId);
    if (!adjustedCost) return false;

    return gameData.currentEnergy >= adjustedCost.energy &&
           gameData.material >= adjustedCost.material &&
           gameData.credits >= adjustedCost.credits;
}

function updateBuildingList() {
    const buildingListDiv = document.getElementById('building-list');
    if (!buildingListDiv) {
        // console.warn("Building list element not found!");
        return;
    }
    buildingListDiv.innerHTML = ''; // Clear existing items

    for (const id in buildingTypes) { // Assumes buildingTypes is available
        const building = buildingTypes[id];
        const isUnlocked = !building.unlockedByScience || gameData.unlockedScience[building.unlockedByScience];
        const adjustedCost = getAdjustedBuildingCost(id); // Assumes getAdjustedBuildingCost is available

        if (!isUnlocked && !(gameData.ownedBuildings[id] > 0)) {
            // Optionally, show locked buildings differently or skip
            continue;
        }

        const itemDiv = document.createElement('div');
        itemDiv.classList.add('building-item');
        if (!isUnlocked) itemDiv.style.opacity = "0.6";

        let costString = `Cost: `;
        if (adjustedCost) {
            if(adjustedCost.energy > 0) costString += `${formatNumber(adjustedCost.energy,0)}E `;
            if(adjustedCost.material > 0) costString += `${formatNumber(adjustedCost.material,0)}M `;
            if(adjustedCost.credits > 0) costString += `${formatNumber(adjustedCost.credits,0)}C`;
            if (costString === `Cost: ` && (adjustedCost.energy === 0 || adjustedCost.material === 0 || adjustedCost.credits === 0)) costString = 'Cost: Free';
        } else {
            costString = 'Cost: N/A';
        }


        let productionString = 'Produces: ';
        if(building.production) {
            if(building.production.energy) productionString += `${formatNumber(building.production.energy,1)}E/s `;
            if(building.production.material) productionString += `${formatNumber(building.production.material,1)}M/s `;
            if(building.production.credits && !building.consumes) productionString += `${formatNumber(building.production.credits,1)}C/s `; // Show if not a conversion building
            if(building.production.research) productionString += `${formatNumber(building.production.research,1)}R/s `;
        }
        if(building.id === 'tradeDepot') productionString += `(${formatNumber(building.consumes.material * building.creditOutputPerMaterialConsumed, 1)}C/s from M) `;
        if(building.id === 'marketStall') productionString += `(C/s from E) `;

        if (productionString === 'Produces: ') productionString = 'No direct production.';


        let upkeepString = 'Upkeep: ';
        if(building.upkeep) {
            if(building.upkeep.energy) upkeepString += `${formatNumber(building.upkeep.energy,1)}E/s `;
            if(building.upkeep.credits) upkeepString += `${formatNumber(building.upkeep.credits,1)}C/s `;
        }
        if(building.consumes && building.consumes.material) { // For buildings like Trade Depot
            upkeepString += `${formatNumber(building.consumes.material,1)}M/s (consumed) `;
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
            button.onclick = () => buyBuilding(id); // Assumes buyBuilding is available (defined in buildings.js)
            button.disabled = !isUnlocked || !canAffordBuildingWithAdjustedCost(id) || (building.maxOwned && (gameData.ownedBuildings[id] || 0) >= building.maxOwned);
        }
    }
}


function updateScienceList() {
    const scienceListDiv = document.getElementById('science-list');
    if (!scienceListDiv) {
        // console.warn("Science list element not found!");
        return;
    }
    scienceListDiv.innerHTML = ''; // Clear existing items

    // Sort science items (optional, but good for consistency)
    const sortedScienceIds = Object.keys(scienceTree).sort((a, b) => { // Assumes scienceTree is available
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
            itemDiv.style.borderLeftColor = "#4CAF50"; // Green for completed
            itemDiv.style.opacity = "0.7";
        }

        let costString = `Cost: `;
        if(tech.cost.research > 0) costString += `${formatNumber(tech.cost.research,0)}R `;
        if(tech.cost.energy > 0) costString += `${formatNumber(tech.cost.energy,0)}E `;
        if(tech.cost.material > 0) costString += `${formatNumber(tech.cost.material,0)}M `;
        if(tech.cost.credits > 0) costString += `${formatNumber(tech.cost.credits,0)}C`;
        if (costString === `Cost: ` && (tech.cost.research === 0 || tech.cost.energy === 0 || tech.cost.material === 0 || tech.cost.credits === 0)) costString = 'Cost: Free';

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
            button.onclick = () => researchTech(id); // Assumes researchTech is available (defined in science.js)
            let canResearch = canAffordScience(id); // Assumes canAffordScience is available
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
