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
  "Brass Knuckles": "/images/items/weapons/Colt M1911.png",
  "Pistol": "/images/items/weapons/Colt M1911.png",
  "Revolver": "/images/items/weapons/Tokarev TT-33.png",
  "Shotgun": "/images/items/weapons/StG 44.png",
  "SMG": "/images/items/weapons/Thompson.png",
  "Machine Gun": "/images/items/weapons/MG 42.png",
  "Assault Rifle": "/images/items/weapons/BAR.png",
  "Sniper Rifle": "/images/items/weapons/M1 Garand.png",
  "Switchblade": "/images/items/weapons/Stick grenade.png",
  "Combat Knife": "/images/items/weapons/Stick grenade.png",
  "Baseball Bat": "/images/items/weapons/MP 40.png",
  "Grenade": "/images/items/weapons/Mk 2 grenade.png",
  "Molotov Cocktail": "/images/items/weapons/Type 97 grenade.png",
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
      // Default to the Thompson as a fallback
      return "/images/items/weapons/Thompson.png";
    case "tool":
      return "/images/items/tools/tool.png";
    case "protection":
      return "/images/items/protection/armor.png";
    case "consumable":
      return "/images/items/consumables/potion.png";
    default:
      // Generic fallback
      return "/images/items/gen-mafia-gangster-organized-crime-suit-man-photoreali.webp";
  }
}