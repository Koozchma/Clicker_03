// Defines all building types (Harvesters and Converters) in the game.
const buildingTypes = {
    // ENERGY HARVESTERS
    'basicEnergySiphon': {
        id: 'basicEnergySiphon',
        name: 'Basic Energy Siphon',
        description: 'A fundamental Energy harvester. Passively siphons ambient universal energy, providing a steady initial Energy income.', // UPDATED DESCRIPTION
        cost: { material: 0, credits: 0, energy: 25 },
        production: { energy: 0.1 }, // This is its capacity for Energy
        upkeep: { energy: 0.01 },
        unlockedByScience: null,
        type: 'harvester',
        category: 'construction',
        maxOwned: 5,
    },
    'stellarCollector': {
        id: 'stellarCollector',
        name: 'Stellar Radiation Collector',
        description: 'Advanced Energy harvester. Efficiently captures nearby stellar radiation, significantly boosting raw Energy generation.', // UPDATED DESCRIPTION
        cost: { material: 150, credits: 50, energy: 0 },
        production: { energy: 1.5 }, // This is its capacity for Energy
        upkeep: { energy: 0.2, credits: 0.1 },
        unlockedByScience: 'sci_stellar_harnessing',
        type: 'harvester',
        category: 'construction',
    },

    // TIER 1 CONVERTERS
    'matterCoalescerMk1': {
        id: 'matterCoalescerMk1',
        name: 'Matter Coalescer Mk1',
        description: 'A Tier 1 Material converter. Transmutes raw Energy into basic Material, essential for construction and expansion.', // UPDATED DESCRIPTION
        cost: { material: 5, energy: 75 },
        consumes: { energy: 0.5 },
        produces: { material: 0.2 }, // This is its capacity for Material
        upkeep: {},
        unlockedByScience: 'sci_unlock_converters',
        type: 'converter',
        outputResource: 'material',
        inputResource: 'energy',
        category: 'construction',
    },
    'dataStreamEmulator': {
        id: 'dataStreamEmulator',
        name: 'Data Stream Emulator',
        description: 'A Tier 1 Research converter. Channels Energy to emulate universal principles, generating vital Research Data for technological advancement.', // UPDATED DESCRIPTION
        cost: { material: 10, energy: 100 },
        consumes: { energy: 0.8 },
        produces: { researchData: 0.3 }, // This is its capacity for Research Data
        upkeep: {},
        unlockedByScience: 'sci_unlock_converters',
        type: 'converter',
        outputResource: 'researchData',
        inputResource: 'energy',
        category: 'research',
    },
    'valueRefinery': {
        id: 'valueRefinery',
        name: 'Value Refinery',
        description: 'A Tier 1 Credit synthesizer. Refines Energy into stable Credit units, enabling advanced economic operations and projects.', // UPDATED DESCRIPTION
        cost: { material: 15, energy: 125 },
        consumes: { energy: 1.0 },
        produces: { credits: 0.5 }, // This is its capacity for Credits
        upkeep: {},
        unlockedByScience: 'sci_unlock_converters',
        type: 'converter',
        outputResource: 'credits',
        inputResource: 'energy',
        category: 'banking',
    },

    // TIER 2+
    'industrialFabricator': {
        id: 'industrialFabricator',
        name: 'Industrial Fabricator',
        description: 'An advanced Material converter. Offers superior efficiency in transmuting Energy into complex Materials for large-scale projects.', // UPDATED DESCRIPTION
        cost: { material: 200, energy: 0, credits: 50 },
        consumes: { energy: 2.5 },
        produces: { material: 1.5 }, // This is its capacity for Material
        upkeep: { credits: 0.2 },
        unlockedByScience: 'sci_advanced_material_conversion',
        type: 'converter',
        outputResource: 'material',
        inputResource: 'energy',
        category: 'construction',
    },
};

// --- canAffordBuilding function ---
// (Assumes getAdjustedBuildingCost is globally available from science.js)
function canAffordBuilding(buildingId) {
    const building = buildingTypes[buildingId];
    if (!building) {
        console.warn(`canAffordBuilding: Building definition not found for ID: ${buildingId}`);
        return false;
    }
    const costToConsider = (typeof getAdjustedBuildingCost === 'function')
        ? getAdjustedBuildingCost(buildingId)
        : building.cost;
    if (!costToConsider) {
        console.error(`canAffordBuilding: Failed to determine cost for ${buildingId}`);
        return false; // Should not happen if building and getAdjustedBuildingCost are valid
    }
    if ((costToConsider.energy || 0) > gameData.currentEnergy) return false;
    if ((costToConsider.material || 0) > gameData.material) return false;
    if ((costToConsider.credits || 0) > gameData.credits) return false;
    return true;
}

// --- buyBuilding function ---
function buyBuilding(buildingId) {
    const building = buildingTypes[buildingId];
    if (!building) {
        console.warn(`buyBuilding: Building definition not found for ID: ${buildingId}`);
        return false;
    }
    if (building.unlockedByScience && !gameData.unlockedScience[building.unlockedByScience]) {
        const requiredTechName = (typeof scienceTree !== 'undefined' && scienceTree[building.unlockedByScience])
            ? scienceTree[building.unlockedByScience].name
            : 'required research';
        alert(`This structure requires "${requiredTechName}" to be researched first.`);
        return false;
    }
    if (!canAffordBuilding(buildingId)) {
        alert(`Insufficient resources to construct ${building.name}.`);
        return false;
    }
    const currentOwned = gameData.ownedBuildings[buildingId] || 0;
    if (building.maxOwned && currentOwned >= building.maxOwned) {
        alert(`Maximum number of ${building.name}s (${building.maxOwned}) already constructed.`);
        return false;
    }
    const actualCost = (typeof getAdjustedBuildingCost === 'function')
        ? getAdjustedBuildingCost(buildingId)
        : building.cost;
    gameData.currentEnergy -= (actualCost.energy || 0);
    gameData.material -= (actualCost.material || 0);
    gameData.credits -= (actualCost.credits || 0);
    gameData.ownedBuildings[buildingId] = currentOwned + 1;
    console.log(`Constructed ${building.name}. Total owned: ${gameData.ownedBuildings[buildingId]}`);
    if (typeof updateAllUIDisplays === 'function') {
        updateAllUIDisplays(); // This triggers the update of system resource rates
    } else {
        console.warn("updateAllUIDisplays function not found after buying building.");
    }
    return true;
}

// --- calculateTotalProductionAndUpkeep function ---
function calculateTotalProductionAndUpkeep() {
    gameData.productionRates.energyFromHarvesters = 0;
    gameData.productionRates.material = 0;
    gameData.productionRates.researchData = 0;
    gameData.productionRates.credits = 0;
    gameData.upkeepRates.energyForConverters = 0;
    gameData.upkeepRates.energyForOtherSystems = 0;
    gameData.upkeepRates.creditsForMaintenance = 0;
    gameData.consumptionRates.energyByMaterialConverters = 0;
    gameData.consumptionRates.energyByResearchEmulators = 0;
    gameData.consumptionRates.energyByCreditSynthesizers = 0;
    let totalPotentialEnergyDemandFromConverters = 0;

    for (const buildingId in gameData.ownedBuildings) {
        const count = gameData.ownedBuildings[buildingId];
        if (count > 0) {
            const building = buildingTypes[buildingId];
            if (!building) {
                console.warn(`calcProd: Building def missing for owned ID: ${buildingId}`);
                continue;
            }
            if (building.type === 'harvester') {
                if (building.production && building.production.energy) {
                    gameData.productionRates.energyFromHarvesters += building.production.energy * count;
                }
                if (building.upkeep) {
                    gameData.upkeepRates.energyForOtherSystems += (building.upkeep.energy || 0) * count;
                    gameData.upkeepRates.creditsForMaintenance += (building.upkeep.credits || 0) * count;
                }
            } else if (building.type === 'converter') {
                const energyNeededForThisType = (building.consumes && building.consumes.energy || 0) * count;
                totalPotentialEnergyDemandFromConverters += energyNeededForThisType;
                if (building.produces) {
                    if (building.outputResource === 'material' && building.produces.material) {
                        gameData.productionRates.material += building.produces.material * count;
                        gameData.consumptionRates.energyByMaterialConverters += energyNeededForThisType;
                    } else if (building.outputResource === 'researchData' && building.produces.researchData) {
                        gameData.productionRates.researchData += building.produces.researchData * count;
                        gameData.consumptionRates.energyByResearchEmulators += energyNeededForThisType;
                    } else if (building.outputResource === 'credits' && building.produces.credits) {
                        gameData.productionRates.credits += building.produces.credits * count;
                        gameData.consumptionRates.energyByCreditSynthesizers += energyNeededForThisType;
                    }
                }
                if (building.upkeep && building.upkeep.credits) {
                    gameData.upkeepRates.creditsForMaintenance += building.upkeep.credits * count;
                }
            }
        }
    }
    gameData.upkeepRates.energyForConverters = totalPotentialEnergyDemandFromConverters;
}

// Log to confirm script is loaded
console.log("buildings.js loaded. Typeof buyBuilding:", typeof buyBuilding);
