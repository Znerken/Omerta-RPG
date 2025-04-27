const { db } = require('./server/db');
const { drugIngredients, userIngredients } = require('./shared/schema');
const { eq, and } = require('drizzle-orm');

const USER_ID = 16; // suffire's ID
const QUANTITIES = {
  'Basic Chemical': 10,
  'Synthetic Compound': 10,
  'Rare Extract': 10,
  'Crystalline Powder': 10,
  'Exotic Mineral': 10,
  'Forbidden Substance': 5
};

async function addIngredientsToUser() {
  try {
    console.log(`Adding ingredients to user ID ${USER_ID}`);
    
    // Get all ingredients
    const ingredients = await db.select().from(drugIngredients);
    console.log(`Found ${ingredients.length} ingredients`);
    
    for (const ingredient of ingredients) {
      const quantity = QUANTITIES[ingredient.name] || 5;
      
      // Check if user already has this ingredient
      const [existingIngredient] = await db
        .select()
        .from(userIngredients)
        .where(and(
          eq(userIngredients.userId, USER_ID),
          eq(userIngredients.ingredientId, ingredient.id)
        ));
      
      if (existingIngredient) {
        // Update quantity
        await db
          .update(userIngredients)
          .set({ quantity: existingIngredient.quantity + quantity })
          .where(eq(userIngredients.id, existingIngredient.id));
        
        console.log(`Updated ${ingredient.name} for user ${USER_ID}. Added ${quantity} more.`);
      } else {
        // Add new ingredient
        await db
          .insert(userIngredients)
          .values({
            userId: USER_ID,
            ingredientId: ingredient.id,
            quantity: quantity,
            acquiredAt: new Date()
          });
        
        console.log(`Added ${quantity} ${ingredient.name} to user ${USER_ID}`);
      }
    }
    
    console.log('All ingredients added successfully');
  } catch (error) {
    console.error('Error adding ingredients:', error);
  } finally {
    // Close the database connection
    process.exit(0);
  }
}

addIngredientsToUser();