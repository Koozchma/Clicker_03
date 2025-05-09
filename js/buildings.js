// js/buildings.js
const buildingTypes = {
    // ENERGY HARVESTERS
    'basicEnergySiphon': {
        id: 'basicEnergySiphon',
        name: 'Basic Energy Siphon',
        description: 'Improves passive siphoning of ambient universal energy.',
        // COST CHANGE: Only energy, or very low other resources if it's unlocked via a free/cheap science.
        // For now, let's make it cost only energy and be available by default.
        cost: { material: 0, credits: 0, energy: 25 }, // Was: material: 20
        production: { energy: 0.1 },
        upkeep: { energy: 0.01 },
        unlockedByScience: null, // Available by default
        type: 'harvester',
    },
    'stellarCollector': {
        id: 'stellarCollector',
        name: 'Stellar Radiation Collector',
        description: 'Harnesses nearby stellar radiation for a significant energy boost.',
        cost: { material: 150, credits: 50, energy: 0 }, // This can remain as is, for later
        production: { energy: 1.5 },
        upkeep: { energy: 0.2, credits: 0.1 },
        unlockedByScience: 'sci_stellar_harnessing', // Make sure this science exists
        type: 'harvester',
    },

    // MATERIAL CONVERTERS
    'matterCoalescerMk1': {
        id: 'matterCoalescerMk1',
        name: 'Matter Coalescer Mk1',
        description: 'Converts raw Energy into basic Material.',
        // COST CHANGE: Only energy for the very first step.
        cost: { material: 0, energy: 50 }, // Was: material: 10, energy: 50
        consumes: { energy: 0.5 },
        produces: { material: 0.2 },
        upkeep: {},
        unlockedByScience: null, // Let's make this available by default to get materials
        type: 'converter',
        outputResource: 'material',
        inputResource: 'energy',
    },
    'industrialFabricator': {
        id: 'industrialFabricator',
        name: 'Industrial Fabricator',
        description: 'More efficiently transmutes Energy into complex Materials.',
        cost: { material: 200, energy: 0 }, // This requires material, so it's a clear progression
        consumes: { energy: 2.5 },
        produces: { material: 1.5 },
        upkeep: { credits: 0.2 },
        unlockedByScience: 'sci_advanced_material_conversion', // Make sure this science exists
        type: 'converter',
        outputResource: 'material',
        inputResource: 'energy',
    },

    // RESEARCH EMULATORS
    'dataStreamEmulator': {
        id: 'dataStreamEmulator',
        name: 'Data Stream Emulator',
        description: 'Channels Energy to simulate principles and generate Research Data.',
        // COST: This will need Material, so it must come after the Matter Coalescer.
        cost: { material: 75, energy: 100 },
        consumes: { energy: 0.8 },
        produces: { researchData: 0.3 },
        upkeep: {},
        // This should be unlocked by a science that itself might cost only energy or be free.
        unlockedByScience: 'sci_basic_emulation',
        type: 'converter',
        outputResource: 'researchData',
        inputResource: 'energy',
    },

    // CREDIT SYNTHESIZERS
    'valueRefinery': {
        id: 'valueRefinery',
        name: 'Value Refinery',
        description: 'Refines Energy into stable Credit units for operational liquidity.',
        // COST: This will also likely need Material.
        cost: { material: 100, energy: 150 },
        consumes: { energy: 1.0 },
        produces: { credits: 0.5 },
        upkeep: {},
        unlockedByScience: 'sci_credit_synthesis', // Make sure this science exists
        type: 'converter',
        outputResource: 'credits',
        inputResource: 'energy',
    }
};

// ... (canAffordBuilding, buyBuilding functions - may need minor tweaks if cost types change) ...

function calculateTotalProductionAndUpkeep() {
    // Reset rates
    gameData.productionRates.energyFromHarvesters = 0;
    gameData.productionRates.material = 0;
    gameData.productionRates.researchData = 0;
    gameData.productionRates.credits = 0;

    gameData.upkeepRates.energyForConverters = 0;
    gameData.upkeepRates.energyForOtherSystems = 0; // For non-converter energy upkeep (e.g. harvesters)
    gameData.upkeepRates.creditsForMaintenance = 0;

    gameData.consumptionRates.energyByMaterialConverters = 0;
    gameData.consumptionRates.energyByResearchEmulators = 0;
    gameData.consumptionRates.energyByCreditSynthesizers = 0;

    let totalEnergyConsumedByActiveConverters = 0;

    for (const buildingId in gameData.ownedBuildings) {
        const count = gameData.ownedBuildings[buildingId];
        if (count > 0) {
            const building = buildingTypes[buildingId];

            // Handle Harvester Production & Upkeep
            if (building.type === 'harvester') {
                gameData.productionRates.energyFromHarvesters += (building.production.energy || 0) * count;
                gameData.upkeepRates.energyForOtherSystems += (building.upkeep.energy || 0) * count; // Harvester's own energy upkeep
                gameData.upkeepRates.creditsForMaintenance += (building.upkeep.credits || 0) * count;
            }
            // Handle Converter Production & Energy Consumption
            else if (building.type === 'converter') {
                const energyNeededForThisType = (building.consumes.energy || 0) * count;
                let actualEnergyConsumedThisTickForType = 0;
                let productionFactor = 0; // 0 to 1, based on energy availability

                // Simplified: For now, assume all converters try to run if globally enough energy.
                // More complex: prioritize or scale down individual converter types.
                // We'll check overall energy sufficiency in the main gameTick.
                // Here, we just calculate potential consumption and production.

                totalEnergyConsumedByActiveConverters += energyNeededForThisType; // Sum up potential energy demand

                // Store potential consumption per category
                if (building.outputResource === 'material') {
                    gameData.consumptionRates.energyByMaterialConverters += energyNeededForThisType;
                    gameData.productionRates.material += (building.produces.material || 0) * count;
                } else if (building.outputResource === 'researchData') {
                    gameData.consumptionRates.energyByResearchEmulators += energyNeededForThisType;
                    gameData.productionRates.researchData += (building.produces.researchData || 0) * count;
                } else if (building.outputResource === 'credits') {
                    gameData.consumptionRates.energyByCreditSynthesizers += energyNeededForThisType;
                    gameData.productionRates.credits += (building.produces.credits || 0) * count;
                }
                 gameData.upkeepRates.creditsForMaintenance += (building.upkeep.credits || 0) * count; // For converters that might have credit upkeep
            }
        }
    }
    gameData.upkeepRates.energyForConverters = totalEnergyConsumedByActiveConverters; // This is the *demand*
}
