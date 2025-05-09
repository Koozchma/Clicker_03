// js/eventHandlers.js
document.addEventListener('DOMContentLoaded', function() {
    const mineEnergyButton = document.getElementById('mineEnergyButton');
    const manualConvertMaterialButton = document.getElementById('manualConvertMaterialButton');
    const manualConvertResearchButton = document.getElementById('manualConvertResearchButton');

    if (mineEnergyButton) {
        mineEnergyButton.addEventListener('click', function() {
            if (isNaN(gameData.currentEnergy)) gameData.currentEnergy = 0;
            if (isNaN(gameData.clickPower)) gameData.clickPower = gameData.rawEnergyPerClick || 1;

            gameData.currentEnergy += gameData.clickPower;
            gameData.totalClicks++;

            if (gameData.totalClicks > 0 && gameData.totalClicks % gameData.gameSettings.clicksForPromotion === 0) {
                gameData.promotionLevel++;
                gameData.clickPower += gameData.promotionBaseBonus; // Direct bonus to clickPower
                console.log(`Cognitive Surge! Attunement Level: ${gameData.promotionLevel}, Siphon Strength: ${gameData.clickPower}`);
            }
            if (typeof updateAllUIDisplays === 'function') updateAllUIDisplays();
        });
    } else {
        console.error("Siphon Energy Button not found!");
    }

    // Manual Material Conversion
    if (manualConvertMaterialButton) {
        manualConvertMaterialButton.addEventListener('click', function() {
            const cost = gameData.manualConversion.material.energyCost;
            const yieldAmount = gameData.manualConversion.material.materialYield;
            if (gameData.currentEnergy >= cost) {
                gameData.currentEnergy -= cost;
                gameData.material += yieldAmount;
                console.log(`Manually coalesced ${yieldAmount} Material for ${cost} Energy.`);
                if (typeof updateAllUIDisplays === 'function') updateAllUIDisplays();
            } else {
                alert(`Not enough Energy. Requires ${cost} Energy to coalesce Material.`);
            }
        });
    } else {
        console.error("Manual Convert Material Button not found!");
    }

    // Manual Research Data Conversion
    if (manualConvertResearchButton) {
        manualConvertResearchButton.addEventListener('click', function() {
            const cost = gameData.manualConversion.research.energyCost;
            const yieldAmount = gameData.manualConversion.research.researchDataYield;
            if (gameData.currentEnergy >= cost) {
                gameData.currentEnergy -= cost;
                gameData.researchData += yieldAmount;
                console.log(`Manually emulated ${yieldAmount} Research Data for ${cost} Energy.`);
                if (typeof updateAllUIDisplays === 'function') updateAllUIDisplays();
            } else {
                alert(`Not enough Energy. Requires ${cost} Energy to emulate Research Data.`);
            }
        });
    } else {
        console.error("Manual Convert Research Button not found!");
    }
});

// Log to confirm script is loaded
console.log("eventHandlers.js loaded.");
