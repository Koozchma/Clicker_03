// js/science.js
const scienceTree = {
    // TIER 0 - Initial Unlocks (Focus on Energy Costs)
    'sci_basic_emulation': { // Unlocks the first research building
        id: 'sci_basic_emulation',
        name: 'Basic Data Emulation',
        description: 'Unlock the Data Stream Emulator to begin generating Research Data.',
        // COST CHANGE: Only energy for this first critical research step.
        cost: { researchData: 0, energy: 75, material: 0, credits: 0 }, // Was: research: 10 (now researchData)
        effects: function() { /* Unlocks 'dataStreamEmulator' - handled by building def */ },
        prerequisites: [], // No prerequisites for the very first one
        tier: 0,
    },
    'sci_stellar_harnessing': { // Unlocks a better energy harvester
        id: 'sci_stellar_harnessing',
        name: 'Stellar Harnessing Principles',
        description: 'Allows construction of Stellar Radiation Collectors for improved Energy generation.',
        // COST: This can cost Research Data and Material, as it's a step up.
        cost: { researchData: 25, material: 50, energy: 100 },
        effects: function() { /* Unlocks 'stellarCollector' */ },
        prerequisites: ['sci_basic_emulation'], // Requires you to be able to research first
        tier: 1,
    },
    'sci_advanced_material_conversion': {
        id: 'sci_advanced_material_conversion',
        name: 'Advanced Material Conversion',
        description: 'Unlocks the Industrial Fabricator for more efficient Material production.',
        cost: { researchData: 40, material: 100, energy: 200 },
        effects: function() { /* Unlocks 'industrialFabricator' */ },
        prerequisites: ['sci_basic_emulation'],
        tier: 1,
    },
    'sci_credit_synthesis': {
        id: 'sci_credit_synthesis',
        name: 'Credit Synthesis Theory',
        description: 'Enables the construction of Value Refineries to produce Credits.',
        cost: { researchData: 30, material: 75, energy: 150 },
        effects: function() { /* Unlocks 'valueRefinery' */ },
        prerequisites: ['sci_basic_emulation'],
        tier: 1,
    },

    // Add Clicking Upgrades that cost Energy or early resources
    'sci_siphon_attunement_1': {
        id: 'sci_siphon_attunement_1',
        name: 'Siphon Attunement I',
        description: 'Enhances manual energy siphoning by +1 Energy per click.',
        cost: { researchData: 10, energy: 100 }, // Requires some research data first
        effects: function() { gameData.rawEnergyPerClick += 1; gameData.clickPower = gameData.rawEnergyPerClick; }, // Update both base and current
        prerequisites: ['sci_basic_emulation'],
        tier: 0, // Could be an early utility upgrade
    },
    // ... more science items ...
};

function canAffordScience(scienceId) {
    const tech = scienceTree[scienceId];
    if (!tech) return false;
    return gameData.research >= (tech.cost.research || 0) &&
           gameData.currentEnergy >= (tech.cost.energy || 0) &&
           gameData.material >= (tech.cost.material || 0) &&
           gameData.credits >= (tech.cost.credits || 0);
}

function researchTech(scienceId) {
    const tech = scienceTree[scienceId];
    if (!tech || gameData.unlockedScience[scienceId] || !canAffordScience(scienceId)) {
        console.warn(`Cannot research or already unlocked: ${scienceId}`);
        return false;
    }

    // Check prerequisites
    for (const prereqId of tech.prerequisites) {
        if (!gameData.unlockedScience[prereqId]) {
            alert(`Cannot research "${tech.name}". Requires "${scienceTree[prereqId]?.name || 'a prerequisite'}" first.`);
            return false;
        }
    }

    gameData.research -= (tech.cost.research || 0);
    gameData.currentEnergy -= (tech.cost.energy || 0);
    gameData.material -= (tech.cost.material || 0);
    gameData.credits -= (tech.cost.credits || 0);

    gameData.unlockedScience[scienceId] = true;
    if (tech.effects) {
        tech.effects();
    }
    console.log(`Researched ${tech.name}`);
    updateAllUIDisplays(); // Update UI to reflect new tech and potential unlocks
    return true;
}

// Helper to dynamically adjust building costs based on research
function getAdjustedBuildingCost(buildingId) {
    const originalBuilding = buildingTypes[buildingId];
    if (!originalBuilding) return null;

    let costMultiplier = 1;
    if (gameData.unlockedScience['sci_building_cost_reduction_1'] && gameData.buildingCostModifier) { // Check if the specific tech is unlocked
        costMultiplier = gameData.buildingCostModifier; // Apply the stored modifier
    }
    // Add more cost reduction techs here

    return {
        energy: Math.ceil(originalBuilding.cost.energy * costMultiplier),
        material: Math.ceil(originalBuilding.cost.material * costMultiplier),
        credits: Math.ceil(originalBuilding.cost.credits * costMultiplier),
    };
}

// Modify canAffordBuilding and buyBuilding to use getAdjustedBuildingCost
// (This part needs to be refactored in buildings.js)
// For now, this shows the intent. The actual cost deduction in buyBuilding
// and the check in canAffordBuilding should use getAdjustedBuildingCost(buildingId).
