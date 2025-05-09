// js/uiUpdates.js

/**
 * Formats a number into a more readable string, using suffixes for large numbers (k, M, B, etc.)
 * and scientific notation for very small non-zero numbers.
 * Also handles NaN, null, or undefined by returning "0".
 * @param {number} num - The number to format.
 * @param {number} [decimals=2] - The number of decimal places for scaled numbers.
 * @returns {string} The formatted number string.
 */
function formatNumber(num, decimals = 2) {
    if (num === undefined || num === null || isNaN(num)) return "0";
    if (num === 0) return "0";

    const absNum = Math.abs(num);
    const sign = num < 0 ? "-" : "";

    // Use scientific notation for very small non-zero numbers
    if (absNum < 0.01 && absNum !== 0) return sign + absNum.toExponential(1);

    const suffixes = ["", "k", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"]; // Add more as needed
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

/**
 * Updates all resource displays in the UI (Energy, Credits, Material, Research Data).
 * Follows the format: Current | Net Change/sec | (Total Production/sec - Total Upkeep/sec)
 */
function updateResourceDisplay() {
    // --- ENERGY ---
    const currentEnergyVal = Number(gameData.currentEnergy) || 0;
    document.getElementById('currentEnergy').textContent = formatNumber(currentEnergyVal, 2);

    const energyProdSiphon = Number(gameData.productionRates.energyFromAmbientSiphon) || 0;
    const energyProdHarvesters = Number(gameData.productionRates.energyFromHarvesters) || 0;
    const energyUpkeepConverters = Number(gameData.upkeepRates.energyForConverters) || 0; // This is potential DEMAND
    const energyUpkeepSystems = Number(gameData.upkeepRates.energyForOtherSystems) || 0;

    const totalGrossEnergyProduction = energyProdSiphon + energyProdHarvesters;
    const totalPotentialEnergyUpkeep = energyUpkeepConverters + energyUpkeepSystems;
    // Net change reflects potential based on full demand; actual energy change is handled in gameTick
    const netEnergyChangePerSecond = totalGrossEnergyProduction - totalPotentialEnergyUpkeep;

    const energyNetChangeSpan = document.getElementById('energyNetChange');
    if (energyNetChangeSpan) {
        energyNetChangeSpan.textContent = formatNumber(netEnergyChangePerSecond, 2);
        if (netEnergyChangePerSecond < 0) {
            energyNetChangeSpan.classList.add('negative-value');
        } else {
            energyNetChangeSpan.classList.remove('negative-value');
        }
    }
    if(document.getElementById('energyProductionRate')) document.getElementById('energyProductionRate').textContent = formatNumber(totalGrossEnergyProduction, 2);
    if(document.getElementById('energyUpkeepRate')) document.getElementById('energyUpkeepRate').textContent = formatNumber(totalPotentialEnergyUpkeep, 2);

    // --- CREDITS ---
    const currentCreditsVal = Number(gameData.credits) || 0;
    document.getElementById('currentCredits').textContent = formatNumber(currentCreditsVal, 2);

    const creditsProdTotal = Number(gameData.productionRates.credits) || 0;
    const creditsUpkeepTotal = Number(gameData.upkeepRates.creditsForMaintenance) || 0;
    const netCreditsChangePerSecond = creditsProdTotal - creditsUpkeepTotal;

    const creditsNetChangeSpan = document.getElementById('creditsNetChange');
    if (creditsNetChangeSpan) {
        creditsNetChangeSpan.textContent = formatNumber(netCreditsChangePerSecond, 2);
        if (netCreditsChangePerSecond < 0) {
            creditsNetChangeSpan.classList.add('negative-value');
        } else {
            creditsNetChangeSpan.classList.remove('negative-value');
        }
    }
    if(document.getElementById('creditsProductionRate')) document.getElementById('creditsProductionRate').textContent = formatNumber(creditsProdTotal, 2);
    if(document.getElementById('creditsUpkeepRate')) document.getElementById('creditsUpkeepRate').textContent = formatNumber(creditsUpkeepTotal, 2);


    // --- MATERIAL ---
    const currentMaterialVal = Number(gameData.material) || 0;
    document.getElementById('currentMaterial').textContent = formatNumber(currentMaterialVal, 2);

    const materialProdTotal = Number(gameData.productionRates.material) || 0;
    const materialUpkeepTotal = 0; // Material is consumed by converters, not passive upkeep typically
    const netMaterialChangePerSecond = materialProdTotal - materialUpkeepTotal;

    const materialNetChangeSpan = document.getElementById('materialNetChange');
    if(materialNetChangeSpan) {
        materialNetChangeSpan.textContent = formatNumber(netMaterialChangePerSecond, 2);
        // Material typically only increases or is consumed for building, so negative class might not apply here in the same way
        if (netMaterialChangePerSecond < 0) { // Should not happen if upkeep is 0
             materialNetChangeSpan.classList.add('negative-value');
        } else {
             materialNetChangeSpan.classList.remove('negative-value');
        }
    }
    if(document.getElementById('materialProductionRate')) document.getElementById('materialProductionRate').textContent = formatNumber(materialProdTotal, 2);
    if(document.getElementById('materialUpkeepRate')) document.getElementById('materialUpkeepRate').textContent = formatNumber(materialUpkeepTotal, 2);


    // --- RESEARCH DATA ---
    const currentResearchVal = Number(gameData.researchData) || 0; // Using researchData
    document.getElementById('currentResearch').textContent = formatNumber(currentResearchVal, 2); // HTML ID is 'currentResearch'

    const researchProdTotal = Number(gameData.productionRates.researchData) || 0;
    const researchUpkeepTotal = Number(gameData.upkeepRates.research) || 0; // Assuming a generic research upkeep if any
    const netResearchChangePerSecond = researchProdTotal - researchUpkeepTotal;

    const researchNetChangeSpan = document.getElementById('researchNetChange');
    if (researchNetChangeSpan) {
        researchNetChangeSpan.textContent = formatNumber(netResearchChangePerSecond, 2);
        if (netResearchChangePerSecond < 0) {
            researchNetChangeSpan.classList.add('negative-value');
        } else {
            researchNetChangeSpan.classList.remove('negative-value');
        }
    }
    if(document.getElementById('researchProductionRate')) document.getElementById('researchProductionRate').textContent = formatNumber(researchProdTotal, 2);
    if(document.getElementById('researchUpkeepRate')) document.getElementById('researchUpkeepRate').textContent = formatNumber(researchUpkeepTotal, 2);
}

/**
 * Updates the display of click power, total clicks, and promotion level.
 */
function updateInteractionArea() {
    if(document.getElementById('clickPowerDisplay')) document.getElementById('clickPowerDisplay').textContent = formatNumber(gameData.clickPower, 0);
    if(document.getElementById('totalClicksDisplay')) document.getElementById('totalClicksDisplay').textContent = formatNumber(gameData.totalClicks, 0);
    if(document.getElementById('promotionLevelDisplay')) document.getElementById('promotionLevelDisplay').textContent = formatNumber(gameData.promotionLevel, 0);
    if(document.getElementById('promotionBonusDisplay')) document.getElementById('promotionBonusDisplay').textContent = formatNumber(gameData.promotionLevel * gameData.promotionBaseBonus, 0);
    if(document.getElementById('vaultMultiplierDisplay')) document.getElementById('vaultMultiplierDisplay').textContent = gameData.ambientEnergySiphonRate !== undefined ? (gameData.ambientEnergySiphonRate * 100).toFixed(2) : "0.00";
}

/**
 * Helper function to check if a building can be afforded, considering research cost adjustments.
 * Relies on buildingTypes (from buildings.js) and getAdjustedBuildingCost (from science.js).
 * @param {string} buildingId - The ID of the building.
 * @returns {boolean} True if affordable, false otherwise.
 */
function canAffordBuildingWithAdjustedCost(buildingId) {
    // Ensure buildingTypes is available (should be global from buildings.js)
    if (typeof buildingTypes === 'undefined') {
        console.error("canAffordBuildingWithAdjustedCost: buildingTypes is not defined.");
        return false;
    }
    const building = buildingTypes[buildingId];
    if (!building) return false;

    // Ensure getAdjustedBuildingCost is available (should be global from science.js)
    const costToConsider = (typeof getAdjustedBuildingCost === 'function')
        ? getAdjustedBuildingCost(buildingId)
        : building.cost;

    if (!costToConsider) return false;

    return gameData.currentEnergy >= (costToConsider.energy || 0) &&
           gameData.material >= (costToConsider.material || 0) &&
           gameData.credits >= (costToConsider.credits || 0);
}

/**
 * Dynamically generates and updates the list of buildings in the UI.
 * Handles enabling/disabling build buttons based on cost, unlocks, and limits.
 */
function updateBuildingList() {
    const buildingListDiv = document.getElementById('building-list');
    if (!buildingListDiv) return; // Element not found, exit
    buildingListDiv.innerHTML = ''; // Clear existing items

    // Ensure buildingTypes is available
    if (typeof buildingTypes === 'undefined') {
        console.error("updateBuildingList: buildingTypes is not defined.");
        buildingListDiv.innerHTML = '<p>Error: Building data not loaded.</p>';
        return;
    }
    let hasVisibleBuildings = false;

    for (const id in buildingTypes) {
        const building = buildingTypes[id];
        const isUnlocked = !building.unlockedByScience || gameData.unlockedScience[building.unlockedByScience];

        // Only display if unlocked, or if already owned (even if lock conditions change later)
        if (!isUnlocked && !(gameData.ownedBuildings[id] > 0)) {
            continue;
        }
        hasVisibleBuildings = true;

        const adjustedCost = (typeof getAdjustedBuildingCost === 'function')
            ? getAdjustedBuildingCost(id)
            : building.cost;

        const itemDiv = document.createElement('div');
        itemDiv.classList.add('building-item');
        if (!isUnlocked) itemDiv.style.opacity = "0.6"; // Visually indicate if somehow shown but not truly "active"

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
        if(building.produces) {
            if(building.produces.energy) productionString += `${formatNumber(building.produces.energy,2)}E/s `;
            if(building.produces.material) productionString += `${formatNumber(building.produces.material,2)}M/s `;
            if(building.produces.credits) productionString += `${formatNumber(building.produces.credits,2)}C/s `;
            if(building.produces.researchData) productionString += `${formatNumber(building.produces.researchData,2)}RData/s `;
        }
        if (productionString === 'Produces: ') productionString = building.type === 'harvester' && building.production.energy ? '' : 'No direct production output.';


        let upkeepString = 'Requires: ';
        if(building.consumes && building.consumes.energy > 0) {
            upkeepString += `${formatNumber(building.consumes.energy,2)}E/s (to operate) `;
        }
        if(building.upkeep) {
            if(building.upkeep.energy > 0) upkeepString += `${formatNumber(building.upkeep.energy,2)}E/s (maintenance) `;
            if(building.upkeep.credits > 0) upkeepString += `${formatNumber(building.upkeep.credits,2)}C/s (maintenance) `;
        }
        if (upkeepString === 'Requires: ') upkeepString = 'No operational requirements.';


        itemDiv.innerHTML = `
            <h3>${building.name} (Owned: ${formatNumber(gameData.ownedBuildings[id] || 0, 0)}${building.maxOwned ? '/' + building.maxOwned : ''})</h3>
            <p>${building.description}</p>
            <p class="cost-line">${costString}</p>
            <p>${productionString}</p>
            <p>${upkeepString}</p>
            <button id="buy-${id}" class="build-button">Construct</button>
        `;
        buildingListDiv.appendChild(itemDiv);

        const button = document.getElementById(`buy-${id}`);
        if (button) {
            // CRITICAL: Ensure buyBuilding is globally available from buildings.js
            button.onclick = () => {
                if (typeof buyBuilding === 'function') {
                    buyBuilding(id);
                } else {
                    console.error("buyBuilding function is not defined when button clicked!");
                    alert("Error: Build function unavailable. Check console.");
                }
            };
            button.disabled = !isUnlocked || !canAffordBuildingWithAdjustedCost(id) || (building.maxOwned && (gameData.ownedBuildings[id] || 0) >= building.maxOwned);
        }
    }
    if (!hasVisibleBuildings) {
        buildingListDiv.innerHTML = '<p>No facilities online or constructible with current knowledge.</p>';
    }
}

/**
 * Dynamically generates and updates the list of research items in the UI.
 */
function updateScienceList() {
    const scienceListDiv = document.getElementById('science-list');
    if (!scienceListDiv) return;
    scienceListDiv.innerHTML = '';

    if (typeof scienceTree === 'undefined') {
        console.error("updateScienceList: scienceTree is not defined.");
        scienceListDiv.innerHTML = '<p>Error: Research data not loaded.</p>';
        return;
    }
    let hasVisibleScience = false;

    const sortedScienceIds = Object.keys(scienceTree).sort((a, b) => {
        const techA = scienceTree[a];
        const techB = scienceTree[b];
        if ((techA.tier || 0) < (techB.tier || 0)) return -1;
        if ((techA.tier || 0) > (techB.tier || 0)) return 1;
        return techA.name.localeCompare(techB.name);
    });

    for (const id of sortedScienceIds) {
        hasVisibleScience = true;
        const tech = scienceTree[id];
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('science-item');
        if (gameData.unlockedScience[id]) {
            itemDiv.classList.add('is-unlocked'); // For CSS styling
        }

        let costString = `Cost: `;
        if(tech.cost.researchData > 0) costString += `${formatNumber(tech.cost.researchData,0)}RData `;
        if(tech.cost.energy > 0) costString += `${formatNumber(tech.cost.energy,0)}E `;
        if(tech.cost.material > 0) costString += `${formatNumber(tech.cost.material,0)}M `;
        if(tech.cost.credits > 0) costString += `${formatNumber(tech.cost.credits,0)}C`;
        if (costString === `Cost: ` && (tech.cost.researchData === 0 || tech.cost.energy === 0 || tech.cost.material === 0 || tech.cost.credits === 0)) costString = 'Cost: Free';

        let prereqString = 'Prerequisites: ';
        if (tech.prerequisites && tech.prerequisites.length > 0) {
            prereqString += tech.prerequisites.map(pId => {
                const prereqTech = scienceTree[pId];
                const met = gameData.unlockedScience[pId];
                return prereqTech ? `<span class="${met ? 'met' : 'unmet'}">${prereqTech.name}</span>` : 'Unknown';
            }).join(', ');
        } else {
            prereqString += 'None';
        }

        itemDiv.innerHTML = `
            <h3>${tech.name}</h3>
            <p>${tech.description}</p>
            <p class="cost-line">${costString}</p>
            <p class="prereq-line">${prereqString}</p>
            <button id="research-${id}" class="research-button">
                ${gameData.unlockedScience[id] ? 'Researched' : 'Initiate Research'}
            </button>
        `;
        scienceListDiv.appendChild(itemDiv);

        const button = document.getElementById(`research-${id}`);
        if (button) {
            if (gameData.unlockedScience[id]) {
                button.disabled = true;
            } else {
                button.onclick = () => {
                    if (typeof researchTech === 'function') {
                        researchTech(id);
                    } else {
                        console.error("researchTech function is not defined when button clicked!");
                        alert("Error: Research function unavailable. Check console.");
                    }
                };
                let canResearch = (typeof canAffordScience === 'function') ? canAffordScience(id) : false;
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
    if (!hasVisibleScience) {
        scienceListDiv.innerHTML = '<p>No research projects available or defined.</p>';
    }
}

/**
 * Calls all individual UI update functions to refresh the entire game display.
 */
function updateAllUIDisplays() {
    updateResourceDisplay();
    updateInteractionArea();
    updateBuildingList();
    updateScienceList();
}

// Log to confirm script is loaded
console.log("uiUpdates.js loaded.");
