// js/eventHandlers.js
document.addEventListener('DOMContentLoaded', function() {
    const mineEnergyButton = document.getElementById('mineEnergyButton');
    if (mineEnergyButton) {
        mineEnergyButton.addEventListener('click', function() {
            if (isNaN(gameData.currentEnergy)) gameData.currentEnergy = 0;
            if (isNaN(gameData.clickPower)) gameData.clickPower = gameData.rawEnergyPerClick || 1;

            gameData.currentEnergy += gameData.clickPower; // Click power now directly adds energy
            gameData.totalClicks++;

            if (gameData.totalClicks > 0 && gameData.totalClicks % gameData.gameSettings.clicksForPromotion === 0) {
                gameData.promotionLevel++;
                // Promotions could upgrade rawEnergyPerClick or add a bonus to clickPower
                gameData.clickPower += gameData.promotionBaseBonus;
                console.log(`Cognitive Surge! Promotion Level: ${gameData.promotionLevel}, Siphon Strength: ${gameData.clickPower}`);
            }
            updateAllUIDisplays();
        });
    } else {
        console.error("Mine Energy Button not found!");
    }
});
