/**
 * Item Image Mapping
 * 
 * This file provides a mapping between item names and specific image files.
 * It allows for consistent image display across the application.
 */

type ItemImageMapping = {
  [key: string]: string;
};

// Map item names to specific weapon images
const weaponImageMapping: ItemImageMapping = {
  "Brass Knuckles": "/brass-knuckles.svg",
  "Pistol": "/brass-knuckles.svg",
  "Revolver": "/brass-knuckles.svg",
  "Shotgun": "/brass-knuckles.svg",
  "SMG": "/switchblade.svg",
  "Machine Gun": "/switchblade.svg",
  "Assault Rifle": "/switchblade.svg",
  "Sniper Rifle": "/switchblade.svg",
  "Switchblade": "/switchblade.svg",
  "Combat Knife": "/switchblade.svg",
  "Baseball Bat": "/switchblade.svg",
  "Grenade": "/switchblade.svg",
  "Molotov Cocktail": "/switchblade.svg",
};

// Map tool items to specific images
const toolImageMapping: ItemImageMapping = {
  "Lockpick": "/images/items/tools/tool.png",
  "Drill": "/images/items/tools/tool.png",
  "Wire Cutter": "/images/items/tools/tool.png",
  "Crowbar": "/images/items/tools/tool.png",
  "Laptop": "/images/items/tools/tool.png",
};

// Map protection items to specific images
const protectionImageMapping: ItemImageMapping = {
  "Kevlar Vest": "/images/items/protection/armor.png",
  "Armored Suit": "/images/items/protection/armor.png",
  "Bulletproof Vest": "/images/items/protection/armor.png",
  "Combat Helmet": "/images/items/protection/armor.png",
  "Gas Mask": "/images/items/protection/armor.png",
};

// Map consumable items to specific images
const consumableImageMapping: ItemImageMapping = {
  "Health Pack": "/images/items/consumables/potion.png",
  "Energy Drink": "/images/items/consumables/potion.png",
  "Painkillers": "/images/items/consumables/potion.png",
  "Adrenaline Shot": "/images/items/consumables/potion.png",
  "Stim Pack": "/images/items/consumables/potion.png",
};

/**
 * Get the image path for a specific item
 * @param itemName The name of the item
 * @param itemType The type of the item (weapon, tool, protection, consumable)
 * @returns The path to the image file or undefined if no specific mapping exists
 */
export function getItemImagePath(itemName: string, itemType: string): string | undefined {
  switch (itemType) {
    case "weapon":
      return weaponImageMapping[itemName];
    case "tool":
      return toolImageMapping[itemName];
    case "protection":
      return protectionImageMapping[itemName];
    case "consumable":
      return consumableImageMapping[itemName];
    default:
      return undefined;
  }
}

/**
 * Get a fallback image path based on item type
 * @param itemType The type of the item (weapon, tool, protection, consumable)
 * @returns The path to a fallback image for the given item type
 */
export function getFallbackImageByType(itemType: string): string {
  switch (itemType) {
    case "weapon":
      // Default to our brass knuckles SVG as a fallback
      return "/brass-knuckles.svg";
    case "tool":
      return "/switchblade.svg";
    case "protection":
      return "/switchblade.svg";
    case "consumable":
      return "/brass-knuckles.svg";
    default:
      // Generic fallback
      return "/brass-knuckles.svg";
  }
}