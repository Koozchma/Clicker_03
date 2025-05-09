// js/gameData.js
const gameData = {
    // Core Resources
    currentEnergy: 0,
    credits: 0,
    material: 0,
    research: 0,

    // Clicking
    clickPower: 1,
    totalClicks: 0,
    promotionLevel: 0,
    promotionBaseBonus: 1, // Each promotion adds +1 to clickPower

    // Energy Vault
    vaultMultiplierPercent: 0.1, // Represents 1.01 factor (0.1% actual increase on current value per second)
                                 // The actual math will be currentEnergy * (1 + vaultMultiplierPercent / 100)
                                 // Or simply currentEnergy * 1.001 (if vaultMultiplierPercent is 0.1)

    // Production & Upkeep Rates (calculated each tick)
    productionRates: {
        energy: 0, // Passive from vault, separate from building production
        credits: 0,
        material: 0,
        research: 0,
    },
    upkeepRates: {
        energy: 0,
        credits: 0,
        material: 0, // Material might not have upkeep, but good to have
        research: 0,
    },

    // Game State
    lastTick: Date.now(),
    gameSettings: {
        tickRate: 1000, // milliseconds
        clicksForPromotion: 10,
    },

    // Collections for buildings and science
    ownedBuildings: {}, // e.g., { 'minerMk1': 2, 'labBasic': 1 }
    unlockedScience: {}, // e.g., { 'sci_basicMining': true, 'sci_advChemistry': false }
};

// Function to get the actual vault growth factor
function getVaultGrowthFactor() {
    // Ensure vaultMultiplierPercent is a number
    const multiplierPercent = Number(gameData.vaultMultiplierPercent) || 0;
    return 1 + (multiplierPercent / 100);
}
