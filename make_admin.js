// Script to make TEST123 user an admin
import { db } from './server/db.js';
import { users } from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function makeUserAdmin() {
  try {
    // Find the user by username
    const [userToUpdate] = await db
      .select()
      .from(users)
      .where(eq(users.username, 'TEST123'));
    
    if (!userToUpdate) {
      console.error('User TEST123 not found');
      return;
    }

    console.log('Found user:', userToUpdate);
    
    // Update the user to be an admin
    const [updatedUser] = await db
      .update(users)
      .set({ is_admin: true })
      .where(eq(users.id, userToUpdate.id))
      .returning();
    
    console.log('Updated user to admin:', updatedUser);
    console.log('Success! User TEST123 is now an admin.');
  } catch (error) {
    console.error('Error making user admin:', error);
  } finally {
    process.exit(0);
  }
}

makeUserAdmin();
