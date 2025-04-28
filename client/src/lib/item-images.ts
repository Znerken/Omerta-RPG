/**
 * Item image mapping
 * Maps item names to their image URLs
 */

export interface ItemImageMap {
  [key: string]: string;
}

/**
 * Map of item names to their image paths
 */
export const itemImages: ItemImageMap = {
  "Brass Knuckles": "/items/brass-knuckles.png",
  // Add more items as they are uploaded
};

/**
 * Get the image URL for an item by name
 * Returns a default image URL if the item is not found
 */
export function getItemImageUrl(itemName: string): string {
  return itemImages[itemName] || getDefaultImageByType("weapon");
}

/**
 * Get a default image URL for an item type
 */
export function getDefaultImageByType(itemType: string): string {
  switch (itemType?.toLowerCase()) {
    case "weapon":
      return "/items/brass-knuckles.png"; // Default weapon image
    case "armor":
    case "protection":
      return "/items/brass-knuckles.png"; // Placeholder, replace with armor image when available
    case "consumable":
      return "/items/brass-knuckles.png"; // Placeholder, replace with consumable image when available
    case "tool":
      return "/items/brass-knuckles.png"; // Placeholder, replace with tool image when available
    default:
      return "/items/brass-knuckles.png"; // Default fallback image
  }
}