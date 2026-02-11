/**
 * Demo Assets Configuration
 *
 * To add demo images for Greg's House and Sera's Room:
 * 1. Place your demo images in the assets/demo/ folder
 * 2. Import them here using require()
 * 3. Add them to the appropriate arrays below
 *
 * Example:
 * export const gregsHouseDemoImages = [
 *   require('../../assets/demo/greg-room-1.jpg'),
 *   require('../../assets/demo/greg-room-2.jpg'),
 * ];
 */

// Demo images for "Greg's House" project
export const gregsHouseDemoImages: any[] = [
  require("../../assets/demo/greg-1.jpg"),
  require("../../assets/demo/greg-2.jpg"),
  require("../../assets/demo/greg-3.jpg"),
  require("../../assets/demo/greg-4.jpg"),
];

// Demo images for "Sera's Room" project
export const serasRoomDemoImages: any[] = [
  require("../../assets/demo/sera-1.jpg"),
  require("../../assets/demo/sera-2.jpg"),
];

// Filename mappings for demo images
// These will be the filenames used in the document directory
export const getGregsHouseImageFilenames = (): string[] => {
  return gregsHouseDemoImages.map((_, index) => `demo_greg_${index + 1}.jpg`);
};

export const getSerasRoomImageFilenames = (): string[] => {
  return serasRoomDemoImages.map((_, index) => `demo_sera_${index + 1}.jpg`);
};
