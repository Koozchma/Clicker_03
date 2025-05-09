// js/buildings.js
const buildingTypes = {
    // Material Buildings
    'scrapCollector': {
        id: 'scrapCollector',
        name: 'Scrap Collector',
        description: 'Gathers small amounts of raw materials.',
        cost: { material: 0, energy: 20, credits: 0 }, // Initially no material cost for the first one
        production: { material: 0.5 }, // per second per building
        upkeep: { energy: 0.1 }, // per second per building
        unlockedByScience: null, // Available by default or very early unlock
        maxOwned: 10, // Example limit
    },
    'automatedMine': {
        id: 'automatedMine',
        name: 'Automated Mine',
        description: 'Extracts materials more efficiently with higher energy demands.',
        cost: { material: 100, energy: 250, credits: 50 },
        production: { material: 5 },
        upkeep: { energy: 2.5 },
        unlockedByScience: 'sci_material_processing_1', // Example science ID
    },

    // Credit Buildings
    'marketStall': {
        id: 'marketStall',
        name: 'Market Stall',
        description: 'Sells surplus energy for a small profit.',
        cost: { material: 20, energy: 50, credits: 0 },
        production: { credits: 0.2 }, // Sells 0.1 energy for 0.2 credits (example)
        upkeep: { energy: 0.3 }, // Consumes 0.1 for sale + 0.2 for operation
        specialBehavior: function(buildingCount) { // Custom logic for how it generates credits
            // This stall "sells" energy. Let's say 0.1 energy/sec for 0.2 credits/sec
            const energySoldPerStall = 0.1;
            const creditsEarnedPerEnergySold = 2; // 0.1 energy -> 0.2 credits
            const totalEnergySold = energySoldPerStall * buildingCount;

            if (gameData.currentEnergy >= totalEnergySold + (this.upkeep.energy * buildingCount)) { // Check if enough energy for sale AND upkeep
                // No direct energy deduction here, it's part of its listed "upkeep" conceptually.
                // The credit production is net.
                return (energySoldPerStall * creditsEarnedPerEnergySold) * buildingCount;
            }
            return 0; // Not enough energy to sell
        }
    },
    'tradeDepot': {
        id: 'tradeDepot',
        name: 'Trade Depot',
        description: 'Facilitates larger scale trades, converting materials to credits.',
        cost: { material: 200, energy: 150, credits: 1000 },
        production: {}, // Production handled by special behavior
        upkeep: { energy: 5, credits: 10 }, // Upkeep for operations
        unlockedByScience: 'sci_commerce_1',
        specialBehavior: function(buildingCount) { // Converts material to credits
            const materialConsumedPerDepot = 2; // Consumes 2 material/sec
            const creditsGeneratedPerMaterial = 3; // Generates 3 credits/material
            const totalMaterialNeeded = materialConsumedPerDepot * buildingCount;

            if (gameData.material >= totalMaterialNeeded) {
                gameData.material -= totalMaterialNeeded; // Deduct material here
                return (totalMaterialNeeded * creditsGeneratedPerMaterial);
            }
            return 0; // Not enough material
        }
    },

    // Research Buildings
    'basicLab': {
        id: 'basicLab',
        name: 'Basic Lab',
        description: 'Conducts elementary research.',
        cost: { material: 50, energy: 100, credits: 20 },
        production: { research: 0.2 },
        upkeep: { energy: 0.5, credits: 0.1 },
        unlockedByScience: 'sci_basic_research',
    },
    'researchComplex': {
        id: 'researchComplex',
        name: 'Research Complex',
        description: 'Advanced facility for significant scientific breakthroughs.',
        cost: { material: 500, energy: 1000, credits: 2500 },
        production: { research: 2 },
        upkeep: { energy: 10, credits: 5 },
        unlockedByScience: 'sci_research_methods_2',
    }
};

function canAffordBuilding(buildingId) {
    const building = buildingTypes[buildingId];
    if (!building) return false;
    return gameData.currentEnergy >= building.cost.energy &&
           gameData.material >= building.cost.material &&
           gameData.credits >= building.cost.credits;
}

function buyBuilding(buildingId) {
    const building = buildingTypes[buildingId];
    if (!building || !canAffordBuilding(buildingId)) {
        console.warn(`Cannot afford or find building: ${buildingId}`);
        return false;
    }

    if (building.unlockedByScience && !gameData.unlockedScience[building.unlockedByScience]) {
        console.warn(`Building ${buildingId} is not unlocked by science yet.`);
        alert(`Unlock "${scienceTree[building.unlockedByScience]?.name || 'required research'}" first!`);
        return false;
    }

    const currentOwned = gameData.ownedBuildings[buildingId] || 0;
    if (building.maxOwned && currentOwned >= building.maxOwned) {
        alert(`You have reached the maximum number of ${building.name}s.`);
        return false;
    }


    gameData.currentEnergy -= building.cost.energy;
    gameData.material -= building.cost.material;
    gameData.credits -= building.cost.credits;

    gameData.ownedBuildings[buildingId] = (gameData.ownedBuildings[buildingId] || 0) + 1;
    console.log(`Bought ${building.name}. Total owned: ${gameData.ownedBuildings[buildingId]}`);
    updateAllUIDisplays(); // Ensure UI reflects the purchase and new counts
    return true;
}

function calculateTotalProductionAndUpkeep() {
    gameData.productionRates.credits = 0;
    gameData.productionRates.material = 0;
    gameData.productionRates.research = 0;

    gameData.upkeepRates.energy = 0;
    gameData.upkeepRates.credits = 0;
    // gameData.upkeepRates.material = 0; // If material upkeep exists

    for (const buildingId in gameData.ownedBuildings) {
        const count = gameData.ownedBuildings[buildingId];
        if (count > 0) {
            const building = buildingTypes[buildingId];
            if (building.production) {
                gameData.productionRates.material += (building.production.material || 0) * count;
                gameData.productionRates.research += (building.production.research || 0) * count;
                // Direct credit production if not handled by specialBehavior
                if (!building.specialBehavior && building.production.credits) {
                     gameData.productionRates.credits += (building.production.credits || 0) * count;
                }
            }
            if (building.upkeep) {
                gameData.upkeepRates.energy += (building.upkeep.energy || 0) * count;
                gameData.upkeepRates.credits += (building.upkeep.credits || 0) * count;
            }

            // Handle special behaviors for production (e.g., credit generation)
            if (building.specialBehavior) {
                // Assuming special behavior for credits for now
                const specialCredits = building.specialBehavior(count);
                gameData.productionRates.credits += specialCredits;
            }
        }
    }
}
