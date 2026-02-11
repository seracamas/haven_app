import { Paths, File as ExpoFile } from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Asset } from "expo-asset";
import {
  gregsHouseDemoImages,
  serasRoomDemoImages,
  getGregsHouseImageFilenames,
  getSerasRoomImageFilenames,
} from "./demoAssets";

const SAVED_IMAGES_KEY = "@haven_saved_images";
const SAVED_PROJECTS_KEY = "@haven_saved_projects";

interface SavedProject {
  id: string;
  name: string;
  description: string;
  images: string[];
  createdAt: number;
  sharedWith?: string[];
  shareMessage?: string;
}

// Get the document directory path (persists across app restarts)
// Use a cached value to avoid repeated File object creation
let cachedDocumentDir: string | null = null;

export const getDocumentDirectory = (): string => {
  // Return cached value if available
  if (cachedDocumentDir) {
    return cachedDocumentDir;
  }

  // Create a temporary file in the document directory to get the actual path
  try {
    const tempFile = new ExpoFile(Paths.document, "temp");
    const fileUri = tempFile.uri;

    // Ensure it's a string
    let uriString: string;
    if (typeof fileUri === "string") {
      uriString = fileUri;
    } else if (fileUri && typeof (fileUri as any).uri === "string") {
      uriString = (fileUri as any).uri;
    } else {
      throw new Error("Could not get URI from File object");
    }

    // Extract just the directory path (remove filename)
    if (uriString && !uriString.includes("[object Object]")) {
      // Get the directory by removing the filename
      const lastSlash = uriString.lastIndexOf("/");
      if (lastSlash > 0) {
        cachedDocumentDir = uriString.substring(0, lastSlash + 1);
        return cachedDocumentDir;
      }
      cachedDocumentDir = uriString;
      return cachedDocumentDir;
    }
  } catch (e) {
    console.warn("Error getting document directory from file:", e);
  }

  // Fallback: try to get it directly from Paths.document
  const docPath = Paths.document;
  if (typeof docPath === "string") {
    cachedDocumentDir = docPath;
    return cachedDocumentDir;
  }

  console.error("Could not get document directory path:", docPath);
  return "";
};

// Extract filename from a full path
const extractFilename = (uri: string): string => {
  if (!uri) return uri;
  // Remove file:// prefix if present
  const withoutPrefix = uri.replace("file://", "");
  // Extract just the filename
  const parts = withoutPrefix.split("/");
  return parts[parts.length - 1];
};

// Ensure image URI is properly formatted for React Native Image component
// This also handles the case where container IDs change after rebuilds
export const ensureImageUri = (uri: string | any): string => {
  if (!uri) return "";

  // If it's an object, try to extract the URI property or convert to string
  if (typeof uri !== "string") {
    console.warn("ensureImageUri received non-string value:", uri);
    // Try to get a URI property if it's an object
    if (uri && typeof uri === "object") {
      if (uri.uri && typeof uri.uri === "string") {
        uri = uri.uri;
      } else {
        // Last resort: convert to string and check
        const uriStr = String(uri);
        if (uriStr.includes("[object Object]")) {
          console.error("Cannot convert object to URI:", uri);
          return "";
        }
        uri = uriStr;
      }
    } else {
      uri = String(uri);
    }
  }

  // Check if the URI string contains [object Object] which indicates an error
  if (
    uri.includes("[object Object]") ||
    uri.includes("%5Bobject%20Object%5D")
  ) {
    console.error("URI contains [object Object] - attempting to recover:", uri);
    // Try to extract just the filename from the corrupted URI
    const match = uri.match(
      /furniture_scene_[\d]+\.jpg|image_[\d]+\.jpg|room_scan_[\d]+\.jpg/
    );
    if (match) {
      const filename = match[0];
      const currentDocDir = getDocumentDirectory();
      console.log(`Recovered filename: ${filename}, using current doc dir`);
      return `${currentDocDir}${filename}`;
    }
    console.error("Could not recover from corrupted URI");
    return "";
  }

  // Check if URI is pointing to app bundle instead of Documents - fix it
  if (
    (uri.includes(".app/") && uri.includes("furniture_scene_")) ||
    uri.includes("image_") ||
    uri.includes("room_scan_")
  ) {
    console.warn("URI points to app bundle, fixing to Documents:", uri);
    const filename = extractFilename(uri);
    const currentDocDir = getDocumentDirectory();
    return `${currentDocDir}${filename}`;
  }

  // If it's just a filename (no path separators and has extension), prepend current document directory
  if (
    !uri.includes("/") &&
    !uri.includes("://") &&
    uri.match(/\.(jpg|jpeg|png)$/i)
  ) {
    return `${getDocumentDirectory()}${uri}`;
  }

  // If it's a full path (contains /var/mobile/Containers or similar), extract filename
  // and use current document directory (handles container ID changes after rebuilds)
  if (uri.includes("/Containers/") || uri.includes("/Documents/")) {
    const filename = extractFilename(uri);
    // Only extract if it's a valid image filename pattern
    if (filename.match(/\.(jpg|jpeg|png)$/i)) {
      const currentDocDir = getDocumentDirectory();
      return `${currentDocDir}${filename}`;
    }
  }

  // If it already starts with file:// and is in current doc dir, return as is
  if (uri.startsWith("file://")) {
    const currentDocDir = getDocumentDirectory();
    if (uri.startsWith(currentDocDir)) {
      return uri;
    }
    // Otherwise, extract filename and use current directory
    const filename = extractFilename(uri);
    if (filename && filename.match(/\.(jpg|jpeg|png)$/i)) {
      return `${currentDocDir}${filename}`;
    }
  }

  // If it's an absolute path starting with /, add file://
  if (uri.startsWith("/")) {
    // Check if it's in a container path that might be outdated
    if (uri.includes("/Containers/")) {
      const filename = extractFilename(uri);
      if (filename && filename.match(/\.(jpg|jpeg|png)$/i)) {
        return `${getDocumentDirectory()}${filename}`;
      }
    }
    return `file://${uri}`;
  }

  return uri;
};

// Save image file to persistent storage
// Returns just the filename for storage in AsyncStorage
export const saveImageFile = async (
  tempUri: string,
  filename?: string
): Promise<string> => {
  try {
    // Ensure tempUri is a string
    if (typeof tempUri !== "string") {
      console.error("tempUri is not a string:", tempUri);
      throw new Error("Invalid tempUri type");
    }

    const timestamp = Date.now();
    const imageFilename = filename || `image_${timestamp}.jpg`;

    console.log(`📸 Saving image: ${tempUri} -> Documents/${imageFilename}`);

    // Create source and destination files using new API
    // Use Paths.document directly (as Directory object) like ARScanner does
    const sourceFile = new ExpoFile(tempUri);
    const destFile = new ExpoFile(Paths.document, imageFilename);

    // Copy file from temp location to document directory
    // Note: ARScanner doesn't await this, but we should for error handling
    await sourceFile.copy(destFile);

    // Get the URI from the destFile object - exactly like ARScanner does
    const savedUri = destFile.uri;

    // Log what we got for debugging
    console.log("destFile.uri type:", typeof savedUri, savedUri);

    // Verify it's a string (ARScanner uses it directly, so it should be)
    if (!savedUri) {
      console.error("destFile.uri is null/undefined");
      throw new Error("File URI is null or undefined after copy");
    }

    // Convert to string if needed
    const uriString =
      typeof savedUri === "string" ? savedUri : String(savedUri);

    // Check for [object Object] corruption
    if (
      uriString.includes("[object Object]") ||
      uriString.includes("%5Bobject%20Object%5D")
    ) {
      console.error(
        "URI contains [object Object] - destFile.uri value:",
        savedUri
      );
      throw new Error("File URI contains [object Object] - invalid path");
    }

    // Verify the file was actually created
    const fileInfo = await Paths.info(uriString);
    if (fileInfo.exists) {
      console.log(`✅ Image saved successfully: ${uriString}`);
      // Return just the filename for storage - we'll reconstruct the full path when loading
      return imageFilename;
    } else {
      console.error(
        `❌ File copy completed but file not found at: ${uriString}`
      );
      throw new Error("File was not created after copy");
    }
  } catch (error) {
    console.error("Error saving image file:", error);
    throw error;
  }
};

// Check if image file exists
export const imageFileExists = async (uri: string): Promise<boolean> => {
  try {
    if (!uri) return false;

    // Try using File object directly - this is the most reliable method
    try {
      const file = new ExpoFile(uri);
      const info = await file.info();
      if (info.exists) {
        return true;
      }
    } catch (e) {
      // File object method failed, try alternatives
    }

    // Try with Paths.info using the URI as-is
    try {
      const fileInfo = await Paths.info(uri);
      if (fileInfo.exists) return true;
    } catch (e) {
      // Paths.info failed with this format
    }

    // Try without file:// prefix if it has one
    if (uri.startsWith("file://")) {
      const pathWithoutPrefix = uri.replace("file://", "");
      try {
        const fileInfo = await Paths.info(pathWithoutPrefix);
        if (fileInfo.exists) return true;
      } catch (e) {
        // Continue
      }

      // Also try File object without prefix
      try {
        const file = new ExpoFile(pathWithoutPrefix);
        const info = await file.info();
        if (info.exists) return true;
      } catch (e) {
        // Continue
      }
    }

    // Try with file:// prefix if it doesn't have one but starts with /
    if (!uri.startsWith("file://") && uri.startsWith("/")) {
      const uriWithPrefix = `file://${uri}`;
      try {
        const file = new ExpoFile(uriWithPrefix);
        const info = await file.info();
        if (info.exists) return true;
      } catch (e) {
        // Continue
      }
    }

    return false;
  } catch (error) {
    // Don't log warnings - this is expected to fail sometimes
    return false;
  }
};

// Clean up invalid image references from projects
// NOTE: This is disabled by default to prevent false positives
// Set enableCleanup to true only if you want to remove truly missing files
export const cleanupInvalidImages = async (
  enableCleanup: boolean = false
): Promise<void> => {
  if (!enableCleanup) {
    // Skip cleanup by default to avoid removing valid images
    return;
  }

  try {
    const projectsData = await AsyncStorage.getItem(SAVED_PROJECTS_KEY);
    if (!projectsData) return;

    const projects = JSON.parse(projectsData);
    let hasChanges = false;

    for (const project of projects) {
      if (project.images && Array.isArray(project.images)) {
        const validImages = [];
        for (const imageUri of project.images) {
          // Check multiple URI formats before giving up
          const exists = await imageFileExists(imageUri);
          if (exists) {
            validImages.push(imageUri); // Keep original URI format
          } else {
            // Log but don't remove - might be a false negative
            console.warn(`Image file check failed (but keeping): ${imageUri}`);
            // Only remove if explicitly enabled
            if (enableCleanup) {
              hasChanges = true;
              console.log(`Removed invalid image: ${imageUri}`);
            } else {
              // Keep the image even if check failed
              validImages.push(imageUri);
            }
          }
        }
        if (hasChanges) {
          project.images = validImages;
        }
      }
    }

    if (hasChanges) {
      await AsyncStorage.setItem(SAVED_PROJECTS_KEY, JSON.stringify(projects));
      console.log("Cleaned up invalid image references");
    }
  } catch (error) {
    console.error("Error cleaning up images:", error);
  }
};

// Delete image file from storage
export const deleteImageFile = async (uri: string): Promise<void> => {
  try {
    const fullUri = ensureImageUri(uri);
    const fileInfo = await Paths.info(fullUri);
    if (fileInfo.exists) {
      const file = new ExpoFile(fullUri);
      await file.delete();
    }
  } catch (error) {
    console.error("Error deleting image file:", error);
  }
};

// Migrate old full-path URIs to just filenames
export const migrateProjectImages = async (): Promise<void> => {
  try {
    // Migrate projects
    const projectsData = await AsyncStorage.getItem(SAVED_PROJECTS_KEY);
    let projectsChanged = false;

    if (projectsData) {
      const projects = JSON.parse(projectsData);

      for (const project of projects) {
        if (project.images && Array.isArray(project.images)) {
          const migratedImages = project.images
            .map((uri: any) => {
              // Convert to string if needed
              let uriStr = typeof uri === "string" ? uri : String(uri);

              // If it contains [object Object], try to extract filename
              if (
                uriStr.includes("[object Object]") ||
                uriStr.includes("%5Bobject%20Object%5D")
              ) {
                console.log(`🔧 Fixing corrupted URI: ${uriStr}`);
                const match = uriStr.match(
                  /(furniture_scene_|image_|room_scan_)[\d]+\.jpg/
                );
                if (match) {
                  projectsChanged = true;
                  return match[0];
                }
                // If we can't extract, remove it
                projectsChanged = true;
                return null;
              }

              // If it's already just a filename, keep it
              if (!uriStr.includes("/") && !uriStr.includes("://")) {
                return uriStr;
              }

              // Extract filename from full path
              const filename = extractFilename(uriStr);
              if (filename && filename.match(/\.(jpg|jpeg|png)$/i)) {
                projectsChanged = true;
                return filename;
              }

              return null; // Remove invalid URIs
            })
            .filter((uri: string | null) => uri !== null); // Remove nulls

          if (migratedImages.length !== project.images.length) {
            projectsChanged = true;
          }
          project.images = migratedImages;
        }
      }

      if (projectsChanged) {
        await AsyncStorage.setItem(
          SAVED_PROJECTS_KEY,
          JSON.stringify(projects)
        );
        console.log("✅ Migrated project images to filename-only format");
      }
    }

    // Migrate saved images gallery
    const imagesData = await AsyncStorage.getItem(SAVED_IMAGES_KEY);
    if (imagesData) {
      const images = JSON.parse(imagesData);
      const migratedImages = images
        .map((uri: any) => {
          let uriStr = typeof uri === "string" ? uri : String(uri);

          if (
            uriStr.includes("[object Object]") ||
            uriStr.includes("%5Bobject%20Object%5D")
          ) {
            const match = uriStr.match(
              /(furniture_scene_|image_|room_scan_)[\d]+\.jpg/
            );
            return match ? match[0] : null;
          }

          if (!uriStr.includes("/") && !uriStr.includes("://")) {
            return uriStr;
          }

          const filename = extractFilename(uriStr);
          return filename && filename.match(/\.(jpg|jpeg|png)$/i)
            ? filename
            : null;
        })
        .filter((uri: string | null) => uri !== null);

      if (migratedImages.length !== images.length) {
        await AsyncStorage.setItem(
          SAVED_IMAGES_KEY,
          JSON.stringify(migratedImages)
        );
        console.log("✅ Migrated saved images to filename-only format");
      }
    }
  } catch (error) {
    console.error("Error migrating images:", error);
  }
};

// Copy a bundled asset to the document directory
// Returns the filename if successful, null otherwise
export const copyBundledAssetToDocuments = async (
  assetModule: any,
  filename: string
): Promise<string | null> => {
  try {
    // Load the asset to get its local URI
    const asset = Asset.fromModule(assetModule);
    await asset.downloadAsync();

    if (!asset.localUri) {
      console.error(`Failed to load asset for ${filename}`);
      return null;
    }

    // Create destination file object
    const destFile = new ExpoFile(Paths.document, filename);

    // Check if file already exists - if so, delete it first
    try {
      const destInfo = await destFile.info();
      if (destInfo.exists) {
        // File already exists, delete it so we can overwrite
        await destFile.delete();
      }
    } catch (e) {
      // File doesn't exist or error checking, continue with copy
    }

    // Copy from asset URI to document directory
    const sourceFile = new ExpoFile(asset.localUri);
    await sourceFile.copy(destFile);

    // Verify the file was created
    const fileInfo = await Paths.info(destFile.uri);
    if (fileInfo.exists) {
      return filename; // Return just the filename for storage
    } else {
      console.error(`File was not created at: ${destFile.uri}`);
      return null;
    }
  } catch (error) {
    console.error(`Error copying bundled asset ${filename}:`, error);
    return null;
  }
};

// Initialize demo projects - always ensures demo projects use bundled assets
export const initializeDemoProjects = async (): Promise<void> => {
  try {
    // Copy demo images from bundled assets to document directory
    const gregsHouseFilenames = getGregsHouseImageFilenames();
    const serasRoomFilenames = getSerasRoomImageFilenames();

    const gregsHouseImages: string[] = [];
    const serasRoomImages: string[] = [];

    // Always copy Greg's House demo images from bundled assets
    if (gregsHouseDemoImages.length > 0) {
      for (let i = 0; i < gregsHouseDemoImages.length; i++) {
        const filename = gregsHouseFilenames[i];
        const copiedFilename = await copyBundledAssetToDocuments(
          gregsHouseDemoImages[i],
          filename
        );
        if (copiedFilename) {
          gregsHouseImages.push(copiedFilename);
        }
      }
    }

    // Always copy Sera's Room demo images from bundled assets
    if (serasRoomDemoImages.length > 0) {
      for (let i = 0; i < serasRoomDemoImages.length; i++) {
        const filename = serasRoomFilenames[i];
        const copiedFilename = await copyBundledAssetToDocuments(
          serasRoomDemoImages[i],
          filename
        );
        if (copiedFilename) {
          serasRoomImages.push(copiedFilename);
        }
      }
    }

    // Load existing projects
    const existing = await AsyncStorage.getItem(SAVED_PROJECTS_KEY);
    let existingProjects: SavedProject[] = existing ? JSON.parse(existing) : [];

    // Find or create demo projects
    const gregProjectIndex = existingProjects.findIndex(
      (p) =>
        p.name?.toLowerCase().includes("greg") &&
        p.name?.toLowerCase().includes("house")
    );
    const seraProjectIndex = existingProjects.findIndex(
      (p) =>
        p.name?.toLowerCase().includes("sera") &&
        p.name?.toLowerCase().includes("room")
    );

    // Update or create Greg's House project with bundled images
    if (gregProjectIndex >= 0) {
      // Update existing project to use bundled images (preserve id and createdAt)
      existingProjects[gregProjectIndex] = {
        ...existingProjects[gregProjectIndex],
        images: gregsHouseImages, // Always use bundled images
        name: "Greg's House", // Ensure correct name
        description: "Living room redesign with modern furniture and lighting",
        sharedWith: ["John Doe", "Jane Smith", "Bob Johnson"],
        shareMessage:
          "Hey everyone! I'd love your feedback on my living room redesign. What do you think about the furniture choices and layout?",
      };
    } else {
      // Create new Greg's House project
      existingProjects.push({
        id: `project-${Date.now()}-greg`,
        name: "Greg's House",
        description: "Living room redesign with modern furniture and lighting",
        images: gregsHouseImages,
        createdAt: Date.now() - 86400000, // 1 day ago
        sharedWith: ["John Doe", "Jane Smith", "Bob Johnson"],
        shareMessage:
          "Hey everyone! I'd love your feedback on my living room redesign. What do you think about the furniture choices and layout?",
      });
    }

    // Update or create Sera's Room project with bundled images
    if (seraProjectIndex >= 0) {
      // Update existing project to use bundled images (preserve id and createdAt)
      existingProjects[seraProjectIndex] = {
        ...existingProjects[seraProjectIndex],
        images: serasRoomImages, // Always use bundled images
        name: "Sera's Room", // Ensure correct name
        description: "Bedroom makeover with minimalist aesthetic",
        sharedWith: ["Alice Williams", "Michael Jordan"],
        shareMessage:
          "Looking for feedback on my bedroom redesign! Especially interested in thoughts about the color scheme and furniture placement.",
      };
    } else {
      // Create new Sera's Room project
      existingProjects.push({
        id: `project-${Date.now()}-sera`,
        name: "Sera's Room",
        description: "Bedroom makeover with minimalist aesthetic",
        images: serasRoomImages,
        createdAt: Date.now() - 172800000, // 2 days ago
        sharedWith: ["Alice Williams", "Michael Jordan"],
        shareMessage:
          "Looking for feedback on my bedroom redesign! Especially interested in thoughts about the color scheme and furniture placement.",
      });
    }

    // Save updated projects
    await AsyncStorage.setItem(
      SAVED_PROJECTS_KEY,
      JSON.stringify(existingProjects)
    );
  } catch (error) {
    console.error("Error initializing demo projects:", error);
  }
};

export { SAVED_IMAGES_KEY, SAVED_PROJECTS_KEY };
