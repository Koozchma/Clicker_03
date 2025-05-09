// js/main.js

function gameTick() {
    const now = Date.now();
    const delta = now - gameData.lastTick;

    // --- Passive Energy from Vault ---
    // Energy vault: always increase by a factor of 1.01 per second (or gameData.vaultMultiplierPercent).
    // This means currentEnergy * (vaultMultiplierPercent / 100) is ADDED each second.
    if (gameData.currentEnergy > 0) { // Only generate if there's energy to multiply
        const vaultFactor = getVaultGrowthFactor(); // e.g., 1.001 if percent is 0.1
        const energyFromVaultThisTick = gameData.currentEnergy * (vaultFactor - 1);
        gameData.currentEnergy += energyFromVaultThisTick;
        // The 'productionRates.energy' will store this vault generation for display
        gameData.productionRates.energy = energyFromVaultThisTick; // This is per-second rate
    } else {
        gameData.productionRates.energy = 0;
    }


    // --- Calculate Production & Upkeep from Buildings ---
    calculateTotalProductionAndUpkeep(); // This function is in buildings.js
                                        // It updates gameData.productionRates and gameData.upkeepRates
                                        // (excluding vault energy which is handled above)

    // --- Apply Production (per second) ---
    // These are already per second, so no delta multiplication needed if tick is 1s
    gameData.material += gameData.productionRates.material;
    gameData.credits += gameData.productionRates.credits;
    gameData.research += gameData.productionRates.research;

    // --- Apply Upkeep (per second) ---
    let energyDeficit = false;
    let newEnergy = gameData.currentEnergy - gameData.upkeepRates.energy;

    if (newEnergy < 0) {
        // Simple deficit handling: set energy to 0, production might halt or reduce.
        // For now, just note the deficit and prevent energy from going deeply negative from upkeep.
        // More complex: shut down buildings, apply penalties.
        // gameData.currentEnergy = 0; // Option 1: bottom out energy
        // For now, allow it to go slightly negative to show the problem, but cap it
        gameData.currentEnergy = Math.max(-100, newEnergy); // Prevent large negative values from upkeep
        energyDeficit = true;
        console.warn("Energy deficit! Upkeep exceeds available energy.");
        // Potentially reduce production rates if in deficit in a more complex system
    } else {
        gameData.currentEnergy = newEnergy;
    }

    gameData.credits -= gameData.upkeepRates.credits;
    // Handle negative credits if necessary (e.g., loans, penalties)
    if (gameData.credits < 0) gameData.credits = 0; // Simplest: don't go below 0


    // --- Update UI ---
    // We update UI frequently to ensure buttons (buy/research) are enabled/disabled correctly
    updateAllUIDisplays();

    gameData.lastTick = now;
}

function initializeGame() {
    console.log("Initializing Energy Clicker...");
    // Load game from localStorage if implemented
    // For now, just use default gameData

    // Initial UI population
    updateAllUIDisplays();

    // Start the game loop
    setInterval(gameTick, gameData.gameSettings.tickRate);
    console.log("Game loop started.");
}

// Wait for the DOM to be fully loaded before starting the game
document.addEventListener('DOMContentLoaded', initializeGame);
