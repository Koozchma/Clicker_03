// js/gameData.js
const gameData = {
    // Core Resources
    currentEnergy: 10, // Start with a little raw energy
    rawEnergyPerClick: 1, // Base energy from manual siphoning
    ambientEnergySiphonRate: 0.01, // Base passive % increase of currentEnergy, e.g., 0.01 = 1% per second

    material: 0,
    researchData: 0, // Renamed from 'research'
    credits: 0,

    // Clicking & Manual Siphoning
    clickPower: 1, // Effective energy per click (can be upgraded)
    totalClicks: 0,
    promotionLevel: 0,
    promotionBaseBonus: 1,

    // Production & Upkeep Rates (calculated each tick)
    productionRates: {
        energyFromHarvesters: 0, // Energy from dedicated harvester buildings
        energyFromAmbientSiphon: 0, // Energy from the base passive % gain
        material: 0,
        researchData: 0,
        credits: 0,
    },
    upkeepRates: { // Energy consumed by converters & other systems
        energyForConverters: 0,
        energyForOtherSystems: 0, // For future use
        creditsForMaintenance: 0, // For future use
        // Material upkeep is usually for specific building *actions* rather than passive, handled by consumption logic
    },
    consumptionRates: { // Resources consumed to produce others (e.g. energy by converters)
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

    ownedBuildings: {}, // Will store counts of Harvesters and Converters
    unlockedScience: {},
    buildingCostModifier: 1,
    // Add new fields for special projects or global states if needed
};

// Renamed for clarity, previously getVaultGrowthFactor
function getAmbientSiphonFactor() {
    return 1 + (gameData.ambientEnergySiphonRate); // If 0.01, it's 1 + 0.01 = 1.01
}
