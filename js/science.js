// js/science.js
const scienceTree = {
    // TIER 0 - Initial Unlocks
    'sci_unlock_converters': {
        id: 'sci_unlock_converters',
        name: 'Basic Conversion Schematics',
        description: 'Decipher fundamental blueprints to construct Tier 1 Energy Converters for Material, Research Data, and Credits.',
        // COST: Requires a small amount of manually generated Research Data
        cost: { researchData: 5, energy: 50, material: 0, credits: 0 },
        effects: function() {
            // This research effectively unlocks the *ability* to see/build T1 converters if they were previously hidden.
            // Actual unlock status for building is also checked via their 'unlockedByScience' property.
            // For simplicity, we'll assume T1 converters have their 'unlockedByScience' set to this ID.
            console.log("Basic Conversion Schematics deciphered. Tier 1 Converters accessible.");
        },
        prerequisites: [],
        tier: 0,
    },

    // TIER 1 - Requires automated resource generation
    'sci_stellar_harnessing': {
        id: 'sci_stellar_harnessing',
        name: 'Stellar Harnessing Principles',
        description: 'Allows construction of Stellar Radiation Collectors for improved Energy generation.',
        cost: { researchData: 25, material: 50, energy: 100 },
        effects: function() { /* Unlocks 'stellarCollector' building */ },
        prerequisites: ['sci_unlock_converters'], // Must unlock basic converters first
        tier: 1,
    },
    'sci_advanced_material_conversion': {
        id: 'sci_advanced_material_conversion',
        name: 'Advanced Material Conversion',
        description: 'Unlocks the Industrial Fabricator for more efficient Material production.',
        cost: { researchData: 40, material: 100, energy: 200 },
        effects: function() { /* Unlocks 'industrialFabricator' building */ },
        prerequisites: ['sci_unlock_converters'],
        tier: 1,
    },
    // Note: sci_basic_emulation and sci_credit_synthesis might be redundant if sci_unlock_converters unlocks all T1s.
    // Or, sci_unlock_converters could be a prerequisite for individual T1 converter research nodes.
    // For now, let's assume sci_unlock_converters makes them buildable.

    // Clicking Upgrades
    'sci_siphon_attunement_1': {
        id: 'sci_siphon_attunement_1',
        name: 'Siphon Attunement I',
        description: 'Enhances manual energy siphoning by +1 Energy per click.',
        cost: { researchData: 10, energy: 100 },
        effects: function() {
            gameData.rawEnergyPerClick += 1;
            // clickPower is directly modified by promotions, rawEnergyPerClick is the base for it.
            // If promotions add to base, then clickPower should be recalculated.
            // For now, promotions directly add to clickPower. This tech improves the base.
            gameData.clickPower = gameData.rawEnergyPerClick + (gameData.promotionLevel * gameData.promotionBaseBonus); // Recalculate clickPower
        },
        prerequisites: ['sci_unlock_converters'],
        tier: 0,
    },
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
        console.warn(`Science ${scienceId} is already researched.`);
        return false; // Already researched
    }

    // Check prerequisites
    if (tech.prerequisites && tech.prerequisites.length > 0) {
        for (const prereqId of tech.prerequisites) {
            if (!gameData.unlockedScience[prereqId]) {
                const prereqName = scienceTree[prereqId] ? scienceTree[prereqId].name : "an unknown technology";
                alert(`Cannot research "${tech.name}". Requires "${prereqName}" first.`);
                return false;
            }
        }
    }

    if (!canAffordScience(scienceId)) {
        alert(`Insufficient resources to research ${tech.name}.`);
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

    console.log(`Researched: ${tech.name}`);
    if (typeof updateAllUIDisplays === 'function') {
        updateAllUIDisplays();
    }
    return true;
}

// Function to get adjusted building cost (can remain largely the same but ensure it uses buildingCostModifier)
function getAdjustedBuildingCost(buildingId) {
    if (typeof buildingTypes === 'undefined' || !buildingTypes[buildingId]) {
        console.warn(`getAdjustedBuildingCost: Building type not found for ID: ${buildingId}`);
        return null; // Or return original cost if buildingTypes[buildingId] exists
    }
    const originalBuilding = buildingTypes[buildingId];
    const costMultiplier = gameData.buildingCostModifier || 1;

    // Add specific science effects that modify costs
    // Example: if (gameData.unlockedScience['sci_construction_efficiency_1']) costMultiplier *= 0.9;

    return {
        energy: Math.ceil((originalBuilding.cost.energy || 0) * costMultiplier),
        material: Math.ceil((originalBuilding.cost.material || 0) * costMultiplier),
        credits: Math.ceil((originalBuilding.cost.credits || 0) * costMultiplier),
    };
}

// Log to confirm script is loaded
console.log("science.js loaded.");
