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
        { name: 'Material', idPrefix: 'material', current: gameData.material, prodTotal: gameData.productionRates.material, upkeepTotal: 0, unit: 'm/sec' },
        { name: 'Research Data', idPrefix: 'research', current: gameData.researchData, prodTotal: gameData.productionRates.researchData, upkeepTotal: gameData.upkeepRates.research || 0, unit: 'r.data/sec' },
        { name: 'Credits', idPrefix: 'credits', current: gameData.credits, prodTotal: gameData.productionRates.credits, upkeepTotal: gameData.upkeepRates.creditsForMaintenance, unit: 'c/sec' }
    ];

    resources.forEach(res => {
        const currentVal = Number(res.current) || 0;
        const currentDisplayId = res.idPrefix === 'research' ? 'currentResearch' : `current${res.idPrefix.charAt(0).toUpperCase() + res.idPrefix.slice(1)}`;
        const currentDisplayElement = document.getElementById(currentDisplayId);
        if(currentDisplayElement) {
             currentDisplayElement.textContent = formatNumber(currentVal, 2);
        }

        let totalGrossProduction, totalPotentialUpkeep;
        if (res.name === 'Energy') {
            totalGrossProduction = (Number(res.prodSiphon) || 0) + (Number(res.prodBuildings) || 0);
            totalPotentialUpkeep = (Number(res.upkeepConverters) || 0) + (Number(res.upkeepSystems) || 0);
        } else {
            totalGrossProduction = Number(res.prodTotal) || 0;
            totalPotentialUpkeep = Number(res.upkeepTotal) || 0;
        }
        const netChangePerSecond = totalGrossProduction - totalPotentialUpkeep;

        const netChangeSpan = document.getElementById(`${res.idPrefix}NetChange`);
        if (netChangeSpan) {
            netChangeSpan.textContent = formatNumber(netChangePerSecond, 2);
            netChangeSpan.classList.toggle('negative-value', netChangePerSecond < 0);
        }
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
    if (typeof buildingTypes === 'undefined') {
        console.warn("buildingTypes not defined in canAffordBuildingWithAdjustedCost");
        return false;
    }
    const building = buildingTypes[buildingId];
    if (!building) return false;
    const costToConsider = (typeof getAdjustedBuildingCost === 'function') ? getAdjustedBuildingCost(buildingId) : building.cost;
    if (!costToConsider) return false; 
    return gameData.currentEnergy >= (costToConsider.energy || 0) &&
           gameData.material >= (costToConsider.material || 0) &&
           gameData.credits >= (costToConsider.credits || 0);
}

/**
 * Creates the "Output" string for a building card.
 * @param {object} building - The building object from buildingTypes.
 * @returns {string} The formatted output string.
 */
function getBuildingOutputString(building) {
    let outputParts = [];
    if (building.produces) {
        if (building.produces.energy !== undefined && building.produces.energy !== 0) outputParts.push(`${formatNumber(building.produces.energy, 2)} Energy/sec`);
        if (building.produces.material !== undefined && building.produces.material !== 0) outputParts.push(`${formatNumber(building.produces.material, 2)} Material/sec`);
        if (building.produces.credits !== undefined && building.produces.credits !== 0) outputParts.push(`${formatNumber(building.produces.credits, 2)} Credits/sec`);
        if (building.produces.researchData !== undefined && building.produces.researchData !== 0) outputParts.push(`${formatNumber(building.produces.researchData, 2)} RData/sec`);
    }
    if (building.type === 'harvester' && building.production && building.production.energy !== undefined && building.production.energy !== 0 && outputParts.length === 0) {
        outputParts.push(`${formatNumber(building.production.energy, 2)} Energy/sec`);
    }
    if (outputParts.length > 0) {
        return `Capacity: ${outputParts.join(', ')} (Production)`;
    }
    return 'Output: None or Passive Effect';
}

/**
 * Updates the list of buildings displayed in the UI for the active category.
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
        if (building.category !== 'construction') continue;

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

        const outputString = getBuildingOutputString(building); 

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
            <p>${outputString}</p> 
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
 * Only shows research items whose prerequisites are met or have no prerequisites.
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
        const tech = scienceTree[id];

        // *** NEW LOGIC TO FILTER DISPLAY BASED ON PREREQUISITES ***
        let prerequisitesMet = true;
        if (tech.prerequisites && tech.prerequisites.length > 0) {
            for (const prereqId of tech.prerequisites) {
                if (!gameData.unlockedScience[prereqId]) {
                    prerequisitesMet = false;
                    break;
                }
            }
        }
        // Only display if already unlocked OR prerequisites are met (or no prerequisites)
        if (!gameData.unlockedScience[id] && !prerequisitesMet) {
            continue; // Skip rendering this tech if its prerequisites are not met and it's not yet unlocked
        }
        // *** END OF NEW LOGIC ***

        hasVisibleScience = true;
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('science-item');
        if (gameData.unlockedScience[id]) itemDiv.classList.add('is-unlocked');
        
        let costString = `Cost: `;
        if(tech.cost.researchData > 0) costString += `${formatNumber(tech.cost.researchData,0)}RData `;
        if(tech.cost.energy > 0) costString += `${formatNumber(tech.cost.energy,0)}E `;
        if(tech.cost.material > 0) costString += `${formatNumber(tech.cost.material,0)}M `;
        if(tech.cost.credits > 0) costString += `${formatNumber(tech.cost.credits,0)}C`;
        if (costString === `Cost: ` && (tech.cost.researchData === 0 || tech.cost.energy === 0 || tech.cost.material === 0 || tech.cost.credits === 0)) costString = 'Cost: Free';

        let prereqDisplayString = 'Prerequisites: '; // For display purposes
        if (tech.prerequisites && tech.prerequisites.length > 0) {
            prereqDisplayString += tech.prerequisites.map(pId => {
                const prereqTech = scienceTree[pId];
                const met = gameData.unlockedScience[pId]; // Check if this specific prereq is met
                return prereqTech ? `<span class="${met ? 'met' : 'unmet'}">${prereqTech.name}</span>` : 'Unknown';
            }).join(', ');
        } else {
            prereqDisplayString += 'None';
        }
        
        itemDiv.innerHTML = `
            <h3>${tech.name}</h3>
            <p>${tech.description}</p>
            <p class="cost-line">${costString}</p>
            <p class="prereq-line">${prereqDisplayString}</p>
            <button id="research-${id}" class="research-button">
                ${gameData.unlockedScience[id] ? 'Researched' : 'Initiate Research'}
            </button>
        `;
        container.appendChild(itemDiv);
        const button = document.getElementById(`research-${id}`);
        if (button) {
            if (gameData.unlockedScience[id]) {
                button.disabled = true;
            } else {
                button.onclick = () => {
                    if (typeof researchTech === 'function') researchTech(id);
                    else console.error("researchTech function is not defined!");
                };
                // Affordability check is still needed for the button's disabled state
                button.disabled = !canAffordScience(id); // prerequisitesMet is already handled by the display filter
            }
        }
    }
    if (!hasVisibleScience) {
        container.innerHTML = '<p>No research projects currently available. Advance further to unlock new possibilities.</p>';
    }
}

/**
 * Updates the Banking & Finance category with relevant buildings/actions.
 * @param {HTMLElement} container - The HTML element to render into.
 */
function updateBankingList(container) {
    container.innerHTML = ''; 
    if (typeof buildingTypes === 'undefined') {
        container.innerHTML = '<p>Error: Banking data not loaded.</p>';
        return;
    }
    let hasVisibleBankingItems = false;
    for (const id in buildingTypes) {
        const building = buildingTypes[id];
        if (building.category !== 'banking') continue; 

        const isUnlocked = !building.unlockedByScience || gameData.unlockedScience[building.unlockedByScience];
        // Only display if unlocked by science, or if it has no science requirement (like basic starters)
        if (!isUnlocked && building.unlockedByScience && !(gameData.ownedBuildings[id] > 0) ) {
             continue;
        }
        // If it has no science requirement, it should always be considered for display
        if (building.unlockedByScience && !isUnlocked && !(gameData.ownedBuildings[id] > 0)) {
            // This condition was a bit complex, simplify: if it needs a science unlock and it's not unlocked,
            // and we don't own any, then skip.
            // If it has NO science requirement (unlockedByScience is null), it should pass this.
        } else if (building.unlockedByScience && !isUnlocked && !gameData.ownedBuildings[id]) {
            // If it requires science, is not unlocked, and we don't own any, skip.
            // This allows default items (unlockedByScience: null) to show.
            if (building.unlockedByScience !== null) continue;
        }


        hasVisibleBankingItems = true;

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

        const outputString = getBuildingOutputString(building); 

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
            <p>${outputString}</p>
            <p>${upkeepString}</p>
            <button id="buy-${id}" class="build-button">Activate System</button>
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
    
    categoryListContainer.innerHTML = ''; 

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
