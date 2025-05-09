// js/eventHandlers.js

document.getElementById('mineEnergyButton').addEventListener('click', function() {
    // Ensure gameData.clickPower is a number
    const clickPower = Number(gameData.clickPower) || 1; // Default to 1 if NaN or undefined

    // Ensure gameData.currentEnergy starts as a number or is reset if it became NaN
    if (isNaN(gameData.currentEnergy)) {
        // console.warn("currentEnergy was NaN before click, resetting to 0");
        gameData.currentEnergy = 0;
    }
    gameData.currentEnergy += clickPower;
    gameData.totalClicks++;

    // Promotion Check
    if (gameData.totalClicks % gameData.gameSettings.clicksForPromotion === 0) {
        gameData.promotionLevel++;
        gameData.clickPower += gameData.promotionBaseBonus; // Each promotion adds +1 base
        console.log(`Promotion! Level: ${gameData.promotionLevel}, Click Power: ${gameData.clickPower}`);
        // Add a visual cue for promotion if desired
    }

    updateAllUIDisplays();
});

// Initial setup of building and science buttons will be handled by their respective UI update functions
// as they populate the lists.
