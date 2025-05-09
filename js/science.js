// js/science.js

const scienceTree = {
    // TIER 0 - Initial Unlocks (Now focusing on unlocking Harvesters & advanced Converters)
    'sci_unlock_energy_harvesters': { // NEW: Unlocks the first automated Energy Harvester
        id: 'sci_unlock_energy_harvesters',
        name: 'Basic Energy Siphoning Tech',
        description: 'Develop the understanding to construct Micro-Siphon Relays for automated Energy collection.',
        cost: { researchData: 5, energy: 75, material: 10, credits: 0 }, // Requires some manually made resources
        effects: function() {
            console.log("Basic Energy Siphoning Tech researched. Micro-Siphon Relays constructible.");
        },
        prerequisites: [], // Can be researched after getting some manual RData
        tier: 0,
    },
    'sci_unlock_research_converters': { // Unlocks T1 Research Converter
        id: 'sci_unlock_research_converters',
        name: 'Advanced Emulation Protocols',
        description: 'Unlocks the Data Stream Emulator for more efficient Research Data generation.',
        cost: { researchData: 15, energy: 100, material: 25 },
        effects: function() {},
        prerequisites: [], // Could also require 'sci_unlock_energy_harvesters'
        tier: 0,
    },
    'sci_unlock_banking_converters': { // Unlocks T1 Banking Converter
        id: 'sci_unlock_banking_converters',
        name: 'Value Crystallization Theory',
        description: 'Unlocks the Value Refinery for automated Credit synthesis.',
        cost: { researchData: 20, energy: 120, material: 30 },
        effects: function() {},
        prerequisites: [], // Could also require 'sci_unlock_energy_harvesters'
        tier: 0,
    },


    // TIER 1
    'sci_siphon_attunement_1': {
        id: 'sci_siphon_attunement_1',
        name: 'Siphon Attunement I',
        description: 'Refine manual energy siphoning techniques, increasing Energy gained per siphon operation by +1.',
        cost: { researchData: 10, energy: 100, material: 5 },
        effects: function() {
            gameData.rawEnergyPerClick += 1;
            gameData.clickPower = gameData.rawEnergyPerClick + (gameData.promotionLevel * gameData.promotionBaseBonus);
            console.log("Siphon Attunement I achieved. New base siphon strength: " + gameData.rawEnergyPerClick);
        },
        prerequisites: [], // Make this an early, independent research
        tier: 1,
    },
    'sci_stellar_harnessing': {
        id: 'sci_stellar_harnessing',
        name: 'Stellar Harnessing Principles',
        description: 'Unlock the technology for Stellar Radiation Collectors, significantly boosting passive Energy generation.',
        cost: { researchData: 25, material: 50, energy: 150 },
        effects: function() { /* Unlocks 'stellarCollector' building */ },
        prerequisites: ['sci_unlock_energy_harvesters'], // Requires the basic harvester tech
        tier: 1,
    },
    'sci_advanced_material_conversion': {
        id: 'sci_advanced_material_conversion',
        name: 'Advanced Material Conversion',
        description: 'Develop schematics for the Industrial Fabricator, a more efficient Material Converter.',
        cost: { researchData: 40, material: 100, energy: 200 },
        effects: function() { /* Unlocks 'industrialFabricator' building */ },
        prerequisites: [], // Can be researched once RData flows
        tier: 1,
    },
};

// --- canAffordScience, researchTech, getAdjustedBuildingCost functions remain the same ---
// Ensure they are present and correct as in 'science_js_Aethel_unlock_converters' artifact.
function canAffordScience(scienceId) {
    if (typeof scienceTree === 'undefined' || !scienceTree[scienceId]) {
        console.warn(`canAffordScience: Science tech not found for ID: ${scienceId}`);
        return false;
    }
    const tech = scienceTree[scienceId];
    if ((tech.cost.researchData || 0) > gameData.researchData) return false;
    if ((tech.cost.energy || 0) > gameData.currentEnergy) return false;
    if ((tech.cost.material || 0) > gameData.material) return false;
    if ((tech.cost.credits || 0) > gameData.credits) return false;
    return true;
}

function researchTech(scienceId) {
    if (typeof scienceTree === 'undefined' || !scienceTree[scienceId]) {
        console.warn(`researchTech: Science tech not found for ID: ${scienceId}`);
        return false;
    }
    const tech = scienceTree[scienceId];
    if (gameData.unlockedScience[scienceId]) return false;
    if (tech.prerequisites && tech.prerequisites.length > 0) {
        for (const prereqId of tech.prerequisites) {
            if (!gameData.unlockedScience[prereqId]) {
                const prereqName = scienceTree[prereqId] ? scienceTree[prereqId].name : "an unknown technology";
                alert(`Cannot initiate "${tech.name}". Requires mastery of "${prereqName}" first.`);
                return false;
            }
        }
    }
    if (!canAffordScience(scienceId)) {
        alert(`Insufficient resources to initiate research on ${tech.name}.`);
        return false;
    }
    gameData.researchData -= (tech.cost.researchData || 0);
    gameData.currentEnergy -= (tech.cost.energy || 0);
    gameData.material -= (tech.cost.material || 0);
    gameData.credits -= (tech.cost.credits || 0);
    gameData.unlockedScience[scienceId] = true;
    if (tech.effects && typeof tech.effects === 'function') tech.effects();
    console.log(`Research complete: ${tech.name}`);
    if (typeof updateAllUIDisplays === 'function') updateAllUIDisplays();
    return true;
}

function getAdjustedBuildingCost(buildingId) {
    if (typeof buildingTypes === 'undefined' || !buildingTypes[buildingId]) {
        console.warn(`getAdjustedBuildingCost: Building type not found for ID: ${buildingId}`);
        return buildingTypes[buildingId] ? buildingTypes[buildingId].cost : null;
    }
    const originalBuilding = buildingTypes[buildingId];
    let costMultiplier = gameData.buildingCostModifier || 1;
    return {
        energy: Math.ceil((originalBuilding.cost.energy || 0) * costMultiplier),
        material: Math.ceil((originalBuilding.cost.material || 0) * costMultiplier),
        credits: Math.ceil((originalBuilding.cost.credits || 0) * costMultiplier),
    };
}
console.log("science.js loaded.");
