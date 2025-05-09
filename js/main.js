// js/main.js

function gameTick() {
    const now = Date.now();

    // --- 1. Calculate Potential Production & Energy Demand ---
    calculateTotalProductionAndUpkeep(); // From buildings.js - populates gameData.productionRates & .upkeepRates

    // --- 2. Ambient Energy Siphoning ---
    if (gameData.currentEnergy > 0) {
        const siphonFactor = getAmbientSiphonFactor(); // e.g., 1.01 for 1%
        const energyFromSiphon = gameData.currentEnergy * (siphonFactor - 1);
        gameData.productionRates.energyFromAmbientSiphon = energyFromSiphon;
        // This energy is added *after* checking if converters can run from existing + harvester energy
    } else {
        gameData.productionRates.energyFromAmbientSiphon = 0;
    }

    // --- 3. Gross Energy Available This Tick (Before Converters Run) ---
    let grossEnergyAvailable = gameData.currentEnergy + gameData.productionRates.energyFromHarvesters + gameData.productionRates.energyFromAmbientSiphon;
    grossEnergyAvailable -= gameData.upkeepRates.energyForOtherSystems; // Subtract harvester upkeep

    // --- 4. Determine Converter Efficiency based on Energy Availability ---
    let converterEfficiencyFactor = 1; // Assume 100% efficiency
    const totalEnergyDemandFromConverters = gameData.upkeepRates.energyForConverters;

    if (totalEnergyDemandFromConverters > 0) { // Only if converters are trying to run
        if (grossEnergyAvailable >= totalEnergyDemandFromConverters) {
            converterEfficiencyFactor = 1;
            gameData.currentEnergy = grossEnergyAvailable - totalEnergyDemandFromConverters; // Consume energy
        } else if (grossEnergyAvailable > 0) { // Not enough for full, but some energy exists
            converterEfficiencyFactor = grossEnergyAvailable / totalEnergyDemandFromConverters;
            gameData.currentEnergy = 0; // All available energy is used up
            // console.warn(`Energy deficit for converters. Efficiency: ${converterEfficiencyFactor * 100}%`);
        } else { // No energy available for converters
            converterEfficiencyFactor = 0;
            gameData.currentEnergy = Math.max(0, grossEnergyAvailable); // Should be 0 or slightly negative if upkeep was high
            // console.warn("No energy available for converters.");
        }
    } else { // No converters demanding energy
         gameData.currentEnergy = Math.max(0, grossEnergyAvailable);
    }


    // --- 5. Apply Actual Production (Scaled by Converter Efficiency) ---
    gameData.material += gameData.productionRates.material * converterEfficiencyFactor;
    gameData.researchData += gameData.productionRates.researchData * converterEfficiencyFactor;
    gameData.credits += gameData.productionRates.credits * converterEfficiencyFactor;
    // Energy has already been updated in step 4 based on consumption.

    // --- 6. Apply Credit Upkeep ---
    gameData.credits -= gameData.upkeepRates.creditsForMaintenance;
    if (gameData.credits < 0) {
        // console.warn("Credit deficit!");
        gameData.credits = 0; // Or handle penalties
    }

    // Safety net for energy (should not go far below zero from harvester upkeep)
    if (gameData.currentEnergy < 0) gameData.currentEnergy = 0;


    // --- 7. Update UI ---
    updateAllUIDisplays();
    gameData.lastTick = now;
}

// Modify initializeGame if needed for new starting values
function initializeGame() {
    console.log("Initializing Aethel: Conduit of Creation...");
    gameData.clickPower = gameData.rawEnergyPerClick; // Initialize clickPower based on rawEnergyPerClick
    updateAllUIDisplays();
    setInterval(gameTick, gameData.gameSettings.tickRate);
    console.log("Cosmic Structure Online. Tick rate: " + gameData.gameSettings.tickRate + "ms");
}

document.addEventListener('DOMContentLoaded', initializeGame);
