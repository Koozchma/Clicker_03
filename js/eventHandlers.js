// js/eventHandlers.js
document.addEventListener('DOMContentLoaded', function() {
    const mineEnergyButton = document.getElementById('mineEnergyButton');
    const manualConvertMaterialButton = document.getElementById('manualConvertMaterialButton');
    const manualConvertResearchButton = document.getElementById('manualConvertResearchButton');

    // Category Navigation Buttons
    const navButtonConstruction = document.getElementById('navButtonConstruction');
    const navButtonResearch = document.getElementById('navButtonResearch');
    const navButtonBanking = document.getElementById('navButtonBanking');

    if (mineEnergyButton) {
        mineEnergyButton.addEventListener('click', function() {
            if (isNaN(gameData.currentEnergy)) gameData.currentEnergy = 0;
            if (isNaN(gameData.clickPower)) gameData.clickPower = gameData.rawEnergyPerClick || 1;

            gameData.currentEnergy += gameData.clickPower;
            gameData.totalClicks++;

            if (gameData.totalClicks > 0 && gameData.totalClicks % gameData.gameSettings.clicksForPromotion === 0) {
                gameData.promotionLevel++;
                gameData.clickPower += gameData.promotionBaseBonus;
                console.log(`Cognitive Surge! Attunement Level: ${gameData.promotionLevel}, Siphon Strength: ${gameData.clickPower}`);
            }
            if (typeof updateAllUIDisplays === 'function') updateAllUIDisplays();
        });
    } else {
        console.error("Siphon Energy Button not found!");
    }

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
    }

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
    }

    // Category Navigation Click Handlers
    function setActiveCategory(category) {
        gameData.activeCategoryView = category;
        console.log("Active category set to: " + category);
        if (typeof updateCategoryDisplay === 'function') { // Check if the specific function exists
            updateCategoryDisplay();
        } else if (typeof updateAllUIDisplays === 'function') { // Fallback to full update
            updateAllUIDisplays();
        }
    }

    if (navButtonConstruction) {
        navButtonConstruction.addEventListener('click', () => setActiveCategory('construction'));
    }
    if (navButtonResearch) {
        navButtonResearch.addEventListener('click', () => setActiveCategory('research'));
    }
    if (navButtonBanking) {
        navButtonBanking.addEventListener('click', () => setActiveCategory('banking'));
    }
});

// Log to confirm script is loaded
console.log("eventHandlers.js loaded.");
