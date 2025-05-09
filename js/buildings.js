// js/buildings.js

// Defines all building types (Harvesters and Converters) in the game.
const buildingTypes = {
    // THIS IS THE BUILDING FROM YOUR SCREENSHOT, NOW MODIFIED TO PRODUCE MATERIAL
    'basicEnergySiphon': {
        id: 'basicEnergySiphon',
        name: 'Basic Energy Siphon', // Keeping name as per your reference
        description: 'A foundational structure that now converts Energy directly into usable Material at a steady rate.',
        cost: { material: 0, credits: 0, energy: 25 }, // Original cost
        consumes: { energy: 0.5 },      // <<<< ADDED: Energy consumption to produce material
        produces: { material: 1 },    // <<<< CHANGED: Now produces 1 Material/sec
        upkeep: { energy: 0.01 },       // This can be its base operational upkeep on top of consumption
        unlockedByScience: null,        // AVAILABLE BY DEFAULT
        type: 'converter',              // <<<< CHANGED: Now a converter
        outputResource: 'material',     // <<<< ADDED
        inputResource: 'energy',        // <<<< ADDED
        category: 'construction',
        maxOwned: 5,                    // Original maxOwned
    },

    // INITIAL, SLOWER MATERIAL CONVERTER (if you want a different starting path)
    // This one is also default available and costs only energy.
    // You might want to make 'basicEnergySiphon' require research if this one exists.
    // For now, both are default to ensure one works as you expect.
    'basicMatterAssembler': {
        id: 'basicMatterAssembler',
        name: 'Basic Matter Assembler',
        description: 'A rudimentary converter that coalesces raw Energy into basic structural Material. Slower but essential for initial expansion if other methods are locked.',
        cost: { material: 0, credits: 0, energy: 40 },
        consumes: { energy: 0.25 },
        produces: { material: 0.1 },    // Produces 0.1 Material/sec
        upkeep: {},
        unlockedByScience: null,        // AVAILABLE BY DEFAULT
        type: 'converter',
        outputResource: 'material',
        inputResource: 'energy',
        category: 'construction',
        maxOwned: 10,
    },

    // ENERGY HARVESTER - Needed for energy income
    'microSiphonRelay': {
        id: 'microSiphonRelay',
        name: 'Micro-Siphon Relay',
        description: 'A small, automated relay that passively draws and stabilizes trace amounts of ambient Energy.',
        cost: { material: 5, credits: 0, energy: 30 },
        production: { energy: 0.15 }, // Produces Energy
        upkeep: { energy: 0.01 },
        unlockedByScience: 'sci_unlock_converters', // Requires research
        type: 'harvester',
        category: 'construction',
        maxOwned: 5,
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

    // TIER 1 CONVERTERS
    'dataStreamEmulator': {
        id: 'dataStreamEmulator',
        name: 'Data Stream Emulator',
        description: 'A Tier 1 Research converter. Channels Energy to emulate universal principles, generating vital Research Data.',
        cost: { material: 10, energy: 100 },
        consumes: { energy: 0.8 },
        produces: { researchData: 0.3 },
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
        description: 'A Tier 1 Credit synthesizer. Refines Energy into stable Credit units for economic operations.',
        cost: { material: 15, energy: 125 },
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
        produces: { material: 1.5 },
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
                if (building.production && building.production.energy !== undefined) {
                    gameData.productionRates.energyFromHarvesters += building.production.energy * count;
                }
                if (building.upkeep) {
                    gameData.upkeepRates.energyForOtherSystems += (building.upkeep.energy || 0) * count;
                    gameData.upkeepRates.creditsForMaintenance += (building.upkeep.credits || 0) * count;
                }
            } else if (building.type === 'converter') {
                const energyNeededForThisType = (building.consumes && building.consumes.energy || 0) * count;
                totalPotentialEnergyDemandFromConverters += energyNeededForThisType;

                // This is where production rates are aggregated
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
                    // If the converter also directly produces energy (uncommon for this model but possible)
                    if (building.produces.energy !== undefined) {
                         gameData.productionRates.energyFromHarvesters += building.produces.energy * count; // Or a new category like energyFromConverters
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
