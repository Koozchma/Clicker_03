// js/uiUpdates.js

/**
 * Formats a number into a more readable string.
 * @param {number} num - The number to format.
 * @param {number} [decimals=2] - Decimal places.
 * @returns {string} Formatted number.
 */
function formatNumber(num, decimals = 2) {
    if (num === undefined || num === null || isNaN(num)) return "0";
    if (num === 0) return "0";
    const absNum = Math.abs(num);
    const sign = num < 0 ? "-" : "";
    if (absNum < 0.01 && absNum !== 0) return sign + absNum.toExponential(1);
    const suffixes = ["", "k", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];
    let tier = 0;
    if (absNum >= 1000) tier = Math.floor(Math.log10(absNum) / 3);
    if (tier === 0) {
        let fixedNum = absNum.toFixed(decimals);
        if (decimals > 0 && fixedNum.includes('.')) fixedNum = fixedNum.replace(/\.?0+$/, "");
        return sign + fixedNum;
    }
    const suffix = suffixes[tier] || "";
    const scale = Math.pow(10, tier * 3);
    const scaled = absNum / scale;
    let fixedScaledNum = scaled.toFixed(decimals);
    if (decimals > 0 && fixedScaledNum.includes('.')) fixedScaledNum = fixedScaledNum.replace(/\.?0+$/, "");
    return sign + fixedScaledNum + suffix;
}

/**
 * Updates all resource displays in the UI.
 */
function updateResourceDisplay() {
    const resources = [
        { name: 'Energy', idPrefix: 'energy', current: gameData.currentEnergy, prodSiphon: gameData.productionRates.energyFromAmbientSiphon, prodBuildings: gameData.productionRates.energyFromHarvesters, upkeepConverters: gameData.upkeepRates.energyForConverters, upkeepSystems: gameData.upkeepRates.energyForOtherSystems, unit: 'e/sec' },
        // For Material, prodTotal IS gameData.productionRates.material, which is calculated in buildings.js
        { name: 'Material', idPrefix: 'material', current: gameData.material, prodTotal: gameData.productionRates.material, upkeepTotal: 0, unit: 'm/sec' },
        // For Research Data, prodTotal IS gameData.productionRates.researchData
        { name: 'Research Data', idPrefix: 'research', current: gameData.researchData, prodTotal: gameData.productionRates.researchData, upkeepTotal: gameData.upkeepRates.research || 0, unit: 'r.data/sec' },
        // For Credits, prodTotal IS gameData.productionRates.credits
        { name: 'Credits', idPrefix: 'credits', current: gameData.credits, prodTotal: gameData.productionRates.credits, upkeepTotal: gameData.upkeepRates.creditsForMaintenance, unit: 'c/sec' }
    ];

    resources.forEach(res => {
        const currentVal = Number(res.current) || 0;
        const currentDisplayId = res.idPrefix === 'research' ? 'currentResearch' : `current${res.idPrefix.charAt(0).toUpperCase() + res.idPrefix.slice(1)}`;
        if(document.getElementById(currentDisplayId)) {
             document.getElementById(currentDisplayId).textContent = formatNumber(currentVal, 2);
        }

        let totalGrossProduction, totalPotentialUpkeep;
        if (res.name === 'Energy') {
            totalGrossProduction = (Number(res.prodSiphon) || 0) + (Number(res.prodBuildings) || 0);
            totalPotentialUpkeep = (Number(res.upkeepConverters) || 0) + (Number(res.upkeepSystems) || 0);
        } else {
            // For Material, Research Data, Credits, prodTotal directly comes from gameData.productionRates.RESOURCE
            // This value is calculated by summing up all relevant converter outputs in buildings.js
            totalGrossProduction = Number(res.prodTotal) || 0;
            totalPotentialUpkeep = Number(res.upkeepTotal) || 0;
        }
        const netChangePerSecond = totalGrossProduction - totalPotentialUpkeep;

        const netChangeSpan = document.getElementById(`${res.idPrefix}NetChange`);
        if (netChangeSpan) {
            netChangeSpan.textContent = formatNumber(netChangePerSecond, 2);
            netChangeSpan.classList.toggle('negative-value', netChangePerSecond < 0);
        }
        // This displays the totalGrossProduction, which includes output from all relevant converters
        if(document.getElementById(`${res.idPrefix}ProductionRate`)) document.getElementById(`${res.idPrefix}ProductionRate`).textContent = formatNumber(totalGrossProduction, 2);
        if(document.getElementById(`${res.idPrefix}UpkeepRate`)) document.getElementById(`${res.idPrefix}UpkeepRate`).textContent = formatNumber(totalPotentialUpkeep, 2);
    });
}

/**
 * Updates interaction area elements like click power and manual conversion buttons.
 */
function updateInteractionArea() {
    if(document.getElementById('clickPowerDisplay')) document.getElementById('clickPowerDisplay').textContent = formatNumber(gameData.clickPower, 0);
    if(document.getElementById('totalClicksDisplay')) document.getElementById('totalClicksDisplay').textContent = formatNumber(gameData.totalClicks, 0);
    if(document.getElementById('promotionLevelDisplay')) document.getElementById('promotionLevelDisplay').textContent = formatNumber(gameData.promotionLevel, 0);
    if(document.getElementById('promotionBonusDisplay')) document.getElementById('promotionBonusDisplay').textContent = formatNumber(gameData.promotionLevel * gameData.promotionBaseBonus, 0);

    const manualMaterialButton = document.getElementById('manualConvertMaterialButton');
    if (manualMaterialButton) {
        manualMaterialButton.disabled = gameData.currentEnergy < gameData.manualConversion.material.energyCost;
    }
    const manualResearchButton = document.getElementById('manualConvertResearchButton');
    if (manualResearchButton) {
        manualResearchButton.disabled = gameData.currentEnergy < gameData.manualConversion.research.energyCost;
    }
}

/**
 * Checks if a building can be afforded.
 * @param {string} buildingId
 * @returns {boolean}
 */
function canAffordBuildingWithAdjustedCost(buildingId) {
    if (typeof buildingTypes === 'undefined') return false;
    const building = buildingTypes[buildingId];
    if (!building) return false;
    const costToConsider = (typeof getAdjustedBuildingCost === 'function') ? getAdjustedBuildingCost(buildingId) : building.cost;
    if (!costToConsider) return false;
    return gameData.currentEnergy >= (costToConsider.energy || 0) &&
           gameData.material >= (costToConsider.material || 0) &&
           gameData.credits >= (costToConsider.credits || 0);
}

/**
 * Updates the list of buildings displayed in the UI.
 * @param {HTMLElement} container - The HTML element to render the list into.
 */
function updateBuildingList(container) {
    container.innerHTML = ''; 
    if (typeof buildingTypes === 'undefined') {
        container.innerHTML = '<p>Error: Construction data not loaded.</p>';
        return;
    }
    let hasVisibleBuildings = false;
    for (const id in buildingTypes) {
        const building = buildingTypes[id];
        // Filter for construction category OR if it's a harvester (general construction)
        // OR if it's a material converter (as per user's focus)
        if (building.category !== 'construction' && building.type !== 'harvester' && building.outputResource !== 'material') {
            // If you want ALL construction items, just use: if (building.category !== 'construction') continue;
            // If you want harvesters and material converters under "Construction":
            if (!(building.category === 'construction' || (building.type === 'harvester' || building.outputResource === 'material'))) continue;
        }


        const isUnlocked = !building.unlockedByScience || gameData.unlockedScience[building.unlockedByScience];
        if (!isUnlocked && !(gameData.ownedBuildings[id] > 0)) continue;
        hasVisibleBuildings = true;

        const adjustedCost = (typeof getAdjustedBuildingCost === 'function') ? getAdjustedBuildingCost(id) : building.cost;
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('building-item');
        
        let costString = `Cost: `;
        if (adjustedCost) {
            if(adjustedCost.energy > 0) costString += `${formatNumber(adjustedCost.energy,0)}E `;
            if(adjustedCost.material > 0) costString += `${formatNumber(adjustedCost.material,0)}M `;
            if(adjustedCost.credits > 0) costString += `${formatNumber(adjustedCost.credits,0)}C`;
            if (costString === `Cost: ` && (adjustedCost.energy === 0 || adjustedCost.material === 0 || adjustedCost.credits === 0)) costString = 'Cost: Free';
        } else { costString = 'Cost: N/A'; }

        let productionString = 'Produces: ';
        if(building.produces) {
            if(building.produces.energy) productionString += `${formatNumber(building.produces.energy,2)}E/s `;
            if(building.produces.material) productionString += `${formatNumber(building.produces.material,2)}M/s `;
            if(building.produces.credits) productionString += `${formatNumber(building.produces.credits,2)}C/s `;
            if(building.produces.researchData) productionString += `${formatNumber(building.produces.researchData,2)}RData/s `;
        }
        if (productionString === 'Produces: ') productionString = (building.type === 'harvester' && building.production && building.production.energy) ? '' : 'No direct production output.';


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
        container.appendChild(itemDiv);
        const button = document.getElementById(`buy-${id}`);
        if (button) {
            button.onclick = () => {
                if (typeof buyBuilding === 'function') buyBuilding(id);
                else console.error("buyBuilding function is not defined!");
            };
            button.disabled = !isUnlocked || !canAffordBuildingWithAdjustedCost(id) || (building.maxOwned && (gameData.ownedBuildings[id] || 0) >= building.maxOwned);
        }
    }
    if (!hasVisibleBuildings) {
        container.innerHTML = '<p>No facilities online or constructible with current knowledge in this category.</p>';
    }
}

/**
 * Updates the list of research items displayed in the UI.
 * @param {HTMLElement} container - The HTML element to render the list into.
 */
function updateScienceList(container) {
    container.innerHTML = ''; 
    if (typeof scienceTree === 'undefined') {
        container.innerHTML = '<p>Error: Research data not loaded.</p>';
        return;
    }
    let hasVisibleScience = false;
    const sortedScienceIds = Object.keys(scienceTree).sort((a, b) => {
        const techA = scienceTree[a]; const techB = scienceTree[b];
        if ((techA.tier || 0) < (techB.tier || 0)) return -1;
        if ((techA.tier || 0) > (techB.tier || 0)) return 1;
        return techA.name.localeCompare(techB.name);
    });

    for (const id of sortedScienceIds) {
        // Filter for research category if building.category is used for research items too
        // For now, assuming all scienceTree items belong to 'research' view
        hasVisibleScience = true;
        const tech = scienceTree[id];
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('science-item');
        if (gameData.unlockedScience[id]) itemDiv.classList.add('is-unlocked');
        
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
        container.appendChild(itemDiv);
        const button = document.getElementById(`research-${id}`);
        if (button) {
            if (gameData.unlockedScience[id]) button.disabled = true;
            else {
                button.onclick = () => {
                    if (typeof researchTech === 'function') researchTech(id);
                    else console.error("researchTech function is not defined!");
                };
                let canResearch = (typeof canAffordScience === 'function') ? canAffordScience(id) : false;
                if (tech.prerequisites) {
                    for (const prereqId of tech.prerequisites) {
                        if (!gameData.unlockedScience[prereqId]) { canResearch = false; break; }
                    }
                }
                button.disabled = !canResearch;
            }
        }
    }
    if (!hasVisibleScience) {
        container.innerHTML = '<p>No research projects available or defined.</p>';
    }
}

/**
 * Placeholder for updating Banking & Finance category.
 * @param {HTMLElement} container - The HTML element to render into.
 */
function updateBankingList(container) {
    container.innerHTML = ''; // Clear previous content
    if (typeof buildingTypes === 'undefined') {
        container.innerHTML = '<p>Error: Banking data not loaded.</p>';
        return;
    }
    let hasVisibleBankingItems = false;
    for (const id in buildingTypes) {
        const building = buildingTypes[id];
        // Filter for banking category
        if (building.category !== 'banking') continue;

        const isUnlocked = !building.unlockedByScience || gameData.unlockedScience[building.unlockedByScience];
        if (!isUnlocked && !(gameData.ownedBuildings[id] > 0)) continue;
        hasVisibleBankingItems = true;

        // Re-use building item display logic for banking structures
        const adjustedCost = (typeof getAdjustedBuildingCost === 'function') ? getAdjustedBuildingCost(id) : building.cost;
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('building-item'); // Can reuse 'building-item' or create 'banking-item'
        
        let costString = `Cost: `;
        if (adjustedCost) {
            if(adjustedCost.energy > 0) costString += `${formatNumber(adjustedCost.energy,0)}E `;
            if(adjustedCost.material > 0) costString += `${formatNumber(adjustedCost.material,0)}M `;
            if(adjustedCost.credits > 0) costString += `${formatNumber(adjustedCost.credits,0)}C`;
            if (costString === `Cost: ` && (adjustedCost.energy === 0 || adjustedCost.material === 0 || adjustedCost.credits === 0)) costString = 'Cost: Free';
        } else { costString = 'Cost: N/A'; }

        let productionString = 'Effect: '; // Changed from "Produces" for banking
        if(building.produces) {
            if(building.produces.credits) productionString += `+${formatNumber(building.produces.credits,2)}C/s `;
            // Add other potential banking effects here
        } else {
            productionString = 'No direct production output listed.';
        }
        if (building.description.includes("liquidity") || building.description.includes("funding")) { // Example
             // productionString can be more descriptive for banking items.
        }


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
            <button id="buy-${id}" class="build-button">Activate System</button> `;
        container.appendChild(itemDiv);
        const button = document.getElementById(`buy-${id}`);
        if (button) {
            button.onclick = () => {
                if (typeof buyBuilding === 'function') buyBuilding(id); // Uses the same buyBuilding logic
                else console.error("buyBuilding function is not defined!");
            };
            button.disabled = !isUnlocked || !canAffordBuildingWithAdjustedCost(id) || (building.maxOwned && (gameData.ownedBuildings[id] || 0) >= building.maxOwned);
        }
    }
    if (!hasVisibleBankingItems) {
         container.innerHTML = '<p>Banking & Finance systems are under development or require further research.</p>';
    }
}


/**
 * Updates the category display area based on gameData.activeCategoryView.
 */
function updateCategoryDisplay() {
    const categoryTitleElement = document.getElementById('categoryTitle');
    const categoryListContainer = document.getElementById('categoryListContainer');
    const navButtons = {
        construction: document.getElementById('navButtonConstruction'),
        research: document.getElementById('navButtonResearch'),
        banking: document.getElementById('navButtonBanking')
    };

    if (!categoryTitleElement || !categoryListContainer) {
        console.error("Category display elements not found!");
        return;
    }

    for (const category in navButtons) {
        if (navButtons[category]) {
            navButtons[category].classList.toggle('active', gameData.activeCategoryView === category);
        }
    }

    switch (gameData.activeCategoryView) {
        case 'construction':
            categoryTitleElement.textContent = 'Construction & Automation';
            updateBuildingList(categoryListContainer);
            break;
        case 'research':
            categoryTitleElement.textContent = 'Research & Development';
            updateScienceList(categoryListContainer);
            break;
        case 'banking':
            categoryTitleElement.textContent = 'Banking & Finance';
            updateBankingList(categoryListContainer); 
            break;
        default:
            categoryTitleElement.textContent = 'Select a Category';
            categoryListContainer.innerHTML = '<p>Please select a category from above to view details.</p>';
    }
}

/**
 * Calls all individual UI update functions to refresh the entire game display.
 */
function updateAllUIDisplays() {
    updateResourceDisplay();
    updateInteractionArea();
    updateCategoryDisplay(); 
}

// Log to confirm script is loaded
console.log("uiUpdates.js loaded.");
