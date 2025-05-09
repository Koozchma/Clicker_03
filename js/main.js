// js/main.js

function gameTick() {
    const now = Date.now();
    // const delta = (now - gameData.lastTick) / 1000; // Seconds passed since last tick

    // --- Passive Energy from Vault ---
    if (gameData.currentEnergy > 0) {
        const vaultFactor = getVaultGrowthFactor(); // e.g., 1.001 for 0.1%
        const energyFromVaultThisTick = gameData.currentEnergy * (vaultFactor - 1);
        gameData.currentEnergy += energyFromVaultThisTick;
        gameData.productionRates.energyFromVault = energyFromVaultThisTick; // Store per-second rate
    } else {
        gameData.productionRates.energyFromVault = 0;
    }

    // --- Calculate Production & Upkeep from Buildings ---
    // This function (from buildings.js) updates gameData.productionRates and gameData.upkeepRates
    calculateTotalProductionAndUpkeep();

    // --- Apply Production (per second) ---
    gameData.material += gameData.productionRates.material; // Assumes rates are per second
    gameData.credits += gameData.productionRates.credits;
    gameData.research += gameData.productionRates.research;
    gameData.currentEnergy += gameData.productionRates.energyFromBuildings; // Add energy from buildings

    // --- Apply Upkeep (per second) ---
    let energyDeficit = false;
    let newEnergyAfterUpkeep = gameData.currentEnergy - gameData.upkeepRates.energy;

    if (newEnergyAfterUpkeep < 0) {
        // More sophisticated deficit handling could be added here:
        // - Reduce production efficiency
        // - Shut down buildings one by one
        // - For now, allow energy to go slightly negative to indicate a problem, but cap it.
        gameData.currentEnergy = Math.max(-100, newEnergyAfterUpkeep); // Prevent large negative values
        energyDeficit = true;
        // console.warn("Energy deficit! Upkeep may not be fully met.");
        // If energy is negative, perhaps halt vault production and building production
        if (gameData.currentEnergy < 0) {
            gameData.productionRates.energyFromVault = 0; // Stop vault if bankrupt
            // Optionally stop other productions too
        }
    } else {
        gameData.currentEnergy = newEnergyAfterUpkeep;
    }

    let newCreditsAfterUpkeep = gameData.credits - gameData.upkeepRates.credits;
    gameData.credits = Math.max(0, newCreditsAfterUpkeep); // Prevent credits from going below 0

    // (Add similar for material upkeep if implemented)
    // gameData.material -= gameData.upkeepRates.material;
    // if (gameData.material < 0) gameData.material = 0;


    // --- Update UI ---
    // updateAllUIDisplays is in uiUpdates.js
    updateAllUIDisplays();

    gameData.lastTick = now;
}

function initializeGame() {
    console.log("Initializing Energy Clicker...");
    // Future: Load game from localStorage if implemented

    // Ensure all building definitions are available globally if needed by other files early
    // (Though typically, they are accessed via functions within buildings.js)

    // Initial UI population
    updateAllUIDisplays(); // Call this to set initial button states etc.

    // Start the game loop
    setInterval(gameTick, gameData.gameSettings.tickRate);
    console.log("Game loop started. Tick rate: " + gameData.gameSettings.tickRate + "ms");
}

// Wait for the DOM to be fully loaded and all scripts parsed before starting the game
document.addEventListener('DOMContentLoaded', initializeGame);