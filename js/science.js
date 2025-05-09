// js/science.js

// Defines all researchable technologies in the game.
// Research costs resources and unlocks new buildings, upgrades, or abilities.
const scienceTree = {
    // TIER 0 - Initial Unlocks (Focusing on unlocking Harvesters & T1 advanced Converters)
    'sci_unlock_energy_harvesters': {
        id: 'sci_unlock_energy_harvesters',
        name: 'Basic Energy Siphoning Tech',
        description: 'Develop the understanding to construct Micro-Siphon Relays for automated Energy collection, reducing reliance on manual siphoning.',
        cost: { researchData: 5, energy: 75, material: 10, credits: 0 }, // Requires some manually made/basic converter resources
        effects: function() {
            console.log("Basic Energy Siphoning Tech researched. Micro-Siphon Relays constructible.");
            // The 'microSiphonRelay' building has 'sci_unlock_energy_harvesters' in its 'unlockedByScience'
        },
        prerequisites: [], // Can be researched after getting some RData from Basic Data Scribe
        tier: 0,
    },
    'sci_unlock_advanced_material_converters': { // Unlocks the T1 Industrial Fabricator
        id: 'sci_advanced_material_conversion', // Kept original ID for consistency if referenced elsewhere
        name: 'Advanced Material Conversion',
        description: 'Develop schematics for the Industrial Fabricator, a more efficient Material Converter than the basic assembler.',
        cost: { researchData: 15, energy: 150, material: 30 },
        effects: function() { /* Unlocks 'industrialFabricator' building */ },
        prerequisites: [], // Can be researched once basic RData and Material flow
        tier: 0, // Still considered an early-mid game tech
    },
    'sci_unlock_advanced_research_converters': { // Unlocks the T1 Data Stream Emulator
        id: 'sci_unlock_advanced_research_converters',
        name: 'Advanced Emulation Protocols',
        description: 'Unlocks the Data Stream Emulator for significantly more efficient Research Data generation.',
        cost: { researchData: 20, energy: 100, material: 25 },
        effects: function() { /* Unlocks 'dataStreamEmulator' building */ },
        prerequisites: [],
        tier: 0,
    },
    'sci_unlock_advanced_banking_converters': { // Unlocks the T1 Value Refinery
        id: 'sci_unlock_advanced_banking_converters',
        name: 'Value Crystallization Theory',
        description: 'Unlocks the Value Refinery for more efficient automated Credit synthesis.',
        cost: { researchData: 25, energy: 120, material: 30 },
        effects: function() { /* Unlocks 'valueRefinery' building */ },
        prerequisites: [],
        tier: 0,
    },

    // TIER 1 - Further Enhancements and Specializations
    'sci_siphon_attunement_1': {
        id: 'sci_siphon_attunement_1',
        name: 'Siphon Attunement I',
        description: 'Refine manual energy siphoning techniques, increasing Energy gained per siphon operation by +1.',
        cost: { researchData: 10, energy: 100, material: 5 }, // Requires some basic automated resources
        effects: function() {
            gameData.rawEnergyPerClick += 1;
            // Recalculate clickPower based on the new rawEnergyPerClick and existing promotions
            gameData.clickPower = gameData.rawEnergyPerClick + (gameData.promotionLevel * gameData.promotionBaseBonus);
            console.log("Siphon Attunement I achieved. New base siphon strength: " + gameData.rawEnergyPerClick);
        },
        prerequisites: [], // Making this independent early research
        tier: 1,
    },
    'sci_stellar_harnessing': {
        id: 'sci_stellar_harnessing',
        name: 'Stellar Harnessing Principles',
        description: 'Unlock the technology for Stellar Radiation Collectors, significantly boosting passive Energy generation beyond basic relays.',
        cost: { researchData: 30, material: 50, energy: 150 },
        effects: function() { /* Unlocks 'stellarCollector' building */ },
        prerequisites: ['sci_unlock_energy_harvesters'], // Requires the basic harvester tech
        tier: 1,
    },
    // Add more Tier 1 and Tier 2 research for upgrades, new building types, passive bonuses, etc.
};

/**
 * Checks if the player can afford a given science tech.
 * @param {string} scienceId - The ID of the science to check.
 * @returns {boolean} True if affordable, false otherwise.
 */
function canAffordScience(scienceId) {
    // Ensure scienceTree is globally available
    if (typeof scienceTree === 'undefined' || !scienceTree[scienceId]) {
        console.warn(`canAffordScience: Science tech not found for ID: ${scienceId}`);
        return false;
    }
    const tech = scienceTree[scienceId];

    // Check each resource cost defined in the tech object
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
    // Ensure scienceTree is globally available
    if (typeof scienceTree === 'undefined' || !scienceTree[scienceId]) {
        console.warn(`researchTech: Science tech not found for ID: ${scienceId}`);
        return false;
    }
    const tech = scienceTree[scienceId];

    // Check if already researched
    if (gameData.unlockedScience[scienceId]) {
        // console.warn(`Science ${scienceId} is already researched.`); // Can be noisy if button isn't disabled properly
        return false;
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

    // Check affordability
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

    // Update UI
    // Ensure updateAllUIDisplays is globally available from uiUpdates.js
    if (typeof updateAllUIDisplays === 'function') {
        updateAllUIDisplays();
    } else {
        console.warn("updateAllUIDisplays function not found after researching tech.");
    }
    return true;
}

/**
 * Calculates the adjusted cost of a building, considering research modifiers.
 * This function relies on buildingTypes (from buildings.js) being globally available.
 * @param {string} buildingId - The ID of the building.
 * @returns {object | null} The adjusted cost object, or null if building/original cost not found.
 */
function getAdjustedBuildingCost(buildingId) {
    // Ensure buildingTypes is globally available
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

    // Example for future cost reduction tech:
    // if (gameData.unlockedScience['sci_construction_efficiency_1']) {
    //     costMultiplier *= 0.9; // 10% reduction
    // }

    return {
        energy: Math.ceil((originalBuilding.cost.energy || 0) * costMultiplier),
        material: Math.ceil((originalBuilding.cost.material || 0) * costMultiplier),
        credits: Math.ceil((originalBuilding.cost.credits || 0) * costMultiplier),
    };
}

// Log to confirm script is loaded
console.log("science.js loaded.");
