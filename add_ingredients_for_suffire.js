// Import required modules
import { db } from './server/db.js';
import * as schema from './shared/schema.js';

async function run() {
  try {
    console.log("Adding ingredients to user 'suffire' (ID: 16)");
    
    // Get user ID for suffire
    const userId = 16;
    
    // Get all drug ingredients
    const ingredients = await db.select().from(schema.drugIngredients);
    console.log(`Found ${ingredients.length} ingredients`);
    
    // Quantities for each ingredient
    const quantities = {
      "Basic Chemical": 15,
      "Synthetic Compound": 15,
      "Rare Extract": 15,
      "Crystalline Powder": 15,
      "Exotic Mineral": 15,
      "Forbidden Substance": 10
    };
    
    // Add or update ingredients for user
    for (const ingredient of ingredients) {
      console.log(`Processing ${ingredient.name}`);
      
      // Determine quantity to add
      const quantity = quantities[ingredient.name] || 10;
      
      // Check if user already has this ingredient
      const userIngredient = await db.query.userIngredients.findFirst({
        where: (ui, { eq, and }) => 
          and(
            eq(ui.userId, userId),
            eq(ui.ingredientId, ingredient.id)
          )
      });
      
      if (userIngredient) {
        // Update existing ingredient
        await db
          .update(schema.userIngredients)
          .set({ quantity: userIngredient.quantity + quantity })
          .where(({ and, eq }) => 
            and(
              eq(schema.userIngredients.userId, userId),
              eq(schema.userIngredients.ingredientId, ingredient.id)
            )
          );
        console.log(`Updated ${ingredient.name} quantity to ${userIngredient.quantity + quantity}`);
      } else {
        // Add new ingredient
        await db
          .insert(schema.userIngredients)
          .values({
            userId: userId,
            ingredientId: ingredient.id,
            quantity: quantity,
            acquiredAt: new Date()
          });
        console.log(`Added ${quantity} ${ingredient.name} to user`);
      }
    }
    
    console.log("Successfully added ingredients to suffire");
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit(0);
  }
}

run();