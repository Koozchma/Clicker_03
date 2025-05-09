// js/science.js

// Defines all researchable technologies in the game.
const scienceTree = {
    // TIER 0 - THE VERY FIRST RESEARCHABLE TECHNOLOGY
    'sci_unlock_energy_harvesters': {
        id: 'sci_unlock_energy_harvesters',
        name: 'Automated Energy Collection',
        description: 'Pioneer the techniques for constructing Micro-Siphon Relays, enabling automated passive Energy generation. This is crucial for scaling operations beyond manual siphoning.',
        cost: { researchData: 5, energy: 75, material: 10 }, // Requires output from Basic Data Scribe & Basic Matter Assembler
        effects: function() {
            console.log("Automated Energy Collection researched. Micro-Siphon Relays are now constructible.");
        },
        prerequisites: [], // NO PREREQUISITES - This is the first research available
        tier: 0,
    },

    // TIER 0.5 - EARLY UPGRADES (Requires Automated Energy Collection to be researched first)
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
        prerequisites: ['sci_unlock_energy_harvesters'], // Requires the first energy tech
        tier: 0,
    },

    // TIER 1 - UNLOCKING ADVANCED CONVERTERS (Requires established RData flow & automated energy)
    'sci_unlock_advanced_material_converter': {
        id: 'sci_unlock_advanced_material_converter',
        name: 'Advanced Material Schematics',
        description: 'Develop blueprints for the Industrial Fabricator, a significantly more efficient Material Converter.',
        cost: { researchData: 20, energy: 150, material: 50 },
        effects: function() { /* Unlocks 'industrialFabricator' building */ },
        prerequisites: ['sci_unlock_energy_harvesters'], // Requires stable energy first
        tier: 1,
    },
    'sci_unlock_advanced_research_converter': {
        id: 'sci_unlock_advanced_research_converter',
        name: 'Enhanced Emulation Protocols',
        description: 'Unlock the Advanced Data Emulator for a substantial boost in Research Data generation.',
        cost: { researchData: 25, energy: 120, material: 30 },
        effects: function() { /* Unlocks 'dataStreamEmulator' (which is the advanced one) */ },
        prerequisites: ['sci_unlock_energy_harvesters'], // Requires stable energy first
        tier: 1,
    },
    'sci_unlock_advanced_banking_converter': {
        id: 'sci_unlock_advanced_banking_converter',
        name: 'Sophisticated Value Synthesis',
        description: 'Unlock the Advanced Value Refinery for more efficient and robust Credit synthesis.',
        cost: { researchData: 30, energy: 180, material: 40 },
        effects: function() { /* Unlocks 'valueRefinery' (which is the advanced one) */ },
        prerequisites: ['sci_unlock_energy_harvesters'], // Requires stable energy first
        tier: 1,
    },
    'sci_stellar_harnessing': { // Advanced Energy Harvester
        id: 'sci_stellar_harnessing',
        name: 'Stellar Harnessing Principles',
        description: 'Unlock the technology for Stellar Radiation Collectors, tapping into a vast new Energy source.',
        cost: { researchData: 50, material: 100, energy: 250 },
        effects: function() { /* Unlocks 'stellarCollector' building */ },
        prerequisites: ['sci_unlock_energy_harvesters'], // Depends on basic harvester tech
        tier: 1,
    },
    // Add more research items for upgrades, new tiers, passive bonuses etc.
    // Ensure they have appropriate prerequisites to create a logical progression.
};

/**
 * Checks if the player can afford a given science tech.
 * @param {string} scienceId - The ID of the science to check.
 * @returns {boolean} True if affordable, false otherwise.
 */
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

/**
 * Researches a technology.
 * Deducts costs, marks tech as unlocked, applies effects, and updates UI.
 * @param {string} scienceId - The ID of the science to research.
 * @returns {boolean} True if research was successful, false otherwise.
 */
function researchTech(scienceId) {
    if (typeof scienceTree === 'undefined' || !scienceTree[scienceId]) {
        console.warn(`researchTech: Science tech not found for ID: ${scienceId}`);
        return false;
    }
    const tech = scienceTree[scienceId];

    if (gameData.unlockedScience[scienceId]) {
        return false; // Already researched
    }

    // Check prerequisites
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

    // Deduct costs
    gameData.researchData -= (tech.cost.researchData || 0);
    gameData.currentEnergy -= (tech.cost.energy || 0);
    gameData.material -= (tech.cost.material || 0);
    gameData.credits -= (tech.cost.credits || 0);

    // Mark as unlocked and apply effects
    gameData.unlockedScience[scienceId] = true;
    if (tech.effects && typeof tech.effects === 'function') {
        tech.effects();
    }

    console.log(`Research complete: ${tech.name}`);
    if (typeof updateAllUIDisplays === 'function') {
        updateAllUIDisplays();
    }
    return true;
}

/**
 * Calculates the adjusted cost of a building, considering research modifiers.
 * @param {string} buildingId - The ID of the building.
 * @returns {object | null} The adjusted cost object, or null if building/original cost not found.
 */
function getAdjustedBuildingCost(buildingId) {
    if (typeof buildingTypes === 'undefined' || !buildingTypes[buildingId]) {
        console.warn(`getAdjustedBuildingCost: Building type not found for ID: ${buildingId}. Returning original cost if available or null.`);
        return buildingTypes[buildingId] ? buildingTypes[buildingId].cost : null;
    }
    const originalBuilding = buildingTypes[buildingId];
    if (!originalBuilding || !originalBuilding.cost) {
        console.warn(`getAdjustedBuildingCost: Original building or its cost not found for ID: ${buildingId}`);
        return null;
    }

    let costMultiplier = gameData.buildingCostModifier || 1;

    return {
        energy: Math.ceil((originalBuilding.cost.energy || 0) * costMultiplier),
        material: Math.ceil((originalBuilding.cost.material || 0) * costMultiplier),
        credits: Math.ceil((originalBuilding.cost.credits || 0) * costMultiplier),
    };
}

console.log("science.js loaded.");
