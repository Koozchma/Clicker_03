// js/buildings.js

// Defines all building types (Harvesters and Converters) in the game.
const buildingTypes = {
    // INITIAL ENERGY HARVESTER (Still part of Construction & Automation)
    'microSiphonRelay': { // Renamed for clarity from a generic "siphon"
        id: 'microSiphonRelay',
        name: 'Micro-Siphon Relay',
        description: 'A small, automated relay that passively draws and stabilizes trace amounts of ambient Energy.',
        cost: { material: 5, credits: 0, energy: 30 }, // Requires a tiny bit of manually made material
        production: { energy: 0.15 }, // Produces Energy
        upkeep: { energy: 0.01 },
        unlockedByScience: 'sci_unlock_converters', // Unlocked early
        type: 'harvester',
        category: 'construction', // Foundational construction
        maxOwned: 5,
    },

    // INITIAL MATERIAL CONVERTER (Primary focus for Construction & Automation Material output)
    'basicMatterAssembler': { // Replaces/Re-purposes the old "Basic Energy Siphon"
        id: 'basicMatterAssembler',
        name: 'Basic Matter Assembler',
        description: 'A rudimentary converter that coalesces raw Energy into basic structural Material. Key for initial expansion.',
        cost: { material: 0, credits: 0, energy: 40 }, // Costs only Energy to get the first one
        consumes: { energy: 0.25 },      // Energy consumed per second
        produces: { material: 0.1 },    // <<<< PRODUCES 0.1 MATERIAL/SEC
        upkeep: {},
        unlockedByScience: null,        // AVAILABLE BY DEFAULT to kickstart material
        type: 'converter',
        outputResource: 'material',
        inputResource: 'energy',
        category: 'construction',
        maxOwned: 10, // Allow a few of these basic ones
    },

    // TIER 1 ADVANCED ENERGY HARVESTER
    'stellarCollector': {
        id: 'stellarCollector',
        name: 'Stellar Radiation Collector',
        description: 'Advanced Energy harvester. Efficiently captures nearby stellar radiation, significantly boosting raw Energy generation.',
        cost: { material: 150, credits: 50, energy: 0 },
        production: { energy: 1.5 },
        upkeep: { energy: 0.2, credits: 0.1 },
        unlockedByScience: 'sci_stellar_harnessing',
        type: 'harvester',
        category: 'construction',
    },

    // TIER 1 CONVERTERS (Unlocked by 'sci_unlock_converters' or specific research)
    'dataStreamEmulator': { // For Research Data
        id: 'dataStreamEmulator',
        name: 'Data Stream Emulator',
        description: 'A Tier 1 Research converter. Channels Energy to emulate universal principles, generating vital Research Data.',
        cost: { material: 10, energy: 100 }, // Requires Material
        consumes: { energy: 0.8 },
        produces: { researchData: 0.3 },
        upkeep: {},
        unlockedByScience: 'sci_unlock_converters',
        type: 'converter',
        outputResource: 'researchData',
        inputResource: 'energy',
        category: 'research',
    },
    'valueRefinery': { // For Credits
        id: 'valueRefinery',
        name: 'Value Refinery',
        description: 'A Tier 1 Credit synthesizer. Refines Energy into stable Credit units for economic operations.',
        cost: { material: 15, energy: 125 }, // Requires Material
        consumes: { energy: 1.0 },
        produces: { credits: 0.5 },
        upkeep: {},
        unlockedByScience: 'sci_unlock_converters',
        type: 'converter',
        outputResource: 'credits',
        inputResource: 'energy',
        category: 'banking',
    },

    // TIER 2+ MATERIAL CONVERTER
    'industrialFabricator': {
        id: 'industrialFabricator',
        name: 'Industrial Fabricator',
        description: 'An advanced Material converter. Offers superior efficiency in transmuting Energy into complex Materials.',
        cost: { material: 200, energy: 0, credits: 50 },
        consumes: { energy: 2.5 },
        produces: { material: 1.5 }, // Produces more Material
        upkeep: { credits: 0.2 },
        unlockedByScience: 'sci_advanced_material_conversion',
        type: 'converter',
        outputResource: 'material',
        inputResource: 'energy',
        category: 'construction',
    },
};

// --- canAffordBuilding function ---
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
    
    if (typeof calculateTotalProductionAndUpkeep === 'function') {
        calculateTotalProductionAndUpkeep(); // Recalculate rates
    } else {
        console.error("calculateTotalProductionAndUpkeep function not found!");
    }

    if (typeof updateAllUIDisplays === 'function') {
        updateAllUIDisplays(); // Then update UI with new rates
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
                if (building.production && building.production.energy !== undefined) { // Check property exists
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
                    if (building.outputResource === 'material' && building.produces.material !== undefined) {
                        gameData.productionRates.material += building.produces.material * count;
                        gameData.consumptionRates.energyByMaterialConverters += energyNeededForThisType;
                    } else if (building.outputResource === 'researchData' && building.produces.researchData !== undefined) {
                        gameData.productionRates.researchData += building.produces.researchData * count;
                        gameData.consumptionRates.energyByResearchEmulators += energyNeededForThisType;
                    } else if (building.outputResource === 'credits' && building.produces.credits !== undefined) {
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
