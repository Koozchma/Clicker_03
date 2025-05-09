// js/uiUpdates.js

function formatNumber(num, decimals = 2) {
    if (num === 0) return "0";
    if (Math.abs(num) < 0.01 && num !== 0) return num.toExponential(1); // Use scientific for very small non-zero
    const suffixes = ["", "k", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"]; // Add more as needed
    const tier = Math.log10(Math.abs(num)) / 3 | 0;

    if (tier === 0) return num.toFixed(decimals);

    const suffix = suffixes[tier];
    const scale = Math.pow(10, tier * 3);
    const scaled = num / scale;

    return scaled.toFixed(decimals) + suffix;
}


function updateResourceDisplay() {
    document.getElementById('currentEnergy').textContent = formatNumber(gameData.currentEnergy);
    document.getElementById('currentCredits').textContent = formatNumber(gameData.credits);
    document.getElementById('currentMaterial').textContent = formatNumber(gameData.material);
    document.getElementById('currentResearch').textContent = formatNumber(gameData.research);

    // Net Rates
    const netEnergyRate = gameData.productionRates.energy - gameData.upkeepRates.energy;
    const netCreditsRate = gameData.productionRates.credits - gameData.upkeepRates.credits;
    const netMaterialRate = gameData.productionRates.material - (gameData.upkeepRates.material || 0);
    const netResearchRate = gameData.productionRates.research - (gameData.upkeepRates.research || 0); // Assuming research might have upkeep later

    document.getElementById('energyNetRate').textContent = `${formatNumber(netEnergyRate)} (${formatNumber(gameData.productionRates.energy,1)} - ${formatNumber(gameData.upkeepRates.energy,1)})`;
    document.getElementById('creditsNetRate').textContent = `${formatNumber(netCreditsRate)} (${formatNumber(gameData.productionRates.credits,1)} - ${formatNumber(gameData.upkeepRates.credits,1)})`;
    document.getElementById('materialNetRate').textContent = `${formatNumber(netMaterialRate)} (${formatNumber(gameData.productionRates.material,1)} - ${formatNumber(gameData.upkeepRates.material || 0,1)})`;
    document.getElementById('researchNetRate').textContent = `${formatNumber(netResearchRate)} (${formatNumber(gameData.productionRates.research,1)} - ${formatNumber(gameData.upkeepRates.research || 0,1)})`;

    // Vault Specific
    const passiveVaultGen = (gameData.currentEnergy > 0 ? gameData.currentEnergy * (getVaultGrowthFactor() -1) : 0);
    document.getElementById('vaultBonusRate').textContent = formatNumber(passiveVaultGen);
    document.getElementById('vaultMultiplierDisplay').textContent = gameData.vaultMultiplierPercent.toFixed(2);
    document.getElementById('vaultPassiveGenerationDisplay').textContent = formatNumber(passiveVaultGen);

}

function updateInteractionArea() {
    document.getElementById('clickPowerDisplay').textContent = formatNumber(gameData.clickPower, 0);
    document.getElementById('totalClicksDisplay').textContent = formatNumber(gameData.totalClicks, 0);
    document.getElementById('promotionLevelDisplay').textContent = formatNumber(gameData.promotionLevel, 0);
    document.getElementById('promotionBonusDisplay').textContent = formatNumber(gameData.promotionLevel * gameData.promotionBaseBonus, 0);
}

function updateBuildingList() {
    const buildingListDiv = document.getElementById('building-list');
    buildingListDiv.innerHTML = ''; // Clear existing items

    for (const id in buildingTypes) {
        const building = buildingTypes[id];
        const isUnlockedByScience = !building.unlockedByScience || gameData.unlockedScience[building.unlockedByScience];

        if (!isUnlockedByScience && !gameData.ownedBuildings[id]) { // Don't show if not unlocked and not owned (e.g. starting with some)
            // Option: could show as "locked"
            continue;
        }

        const adjustedCost = getAdjustedBuildingCost(id) || building.cost; // Use adjusted cost

        const itemDiv = document.createElement('div');
        itemDiv.classList.add('building-item');
        if (!isUnlockedByScience) itemDiv.style.opacity = "0.5"; // Visually indicate locked if not fully available

        let costString = `Cost: `;
        if(adjustedCost.energy > 0) costString += `${formatNumber(adjustedCost.energy,0)}E `;
        if(adjustedCost.material > 0) costString += `${formatNumber(adjustedCost.material,0)}M `;
        if(adjustedCost.credits > 0) costString += `${formatNumber(adjustedCost.credits,0)}C`;


        let productionString = 'Produces: ';
        if(building.production) {
            if(building.production.energy) productionString += `${formatNumber(building.production.energy,1)}E/s `;
            if(building.production.material) productionString += `${formatNumber(building.production.material,1)}M/s `;
            if(building.production.credits && !building.specialBehavior) productionString += `${formatNumber(building.production.credits,1)}C/s `;
            if(building.production.research) productionString += `${formatNumber(building.production.research,1)}R/s `;
        }
        if(building.specialBehavior) productionString += `(Special Credit Gen) `;


        let upkeepString = 'Upkeep: ';
        if(building.upkeep) {
            if(building.upkeep.energy) upkeepString += `${formatNumber(building.upkeep.energy,1)}E/s `;
            if(building.upkeep.credits) upkeepString += `${formatNumber(building.upkeep.credits,1)}C/s `;
        }


        itemDiv.innerHTML = `
            <h3>${building.name} (Owned: ${gameData.ownedBuildings[id] || 0}${building.maxOwned ? '/' + building.maxOwned : ''})</h3>
            <p>${building.description}</p>
            <p>${costString}</p>
            <p>${productionString || 'No direct production.'}</p>
            <p>${upkeepString || 'No upkeep.'}</p>
            <button id="buy-${id}" ${!isUnlockedByScience ? 'disabled' : ''}>Build</button>
        `;
        buildingListDiv.appendChild(itemDiv);

        const button = document.getElementById(`buy-${id}`);
        if (button) {
            button.onclick = () => buyBuilding(id);
            // Disable button if cannot afford (visual feedback updated more frequently in main loop or on resource change)
            button.disabled = !canAffordBuildingWithAdjustedCost(id) || !isUnlockedByScience || (building.maxOwned && (gameData.ownedBuildings[id] || 0) >= building.maxOwned);
        }
    }
}
// Helper for canAffordBuilding with dynamic cost updates for UI disabling
function canAffordBuildingWithAdjustedCost(buildingId) {
    const building = buildingTypes[buildingId];
    if (!building) return false;
    const adjustedCost = getAdjustedBuildingCost(buildingId) || building.cost;
    return gameData.currentEnergy >= adjustedCost.energy &&
           gameData.material >= adjustedCost.material &&
           gameData.credits >= adjustedCost.credits;
}


function updateScienceList() {
    const scienceListDiv = document.getElementById('science-list');
    scienceListDiv.innerHTML = ''; // Clear existing items

    // Sort science items by tier, then by name for consistent display
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
            itemDiv.style.borderLeftColor = "#4CAF50"; // Green for completed
            itemDiv.style.opacity = "0.7";
        }

        let costString = `Cost: `;
        if(tech.cost.research > 0) costString += `${formatNumber(tech.cost.research,0)}R `;
        if(tech.cost.energy > 0) costString += `${formatNumber(tech.cost.energy,0)}E `;
        if(tech.cost.material > 0) costString += `${formatNumber(tech.cost.material,0)}M `;
        if(tech.cost.credits > 0) costString += `${formatNumber(tech.cost.credits,0)}C`;

        let prereqString = 'Prerequisites: ';
        if (tech.prerequisites.length > 0) {
            prereqString += tech.prerequisites.map(pId => scienceTree[pId]?.name || 'Unknown').join(', ');
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
            button.onclick = () => researchTech(id);
            // Disable button if cannot afford or prerequisites not met
            let canResearch = canAffordScience(id);
            for (const prereqId of tech.prerequisites) {
                if (!gameData.unlockedScience[prereqId]) {
                    canResearch = false;
                    break;
                }
            }
            button.disabled = !canResearch;
        }
    }
}


function updateAllUIDisplays() {
    updateResourceDisplay();
    updateInteractionArea();
    updateBuildingList(); // This will also handle disabling/enabling buttons based on current resources
    updateScienceList();  // ditto
}
