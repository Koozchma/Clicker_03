// js/eventHandlers.js

document.getElementById('mineEnergyButton').addEventListener('click', function() {
    gameData.currentEnergy += gameData.clickPower;
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