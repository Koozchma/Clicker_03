// js/buildings.js

const buildingTypes = {
    // ENERGY HARVESTERS
    'basicEnergySiphon': {
        id: 'basicEnergySiphon',
        name: 'Basic Energy Siphon',
        description: 'Improves passive siphoning of ambient universal energy. A fundamental step in Energy acquisition.',
        cost: { material: 0, credits: 0, energy: 25 },
        production: { energy: 0.1 },
        upkeep: { energy: 0.01 },
        unlockedByScience: null, // Available by default
        type: 'harvester',
        category: 'construction', // Assign category for UI filtering
        maxOwned: 5,
    },
    'stellarCollector': {
        id: 'stellarCollector',
        name: 'Stellar Radiation Collector',
        description: 'Harnesses nearby stellar radiation for a significant energy boost. Requires specific technological insights.',
        cost: { material: 150, credits: 50, energy: 0 },
        production: { energy: 1.5 },
        upkeep: { energy: 0.2, credits: 0.1 },
        unlockedByScience: 'sci_stellar_harnessing',
        type: 'harvester',
        category: 'construction',
    },

    // TIER 1 CONVERTERS - Unlocked by 'sci_unlock_converters'
    'matterCoalescerMk1': {
        id: 'matterCoalescerMk1',
        name: 'Matter Coalescer Mk1',
        description: 'Converts raw Energy into basic Material, the foundation for all construction.',
        cost: { material: 5, energy: 75 }, // Requires manually acquired Material
        consumes: { energy: 0.5 },
        produces: { material: 0.2 },
        upkeep: {},
        unlockedByScience: 'sci_unlock_converters', // Now unlocked by the new science tech
        type: 'converter',
        outputResource: 'material',
        inputResource: 'energy',
        category: 'construction',
    },
    'dataStreamEmulator': {
        id: 'dataStreamEmulator',
        name: 'Data Stream Emulator',
        description: 'Channels Energy to simulate complex universal principles, generating vital Research Data.',
        cost: { material: 10, energy: 100 }, // Requires manually acquired Material
        consumes: { energy: 0.8 },
        produces: { researchData: 0.3 },
        upkeep: {},
        unlockedByScience: 'sci_unlock_converters', // Now unlocked by the new science tech
        type: 'converter',
        outputResource: 'researchData',
        inputResource: 'energy',
        category: 'research', // Belongs to research category
    },
    'valueRefinery': {
        id: 'valueRefinery',
        name: 'Value Refinery',
        description: 'Refines Energy into stable Credit units, providing operational liquidity and funding for special projects.',
        cost: { material: 15, energy: 125 }, // Requires manually acquired Material
        consumes: { energy: 1.0 },
        produces: { credits: 0.5 },
        upkeep: {},
        unlockedByScience: 'sci_unlock_converters', // Now unlocked by the new science tech
        type: 'converter',
        outputResource: 'credits',
        inputResource: 'energy',
        category: 'banking', // Belongs to banking category
    },

    // TIER 2+ (Examples for later)
    'industrialFabricator': {
        id: 'industrialFabricator',
        name: 'Industrial Fabricator',
        description: 'More efficiently transmutes Energy into complex Materials, enabling advanced structures.',
        cost: { material: 200, energy: 0, credits: 50 },
        consumes: { energy: 2.5 },
        produces: { material: 1.5 },
        upkeep: { credits: 0.2 },
        unlockedByScience: 'sci_advanced_material_conversion',
        type: 'converter',
        outputResource: 'material',
        inputResource: 'energy',
        category: 'construction',
    },
};

/**
 * Checks if the player can afford a given building.
 * @param {string} buildingId - The ID of the building to check.
 * @returns {boolean} True if affordable, false otherwise.
 */
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
        return false;
    }
    if ((costToConsider.energy || 0) > gameData.currentEnergy) return false;
    if ((costToConsider.material || 0) > gameData.material) return false;
    if ((costToConsider.credits || 0) > gameData.credits) return false;
    return true;
}

/**
 * Handles the purchase of a building.
 * @param {string} buildingId - The ID of the building to buy.
 * @returns {boolean} True if purchase was successful, false otherwise.
 */
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
        updateAllUIDisplays();
    }
    return true;
}

/**
 * Calculates total production and upkeep rates from all owned buildings.
 */
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
