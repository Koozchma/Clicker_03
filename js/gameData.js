// js/gameData.js
const gameData = {
    // Core Resources
    currentEnergy: 25,
    rawEnergyPerClick: 1,
    ambientEnergySiphonRate: 0.01, // 1% for ambient siphon

    material: 0,
    researchData: 0,
    credits: 0,

    // Clicking & Manual Siphoning
    clickPower: 1,
    totalClicks: 0,
    promotionLevel: 0,
    promotionBaseBonus: 1,

    // Manual Conversion Settings
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
        clicksForPromotion: 10,
    },

    ownedBuildings: {},
    unlockedScience: {},
    buildingCostModifier: 1,

    // UI State
    activeCategoryView: 'construction', // Default view: 'construction', 'research', 'banking'
};

/**
 * Calculates the factor by which ambient energy increases current energy.
 * @returns {number} The growth factor (e.g., 1.01 for 1% growth).
 */
function getAmbientSiphonFactor() {
    return 1 + (gameData.ambientEnergySiphonRate);
}

// Log to confirm script is loaded
console.log("gameData.js loaded. Active Category: " + gameData.activeCategoryView + ", Ambient Siphon Rate: " + (gameData.ambientEnergySiphonRate * 100) + "%");
