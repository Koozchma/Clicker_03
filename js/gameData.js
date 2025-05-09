// js/gameData.js
const gameData = {
    // Core Resources
    currentEnergy: 25, // Start with a bit more energy for initial actions
    rawEnergyPerClick: 1,
    ambientEnergySiphonRate: 0.005, // Reduced base rate, e.g., 0.5%

    material: 0,
    researchData: 0,
    credits: 0,

    // Clicking & Manual Siphoning
    clickPower: 1,
    totalClicks: 0,
    promotionLevel: 0,
    promotionBaseBonus: 1,

    // Manual Conversion Settings (Phase 2, Step 4)
    manualConversion: {
        material: { energyCost: 10, materialYield: 1 },
        research: { energyCost: 15, researchDataYield: 1 }
    },

    // Production & Upkeep Rates
    productionRates: {
        energyFromHarvesters: 0,
        energyFromAmbientSiphon: 0,
        material: 0,
        researchData: 0,
        credits: 0,
    },
    upkeepRates: {
        energyForConverters: 0,
        energyForOtherSystems: 0,
        creditsForMaintenance: 0,
    },
    consumptionRates: {
        energyByMaterialConverters: 0,
        energyByResearchEmulators: 0,
        energyByCreditSynthesizers: 0,
    },

    // Game State
    lastTick: Date.now(),
    gameSettings: {
        tickRate: 1000,
        clicksForPromotion: 10, // Promotions per 10 "Siphon Energy" clicks
    },

    ownedBuildings: {},
    unlockedScience: {},
    buildingCostModifier: 1,
};

function getAmbientSiphonFactor() {
    return 1 + (gameData.ambientEnergySiphonRate);
}

// Log to confirm script is loaded
console.log("gameData.js loaded.");
