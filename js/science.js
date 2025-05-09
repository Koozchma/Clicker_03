// js/science.js
const scienceTree = {
    // Tier 0 - Basic Unlocks
    'sci_basic_material_scaffolding': {
        id: 'sci_basic_material_scaffolding',
        name: 'Basic Material Scaffolding',
        description: 'Unlocks the Scrap Collector to gather materials.',
        cost: { research: 10, energy: 50 },
        effects: function() { /* Unlocks building - handled by checking science ID in building def */ },
        prerequisites: [],
        tier: 0,
    },
    'sci_rudimentary_credit_system': {
        id: 'sci_rudimentary_credit_system',
        name: 'Rudimentary Credit System',
        description: 'Unlocks the Market Stall to generate Credits by selling surplus Energy.',
        cost: { research: 20, energy: 75 },
        effects: function() { /* Unlocks building */ },
        prerequisites: [],
        tier: 0,
    },
    'sci_early_research_methods': {
        id: 'sci_early_research_methods',
        name: 'Early Research Methods',
        description: 'Unlocks the Basic Lab to start generating Research points.',
        cost: { research: 5, energy: 100 }, // Making this cheap to kickstart research itself
        effects: function() { /* Unlocks building, ID: basicLab */ },
        prerequisites: [],
        tier: 0,
    },

    // Tier 1 - Clicking & Efficiency
    'sci_click_efficiency_1': {
        id: 'sci_click_efficiency_1',
        name: 'Ergonomic Clicker Design',
        description: 'Increases energy per click by 1.',
        cost: { research: 50, material: 20 },
        effects: function() { gameData.clickPower += 1; },
        prerequisites: ['sci_early_research_methods'],
        tier: 1,
    },
    'sci_vault_optimization_1': {
        id: 'sci_vault_optimization_1',
        name: 'Vault Optimization I',
        description: 'Increases Energy Vault passive generation by 0.05%.',
        cost: { research: 100, energy: 500 },
        effects: function() { gameData.vaultMultiplierPercent += 0.05; },
        prerequisites: ['sci_early_research_methods'],
        tier: 1,
    },
    'sci_building_cost_reduction_1': {
        id: 'sci_building_cost_reduction_1',
        name: 'Resource Efficiency I',
        description: 'Reduces Energy and Material cost of all buildings by 5%. (Effect applied dynamically)',
        cost: { research: 75, material: 50 },
        effects: function() { /* Store this as a global modifier */ gameData.buildingCostModifier = (gameData.buildingCostModifier || 1) * 0.95; },
        prerequisites: ['sci_basic_material_scaffolding'],
        tier: 1,
    },

    // Tier 1 - Building Unlocks
    'sci_material_processing_1': {
        id: 'sci_material_processing_1',
        name: 'Advanced Material Processing',
        description: 'Unlocks the Automated Mine for increased material production.',
        cost: { research: 150, material: 100, energy: 300 },
        effects: function() { /* Unlocks building automatedMine */ },
        prerequisites: ['sci_basic_material_scaffolding'],
        tier: 1,
    },
    'sci_commerce_1': {
        id: 'sci_commerce_1',
        name: 'Organized Commerce',
        description: 'Unlocks the Trade Depot for converting materials to credits.',
        cost: { research: 120, credits: 500, energy: 200 },
        effects: function() { /* Unlocks building tradeDepot */ },
        prerequisites: ['sci_rudimentary_credit_system'],
        tier: 1,
    },
    'sci_research_methods_2': {
        id: 'sci_research_methods_2',
        name: 'Dedicated Research Facility',
        description: 'Unlocks the Research Complex for faster research progress.',
        cost: { research: 200, material: 250, credits: 1000 },
        effects: function() { /* Unlocks building researchComplex */ },
        prerequisites: ['sci_early_research_methods', 'sci_material_processing_1'], // Example dependency
        tier: 1,
    },
    // Add more science items:
    // (b) unlock clicking upgrades (e.g., "Resonance Amplifiers": clicks give +0.1 research)
    // (c) lower costs (e.g., "Streamlined Logistics": -10% energy upkeep for all buildings)
    // (d) provide efficiency (e.g., "Material Compaction": +10% material output from material buildings)
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
