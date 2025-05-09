// js/buildings.js

// Defines all building types (Harvesters and Converters) in the game.
// Includes their costs, production/consumption rates, upkeep, and unlock conditions.
const buildingTypes = {
    // ENERGY HARVESTERS
    'basicEnergySiphon': {
        id: 'basicEnergySiphon',
        name: 'Basic Energy Siphon',
        description: 'Improves passive siphoning of ambient universal energy. A fundamental step in Energy acquisition.',
        cost: { material: 0, credits: 0, energy: 25 }, // Initial cost: Energy only
        production: { energy: 0.1 }, // Adds 0.1 Energy/sec
        upkeep: { energy: 0.01 },    // Small energy upkeep to maintain
        unlockedByScience: null,     // Available by default
        type: 'harvester',           // Building category
        maxOwned: 5,                 // Example: Limit how many basic siphons can be built
    },
    'stellarCollector': {
        id: 'stellarCollector',
        name: 'Stellar Radiation Collector',
        description: 'Harnesses nearby stellar radiation for a significant energy boost. Requires specific technological insights.',
        cost: { material: 150, credits: 50, energy: 0 }, // Costs Material and Credits
        production: { energy: 1.5 }, // Produces 1.5 Energy/sec
        upkeep: { energy: 0.2, credits: 0.1 }, // Higher operational upkeep
        unlockedByScience: 'sci_stellar_harnessing', // Requires specific research
        type: 'harvester',
    },

    // MATERIAL CONVERTERS
    'matterCoalescerMk1': {
        id: 'matterCoalescerMk1',
        name: 'Matter Coalescer Mk1',
        description: 'Converts raw Energy into basic Material, the foundation for all construction.',
        cost: { material: 0, energy: 50 }, // Initial cost: Energy only, to kickstart material production
        consumes: { energy: 0.5 },      // Energy consumed per second per building
        produces: { material: 0.2 },    // Material produced per second per building
        upkeep: {},                     // Primary "upkeep" is its energy consumption
        unlockedByScience: null,        // Available by default
        type: 'converter',              // Building category
        outputResource: 'material',     // Specifies what it produces
        inputResource: 'energy',        // Specifies what it primarily consumes for conversion
    },
    'industrialFabricator': {
        id: 'industrialFabricator',
        name: 'Industrial Fabricator',
        description: 'More efficiently transmutes Energy into complex Materials, enabling advanced structures.',
        cost: { material: 200, energy: 0 }, // Requires previously produced Material
        consumes: { energy: 2.5 },
        produces: { material: 1.5 },
        upkeep: { credits: 0.2 },       // May have credit upkeep for operational complexity
        unlockedByScience: 'sci_advanced_material_conversion', // Requires specific research
        type: 'converter',
        outputResource: 'material',
        inputResource: 'energy',
    },

    // RESEARCH EMULATORS
    'dataStreamEmulator': {
        id: 'dataStreamEmulator',
        name: 'Data Stream Emulator',
        description: 'Channels Energy to simulate complex universal principles, generating vital Research Data.',
        cost: { material: 75, energy: 100 }, // Requires Material and Energy
        consumes: { energy: 0.8 },
        produces: { researchData: 0.3 }, // Produces Research Data
        upkeep: {},
        unlockedByScience: 'sci_basic_emulation', // Requires specific research
        type: 'converter',
        outputResource: 'researchData',
        inputResource: 'energy',
    },

    // CREDIT SYNTHESIZERS
    'valueRefinery': {
        id: 'valueRefinery',
        name: 'Value Refinery',
        description: 'Refines Energy into stable Credit units, providing operational liquidity and funding for special projects.',
        cost: { material: 100, energy: 150 }, // Requires Material and Energy
        consumes: { energy: 1.0 },
        produces: { credits: 0.5 }, // Produces Credits
        upkeep: {},
        unlockedByScience: 'sci_credit_synthesis', // Requires specific research
        type: 'converter',
        outputResource: 'credits',
        inputResource: 'energy',
    }
    // Future: Add more advanced converters, harvesters, and unique structures
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

    // Determine the actual cost, considering potential research modifiers
    // Assumes getAdjustedBuildingCost is globally available from science.js
    const costToConsider = (typeof getAdjustedBuildingCost === 'function')
        ? getAdjustedBuildingCost(buildingId)
        : building.cost;

    if (!costToConsider) { // Should not happen if building and getAdjustedBuildingCost are valid
        console.error(`canAffordBuilding: Failed to determine cost for ${buildingId}`);
        return false;
    }

    // Check each resource type defined in the cost object
    if ((costToConsider.energy || 0) > gameData.currentEnergy) return false;
    if ((costToConsider.material || 0) > gameData.material) return false;
    if ((costToConsider.credits || 0) > gameData.credits) return false;
    // Add other resource checks if new cost types are introduced

    return true;
}

/**
 * Handles the purchase of a building.
 * Deducts costs, adds the building to owned list, and updates UI.
 * @param {string} buildingId - The ID of the building to buy.
 * @returns {boolean} True if purchase was successful, false otherwise.
 */
function buyBuilding(buildingId) {
    const building = buildingTypes[buildingId];
    if (!building) {
        console.warn(`buyBuilding: Building definition not found for ID: ${buildingId}`);
        return false;
    }

    // Check if unlocked by science (if applicable)
    if (building.unlockedByScience && !gameData.unlockedScience[building.unlockedByScience]) {
        // scienceTree should be globally available from science.js for the name lookup
        const requiredTechName = (typeof scienceTree !== 'undefined' && scienceTree[building.unlockedByScience])
            ? scienceTree[building.unlockedByScience].name
            : 'required research';
        alert(`This structure requires "${requiredTechName}" to be researched first.`);
        return false;
    }

    // Check affordability using the helper function
    if (!canAffordBuilding(buildingId)) {
        alert(`Insufficient resources to construct ${building.name}.`);
        return false;
    }

    // Check max owned limit
    const currentOwned = gameData.ownedBuildings[buildingId] || 0;
    if (building.maxOwned && currentOwned >= building.maxOwned) {
        alert(`Maximum number of ${building.name}s (${building.maxOwned}) already constructed.`);
        return false;
    }

    // Deduct costs
    // Assumes getAdjustedBuildingCost is available for accurate cost deduction
    const actualCost = (typeof getAdjustedBuildingCost === 'function')
        ? getAdjustedBuildingCost(buildingId)
        : building.cost;

    gameData.currentEnergy -= (actualCost.energy || 0);
    gameData.material -= (actualCost.material || 0);
    gameData.credits -= (actualCost.credits || 0);

    // Add to owned buildings
    gameData.ownedBuildings[buildingId] = currentOwned + 1;

    console.log(`Constructed ${building.name}. Total owned: ${gameData.ownedBuildings[buildingId]}`);

    // Recalculate production and update UI (updateAllUIDisplays calls calculateTotalProductionAndUpkeep indirectly via gameTick or directly)
    // For immediate feedback on rates after purchase, it's good to recalculate.
    // However, gameTick will also do this. If updateAllUIDisplays is called, it should be sufficient.
    if (typeof updateAllUIDisplays === 'function') {
        updateAllUIDisplays();
    } else {
        console.warn("updateAllUIDisplays function not found after buying building.");
    }

    return true;
}

/**
 * Calculates total production and upkeep rates from all owned buildings.
 * Updates gameData.productionRates, gameData.upkeepRates, and gameData.consumptionRates.
 */
function calculateTotalProductionAndUpkeep() {
    // Reset all relevant rates to zero before recalculating
    gameData.productionRates.energyFromHarvesters = 0;
    gameData.productionRates.material = 0;
    gameData.productionRates.researchData = 0;
    gameData.productionRates.credits = 0;
    // Note: energyFromAmbientSiphon is calculated directly in gameTick

    gameData.upkeepRates.energyForConverters = 0;    // Energy DEMAND by converters
    gameData.upkeepRates.energyForOtherSystems = 0; // Energy upkeep for non-converters (e.g., harvesters)
    gameData.upkeepRates.creditsForMaintenance = 0; // Credit upkeep for any building

    // These track potential energy consumption if all converters run at 100%
    gameData.consumptionRates.energyByMaterialConverters = 0;
    gameData.consumptionRates.energyByResearchEmulators = 0;
    gameData.consumptionRates.energyByCreditSynthesizers = 0;

    let totalPotentialEnergyDemandFromConverters = 0;

    // Iterate over each type of building the player owns
    for (const buildingId in gameData.ownedBuildings) {
        const count = gameData.ownedBuildings[buildingId];
        if (count > 0) { // Only process if the player owns one or more
            const building = buildingTypes[buildingId];
            if (!building) {
                console.warn(`calculateTotalProductionAndUpkeep: Building definition missing for owned ID: ${buildingId}`);
                continue;
            }

            // Handle Energy Harvester production and their own direct upkeep
            if (building.type === 'harvester') {
                if (building.production && building.production.energy) {
                    gameData.productionRates.energyFromHarvesters += building.production.energy * count;
                }
                if (building.upkeep) {
                    gameData.upkeepRates.energyForOtherSystems += (building.upkeep.energy || 0) * count;
                    gameData.upkeepRates.creditsForMaintenance += (building.upkeep.credits || 0) * count;
                }
            }
            // Handle Converter resource production and their energy consumption (demand)
            else if (building.type === 'converter') {
                const energyNeededForThisType = (building.consumes && building.consumes.energy || 0) * count;
                totalPotentialEnergyDemandFromConverters += energyNeededForThisType;

                // Calculate potential production if energy is sufficient (actual scaling happens in gameTick)
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
                // Add any direct credit upkeep for converters
                if (building.upkeep && building.upkeep.credits) {
                    gameData.upkeepRates.creditsForMaintenance += building.upkeep.credits * count;
                }
            }
        }
    }
    // Store the total energy DEMAND from all converters
    gameData.upkeepRates.energyForConverters = totalPotentialEnergyDemandFromConverters;
}

// Console log to confirm the script is loaded and functions are defined (for debugging)
console.log("buildings.js loaded. Typeof buyBuilding:", typeof buyBuilding, "Typeof canAffordBuilding:", typeof canAffordBuilding);
