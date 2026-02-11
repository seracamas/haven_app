import React, { useState, useRef, useEffect } from "react";
import {
  ViroARScene,
  ViroARPlaneSelector,
  ViroARPlane,
  ViroBox,
  ViroAmbientLight,
  ViroARSceneNavigator,
  ViroMaterials,
  ViroNode,
  Viro3DObject,
  ViroSphere,
  ViroImage,
  ViroQuad,
} from "@reactvision/react-viro";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  Image,
  Animated,
  Linking,
  Platform,
  TextInput,
  ActivityIndicator,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { captureRef } from "react-native-view-shot";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SecondaryButton } from "./SecondaryButton";
import { theme } from "../theme";
import { DeleteModal } from "./DeleteModal";
import {
  saveImageFile,
  SAVED_IMAGES_KEY,
  SAVED_PROJECTS_KEY,
} from "../utils/storage";

// Furniture information data
interface FurnitureInfo {
  price: string;
  description: string;
  link: string;
}

const furnitureInfoMap: { [key: string]: FurnitureInfo } = {
  "couch-1.png": {
    price: "$199",
    description:
      "Modern 3-seater sofa with plush cushions and elegant design. Perfect for contemporary living spaces.",
    link: "https://example.com/couches/modern-3-seater",
  },
  "couch-2.png": {
    price: "$499",
    description:
      "Luxury sectional couch with premium fabric upholstery. Features adjustable headrests and built-in USB charging ports.",
    link: "https://example.com/couches/luxury-sectional",
  },
  "couch-3.png": {
    price: "$649",
    description:
      "Compact 2-seater loveseat ideal for smaller spaces. Comfortable and stylish with removable cushion covers.",
    link: "https://example.com/couches/compact-loveseat",
  },
  "couch-4.png": {
    price: "$199",
    description: "Premium sofa with power headrest and lumbar support.",
    link: "https://example.com/couches/leather-recliner",
  },
  "couch-5.png": {
    price: "$99",
    description:
      "Comfortable bean bag chair for one person. Features deep seating.",
    link: "https://example.com/couches/mid-century-modern",
  },
  "couch-6.png": {
    price: "$769",
    description:
      "Contemporary chaise lounge sofa with extended seating area. Perfect for lounging and relaxation.",
    link: "https://example.com/couches/chaise-lounge",
  },
  "couch-7.png": {
    price: "$549",
    description:
      "Budget-friendly futon sofa. Great for guest rooms and small apartments.",
    link: "https://example.com/couches/futon-sofa",
  },
  "couch-8.png": {
    price: "$1,099",
    description:
      "High-end modular sectional with multiple configuration options. Premium memory foam cushions included.",
    link: "https://example.com/couches/modular-sectional",
  },
  "couch-9.png": {
    price: "$949",
    description:
      "Traditional tufted sofa with rolled arms and nailhead trim. Classic design with modern comfort features.",
    link: "https://example.com/couches/traditional-tufted",
  },
  "couch-10.png": {
    price: "$699",
    description:
      "Sleeper sofa with pull-out bed mechanism. Comfortable for daily use and convenient for overnight guests.",
    link: "https://example.com/couches/sleeper-sofa",
  },
  "chair-1.png": {
    price: "$299",
    description:
      "Modern accent chair with sleek design and comfortable cushioning. Perfect for living rooms and reading nooks.",
    link: "https://example.com/chairs/modern-accent",
  },
  "chair-2.png": {
    price: "$449",
    description:
      "Ergonomic office chair with adjustable height and lumbar support. Ideal for home offices and workspaces.",
    link: "https://example.com/chairs/ergonomic-office",
  },
  "chair-3.png": {
    price: "$199",
    description:
      "Classic dining chair with upholstered seat. Comfortable and stylish for everyday meals and gatherings.",
    link: "https://example.com/chairs/classic-dining",
  },
  "chair-4.png": {
    price: "$599",
    description:
      "Premium leather recliner chair with power controls. Features heat and massage functions for ultimate relaxation.",
    link: "https://example.com/chairs/leather-recliner",
  },
  "chair-5.png": {
    price: "$349",
    description:
      "Mid-century modern armchair with tapered wooden legs. Timeless design with contemporary comfort.",
    link: "https://example.com/chairs/mid-century-armchair",
  },
  "chair-6.png": {
    price: "$249",
    description:
      "Compact swivel chair perfect for small spaces. 360-degree rotation with smooth gliding mechanism.",
    link: "https://example.com/chairs/compact-swivel",
  },
  "chair-7.png": {
    price: "$179",
    description:
      "Budget-friendly folding chair with metal frame. Lightweight and easy to store, great for extra seating.",
    link: "https://example.com/chairs/folding-chair",
  },
  "chair-8.png": {
    price: "$799",
    description:
      "High-end executive chair with premium materials. Features adjustable armrests and advanced ergonomics.",
    link: "https://example.com/chairs/executive-chair",
  },
  "chair-9.png": {
    price: "$399",
    description:
      "Traditional wingback chair with button-tufted back. Classic design with modern comfort features.",
    link: "https://example.com/chairs/wingback-chair",
  },
  "chair-10.png": {
    price: "$279",
    description:
      "Contemporary chair with adjustable height. Perfect for kitchen islands and home bars.",
    link: "https://example.com/chairs/barstool",
  },
  "art-1.png": {
    price: "$149",
    description:
      "Abstract wall art piece with vibrant colors and modern aesthetic. Adds a contemporary touch to any room.",
    link: "https://example.com/art/abstract-1",
  },
  "art-2.png": {
    price: "$199",
    description:
      "Minimalist geometric print with clean lines. Perfect for modern and Scandinavian-style interiors.",
    link: "https://example.com/art/geometric-1",
  },
  "art-3.png": {
    price: "$179",
    description:
      "Nature-inspired artwork featuring botanical themes. Brings a fresh, organic feel to living spaces.",
    link: "https://example.com/art/nature-1",
  },
  "art-4.png": {
    price: "$229",
    description:
      "Contemporary landscape painting with rich textures. Ideal for creating a focal point in any room.",
    link: "https://example.com/art/landscape-1",
  },
  "art-5.png": {
    price: "$159",
    description:
      "Bold typography art piece with inspirational messaging. Perfect for home offices and creative spaces.",
    link: "https://example.com/art/typography-1",
  },
  "art-6.png": {
    price: "$189",
    description:
      "Vintage-inspired print with classic design elements. Adds character and warmth to traditional decor.",
    link: "https://example.com/art/vintage-1",
  },
  "art-7.png": {
    price: "$219",
    description:
      "Modern abstract composition with dynamic shapes. Creates visual interest and contemporary appeal.",
    link: "https://example.com/art/abstract-2",
  },
  "art-8.png": {
    price: "$249",
    description:
      "Large-scale statement piece with bold colors. Perfect for making a dramatic impact in spacious rooms.",
    link: "https://example.com/art/statement-1",
  },
  "lamp-1.png": {
    price: "$89",
    description:
      "Modern table lamp with sleek design and adjustable brightness. Perfect for desks and bedside tables.",
    link: "https://example.com/lamps/table-1",
  },
  "lamp-2.png": {
    price: "$149",
    description:
      "Minimalist floor lamp with arch design. Provides ambient lighting while maintaining a clean aesthetic.",
    link: "https://example.com/lamps/floor-1",
  },
  "lamp-3.png": {
    price: "$79",
    description:
      "Classic desk lamp with flexible arm and dimmer switch. Ideal for focused task lighting in workspaces.",
    link: "https://example.com/lamps/desk-1",
  },
  "lamp-4.png": {
    price: "$129",
    description:
      "Elegant table lamp with decorative base. Adds sophistication and warm lighting to any room.",
    link: "https://example.com/lamps/decorative-1",
  },
  "lamp-5.png": {
    price: "$199",
    description:
      "Contemporary floor lamp with tripod base. Modern design that complements mid-century decor styles.",
    link: "https://example.com/lamps/tripod-1",
  },
  "lamp-6.png": {
    price: "$109",
    description:
      "Industrial-style pendant lamp with vintage appeal. Perfect for creating a trendy, urban atmosphere.",
    link: "https://example.com/lamps/pendant-1",
  },
  "lamp-7.png": {
    price: "$159",
    description:
      "Smart LED floor lamp with color-changing capabilities. Features app control and multiple lighting modes.",
    link: "https://example.com/lamps/smart-1",
  },
  "lamp-8.png": {
    price: "$69",
    description:
      "Compact bedside lamp with USB charging port. Convenient for modern bedrooms and small spaces.",
    link: "https://example.com/lamps/bedside-1",
  },
  "lamp-9.png": {
    price: "$179",
    description:
      "Art deco-inspired table lamp with geometric patterns. Adds glamour and vintage elegance to interiors.",
    link: "https://example.com/lamps/art-deco-1",
  },
  "lamp-10.png": {
    price: "$139",
    description:
      "Adjustable task lamp with gooseneck design. Perfect for reading corners and home office setups.",
    link: "https://example.com/lamps/task-1",
  },
  "desk-1.png": {
    price: "$299",
    description:
      "Modern writing desk with clean lines and spacious surface. Perfect for home offices and study areas.",
    link: "https://example.com/desks/modern-writing",
  },
  "desk-2.png": {
    price: "$449",
    description:
      "Executive desk with drawers and storage compartments. Ideal for professional workspaces and home offices.",
    link: "https://example.com/desks/executive",
  },
  "desk-3.png": {
    price: "$199",
    description:
      "Compact computer desk with built-in cable management. Great for small spaces and modern setups.",
    link: "https://example.com/desks/compact-computer",
  },
  "desk-4.png": {
    price: "$349",
    description:
      "Standing desk with adjustable height mechanism. Promotes better posture and flexibility in workspace design.",
    link: "https://example.com/desks/standing-adjustable",
  },
  "desk-5.png": {
    price: "$249",
    description:
      "Corner desk with L-shaped design for efficient space utilization. Perfect for maximizing workspace in tight areas.",
    link: "https://example.com/desks/corner-l-shaped",
  },
  "desk-6.png": {
    price: "$399",
    description:
      "Gaming desk with dedicated features for PC setups. Includes headphone hook and cable management system.",
    link: "https://example.com/desks/gaming",
  },
  "desk-7.png": {
    price: "$179",
    description:
      "Minimalist floating desk with wall-mounted design. Clean aesthetic perfect for modern minimalist interiors.",
    link: "https://example.com/desks/floating-minimalist",
  },
  "desk-8.png": {
    price: "$549",
    description:
      "Rustic farmhouse desk with reclaimed wood finish. Adds character and warmth to home office or study spaces.",
    link: "https://example.com/desks/rustic-farmhouse",
  },
  "table-1.png": {
    price: "$249",
    description:
      "Modern dining table with clean lines and sleek design. Perfect for contemporary dining spaces and gatherings.",
    link: "https://example.com/tables/modern-dining",
  },
  "table-2.png": {
    price: "$349",
    description:
      "Classic wooden coffee table with traditional craftsmanship. Adds warmth and elegance to living room settings.",
    link: "https://example.com/tables/classic-coffee",
  },
  "table-3.png": {
    price: "$199",
    description:
      "Round side table with minimalist aesthetic. Ideal as an accent piece or for holding lamps and decor items.",
    link: "https://example.com/tables/round-side",
  },
  "table-4.png": {
    price: "$449",
    description:
      "Extendable dining table with leaf mechanism. Great for accommodating larger groups when needed.",
    link: "https://example.com/tables/extendable-dining",
  },
  "table-5.png": {
    price: "$299",
    description:
      "Glass-top coffee table with metal base. Modern and versatile, perfect for contemporary living spaces.",
    link: "https://example.com/tables/glass-coffee",
  },
  "table-6.png": {
    price: "$179",
    description:
      "Nesting table set with multiple surfaces. Flexible furniture solution for small spaces and versatile layouts.",
    link: "https://example.com/tables/nesting-set",
  },
  "table-7.png": {
    price: "$399",
    description:
      "Farmhouse-style dining table with rustic charm. Features distressed wood finish for character and warmth.",
    link: "https://example.com/tables/farmhouse-dining",
  },
  "table-8.png": {
    price: "$229",
    description:
      "Console table with drawers for storage. Perfect for entryways, hallways, or as a TV stand alternative.",
    link: "https://example.com/tables/console-storage",
  },
  "poster-1.png": {
    price: "$29",
    description:
      "Vibrant abstract wall poster with bold colors and modern design. Perfect for adding personality to any room.",
    link: "https://example.com/posters/abstract-1",
  },
  "poster-2.png": {
    price: "$34",
    description:
      "Minimalist typography poster with inspirational quote. Clean and modern design ideal for home offices and bedrooms.",
    link: "https://example.com/posters/typography-1",
  },
  "poster-3.png": {
    price: "$39",
    description:
      "Nature-inspired landscape poster featuring scenic views. Brings the outdoors inside with calming imagery.",
    link: "https://example.com/posters/nature-1",
  },
  "poster-4.png": {
    price: "$27",
    description:
      "Geometric pattern poster with contemporary design. Adds visual interest and modern flair to empty walls.",
    link: "https://example.com/posters/geometric-1",
  },
  "poster-5.png": {
    price: "$32",
    description:
      "Vintage travel poster with retro aesthetic. Perfect for creating a nostalgic atmosphere in living spaces.",
    link: "https://example.com/posters/vintage-travel",
  },
  "poster-6.png": {
    price: "$36",
    description:
      "Botanical illustration poster featuring plants and flowers. Adds a fresh, organic touch to any interior.",
    link: "https://example.com/posters/botanical",
  },
  "poster-7.png": {
    price: "$31",
    description:
      "Music-themed poster with artistic design. Ideal for bedrooms, music rooms, or any space that needs character.",
    link: "https://example.com/posters/music",
  },
  "poster-8.png": {
    price: "$28",
    description:
      "Urban cityscape poster with architectural elements. Perfect for contemporary spaces and modern decor themes.",
    link: "https://example.com/posters/cityscape",
  },
};

interface PlacedFurniture {
  id: string;
  type: "chair" | "table" | "couch" | "lamp" | "art" | "posters" | "desk";
  position: [number, number, number];
  rotation: [number, number, number];
  variant?: string; // For couch variants (e.g., "couch1.png", "couch2.png")
}

interface ARFurniturePlacerProps {
  onBack: () => void;
  onSave?: (imageUri: string) => void;
  onViewGallery?: () => void;
  projectId?: string; // For existing projects
  isExistingProject?: boolean; // Flag to indicate if this is for an existing project
  isNewProjectStart?: boolean; // Flag to indicate if this is a new project start from home (not back from gallery)
}

// Mapping for couch image requires (React Native doesn't support dynamic requires)
const couchImageMap: { [key: string]: any } = {
  "couch-1.png": require("../../assets/models/couches/couch-1.png"),
  "couch-2.png": require("../../assets/models/couches/couch-2.png"),
  "couch-3.png": require("../../assets/models/couches/couch-3.png"),
  "couch-4.png": require("../../assets/models/couches/couch-4.png"),
  "couch-5.png": require("../../assets/models/couches/couch-5.png"),
  "couch-6.png": require("../../assets/models/couches/couch-6.png"),
  "couch-7.png": require("../../assets/models/couches/couch-7.png"),
  "couch-8.png": require("../../assets/models/couches/couch-8.png"),
  "couch-9.png": require("../../assets/models/couches/couch-9.png"),
  "couch-10.png": require("../../assets/models/couches/couch-10.png"),
};

const chairImageMap: { [key: string]: any } = {
  "chair-1.png": require("../../assets/models/chairs/chair-1.png"),
  "chair-2.png": require("../../assets/models/chairs/chair-2.png"),
  "chair-3.png": require("../../assets/models/chairs/chair-3.png"),
  "chair-4.png": require("../../assets/models/chairs/chair-4.png"),
  "chair-5.png": require("../../assets/models/chairs/chair-5.png"),
  "chair-6.png": require("../../assets/models/chairs/chair-6.png"),
  "chair-7.png": require("../../assets/models/chairs/chair-7.png"),
  "chair-8.png": require("../../assets/models/chairs/chair-8.png"),
  "chair-9.png": require("../../assets/models/chairs/chair-9.png"),
  "chair-10.png": require("../../assets/models/chairs/chair-10.png"),
};

const artImageMap: { [key: string]: any } = {
  "art-1.png": require("../../assets/models/art/art-1.png"),
  "art-2.png": require("../../assets/models/art/art-2.png"),
  "art-3.png": require("../../assets/models/art/art-3.png"),
  "art-4.png": require("../../assets/models/art/art-4.png"),
  "art-5.png": require("../../assets/models/art/art-5.png"),
  "art-6.png": require("../../assets/models/art/art-6.png"),
  "art-7.png": require("../../assets/models/art/art-7.png"),
  "art-8.png": require("../../assets/models/art/art-8.png"),
};

const lampImageMap: { [key: string]: any } = {
  "lamp-1.png": require("../../assets/models/lamps/lamp-1.png"),
  "lamp-2.png": require("../../assets/models/lamps/lamp-2.png"),
  "lamp-3.png": require("../../assets/models/lamps/lamp-3.png"),
  "lamp-4.png": require("../../assets/models/lamps/lamp-4.png"),
  "lamp-5.png": require("../../assets/models/lamps/lamp-5.png"),
  "lamp-6.png": require("../../assets/models/lamps/lamp-6.png"),
  "lamp-7.png": require("../../assets/models/lamps/lamp-7.png"),
  "lamp-8.png": require("../../assets/models/lamps/lamp-8.png"),
  "lamp-9.png": require("../../assets/models/lamps/lamp-9.png"),
  "lamp-10.png": require("../../assets/models/lamps/lamp-10.png"),
};

const deskImageMap: { [key: string]: any } = {
  "desk-1.png": require("../../assets/models/desks/desk-1.png"),
  "desk-2.png": require("../../assets/models/desks/desk-2.png"),
  "desk-3.png": require("../../assets/models/desks/desk-3.png"),
  "desk-4.png": require("../../assets/models/desks/desk-4.png"),
  "desk-5.png": require("../../assets/models/desks/desk-5.png"),
  "desk-6.png": require("../../assets/models/desks/desk-6.png"),
  "desk-7.png": require("../../assets/models/desks/desk-7.png"),
  "desk-8.png": require("../../assets/models/desks/desk-8.png"),
};

const tableImageMap: { [key: string]: any } = {
  "table-1.png": require("../../assets/models/tables/table-1.png"),
  "table-2.png": require("../../assets/models/tables/table-2.png"),
  "table-3.png": require("../../assets/models/tables/table-3.png"),
  "table-4.png": require("../../assets/models/tables/table-4.png"),
  "table-5.png": require("../../assets/models/tables/table-5.png"),
  "table-6.png": require("../../assets/models/tables/table-6.png"),
  "table-7.png": require("../../assets/models/tables/table-7.png"),
  "table-8.png": require("../../assets/models/tables/table-8.png"),
};

const posterImageMap: { [key: string]: any } = {
  "poster-1.png": require("../../assets/models/posters/poster-1.png"),
  "poster-2.png": require("../../assets/models/posters/poster-2.png"),
  "poster-3.png": require("../../assets/models/posters/poster-3.png"),
  "poster-4.png": require("../../assets/models/posters/poster-4.png"),
  "poster-5.png": require("../../assets/models/posters/poster-5.png"),
  "poster-6.png": require("../../assets/models/posters/poster-6.png"),
  "poster-7.png": require("../../assets/models/posters/poster-7.png"),
  "poster-8.png": require("../../assets/models/posters/poster-8.png"),
};

const FurnitureScene: React.FC<{
  placedFurniture: PlacedFurniture[];
  onPlaneTap: (position: [number, number, number]) => void;
  selectedFurniture: PlacedFurniture["type"] | null;
  moveMode3D: boolean; // Enable 3D movement (vertical + horizontal)
  onFurnitureSelect: (id: string | null) => void; // Callback to select furniture for editing
}> = React.memo(
  ({
    placedFurniture,
    onPlaneTap,
    selectedFurniture,
    moveMode3D,
    onFurnitureSelect,
  }) => {
    const [materialsReady, setMaterialsReady] = useState(false);

    // Initialize materials - only basic color materials (PNGs use ViroImage directly, no materials needed)
    React.useEffect(() => {
      const initBasicMaterials = () => {
        try {
          // Ensure ViroMaterials is available before creating materials
          if (
            typeof ViroMaterials !== "undefined" &&
            ViroMaterials.createMaterials
          ) {
            ViroMaterials.createMaterials({
              planeMaterial: {
                diffuseColor: "#00FF00",
              },
              chairMaterial: {
                diffuseColor: "#8B4513", // Brown
              },
              tableMaterial: {
                diffuseColor: "#654321", // Dark brown
              },
              couchMaterial: {
                diffuseColor: "#A0522D", // Sienna
              },
              lampMaterial: {
                diffuseColor: "#FFD700", // Gold
              },
            });
            setMaterialsReady(true);
          } else {
            setTimeout(initBasicMaterials, 500);
          }
        } catch (error) {
          setTimeout(initBasicMaterials, 500);
        }
      };

      // Start with basic materials after a short delay to ensure native module is ready
      const timer = setTimeout(initBasicMaterials, 300);
      return () => clearTimeout(timer);
    }, []);

    const handlePlaneTap = (anchor: any) => {
      if (selectedFurniture && anchor?.center) {
        onPlaneTap(anchor.center);
      }
    };

    // Render furniture based on type
    // Priority: 1) PNG images (2D billboard), 2) .glb/.gltf (3D models), 3) .obj 3D models, 4) 3D shapes
    const renderFurniture = (furniture: PlacedFurniture) => {
      // Try PNG image first (2D billboard - always faces camera)
      // Only use PNG if it exists, otherwise fall through to 3D models
      let imageSource = null;
      try {
        switch (furniture.type) {
          case "couch":
            // Use variant if specified, otherwise fallback to default couch.png
            if (furniture.variant) {
              imageSource = couchImageMap[furniture.variant];
              if (!imageSource) {
                try {
                  imageSource = require("../../assets/models/couch.png");
                } catch (e2) {
                  // Default couch.png not found
                }
              }
            } else {
              try {
                imageSource = require("../../assets/models/couch.png");
              } catch (e) {
                // couch.png not found
              }
            }
            break;
          case "chair":
            // Use variant if specified, otherwise fallback to default chair.png
            if (furniture.variant) {
              imageSource = chairImageMap[furniture.variant];
              if (!imageSource) {
                try {
                  imageSource = require("../../assets/models/chair.png");
                } catch (e2) {
                  // Default chair.png not found
                }
              }
            } else {
              try {
                imageSource = require("../../assets/models/chair.png");
              } catch (e) {
                // chair.png not found
              }
            }
            break;
          case "art":
            // Use variant if specified, otherwise fallback to default art.png
            if (furniture.variant) {
              imageSource = artImageMap[furniture.variant];
              if (!imageSource) {
                try {
                  imageSource = require("../../assets/models/art.png");
                } catch (e2) {
                  // Default art.png not found
                }
              }
            } else {
              try {
                imageSource = require("../../assets/models/art.png");
              } catch (e) {
                // art.png not found
              }
            }
            break;
          case "table":
            // Use variant if specified, otherwise fallback to default table.png
            if (furniture.variant) {
              imageSource = tableImageMap[furniture.variant];
              if (!imageSource) {
                try {
                  imageSource = require("../../assets/models/table.png");
                } catch (e2) {
                  // Default table.png not found
                }
              }
            } else {
              try {
                imageSource = require("../../assets/models/table.png");
              } catch (e) {
                // table.png not found
              }
            }
            break;
          case "lamp":
            // Use variant if specified, otherwise fallback to default lamp.png
            if (furniture.variant) {
              imageSource = lampImageMap[furniture.variant];
              if (!imageSource) {
                try {
                  imageSource = require("../../assets/models/lamp.png");
                } catch (e2) {
                  // Default lamp.png not found
                }
              }
            } else {
              try {
                imageSource = require("../../assets/models/lamp.png");
              } catch (e) {
                // lamp.png not found
              }
            }
            break;
          case "posters":
            // Use variant if specified, otherwise fallback to default posters.png
            if (furniture.variant) {
              imageSource = posterImageMap[furniture.variant];
              if (!imageSource) {
                try {
                  imageSource = require("../../assets/models/posters.png");
                } catch (e2) {
                  // Default posters.png not found
                }
              }
            } else {
              try {
                imageSource = require("../../assets/models/posters.png");
              } catch (e) {
                // posters.png not found
              }
            }
            break;
          case "desk":
            // Use variant if specified, otherwise fallback to default desk.png
            if (furniture.variant) {
              imageSource = deskImageMap[furniture.variant];
              if (!imageSource) {
                try {
                  imageSource = require("../../assets/models/desk.png");
                } catch (e2) {
                  // Default desk.png not found
                }
              }
            } else {
              try {
                imageSource = require("../../assets/models/desk.png");
              } catch (e) {
                // desk.png not found
              }
            }
            break;
        }
      } catch (pngError) {
        // PNG not found for this furniture type, will fall through to 3D models
      }

      // If PNG found, use ViroImage directly (no materials needed!)
      if (imageSource && materialsReady) {
        try {
          return (
            <ViroImage
              source={imageSource}
              position={[0, 0.75, 0]} // 0.75m above ground (relative to furniture position) - centers the image
              scale={[1.5, 1.5, 1]} // 1.5m wide, 1.5m tall (reasonable furniture size)
              rotation={[0, 0, 0]} // Fixed orientation - no rotation
              resizeMode="ScaleToFit"
            />
          );
        } catch (error) {
          // Fall through to 3D models/shapes
        }
      } else if (imageSource && !materialsReady) {
        // PNG found but basic materials not ready yet - wait
        return null; // Don't render until basic materials are ready
      }

      // Try .glb/.gltf as fallback (better format, single file, more efficient)
      try {
        let glbSource = null;
        let modelType = null;

        switch (furniture.type) {
          case "couch":
            try {
              glbSource = require("../../assets/models/couch.glb");
              modelType = "GLB";
            } catch (glbError) {
              try {
                glbSource = require("../../assets/models/couch.gltf");
                modelType = "GLTF";
              } catch (gltfError) {
                throw gltfError;
              }
            }
            break;
          case "chair":
            try {
              glbSource = require("../../assets/models/chair.glb");
              modelType = "GLB";
            } catch {
              try {
                glbSource = require("../../assets/models/chair.gltf");
                modelType = "GLTF";
              } catch {
                throw new Error("No GLB/GLTF");
              }
            }
            break;
          case "table":
            try {
              glbSource = require("../../assets/models/table.glb");
              modelType = "GLB";
            } catch {
              try {
                glbSource = require("../../assets/models/table.gltf");
                modelType = "GLTF";
              } catch {
                throw new Error("No GLB/GLTF");
              }
            }
            break;
          case "lamp":
            try {
              glbSource = require("../../assets/models/lamp.glb");
              modelType = "GLB";
            } catch {
              try {
                glbSource = require("../../assets/models/lamp.gltf");
                modelType = "GLTF";
              } catch {
                throw new Error("No GLB/GLTF");
              }
            }
            break;
          case "art":
            try {
              glbSource = require("../../assets/models/art.glb");
              modelType = "GLB";
            } catch {
              try {
                glbSource = require("../../assets/models/art.gltf");
                modelType = "GLTF";
              } catch {
                throw new Error("No GLB/GLTF");
              }
            }
            break;
          case "posters":
            try {
              glbSource = require("../../assets/models/posters.glb");
              modelType = "GLB";
            } catch {
              try {
                glbSource = require("../../assets/models/posters.gltf");
                modelType = "GLTF";
              } catch {
                throw new Error("No GLB/GLTF");
              }
            }
            break;
          case "desk":
            try {
              glbSource = require("../../assets/models/desk.glb");
              modelType = "GLB";
            } catch {
              try {
                glbSource = require("../../assets/models/desk.gltf");
                modelType = "GLTF";
              } catch {
                throw new Error("No GLB/GLTF");
              }
            }
            break;
        }

        if (glbSource && modelType) {
          // GLB files are usually well-scaled, start with 1.0 and adjust if needed
          return (
            <>
              {/* Test box to verify placement position */}
              {materialsReady && (
                <ViroBox
                  position={[0, 0, 0]}
                  scale={[0.3, 0.3, 0.3]}
                  materials={["couchMaterial"]}
                  opacity={0.8}
                />
              )}
              {/* 3D Model - GLB format */}
              <Viro3DObject
                source={glbSource}
                position={[0, 0, 0]}
                scale={[1.0, 1.0, 1.0]} // Full size - adjust if needed
                type={modelType as "GLB" | "GLTF"}
                // Don't pass materials prop - let the GLB use its own embedded materials
                onLoadStart={() => {}}
                onLoadEnd={() => {}}
                onError={() => {}}
              />
            </>
          );
        }
      } catch (glbError) {
        // No .glb/.gltf file, trying .obj...
      }

      // Try .obj as fallback
      try {
        let objSource = null;
        let mtlSource = null;

        switch (furniture.type) {
          case "couch":
            try {
              objSource = require("../../assets/models/couch.obj");
              try {
                mtlSource = require("../../assets/models/couch.mtl");
              } catch (e) {
                // couch.mtl not found
              }
            } catch (e) {
              throw e;
            }
            break;
          case "chair":
            objSource = require("../../assets/models/chair.obj");
            try {
              mtlSource = require("../../assets/models/chair.mtl");
            } catch (e) {
              // chair.mtl not found
            }
            break;
          case "table":
            objSource = require("../../assets/models/table.obj");
            try {
              mtlSource = require("../../assets/models/table.mtl");
            } catch (e) {
              // table.mtl not found
            }
            break;
          case "lamp":
            objSource = require("../../assets/models/lamp.obj");
            try {
              mtlSource = require("../../assets/models/lamp.mtl");
            } catch (e) {
              // lamp.mtl not found
            }
            break;
          case "art":
            objSource = require("../../assets/models/art.obj");
            try {
              mtlSource = require("../../assets/models/art.mtl");
            } catch (e) {
              // art.mtl not found
            }
            break;
          case "posters":
            objSource = require("../../assets/models/posters.obj");
            try {
              mtlSource = require("../../assets/models/posters.mtl");
            } catch (e) {
              // posters.mtl not found
            }
            break;
          case "desk":
            objSource = require("../../assets/models/desk.obj");
            try {
              mtlSource = require("../../assets/models/desk.mtl");
            } catch (e) {
              // desk.mtl not found
            }
            break;
        }

        if (objSource) {
          return (
            <>
              {materialsReady && (
                <ViroBox
                  position={[0, 0, 0]}
                  scale={[0.5, 0.5, 0.5]}
                  materials={["couchMaterial"]}
                  opacity={1.0}
                />
              )}
              <Viro3DObject
                source={objSource}
                resources={mtlSource ? [mtlSource] : undefined}
                position={[0, 0, 0]}
                scale={[0.01, 0.01, 0.01]}
                type="OBJ"
                onLoadStart={() => {}}
                onLoadEnd={() => {}}
                onError={() => {}}
              />
            </>
          );
        }
      } catch (objError) {
        // No .obj file, using 3D shapes...
      }

      // Fallback to 3D shapes if PNG doesn't exist
      switch (furniture.type) {
        case "chair":
          // Chair: seat + back + legs
          return (
            <>
              {/* Seat */}
              <ViroBox
                position={[0, 0.25, 0]}
                scale={[0.4, 0.05, 0.4]}
                materials={["chairMaterial"]}
              />
              {/* Back */}
              <ViroBox
                position={[0, 0.45, -0.15]}
                scale={[0.4, 0.3, 0.05]}
                materials={["chairMaterial"]}
              />
              {/* Legs */}
              <ViroBox
                position={[-0.15, 0.1, -0.15]}
                scale={[0.04, 0.2, 0.04]}
                materials={["chairMaterial"]}
              />
              <ViroBox
                position={[0.15, 0.1, -0.15]}
                scale={[0.04, 0.2, 0.04]}
                materials={["chairMaterial"]}
              />
              <ViroBox
                position={[-0.15, 0.1, 0.15]}
                scale={[0.04, 0.2, 0.04]}
                materials={["chairMaterial"]}
              />
              <ViroBox
                position={[0.15, 0.1, 0.15]}
                scale={[0.04, 0.2, 0.04]}
                materials={["chairMaterial"]}
              />
            </>
          );
        case "table":
          // Table: top + legs
          return (
            <>
              {/* Table top */}
              <ViroBox
                position={[0, 0.4, 0]}
                scale={[1, 0.1, 1]}
                materials={["tableMaterial"]}
              />
              {/* Legs */}
              <ViroBox
                position={[-0.4, 0.2, -0.4]}
                scale={[0.06, 0.4, 0.06]}
                materials={["tableMaterial"]}
              />
              <ViroBox
                position={[0.4, 0.2, -0.4]}
                scale={[0.06, 0.4, 0.06]}
                materials={["tableMaterial"]}
              />
              <ViroBox
                position={[-0.4, 0.2, 0.4]}
                scale={[0.06, 0.4, 0.06]}
                materials={["tableMaterial"]}
              />
              <ViroBox
                position={[0.4, 0.2, 0.4]}
                scale={[0.06, 0.4, 0.06]}
                materials={["tableMaterial"]}
              />
            </>
          );
        case "couch":
          // Couch: seat + back + arms
          return (
            <>
              {/* Seat */}
              <ViroBox
                position={[0, 0.3, 0]}
                scale={[1.2, 0.2, 0.5]}
                materials={["couchMaterial"]}
              />
              {/* Back */}
              <ViroBox
                position={[0, 0.55, -0.2]}
                scale={[1.2, 0.5, 0.1]}
                materials={["couchMaterial"]}
              />
              {/* Left arm */}
              <ViroBox
                position={[-0.6, 0.4, 0]}
                scale={[0.15, 0.4, 0.5]}
                materials={["couchMaterial"]}
              />
              {/* Right arm */}
              <ViroBox
                position={[0.6, 0.4, 0]}
                scale={[0.15, 0.4, 0.5]}
                materials={["couchMaterial"]}
              />
            </>
          );
        case "lamp":
          // Lamp: base + pole + shade
          return (
            <>
              {/* Base */}
              <ViroBox
                position={[0, 0.05, 0]}
                scale={[0.3, 0.2, 0.3]}
                materials={["lampMaterial"]}
              />
              {/* Pole */}
              <ViroBox
                position={[0, 0.4, 0]}
                scale={[0.06, 0.6, 0.06]}
                materials={["lampMaterial"]}
              />
              {/* Shade */}
              <ViroBox
                position={[0, 0.75, 0]}
                scale={[0.5, 0.4, 0.5]}
                materials={["lampMaterial"]}
              />
              {/* Light bulb (glowing sphere) */}
              <ViroSphere
                position={[0, 0.75, 0]}
                scale={[0.1, 0.1, 0.1]}
                materials={["lampMaterial"]}
              />
            </>
          );
        case "art":
          // Art: simple frame/rectangle
          return (
            <>
              <ViroBox
                position={[0, 0.5, 0]}
                scale={[0.8, 1.0, 0.05]}
                materials={["couchMaterial"]}
              />
            </>
          );
        case "posters":
          // Posters: flat rectangle
          return (
            <>
              <ViroBox
                position={[0, 0.5, 0]}
                scale={[0.6, 0.8, 0.02]}
                materials={["couchMaterial"]}
              />
            </>
          );
        case "desk":
          // Desk: top + legs
          return (
            <>
              {/* Desk top */}
              <ViroBox
                position={[0, 0.35, 0]}
                scale={[0.8, 0.05, 0.4]}
                materials={["tableMaterial"]}
              />
              {/* Legs */}
              <ViroBox
                position={[-0.35, 0.175, -0.15]}
                scale={[0.05, 0.35, 0.05]}
                materials={["tableMaterial"]}
              />
              <ViroBox
                position={[0.35, 0.175, -0.15]}
                scale={[0.05, 0.35, 0.05]}
                materials={["tableMaterial"]}
              />
              <ViroBox
                position={[-0.35, 0.175, 0.15]}
                scale={[0.05, 0.35, 0.05]}
                materials={["tableMaterial"]}
              />
              <ViroBox
                position={[0.35, 0.175, 0.15]}
                scale={[0.05, 0.35, 0.05]}
                materials={["tableMaterial"]}
              />
            </>
          );
        default:
          return null;
      }
    };

    return (
      <ViroARScene>
        <ViroAmbientLight color="#ffffff" intensity={300} />

        {/* Plane selector for tap-to-place on detected surfaces */}
        {selectedFurniture && (
          <ViroARPlaneSelector
            minHeight={0.1}
            minWidth={0.1}
            onPlaneSelected={(plane) => {
              if (plane && plane.center) {
                // Place furniture on the detected plane
                onPlaneTap(plane.center as [number, number, number]);
              }
            }}
          />
        )}

        {/* Debug: Always show materials status - removed to prevent material errors */}

        {/* Render placed furniture */}
        {materialsReady && placedFurniture.length > 0 && (
          <>
            {placedFurniture.map((furniture) => {
              // No drag functionality - furniture can only be moved with arrows

              return (
                <ViroNode
                  key={furniture.id}
                  position={furniture.position}
                  rotation={[0, 0, 0]} // Fixed rotation - PNGs stay upright, 3D models can be rotated later if needed
                  onPinch={() => {}} // Disable pinch/scale - prevent scaling
                  // Temporarily disable onClick to prevent crashes - use UI buttons to select instead
                  // onClick={(position, source) => {
                  //   try {
                  //     // Select furniture for editing when clicked
                  //     // Only select if not currently placing furniture
                  //     if (onFurnitureSelect) {
                  //       onFurnitureSelect(furniture.id);
                  //     }
                  //   } catch (error) {
                  //     console.error("Error in onClick handler:", error);
                  //   }
                  // }}
                >
                  {renderFurniture(furniture)}
                </ViroNode>
              );
            })}
          </>
        )}
      </ViroARScene>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison: only re-render if furniture positions actually changed
    if (prevProps.placedFurniture.length !== nextProps.placedFurniture.length) {
      return false; // Re-render if count changed
    }
    // Check if any positions changed
    for (let i = 0; i < prevProps.placedFurniture.length; i++) {
      const prev = prevProps.placedFurniture[i];
      const next = nextProps.placedFurniture[i];
      if (
        prev.id !== next.id ||
        prev.position[0] !== next.position[0] ||
        prev.position[1] !== next.position[1] ||
        prev.position[2] !== next.position[2]
      ) {
        return false; // Re-render if position changed
      }
    }
    // Check other props
    return (
      prevProps.selectedFurniture === nextProps.selectedFurniture &&
      prevProps.moveMode3D === nextProps.moveMode3D
    );
  }
);

export const ARFurniturePlacer: React.FC<ARFurniturePlacerProps> = ({
  onBack,
  onSave,
  onViewGallery,
  projectId,
  isExistingProject = false,
  isNewProjectStart = false,
}) => {
  const [selectedFurniture, setSelectedFurniture] = useState<
    PlacedFurniture["type"] | null
  >(null);
  const [placedFurniture, setPlacedFurniture] = useState<PlacedFurniture[]>([]);
  const [moveMode3D, setMoveMode3D] = useState(false); // Toggle between horizontal-only and 3D movement
  const [selectedFurnitureId, setSelectedFurnitureId] = useState<string | null>(
    null
  ); // Track which furniture is selected for editing
  const [isCapturing, setIsCapturing] = useState(false); // Track when capturing scene to hide UI
  const [showFlash, setShowFlash] = useState(false); // Flash animation for photo capture
  const flashOpacity = useRef(new Animated.Value(0)).current; // Flash animation value
  const [projectName, setProjectName] = useState(""); // Project name for new projects
  const [projectDescription, setProjectDescription] = useState(""); // Project description for new projects
  const [showInitialModal, setShowInitialModal] = useState(false); // Will be set after checking AsyncStorage
  const [showInstructionsModal, setShowInstructionsModal] = useState(false); // Show instructions after initial setup
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false); // Show confirmation when leaving with unsaved changes

  // Check if project already exists in AsyncStorage - if so, don't show modal
  // Also reset state if returning after leaving (no saved data)
  useEffect(() => {
    const checkExistingProject = async () => {
      if (!isExistingProject && isNewProjectStart) {
        try {
          const existingName = await AsyncStorage.getItem(
            "@haven_current_project_name"
          );
          if (!existingName) {
            // No existing project name, show modal for new project start
            // Also reset state in case user left and came back
            setProjectName("");
            setProjectDescription("");
            setPlacedFurniture([]);
            setShowInitialModal(true);
          } else {
            // Project name exists, load it and don't show modal
            setProjectName(existingName);
            const existingDesc = await AsyncStorage.getItem(
              "@haven_current_project_description"
            );
            if (existingDesc) {
              setProjectDescription(existingDesc);
            }
          }
        } catch (error) {
          console.error("Error checking existing project:", error);
          // If error, show modal if it's a new project start
          if (isNewProjectStart) {
            setProjectName("");
            setProjectDescription("");
            setPlacedFurniture([]);
            setShowInitialModal(true);
          }
        }
      } else if (!isExistingProject && !isNewProjectStart) {
        // Returning after leaving - reset everything
        setProjectName("");
        setProjectDescription("");
        setPlacedFurniture([]);
      }
    };
    checkExistingProject();
  }, [isNewProjectStart, isExistingProject]);

  // Store project name/description in AsyncStorage so ImageGallery can access it
  useEffect(() => {
    if (projectName && !isExistingProject) {
      AsyncStorage.setItem("@haven_current_project_name", projectName);
      AsyncStorage.setItem(
        "@haven_current_project_description",
        projectDescription || ""
      );
    }
  }, [projectName, projectDescription, isExistingProject]);

  // Handle back navigation - clear data if user confirms leaving
  const handleBack = async () => {
    setShowUnsavedChangesModal(false);
    if (!isExistingProject) {
      // Clear all project data when leaving new project
      try {
        await AsyncStorage.removeItem("@haven_current_project_name");
        await AsyncStorage.removeItem("@haven_current_project_description");
        await AsyncStorage.setItem(SAVED_IMAGES_KEY, JSON.stringify([]));
        // Reset local state
        setProjectName("");
        setProjectDescription("");
        setPlacedFurniture([]);
      } catch (error) {
        console.error("Error clearing project data:", error);
      }
    }
    onBack();
  };
  const [showCouchModal, setShowCouchModal] = useState(false); // Show couch selection modal
  const [selectedCouchVariant, setSelectedCouchVariant] = useState<
    string | null
  >(null); // Selected couch variant
  const [showChairModal, setShowChairModal] = useState(false); // Show chair selection modal
  const [selectedChairVariant, setSelectedChairVariant] = useState<
    string | null
  >(null); // Selected chair variant
  const [showArtModal, setShowArtModal] = useState(false); // Show art selection modal
  const [selectedArtVariant, setSelectedArtVariant] = useState<string | null>(
    null
  ); // Selected art variant
  const [showLampModal, setShowLampModal] = useState(false); // Show lamp selection modal
  const [selectedLampVariant, setSelectedLampVariant] = useState<string | null>(
    null
  ); // Selected lamp variant
  const [showDeskModal, setShowDeskModal] = useState(false); // Show desk selection modal
  const [selectedDeskVariant, setSelectedDeskVariant] = useState<string | null>(
    null
  ); // Selected desk variant
  const [showTableModal, setShowTableModal] = useState(false); // Show table selection modal
  const [selectedTableVariant, setSelectedTableVariant] = useState<
    string | null
  >(null); // Selected table variant
  const [showPosterModal, setShowPosterModal] = useState(false); // Show poster selection modal
  const [selectedPosterVariant, setSelectedPosterVariant] = useState<
    string | null
  >(null); // Selected poster variant
  const [showEditModal, setShowEditModal] = useState(false); // Show edit furniture selection modal
  const [infoModalVisible, setInfoModalVisible] = useState(false); // Show furniture info modal
  const [showDeleteModal, setShowDeleteModal] = useState(false); // Show delete confirmation modal
  const [showOnePieceModal, setShowOnePieceModal] = useState(false); // Show "only one piece" modal
  const [infoModalItem, setInfoModalItem] = useState<{
    type: string;
    variant?: string;
  } | null>(null); // Item to show info for

  // Debug: Log when info modal visibility changes
  useEffect(() => {
    console.log("infoModalVisible changed to:", infoModalVisible);
    console.log("infoModalItem:", infoModalItem);
  }, [infoModalVisible, infoModalItem]);
  const [showTapToPlace, setShowTapToPlace] = useState(false); // Show "Tap to place" message
  const tapToPlaceOpacity = useRef(new Animated.Value(0)).current;
  const [showCaptureModal, setShowCaptureModal] = useState(false); // Show capture confirmation modal
  const sceneRef = useRef<any>(null);
  const containerRef = useRef<View>(null);
  const arSceneContainerRef = useRef<View>(null); // Ref for AR scene area only (without header/footer)
  const furnitureScrollRef = useRef<ScrollView | null>(null);
  const [scrollbarWidth, setScrollbarWidth] = useState(30); // Percentage of track width
  const [scrollbarPosition, setScrollbarPosition] = useState(0); // Percentage from left
  const [scrollContentWidth, setScrollContentWidth] = useState(0);
  const [scrollViewWidth, setScrollViewWidth] = useState(0);

  // Couch variants - 10 couches with require mapping
  const couchVariants = [
    "couch-1.png",
    "couch-2.png",
    "couch-3.png",
    "couch-4.png",
    "couch-5.png",
    "couch-6.png",
    "couch-7.png",
    "couch-8.png",
    "couch-9.png",
    "couch-10.png",
  ];

  // Chair variants - 10 chairs with require mapping
  const chairVariants = [
    "chair-1.png",
    "chair-2.png",
    "chair-3.png",
    "chair-4.png",
    "chair-5.png",
    "chair-6.png",
    "chair-7.png",
    "chair-8.png",
    "chair-9.png",
    "chair-10.png",
  ];

  // Art variants - 8 art pieces with require mapping
  const artVariants = [
    "art-1.png",
    "art-2.png",
    "art-3.png",
    "art-4.png",
    "art-5.png",
    "art-6.png",
    "art-7.png",
    "art-8.png",
  ];

  // Lamp variants - 10 lamps with require mapping
  const lampVariants = [
    "lamp-1.png",
    "lamp-2.png",
    "lamp-3.png",
    "lamp-4.png",
    "lamp-5.png",
    "lamp-6.png",
    "lamp-7.png",
    "lamp-8.png",
    "lamp-9.png",
    "lamp-10.png",
  ];

  // Desk variants - 8 desks with require mapping
  const deskVariants = [
    "desk-1.png",
    "desk-2.png",
    "desk-3.png",
    "desk-4.png",
    "desk-5.png",
    "desk-6.png",
    "desk-7.png",
    "desk-8.png",
  ];

  // Table variants - 8 tables with require mapping
  const tableVariants = [
    "table-1.png",
    "table-2.png",
    "table-3.png",
    "table-4.png",
    "table-5.png",
    "table-6.png",
    "table-7.png",
    "table-8.png",
  ];

  // Poster variants - 8 posters with require mapping
  const posterVariants = [
    "poster-1.png",
    "poster-2.png",
    "poster-3.png",
    "poster-4.png",
    "poster-5.png",
    "poster-6.png",
    "poster-7.png",
    "poster-8.png",
  ];

  const furnitureTypes: PlacedFurniture["type"][] = [
    "chair",
    "table",
    "couch",
    "lamp",
    "art",
    "posters",
    "desk",
  ];

  // Handle scroll to update scrollbar position
  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const scrollX = contentOffset.x;
    const contentWidth = contentSize.width;
    const viewWidth = layoutMeasurement.width;

    if (contentWidth > viewWidth) {
      // Calculate scrollbar thumb width as percentage of visible content
      const thumbWidthPercent = (viewWidth / contentWidth) * 100;
      // Calculate scrollbar thumb position based on scroll position
      const maxScroll = contentWidth - viewWidth;
      const positionPercent =
        maxScroll > 0 ? (scrollX / maxScroll) * (100 - thumbWidthPercent) : 0;

      setScrollbarWidth(thumbWidthPercent);
      setScrollbarPosition(positionPercent);
    } else {
      // Content fits in view, hide scrollbar
      setScrollbarWidth(100);
      setScrollbarPosition(0);
    }
  };

  // Track content and view dimensions
  const handleContentSizeChange = (contentWidth: number) => {
    setScrollContentWidth(contentWidth);
  };

  const handleScrollViewLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
    setScrollViewWidth(width);

    // Center scroll view on "Lamp" button on initial mount
    if (furnitureScrollRef.current && scrollContentWidth === 0) {
      // Scroll to center on "Lamp" (index 3)
      // Estimate: each button is approximately 100px wide (minWidth 80 + padding + margin)
      const buttonWidth = 100;
      const lampIndex = 3; // "lamp" is at index 3
      setTimeout(() => {
        if (furnitureScrollRef.current) {
          const scrollPosition = lampIndex * buttonWidth - 150; // Offset to center
          furnitureScrollRef.current.scrollTo({
            x: Math.max(0, scrollPosition),
            animated: false,
          });
        }
      }, 50);
    }
  };

  // Show "Tap to place" message when furniture is selected
  useEffect(() => {
    if (selectedFurniture && !isCapturing) {
      setShowTapToPlace(true);
      // Fade in
      Animated.timing(tapToPlaceOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Fade out and hide after 3 seconds
      const timer = setTimeout(() => {
        Animated.timing(tapToPlaceOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setShowTapToPlace(false);
        });
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      setShowTapToPlace(false);
      tapToPlaceOpacity.setValue(0);
    }
  }, [selectedFurniture, isCapturing, tapToPlaceOpacity]);

  const handlePlaneTap = async (position: [number, number, number]) => {
    if (!selectedFurniture) {
      return;
    }

    // Only allow one piece of furniture at a time
    if (placedFurniture.length > 0) {
      setShowOnePieceModal(true);
      setSelectedFurniture(null);
      return;
    }

    // Capture current scene as snapshot before placing furniture
    if (containerRef.current) {
      try {
        const snapshot = await captureRef(containerRef, {
          format: "jpg",
          quality: 0.9,
          result: "tmpfile",
        });
        if (snapshot) {
          setSnapshotUri(snapshot);
        }
      } catch (error) {
        console.error("Error capturing snapshot:", error);
      }
    }

    // Adjust Y position to place furniture higher (more towards middle of screen)
    // Add 0.5m to the Y coordinate to lift furniture from ground level
    // Create a new array instance to ensure each furniture piece has its own position
    // Adjust position: raise by 0.5m and move back by 1.0m for better initial placement
    const adjustedPosition: [number, number, number] = [
      position[0],
      position[1] + 0.5,
      position[2] - 1.0, // Move further back (negative Z = away from camera)
    ];

    const newFurniture: PlacedFurniture = {
      id: `furniture-${Date.now()}-${Math.random()}`,
      type: selectedFurniture,
      position: [adjustedPosition[0], adjustedPosition[1], adjustedPosition[2]], // Create a new array with copied values
      rotation: [0, 0, 0],
      variant:
        selectedFurniture === "couch"
          ? selectedCouchVariant || undefined
          : selectedFurniture === "chair"
          ? selectedChairVariant || undefined
          : selectedFurniture === "art"
          ? selectedArtVariant || undefined
          : selectedFurniture === "lamp"
          ? selectedLampVariant || undefined
          : selectedFurniture === "desk"
          ? selectedDeskVariant || undefined
          : selectedFurniture === "table"
          ? selectedTableVariant || undefined
          : selectedFurniture === "posters"
          ? selectedPosterVariant || undefined
          : undefined,
    };

    setPlacedFurniture((prev) => {
      // Create independent copies of existing furniture with their exact positions
      // Each piece maintains its own position array (no shared references)
      const prevWithCopiedPositions = prev.map((f) => ({
        ...f,
        position: [f.position[0], f.position[1], f.position[2]] as [
          number,
          number,
          number
        ],
      }));
      const updated = [...prevWithCopiedPositions, newFurniture];

      // Show snapshot overlay immediately
      setIsUpdatingScene(true);
      fadeOverlayOpacity.setValue(1);

      // Clear any pending updates
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      // IMPORTANT: We must remount the scene to show new furniture, but this resets AR tracking.
      // AR limitation: When scene remounts, coordinate system resets, causing position drift.
      // We store positions correctly, but they become relative to new AR origin after remount.
      // Increment placementKey to trigger remount - positions will be preserved in state.
      setPlacementKey((prev) => prev + 1);

      // Wait for scene to remount and render, then hide snapshot
      updateTimeoutRef.current = setTimeout(() => {
        setTimeout(() => {
          fadeOverlayOpacity.setValue(0);
          Animated.timing(fadeOverlayOpacity, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }).start(() => {
            setIsUpdatingScene(false);
            setSnapshotUri(null);
            // Auto-select the newly placed furniture for editing after snapshot fades
            setSelectedFurnitureId(newFurniture.id);
          });
        }, 400);
      }, 500);

      return updated;
    });
    setSelectedFurniture(null); // Deselect after placing
    // Clear selected variants after placing
    setSelectedCouchVariant(null);
    setSelectedChairVariant(null);
    setSelectedArtVariant(null);
    setSelectedLampVariant(null);
    setSelectedDeskVariant(null);
    setSelectedTableVariant(null);
    setSelectedPosterVariant(null);
  };

  // Move furniture by small increments using arrow buttons
  const [sceneUpdateKey, setSceneUpdateKey] = useState(0);
  const [placementKey, setPlacementKey] = useState(0); // Separate key for furniture placement to track additions
  const [isUpdatingScene, setIsUpdatingScene] = useState(false);
  const [snapshotUri, setSnapshotUri] = useState<string | null>(null);
  const fadeOverlayOpacity = useRef(new Animated.Value(0)).current;
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const moveFurniture = React.useCallback(
    async (
      id: string,
      direction: "up" | "down" | "left" | "right" | "forward" | "backward"
    ) => {
      // Capture current scene as snapshot before moving
      // Use containerRef like the photo capture - header/footer will be in snapshot but that's fine for transition
      let capturedSnapshot: string | null = null;
      if (containerRef.current) {
        try {
          const snapshot = await captureRef(containerRef, {
            format: "jpg",
            quality: 0.9,
            result: "tmpfile",
          });
          if (snapshot) {
            capturedSnapshot = snapshot;
            setSnapshotUri(snapshot);
          }
        } catch (error) {
          console.error("Error capturing snapshot:", error);
        }
      }

      setPlacedFurniture((prev) => {
        const updated = prev.map((f) => {
          if (f.id !== id)
            return {
              ...f,
              position: [f.position[0], f.position[1], f.position[2]] as [
                number,
                number,
                number
              ],
            }; // Ensure each piece has its own position array copy
          const [x, y, z] = f.position;
          let newPosition: [number, number, number];
          // Forward/backward move more than other directions for better control
          const forwardBackAmount = 0.6;
          const otherAmount = 0.2;

          switch (direction) {
            case "up":
              newPosition = [x, y + otherAmount, z];
              break;
            case "down":
              newPosition = [x, y - otherAmount, z];
              break;
            case "left":
              newPosition = [x - otherAmount, y, z];
              break;
            case "right":
              newPosition = [x + otherAmount, y, z];
              break;
            case "forward":
              newPosition = [x, y, z - forwardBackAmount]; // Move forward (toward camera)
              break;
            case "backward":
              newPosition = [x, y, z + forwardBackAmount]; // Move backward (away from camera)
              break;
            default:
              newPosition = [x, y, z];
          }
          return { ...f, position: newPosition };
        });

        // Show snapshot overlay immediately
        setIsUpdatingScene(true);
        fadeOverlayOpacity.setValue(1);

        // Clear any pending updates
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current);
        }

        // Debounce scene update to batch multiple rapid movements
        updateTimeoutRef.current = setTimeout(() => {
          // Force scene update by incrementing sceneUpdateKey
          setSceneUpdateKey((prev) => prev + 1);

          // Wait longer for scene to fully remount and render
          // Use multiple timeouts to ensure AR scene is completely ready
          setTimeout(() => {
            // Additional delay to ensure furniture is properly positioned
            setTimeout(() => {
              fadeOverlayOpacity.setValue(0);
              Animated.timing(fadeOverlayOpacity, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
              }).start(() => {
                setIsUpdatingScene(false);
                setSnapshotUri(null);
              });
            }, 400); // Extra delay to ensure AR scene is fully rendered
          }, 500); // Initial delay for scene remount
        }, 100); // Debounce by 100ms

        return updated;
      });
    },
    [fadeOverlayOpacity]
  );

  const removeLastFurniture = () => {
    setPlacedFurniture((prev) => {
      const updated = prev.slice(0, -1);
      // If we removed the selected furniture, clear the selection to close move controls
      if (prev.length > 0 && selectedFurnitureId === prev[prev.length - 1].id) {
        setSelectedFurnitureId(null);
      }
      return updated;
    });
  };

  const confirmRemoveFurniture = () => {
    if (selectedFurnitureId) {
      // Filter out the furniture to remove
      setPlacedFurniture((prev) => {
        const filtered = prev.filter((f) => f.id !== selectedFurnitureId);
        return filtered;
      });
      setSelectedFurnitureId(null);
      setShowDeleteModal(false);
      // Force scene remount by incrementing placementKey
      // Scene key includes placedFurniture.length (1->0), which will also trigger remount
      setTimeout(() => {
        setPlacementKey((prev) => prev + 1);
      }, 0);
    }
  };

  // Note: Sound feedback removed - using haptics and flash animation instead
  // To add sound in the future, you'll need to rebuild native code after adding expo-av

  const captureScene = async () => {
    if (!containerRef.current) {
      return;
    }

    try {
      // Trigger haptic feedback
      if (Platform.OS === "ios") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      // Hide all UI before capturing (header and footer will be hidden by isCapturing)
      setIsCapturing(true);

      // Wait a brief moment for UI to hide
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Capture first, then show flash (header/footer hidden by isCapturing condition)
      const uri = await captureRef(containerRef, {
        format: "jpg",
        quality: 0.9,
        result: "tmpfile",
      });

      // Now trigger flash animation after capture
      setShowFlash(true);
      flashOpacity.setValue(1);
      Animated.sequence([
        Animated.timing(flashOpacity, {
          toValue: 0.8,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(flashOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowFlash(false);
      });

      // Play system sound (simplified - in production use a custom sound file)
      try {
        // Use Haptics notification for sound-like feedback
        if (Platform.OS === "ios") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } catch (error) {
        console.log("Could not play sound feedback:", error);
      }

      if (uri) {
        // Save to permanent location using storage utility
        const timestamp = Date.now();
        const filename = `furniture_scene_${timestamp}.jpg`;
        const savedUri = await saveImageFile(uri, filename);

        // Store the saved image URI in AsyncStorage
        try {
          if (isExistingProject && projectId) {
            // Save to existing project
            const existing = await AsyncStorage.getItem(SAVED_PROJECTS_KEY);
            const projects = existing ? JSON.parse(existing) : [];
            const projectIndex = projects.findIndex(
              (p: any) => p.id === projectId
            );
            if (projectIndex !== -1) {
              projects[projectIndex].images.push(savedUri);
              await AsyncStorage.setItem(
                SAVED_PROJECTS_KEY,
                JSON.stringify(projects)
              );
            }
          } else {
            // Save to new project gallery
            const existing = await AsyncStorage.getItem(SAVED_IMAGES_KEY);
            const images = existing ? JSON.parse(existing) : [];
            images.push(savedUri);
            await AsyncStorage.setItem(
              SAVED_IMAGES_KEY,
              JSON.stringify(images)
            );
          }
        } catch (error) {
          console.error("Failed to save image URI to storage:", error);
        }

        // Show capture confirmation modal
        setShowCaptureModal(true);
        if (onSave) {
          onSave(savedUri);
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to capture scene. Please try again.");
    } finally {
      // Always show UI again after capture (success or failure)
      setIsCapturing(false);
    }
  };

  const handleFurnitureSelect = React.useCallback((id: string | null) => {
    setSelectedFurnitureId(id);
  }, []);

  const sceneFunction = React.useCallback(() => {
    return (
      <FurnitureScene
        placedFurniture={placedFurniture}
        onPlaneTap={handlePlaneTap}
        selectedFurniture={selectedFurniture}
        moveMode3D={moveMode3D}
        onFurnitureSelect={handleFurnitureSelect}
      />
    );
  }, [
    placedFurniture,
    selectedFurniture,
    moveMode3D,
    handleFurnitureSelect,
    handlePlaneTap,
  ]);

  // Show instructions modal after initial setup
  useEffect(() => {
    if (!showInitialModal && !isExistingProject && projectName) {
      setShowInstructionsModal(true);
      const timer = setTimeout(() => {
        setShowInstructionsModal(false);
      }, 5000); // Show for 5 seconds
      return () => clearTimeout(timer);
    }
  }, [showInitialModal, isExistingProject, projectName]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  return (
    <View ref={containerRef} style={styles.container} collapsable={false}>
      {/* Initial Project Setup Modal - Only for new projects */}
      <Modal
        visible={showInitialModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {}} // Prevent closing without completing
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Start New Project</Text>
              <TouchableOpacity
                style={styles.modalCloseButtonEdit}
                onPress={() => {
                  // Navigate back to home screen
                  setShowInitialModal(false);
                  setProjectName("");
                  setProjectDescription("");
                  onBack();
                }}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={theme.colors.textInverse}
                />
              </TouchableOpacity>
            </View>

            <View style={[styles.inputContainer, styles.firstInputContainer]}>
              <Text style={styles.inputLabel}>Project Name</Text>
              <TextInput
                style={styles.input}
                value={projectName}
                onChangeText={setProjectName}
                placeholder="Enter project name"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={styles.input}
                value={projectDescription}
                onChangeText={(text) => {
                  // Remove newlines and returns
                  const cleanText = text.replace(/[\n\r]/g, "");
                  setProjectDescription(cleanText);
                }}
                placeholder="Add a description"
                placeholderTextColor={theme.colors.textSecondary}
                returnKeyType="done"
                blurOnSubmit={true}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalSecondaryButton,
                  !projectName.trim() && styles.buttonDisabled,
                ]}
                onPress={() => {
                  if (projectName.trim()) {
                    setShowInitialModal(false);
                  }
                }}
                disabled={!projectName.trim()}
              >
                <Text style={styles.modalSecondaryButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Instructions Modal - Shows after initial setup */}
      <Modal
        visible={showInstructionsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowInstructionsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Getting Started</Text>
            <Text
              style={[styles.modalSubtitle, { marginTop: theme.spacing.lg }]}
            >
              Now place furniture to view the layout in AR. Capture your scenes
              and share with friends for feedback.
            </Text>
            <SecondaryButton
              title="Got it!"
              onPress={() => setShowInstructionsModal(false)}
            />
          </View>
        </View>
      </Modal>

      <View ref={arSceneContainerRef} style={styles.arSceneContainer}>
        <ViroARSceneNavigator
          key={`scene-${placedFurniture.length}-${placementKey}-${sceneUpdateKey}`} // Remount on placement, movement, or removal
          ref={sceneRef}
          initialScene={{ scene: sceneFunction }}
          style={styles.arScene}
        />
      </View>

      {/* Transparent tap overlay - MUST be outside overlay view to capture taps */}
      {selectedFurniture && !isCapturing && (
        <TouchableOpacity
          style={styles.tapOverlay}
          activeOpacity={1}
          onPress={() => {
            // Place furniture at fixed position in front of camera, raised for better visibility
            // ViroARPlaneSelector will handle actual plane detection and placement
            // Position: X=0 (center), Y=-1.0 (raised from ground), Z=-1.5 (1.5m in front)
            const position: [number, number, number] = [0, -1.0, -1.5]; // Raised higher for better placement
            handlePlaneTap(position);
          }}
        />
      )}

      {/* Animated "Tap to place" message */}
      {showTapToPlace && (
        <Animated.View
          style={[styles.tapToPlaceContainer, { opacity: tapToPlaceOpacity }]}
          pointerEvents="none"
        >
          <Text style={styles.tapToPlaceText}>Tap to place</Text>
        </Animated.View>
      )}

      {/* Header - Furniture Selection - Hide when move controls are open */}
      {!isCapturing && !selectedFurnitureId && (
        <View style={styles.header} pointerEvents="box-none">
          <View pointerEvents="auto" style={styles.headerContent}>
            <Text style={styles.selectorTitle}>
              Choose furniture to view in AR
            </Text>
            <View style={styles.furnitureScrollContainer}>
              <ScrollView
                ref={furnitureScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.furnitureScroll}
                contentContainerStyle={styles.furnitureScrollContent}
                pointerEvents="auto"
                onLayout={handleScrollViewLayout}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                onContentSizeChange={handleContentSizeChange}
              >
                {furnitureTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.furnitureButton,
                      selectedFurniture === type &&
                        styles.furnitureButtonSelected,
                    ]}
                    onPress={() => {
                      // Check if furniture already exists - only allow one piece at a time
                      if (placedFurniture.length > 0) {
                        setShowOnePieceModal(true);
                        return;
                      }

                      if (type === "couch") {
                        // Open couch selection modal
                        setShowCouchModal(true);
                      } else if (type === "chair") {
                        // Open chair selection modal
                        setShowChairModal(true);
                      } else if (type === "art") {
                        // Open art selection modal
                        setShowArtModal(true);
                      } else if (type === "lamp") {
                        // Open lamp selection modal
                        setShowLampModal(true);
                      } else if (type === "desk") {
                        // Open desk selection modal
                        setShowDeskModal(true);
                      } else if (type === "table") {
                        // Open table selection modal
                        setShowTableModal(true);
                      } else if (type === "posters") {
                        // Open poster selection modal
                        setShowPosterModal(true);
                      } else {
                        setSelectedFurniture(
                          selectedFurniture === type ? null : type
                        );
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.furnitureButtonText}>
                      {type === "couch"
                        ? "Couch"
                        : type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {/* Custom scrollbar indicator below buttons */}
              <View style={styles.scrollbarContainer}>
                <View style={styles.scrollbarTrack}>
                  <View
                    style={[
                      styles.scrollbarThumb,
                      {
                        width: `${scrollbarWidth}%`,
                        left: `${scrollbarPosition}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Overlay UI - Hide when capturing */}
      {!isCapturing && (
        <View style={styles.overlay} pointerEvents="box-none">
          {/* Controls */}
          <View style={styles.controls} pointerEvents="box-none"></View>

          {/* Arrow Controls - Show when furniture is placed and selected - Outside controls container for proper positioning */}
          {selectedFurnitureId &&
            placedFurniture.length > 0 &&
            (() => {
              const selectedFurniture = placedFurniture.find(
                (f) => f.id === selectedFurnitureId
              );
              const furnitureType = selectedFurniture?.type || "Furniture";
              const furnitureTypeCapitalized =
                furnitureType.charAt(0).toUpperCase() + furnitureType.slice(1);
              return (
                <View style={styles.arrowControls} pointerEvents="auto">
                  <View style={styles.arrowControlsHeader}>
                    <TouchableOpacity
                      style={styles.exitButton}
                      onPress={() => setSelectedFurnitureId(null)}
                    >
                      <Ionicons
                        name="close"
                        size={24}
                        color={theme.colors.textInverse}
                      />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.arrowControlsContainer}>
                    {/* D-pad on the left */}
                    <View style={styles.dpadContainer}>
                      <View style={styles.dpadRow}>
                        <View style={styles.dpadSpacer} />
                        <TouchableOpacity
                          style={[styles.arrowButton, styles.arrowButtonUp]}
                          onPress={() => {
                            moveFurniture(selectedFurnitureId, "up");
                          }}
                        >
                          <Text style={styles.arrowText}>↑</Text>
                        </TouchableOpacity>
                        <View style={styles.dpadSpacer} />
                      </View>
                      <View style={styles.dpadRow}>
                        <TouchableOpacity
                          style={[styles.arrowButton, styles.arrowButtonLeft]}
                          onPress={() => {
                            moveFurniture(selectedFurnitureId, "left");
                          }}
                        >
                          <Text style={styles.arrowText}>←</Text>
                        </TouchableOpacity>
                        <View style={styles.dpadSpacer} />
                        <TouchableOpacity
                          style={[styles.arrowButton, styles.arrowButtonRight]}
                          onPress={() => {
                            moveFurniture(selectedFurnitureId, "right");
                          }}
                        >
                          <Text style={styles.arrowText}>→</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={styles.dpadRow}>
                        <View style={styles.dpadSpacer} />
                        <TouchableOpacity
                          style={[styles.arrowButton, styles.arrowButtonDown]}
                          onPress={() => {
                            moveFurniture(selectedFurnitureId, "down");
                          }}
                        >
                          <Text style={styles.arrowText}>↓</Text>
                        </TouchableOpacity>
                        <View style={styles.dpadSpacer} />
                      </View>
                    </View>
                    {/* Forward/Backward buttons on the right */}
                    <View style={styles.forwardBackContainer}>
                      <TouchableOpacity
                        style={[styles.forwardBackButton, styles.forwardButton]}
                        onPress={() => {
                          moveFurniture(selectedFurnitureId, "backward");
                        }}
                      >
                        <Text style={styles.forwardBackText}>Move forward</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.forwardBackButton,
                          styles.backwardButton,
                        ]}
                        onPress={() => {
                          moveFurniture(selectedFurnitureId, "forward");
                        }}
                      >
                        <Text style={styles.forwardBackText}>Move back</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Action Buttons - Remove and Done */}
                  <View style={styles.moveActionButtons}>
                    <SecondaryButton
                      title="Remove"
                      onPress={() => {
                        setShowDeleteModal(true);
                      }}
                      style={styles.buttonSmall}
                      textStyle={styles.buttonTextSmall}
                    />
                    <TouchableOpacity
                      style={[
                        styles.button,
                        styles.buttonSmall,
                        styles.secondaryButton,
                      ]}
                      onPress={() => setSelectedFurnitureId(null)}
                    >
                      <Text style={styles.buttonTextSmall}>Done</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })()}
        </View>
      )}

      {/* Bottom Action Icons - Footer at the very bottom - Hide when move controls are open */}
      {!isCapturing && !selectedFurnitureId && (
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={styles.iconButtonWithLabel}
            onPress={() => {
              // Show confirmation modal if:
              // - It's a new project, OR
              // - It's an existing project with furniture placed
              if (isExistingProject && placedFurniture.length === 0) {
                // Existing project with no furniture - allow direct navigation
                onBack();
              } else {
                // New project OR existing project with furniture - show confirmation
                setShowUnsavedChangesModal(true);
              }
            }}
          >
            <View style={styles.iconButtonCircle}>
              <Ionicons
                name="arrow-back"
                size={28}
                color={theme.colors.textInverse}
              />
            </View>
            <Text style={styles.iconLabel}>Back</Text>
          </TouchableOpacity>
          {placedFurniture.length > 0 && (
            <TouchableOpacity
              style={styles.iconButtonWithLabel}
              onPress={() => {
                // If furniture exists, go directly to editing (skip selection modal)
                if (placedFurniture.length > 0) {
                  setSelectedFurnitureId(placedFurniture[0].id);
                } else {
                  // No furniture, show selection modal
                  setShowEditModal(true);
                }
              }}
            >
              <View style={styles.iconButtonCircle}>
                <Ionicons
                  name="create"
                  size={28}
                  color={theme.colors.textInverse}
                />
              </View>
              <Text style={styles.iconLabel}>Edit</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.iconButtonWithLabel}
            onPress={captureScene}
          >
            <View style={styles.iconButtonCircle}>
              <Ionicons
                name="save"
                size={28}
                color={theme.colors.textInverse}
              />
            </View>
            <Text style={styles.iconLabel}>Capture</Text>
          </TouchableOpacity>
          {onViewGallery && !isExistingProject && (
            <TouchableOpacity
              style={styles.iconButtonWithLabel}
              onPress={onViewGallery}
            >
              <View style={styles.iconButtonCircle}>
                <Ionicons
                  name="images"
                  size={28}
                  color={theme.colors.textInverse}
                />
              </View>
              <Text style={styles.iconLabel}>Gallery</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Couch Selection Modal */}
      <Modal
        visible={showCouchModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCouchModal(false)}
      >
        <View style={styles.modalOverlay}>
          {/* Furniture Info Overlay - Rendered inside couch modal to appear on top */}
          {infoModalVisible && (
            <View style={styles.infoModalOverlayAbsolute}>
              <TouchableOpacity
                style={StyleSheet.absoluteFill}
                activeOpacity={1}
                onPress={() => setInfoModalVisible(false)}
              />
              <View style={styles.infoModalContent} pointerEvents="auto">
                <View style={styles.infoModalHeader}>
                  <Text style={styles.infoModalTitle}>
                    {infoModalItem?.type === "couch"
                      ? "Information"
                      : `${infoModalItem?.type
                          ?.charAt(0)
                          .toUpperCase()}${infoModalItem?.type?.slice(
                          1
                        )} Information`}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setInfoModalVisible(false)}
                    style={styles.infoModalCloseButton}
                  >
                    <Ionicons
                      name="close"
                      size={20}
                      color={theme.colors.textInverse}
                    />
                  </TouchableOpacity>
                </View>
                <View style={styles.infoModalBody}>
                  {infoModalItem?.variant &&
                  furnitureInfoMap[infoModalItem.variant] ? (
                    <>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Price:</Text>
                        <Text style={styles.infoValue}>
                          {furnitureInfoMap[infoModalItem.variant].price}
                        </Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Description:</Text>
                        <Text style={styles.infoDescription}>
                          {furnitureInfoMap[infoModalItem.variant].description}
                        </Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Link:</Text>
                        <TouchableOpacity
                          onPress={() => {
                            Linking.openURL(
                              furnitureInfoMap[infoModalItem.variant!].link
                            ).catch((err) =>
                              Alert.alert("Error", "Could not open link")
                            );
                          }}
                        >
                          <Text style={styles.infoLink}>
                            {furnitureInfoMap[infoModalItem.variant].link}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : (
                    <Text style={styles.infoModalText}>
                      Information not available
                    </Text>
                  )}
                </View>
              </View>
            </View>
          )}
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selection</Text>
              <TouchableOpacity
                onPress={() => setShowCouchModal(false)}
                style={styles.modalCloseButtonEdit}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={theme.colors.textInverse}
                />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.couchScrollView}
              contentContainerStyle={styles.couchScrollContent}
            >
              {couchVariants.map((variant, index) => {
                const variantNumber = index + 1;
                return (
                  <View key={variant} style={styles.couchOption}>
                    <View
                      style={[
                        styles.couchPurpleSquare,
                        selectedCouchVariant === variant &&
                          styles.couchPurpleSquareSelected,
                      ]}
                    >
                      <TouchableOpacity
                        style={styles.couchImageTouchable}
                        onPress={() => {
                          setSelectedCouchVariant(variant);
                          setSelectedFurniture("couch");
                          setShowCouchModal(false);
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={styles.couchImageContainer}>
                          <Image
                            source={couchImageMap[variant]}
                            style={styles.couchPreviewImage}
                            resizeMode="contain"
                          />
                        </View>
                      </TouchableOpacity>
                    </View>
                    {/* Info icon button - positioned outside the touchable area */}
                    <TouchableOpacity
                      style={styles.couchInfoButton}
                      onPress={() => {
                        console.log("Info button pressed for:", variant);
                        console.log("Setting infoModalItem:", {
                          type: "couch",
                          variant,
                        });
                        setInfoModalItem({ type: "couch", variant });
                        console.log("Setting infoModalVisible to true");
                        setInfoModalVisible(true);
                        console.log("Info modal should now be visible");
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="information-circle"
                        size={20}
                        color={theme.colors.textInverse}
                      />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Chair Selection Modal */}
      <Modal
        visible={showChairModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowChairModal(false)}
      >
        <View style={styles.modalOverlay}>
          {/* Furniture Info Overlay - Rendered inside chair modal to appear on top */}
          {infoModalVisible && (
            <View style={styles.infoModalOverlayAbsolute}>
              <TouchableOpacity
                style={StyleSheet.absoluteFill}
                activeOpacity={1}
                onPress={() => setInfoModalVisible(false)}
              />
              <View style={styles.infoModalContent} pointerEvents="auto">
                <View style={styles.infoModalHeader}>
                  <Text style={styles.infoModalTitle}>
                    {infoModalItem?.type === "chair"
                      ? "Information"
                      : `${infoModalItem?.type
                          ?.charAt(0)
                          .toUpperCase()}${infoModalItem?.type?.slice(
                          1
                        )} Information`}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setInfoModalVisible(false)}
                    style={styles.infoModalCloseButton}
                  >
                    <Ionicons
                      name="close"
                      size={20}
                      color={theme.colors.textInverse}
                    />
                  </TouchableOpacity>
                </View>
                <View style={styles.infoModalBody}>
                  {infoModalItem?.variant &&
                  furnitureInfoMap[infoModalItem.variant] ? (
                    <>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Price:</Text>
                        <Text style={styles.infoValue}>
                          {furnitureInfoMap[infoModalItem.variant].price}
                        </Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Description:</Text>
                        <Text style={styles.infoDescription}>
                          {furnitureInfoMap[infoModalItem.variant].description}
                        </Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Link:</Text>
                        <TouchableOpacity
                          onPress={() => {
                            Linking.openURL(
                              furnitureInfoMap[infoModalItem.variant!].link
                            ).catch((err) =>
                              Alert.alert("Error", "Could not open link")
                            );
                          }}
                        >
                          <Text style={styles.infoLink}>
                            {furnitureInfoMap[infoModalItem.variant].link}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : (
                    <Text style={styles.infoModalText}>
                      Information not available
                    </Text>
                  )}
                </View>
              </View>
            </View>
          )}
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selection</Text>
              <TouchableOpacity
                onPress={() => setShowChairModal(false)}
                style={styles.modalCloseButtonEdit}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={theme.colors.textInverse}
                />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.couchScrollView}
              contentContainerStyle={styles.couchScrollContent}
            >
              {chairVariants.map((variant, index) => {
                const variantNumber = index + 1;
                return (
                  <View key={variant} style={styles.couchOption}>
                    <View
                      style={[
                        styles.couchPurpleSquare,
                        selectedChairVariant === variant &&
                          styles.couchPurpleSquareSelected,
                      ]}
                    >
                      <TouchableOpacity
                        style={styles.couchImageTouchable}
                        onPress={() => {
                          setSelectedChairVariant(variant);
                          setSelectedFurniture("chair");
                          setShowChairModal(false);
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={styles.couchImageContainer}>
                          <Image
                            source={chairImageMap[variant]}
                            style={styles.couchPreviewImage}
                            resizeMode="contain"
                          />
                        </View>
                      </TouchableOpacity>
                    </View>
                    {/* Info icon button - positioned outside the touchable area */}
                    <TouchableOpacity
                      style={styles.couchInfoButton}
                      onPress={() => {
                        console.log("Info button pressed for:", variant);
                        setInfoModalItem({ type: "chair", variant });
                        setInfoModalVisible(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="information-circle"
                        size={20}
                        color={theme.colors.textInverse}
                      />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Art Selection Modal */}
      <Modal
        visible={showArtModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowArtModal(false)}
      >
        <View style={styles.modalOverlay}>
          {/* Furniture Info Overlay - Rendered inside art modal to appear on top */}
          {infoModalVisible && (
            <View style={styles.infoModalOverlayAbsolute}>
              <TouchableOpacity
                style={StyleSheet.absoluteFill}
                activeOpacity={1}
                onPress={() => setInfoModalVisible(false)}
              />
              <View style={styles.infoModalContent} pointerEvents="auto">
                <View style={styles.infoModalHeader}>
                  <Text style={styles.infoModalTitle}>
                    {infoModalItem?.type === "art"
                      ? "Information"
                      : `${infoModalItem?.type
                          ?.charAt(0)
                          .toUpperCase()}${infoModalItem?.type?.slice(
                          1
                        )} Information`}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setInfoModalVisible(false)}
                    style={styles.infoModalCloseButton}
                  >
                    <Ionicons
                      name="close"
                      size={20}
                      color={theme.colors.textInverse}
                    />
                  </TouchableOpacity>
                </View>
                <View style={styles.infoModalBody}>
                  {infoModalItem?.variant &&
                  furnitureInfoMap[infoModalItem.variant] ? (
                    <>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Price:</Text>
                        <Text style={styles.infoValue}>
                          {furnitureInfoMap[infoModalItem.variant].price}
                        </Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Description:</Text>
                        <Text style={styles.infoDescription}>
                          {furnitureInfoMap[infoModalItem.variant].description}
                        </Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Link:</Text>
                        <TouchableOpacity
                          onPress={() => {
                            Linking.openURL(
                              furnitureInfoMap[infoModalItem.variant!].link
                            ).catch((err) =>
                              Alert.alert("Error", "Could not open link")
                            );
                          }}
                        >
                          <Text style={styles.infoLink}>
                            {furnitureInfoMap[infoModalItem.variant].link}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : (
                    <Text style={styles.infoModalText}>
                      Information not available
                    </Text>
                  )}
                </View>
              </View>
            </View>
          )}
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selection</Text>
              <TouchableOpacity
                onPress={() => setShowArtModal(false)}
                style={styles.modalCloseButtonEdit}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={theme.colors.textInverse}
                />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.couchScrollView}
              contentContainerStyle={styles.couchScrollContent}
            >
              {artVariants.map((variant, index) => {
                const variantNumber = index + 1;
                return (
                  <View key={variant} style={styles.couchOption}>
                    <View
                      style={[
                        styles.couchPurpleSquare,
                        selectedArtVariant === variant &&
                          styles.couchPurpleSquareSelected,
                      ]}
                    >
                      <TouchableOpacity
                        style={styles.couchImageTouchable}
                        onPress={() => {
                          setSelectedArtVariant(variant);
                          setSelectedFurniture("art");
                          setShowArtModal(false);
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={styles.couchImageContainer}>
                          <Image
                            source={artImageMap[variant]}
                            style={styles.couchPreviewImage}
                            resizeMode="contain"
                          />
                        </View>
                      </TouchableOpacity>
                    </View>
                    {/* Info icon button - positioned outside the touchable area */}
                    <TouchableOpacity
                      style={styles.couchInfoButton}
                      onPress={() => {
                        console.log("Info button pressed for:", variant);
                        setInfoModalItem({ type: "art", variant });
                        setInfoModalVisible(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="information-circle"
                        size={20}
                        color={theme.colors.textInverse}
                      />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Lamp Selection Modal */}
      <Modal
        visible={showLampModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLampModal(false)}
      >
        <View style={styles.modalOverlay}>
          {/* Furniture Info Overlay - Rendered inside lamp modal to appear on top */}
          {infoModalVisible && (
            <View style={styles.infoModalOverlayAbsolute}>
              <TouchableOpacity
                style={StyleSheet.absoluteFill}
                activeOpacity={1}
                onPress={() => setInfoModalVisible(false)}
              />
              <View style={styles.infoModalContent} pointerEvents="auto">
                <View style={styles.infoModalHeader}>
                  <Text style={styles.infoModalTitle}>
                    {infoModalItem?.type === "lamp"
                      ? "Information"
                      : `${infoModalItem?.type
                          ?.charAt(0)
                          .toUpperCase()}${infoModalItem?.type?.slice(
                          1
                        )} Information`}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setInfoModalVisible(false)}
                    style={styles.infoModalCloseButton}
                  >
                    <Ionicons
                      name="close"
                      size={20}
                      color={theme.colors.textInverse}
                    />
                  </TouchableOpacity>
                </View>
                <View style={styles.infoModalBody}>
                  {infoModalItem?.variant &&
                  furnitureInfoMap[infoModalItem.variant] ? (
                    <>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Price:</Text>
                        <Text style={styles.infoValue}>
                          {furnitureInfoMap[infoModalItem.variant].price}
                        </Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Description:</Text>
                        <Text style={styles.infoDescription}>
                          {furnitureInfoMap[infoModalItem.variant].description}
                        </Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Link:</Text>
                        <TouchableOpacity
                          onPress={() => {
                            Linking.openURL(
                              furnitureInfoMap[infoModalItem.variant!].link
                            ).catch((err) =>
                              Alert.alert("Error", "Could not open link")
                            );
                          }}
                        >
                          <Text style={styles.infoLink}>
                            {furnitureInfoMap[infoModalItem.variant].link}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : (
                    <Text style={styles.infoModalText}>
                      Information not available
                    </Text>
                  )}
                </View>
              </View>
            </View>
          )}
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selection</Text>
              <TouchableOpacity
                onPress={() => setShowLampModal(false)}
                style={styles.modalCloseButtonEdit}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={theme.colors.textInverse}
                />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.couchScrollView}
              contentContainerStyle={styles.couchScrollContent}
            >
              {lampVariants.map((variant, index) => {
                const variantNumber = index + 1;
                return (
                  <View key={variant} style={styles.couchOption}>
                    <View
                      style={[
                        styles.couchPurpleSquare,
                        selectedLampVariant === variant &&
                          styles.couchPurpleSquareSelected,
                      ]}
                    >
                      <TouchableOpacity
                        style={styles.couchImageTouchable}
                        onPress={() => {
                          setSelectedLampVariant(variant);
                          setSelectedFurniture("lamp");
                          setShowLampModal(false);
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={styles.couchImageContainer}>
                          <Image
                            source={lampImageMap[variant]}
                            style={styles.couchPreviewImage}
                            resizeMode="contain"
                          />
                        </View>
                      </TouchableOpacity>
                    </View>
                    {/* Info icon button - positioned outside the touchable area */}
                    <TouchableOpacity
                      style={styles.couchInfoButton}
                      onPress={() => {
                        console.log("Info button pressed for:", variant);
                        setInfoModalItem({ type: "lamp", variant });
                        setInfoModalVisible(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="information-circle"
                        size={20}
                        color={theme.colors.textInverse}
                      />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Desk Selection Modal */}
      <Modal
        visible={showDeskModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDeskModal(false)}
      >
        <View style={styles.modalOverlay}>
          {/* Furniture Info Overlay - Rendered inside desk modal to appear on top */}
          {infoModalVisible && (
            <View style={styles.infoModalOverlayAbsolute}>
              <TouchableOpacity
                style={StyleSheet.absoluteFill}
                activeOpacity={1}
                onPress={() => setInfoModalVisible(false)}
              />
              <View style={styles.infoModalContent} pointerEvents="auto">
                <View style={styles.infoModalHeader}>
                  <Text style={styles.infoModalTitle}>
                    {infoModalItem?.type === "desk"
                      ? "Information"
                      : `${infoModalItem?.type
                          ?.charAt(0)
                          .toUpperCase()}${infoModalItem?.type?.slice(
                          1
                        )} Information`}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setInfoModalVisible(false)}
                    style={styles.infoModalCloseButton}
                  >
                    <Ionicons
                      name="close"
                      size={20}
                      color={theme.colors.textInverse}
                    />
                  </TouchableOpacity>
                </View>
                <View style={styles.infoModalBody}>
                  {infoModalItem?.variant &&
                  furnitureInfoMap[infoModalItem.variant] ? (
                    <>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Price:</Text>
                        <Text style={styles.infoValue}>
                          {furnitureInfoMap[infoModalItem.variant].price}
                        </Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Description:</Text>
                        <Text style={styles.infoDescription}>
                          {furnitureInfoMap[infoModalItem.variant].description}
                        </Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Link:</Text>
                        <TouchableOpacity
                          onPress={() => {
                            Linking.openURL(
                              furnitureInfoMap[infoModalItem.variant!].link
                            ).catch((err) =>
                              Alert.alert("Error", "Could not open link")
                            );
                          }}
                        >
                          <Text style={styles.infoLink}>
                            {furnitureInfoMap[infoModalItem.variant].link}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : (
                    <Text style={styles.infoModalText}>
                      Information not available
                    </Text>
                  )}
                </View>
              </View>
            </View>
          )}
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selection</Text>
              <TouchableOpacity
                onPress={() => setShowDeskModal(false)}
                style={styles.modalCloseButtonEdit}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={theme.colors.textInverse}
                />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.couchScrollView}
              contentContainerStyle={styles.couchScrollContent}
            >
              {deskVariants.map((variant, index) => {
                const variantNumber = index + 1;
                return (
                  <View key={variant} style={styles.couchOption}>
                    <View
                      style={[
                        styles.couchPurpleSquare,
                        selectedDeskVariant === variant &&
                          styles.couchPurpleSquareSelected,
                      ]}
                    >
                      <TouchableOpacity
                        style={styles.couchImageTouchable}
                        onPress={() => {
                          setSelectedDeskVariant(variant);
                          setSelectedFurniture("desk");
                          setShowDeskModal(false);
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={styles.couchImageContainer}>
                          <Image
                            source={deskImageMap[variant]}
                            style={styles.couchPreviewImage}
                            resizeMode="contain"
                          />
                        </View>
                      </TouchableOpacity>
                    </View>
                    {/* Info icon button - positioned outside the touchable area */}
                    <TouchableOpacity
                      style={styles.couchInfoButton}
                      onPress={() => {
                        console.log("Info button pressed for:", variant);
                        setInfoModalItem({ type: "desk", variant });
                        setInfoModalVisible(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="information-circle"
                        size={20}
                        color={theme.colors.textInverse}
                      />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Table Selection Modal */}
      <Modal
        visible={showTableModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTableModal(false)}
      >
        <View style={styles.modalOverlay}>
          {/* Furniture Info Overlay - Rendered inside table modal to appear on top */}
          {infoModalVisible && (
            <View style={styles.infoModalOverlayAbsolute}>
              <TouchableOpacity
                style={StyleSheet.absoluteFill}
                activeOpacity={1}
                onPress={() => setInfoModalVisible(false)}
              />
              <View style={styles.infoModalContent} pointerEvents="auto">
                <View style={styles.infoModalHeader}>
                  <Text style={styles.infoModalTitle}>
                    {infoModalItem?.type === "table"
                      ? "Information"
                      : `${infoModalItem?.type
                          ?.charAt(0)
                          .toUpperCase()}${infoModalItem?.type?.slice(
                          1
                        )} Information`}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setInfoModalVisible(false)}
                    style={styles.infoModalCloseButton}
                  >
                    <Ionicons
                      name="close"
                      size={20}
                      color={theme.colors.textInverse}
                    />
                  </TouchableOpacity>
                </View>
                <View style={styles.infoModalBody}>
                  {infoModalItem?.variant &&
                  furnitureInfoMap[infoModalItem.variant] ? (
                    <>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Price:</Text>
                        <Text style={styles.infoValue}>
                          {furnitureInfoMap[infoModalItem.variant].price}
                        </Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Description:</Text>
                        <Text style={styles.infoDescription}>
                          {furnitureInfoMap[infoModalItem.variant].description}
                        </Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Link:</Text>
                        <TouchableOpacity
                          onPress={() => {
                            Linking.openURL(
                              furnitureInfoMap[infoModalItem.variant!].link
                            ).catch((err) =>
                              Alert.alert("Error", "Could not open link")
                            );
                          }}
                        >
                          <Text style={styles.infoLink}>
                            {furnitureInfoMap[infoModalItem.variant].link}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : (
                    <Text style={styles.infoModalText}>
                      Information not available
                    </Text>
                  )}
                </View>
              </View>
            </View>
          )}
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selection</Text>
              <TouchableOpacity
                onPress={() => setShowTableModal(false)}
                style={styles.modalCloseButtonEdit}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={theme.colors.textInverse}
                />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.couchScrollView}
              contentContainerStyle={styles.couchScrollContent}
            >
              {tableVariants.map((variant, index) => {
                const variantNumber = index + 1;
                return (
                  <View key={variant} style={styles.couchOption}>
                    <View
                      style={[
                        styles.couchPurpleSquare,
                        selectedTableVariant === variant &&
                          styles.couchPurpleSquareSelected,
                      ]}
                    >
                      <TouchableOpacity
                        style={styles.couchImageTouchable}
                        onPress={() => {
                          setSelectedTableVariant(variant);
                          setSelectedFurniture("table");
                          setShowTableModal(false);
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={styles.couchImageContainer}>
                          <Image
                            source={tableImageMap[variant]}
                            style={styles.couchPreviewImage}
                            resizeMode="contain"
                          />
                        </View>
                      </TouchableOpacity>
                    </View>
                    {/* Info icon button - positioned outside the touchable area */}
                    <TouchableOpacity
                      style={styles.couchInfoButton}
                      onPress={() => {
                        console.log("Info button pressed for:", variant);
                        setInfoModalItem({ type: "table", variant });
                        setInfoModalVisible(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="information-circle"
                        size={20}
                        color={theme.colors.textInverse}
                      />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Poster Selection Modal */}
      <Modal
        visible={showPosterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPosterModal(false)}
      >
        <View style={styles.modalOverlay}>
          {/* Furniture Info Overlay - Rendered inside poster modal to appear on top */}
          {infoModalVisible && (
            <View style={styles.infoModalOverlayAbsolute}>
              <TouchableOpacity
                style={StyleSheet.absoluteFill}
                activeOpacity={1}
                onPress={() => setInfoModalVisible(false)}
              />
              <View style={styles.infoModalContent} pointerEvents="auto">
                <View style={styles.infoModalHeader}>
                  <Text style={styles.infoModalTitle}>
                    {infoModalItem?.type === "posters"
                      ? "Information"
                      : `${infoModalItem?.type
                          ?.charAt(0)
                          .toUpperCase()}${infoModalItem?.type?.slice(
                          1
                        )} Information`}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setInfoModalVisible(false)}
                    style={styles.infoModalCloseButton}
                  >
                    <Ionicons
                      name="close"
                      size={20}
                      color={theme.colors.textInverse}
                    />
                  </TouchableOpacity>
                </View>
                <View style={styles.infoModalBody}>
                  {infoModalItem?.variant &&
                  furnitureInfoMap[infoModalItem.variant] ? (
                    <>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Price:</Text>
                        <Text style={styles.infoValue}>
                          {furnitureInfoMap[infoModalItem.variant].price}
                        </Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Description:</Text>
                        <Text style={styles.infoDescription}>
                          {furnitureInfoMap[infoModalItem.variant].description}
                        </Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Link:</Text>
                        <TouchableOpacity
                          onPress={() => {
                            Linking.openURL(
                              furnitureInfoMap[infoModalItem.variant!].link
                            ).catch((err) =>
                              Alert.alert("Error", "Could not open link")
                            );
                          }}
                        >
                          <Text style={styles.infoLink}>
                            {furnitureInfoMap[infoModalItem.variant].link}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : (
                    <Text style={styles.infoModalText}>
                      Information not available
                    </Text>
                  )}
                </View>
              </View>
            </View>
          )}
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selection</Text>
              <TouchableOpacity
                onPress={() => setShowPosterModal(false)}
                style={styles.modalCloseButtonEdit}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={theme.colors.textInverse}
                />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.couchScrollView}
              contentContainerStyle={styles.couchScrollContent}
            >
              {posterVariants.map((variant, index) => {
                const variantNumber = index + 1;
                return (
                  <View key={variant} style={styles.couchOption}>
                    <View
                      style={[
                        styles.couchPurpleSquare,
                        selectedPosterVariant === variant &&
                          styles.couchPurpleSquareSelected,
                      ]}
                    >
                      <TouchableOpacity
                        style={styles.couchImageTouchable}
                        onPress={() => {
                          setSelectedPosterVariant(variant);
                          setSelectedFurniture("posters");
                          setShowPosterModal(false);
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={styles.couchImageContainer}>
                          <Image
                            source={posterImageMap[variant]}
                            style={styles.couchPreviewImage}
                            resizeMode="contain"
                          />
                        </View>
                      </TouchableOpacity>
                    </View>
                    {/* Info icon button - positioned outside the touchable area */}
                    <TouchableOpacity
                      style={styles.couchInfoButton}
                      onPress={() => {
                        console.log("Info button pressed for:", variant);
                        setInfoModalItem({ type: "posters", variant });
                        setInfoModalVisible(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="information-circle"
                        size={20}
                        color={theme.colors.textInverse}
                      />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Furniture Selection Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Furniture to Edit</Text>
              <TouchableOpacity
                onPress={() => setShowEditModal(false)}
                style={styles.modalCloseButtonEdit}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={theme.colors.textInverse}
                />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.editModalScrollView}
              contentContainerStyle={styles.editModalScrollContent}
            >
              {placedFurniture.length === 0 ? (
                <Text style={styles.editFurnitureText}>
                  No furniture placed yet
                </Text>
              ) : (
                placedFurniture.map((furniture, index) => (
                  <TouchableOpacity
                    key={furniture.id}
                    style={[
                      styles.editFurnitureOption,
                      selectedFurnitureId === furniture.id &&
                        styles.editFurnitureOptionSelected,
                    ]}
                    onPress={() => {
                      setSelectedFurnitureId(furniture.id);
                      setShowEditModal(false);
                    }}
                  >
                    <Text style={styles.editFurnitureText}>
                      {index + 1}.{" "}
                      {furniture.type.charAt(0).toUpperCase() +
                        furniture.type.slice(1)}
                    </Text>
                    {selectedFurnitureId === furniture.id && (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color={theme.colors.textInverse}
                      />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Unsaved Changes Confirmation Modal */}
      <Modal
        visible={showUnsavedChangesModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowUnsavedChangesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Leave Project?</Text>
            <Text
              style={[styles.modalSubtitle, { marginTop: theme.spacing.lg }]}
            >
              {!isExistingProject
                ? "Your project has unsaved changes. If you leave now, all changes will be lost and cannot be recovered."
                : placedFurniture.length > 0
                ? "Your project has unsaved changes. If you leave now, all changes will be lost and cannot be recovered."
                : "Are you sure you want to leave this project?"}
            </Text>
            <View
              style={[
                styles.modalButtons,
                {
                  flexDirection: "row",
                  gap: theme.spacing.md,
                  marginTop: theme.spacing.lg,
                },
              ]}
            >
              <TouchableOpacity
                style={[styles.modalSecondaryButton, { flex: 1 }]}
                onPress={() => setShowUnsavedChangesModal(false)}
              >
                <Text style={styles.modalSecondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalSecondaryButton,
                  { backgroundColor: theme.colors.error, flex: 1 },
                ]}
                onPress={handleBack}
              >
                <Text style={styles.modalSecondaryButtonText}>Exit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Capture Confirmation Modal */}
      <Modal
        visible={showCaptureModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCaptureModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Scene Captured</Text>
              <TouchableOpacity
                style={styles.modalCloseButtonEdit}
                onPress={() => setShowCaptureModal(false)}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={theme.colors.textInverse}
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.captureConfirmationText}>
              Your AR scene has been saved successfully!
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.goToGalleryButton}
                onPress={() => {
                  setShowCaptureModal(false);
                  if (isExistingProject) {
                    // Return to project for existing projects
                    if (onBack) {
                      onBack();
                    }
                  } else {
                    // Go to gallery for new projects
                    if (onViewGallery) {
                      onViewGallery();
                    }
                  }
                }}
              >
                <Text style={styles.goToGalleryButtonText}>
                  {isExistingProject ? "Return to Project" : "Go to Gallery"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmRemoveFurniture}
        title="Remove Furniture"
        message="Are you sure you want to remove this furniture from your scene?"
        confirmText="Remove"
        cancelText="Cancel"
      />

      {/* Flash Animation Overlay */}
      {showFlash && (
        <Animated.View
          style={[
            styles.flashOverlay,
            {
              opacity: flashOpacity,
            },
          ]}
        />
      )}

      {/* Snapshot Overlay for Scene Updates - Shows captured image during rerender */}
      {isUpdatingScene && snapshotUri && (
        <Animated.View
          style={[
            styles.snapshotOverlay,
            {
              opacity: fadeOverlayOpacity,
            },
          ]}
        >
          <Image
            source={{ uri: snapshotUri }}
            style={styles.snapshotImage}
            resizeMode="cover"
          />
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={theme.colors.purple} />
          </View>
        </Animated.View>
      )}

      {/* One Piece Only Modal */}
      <Modal
        visible={showOnePieceModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowOnePieceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.onePieceModalContent}>
            <Text style={styles.onePieceModalText}>
              Only one piece of furniture at a time. Please remove the existing
              piece to place another.
            </Text>
            <SecondaryButton
              title="OK"
              onPress={() => setShowOnePieceModal(false)}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  arSceneContainer: {
    flex: 1,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  arScene: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  tapOverlay: {
    position: "absolute",
    top: 150, // Start below header (60px safe area + ~90px header height)
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    zIndex: 5, // Above AR scene, below UI controls
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "box-none", // Allows taps to pass through to children
  },
  statusBar: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: theme.spacing.md,
    paddingTop: 60,
    alignItems: "center",
  },
  statusText: {
    color: theme.colors.textInverse,
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    paddingTop: 60, // Safe area for status bar
    paddingBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    zIndex: 100, // Higher z-index to ensure it's above everything
    alignItems: "center",
  },
  headerContent: {
    width: "100%",
    alignItems: "center",
  },
  furnitureSelector: {
    position: "absolute",
    top: 120,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    padding: theme.spacing.md,
  },
  selectorTitle: {
    color: theme.colors.textInverse,
    fontSize: 22,
    fontWeight: "600",
    marginBottom: theme.spacing.sm,
    textAlign: "center",
  },
  furnitureScroll: {
    flexDirection: "row",
    width: "100%",
  },
  furnitureScrollContent: {
    alignItems: "center",
    paddingHorizontal: theme.spacing.sm,
  },
  furnitureScrollContainer: {
    width: "100%",
  },
  scrollbarContainer: {
    width: "100%",
    height: 4,
    marginTop: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  scrollbarTrack: {
    width: "100%",
    height: 4,
    backgroundColor: "rgba(139, 92, 246, 0.2)", // Purple with transparency
    borderRadius: 2,
    overflow: "hidden",
    position: "relative",
  },
  scrollbarThumb: {
    position: "absolute",
    height: "100%",
    backgroundColor: theme.colors.purple,
    borderRadius: 2,
    minWidth: 20, // Minimum width for visibility
  },
  furnitureButton: {
    backgroundColor: theme.colors.purple,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginRight: theme.spacing.sm,
    minWidth: 80,
    alignItems: "center",
  },
  furnitureButtonSelected: {
    backgroundColor: theme.colors.purple,
    opacity: 0.8,
  },
  furnitureButtonText: {
    color: theme.colors.textInverse,
    fontSize: 14,
    fontWeight: "600",
  },
  controls: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  button: {
    backgroundColor: theme.colors.purple,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    minWidth: 150,
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  primaryButton: {
    backgroundColor: theme.colors.purple,
  },
  secondaryButton: {
    backgroundColor: theme.colors.purple,
  },
  buttonText: {
    color: theme.colors.textInverse,
    fontSize: 16,
    fontWeight: "600",
  },
  furnitureCount: {
    color: theme.colors.textInverse,
    fontSize: 14,
    marginBottom: theme.spacing.sm,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  arrowControls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingVertical: theme.spacing.md,
    paddingBottom: theme.spacing.md + 10, // Safe area for bottom (matches bottomActions)
    paddingHorizontal: theme.spacing.lg,
    borderRadius: 0, // Remove border radius to extend to edges
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    pointerEvents: "auto", // Ensure touch events work
  },
  arrowControlsHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    width: "100%",
    marginBottom: theme.spacing.sm,
  },
  arrowLabel: {
    color: theme.colors.textInverse,
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
  },
  exitButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.purple,
    justifyContent: "center",
    alignItems: "center",
  },
  arrowControlsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  moveActionButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: theme.spacing.md,
    gap: theme.spacing.md,
  },
  dpadContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  dpadRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  dpadSpacer: {
    width: 50,
    height: 50,
  },
  forwardBackContainer: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  forwardBackButton: {
    backgroundColor: theme.colors.purple,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: 130,
    gap: theme.spacing.xs,
    zIndex: 10, // Ensure buttons are on top
  },
  forwardButton: {
    backgroundColor: theme.colors.purple,
  },
  backwardButton: {
    backgroundColor: theme.colors.purple,
  },
  forwardBackText: {
    color: theme.colors.textInverse,
    fontSize: 14,
    fontWeight: "600",
  },
  arrowRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  arrowButton: {
    backgroundColor: theme.colors.purple,
    width: 50,
    height: 50,
    borderRadius: theme.borderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: theme.spacing.xs,
    zIndex: 10, // Ensure buttons are on top
  },
  arrowButtonUp: {
    backgroundColor: theme.colors.purple,
  },
  arrowButtonDown: {
    backgroundColor: theme.colors.purple,
  },
  arrowButtonLeft: {
    backgroundColor: theme.colors.purple,
  },
  arrowButtonRight: {
    backgroundColor: theme.colors.purple,
  },
  arrowButtonSecondary: {
    backgroundColor: theme.colors.secondary,
  },
  arrowText: {
    color: theme.colors.textInverse,
    fontSize: 24,
    fontWeight: "bold",
  },
  editSelector: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  actionButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  mainButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  buttonSmall: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minWidth: 80,
  },
  buttonFlex: {
    flex: 1,
  },
  buttonTextSmall: {
    color: theme.colors.textInverse,
    fontSize: 14,
    fontWeight: "600",
  },
  bottomActions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    paddingVertical: theme.spacing.md,
    paddingBottom: theme.spacing.md + 10, // Safe area for bottom
    paddingHorizontal: theme.spacing.lg,
    zIndex: 100, // Ensure it's on top
  },
  iconButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.purple,
    justifyContent: "center",
    alignItems: "center",
  },
  iconButtonWithLabel: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 60,
  },
  iconButtonCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.purple,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  iconLabel: {
    color: theme.colors.textInverse,
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
  flashOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#FFFFFF",
    zIndex: 1000,
    pointerEvents: "none",
  },
  fadeOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000000",
    zIndex: 999,
    pointerEvents: "none",
  },
  snapshotOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 998,
    pointerEvents: "none",
  },
  snapshotImage: {
    width: "100%",
    height: "100%",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 150, // Move modal down slightly from previous position
  },
  modalContent: {
    width: "85%",
    maxHeight: "70%",
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.2)",
  },
  modalSubtitle: {
    color: theme.colors.textInverse,
    fontSize: 16,
    marginBottom: theme.spacing.lg,
    textAlign: "center",
    opacity: 0.9,
  },
  inputContainer: {
    marginBottom: theme.spacing.md,
    width: "100%",
  },
  firstInputContainer: {
    marginTop: theme.spacing.sm, // Add margin between title and first input
  },
  inputLabel: {
    color: theme.colors.textInverse,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: theme.spacing.xs,
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    color: theme.colors.textInverse,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  modalTitle: {
    color: theme.colors.textInverse,
    fontSize: 20,
    fontWeight: "bold",
  },
  modalCloseButton: {
    padding: theme.spacing.xs,
  },
  modalCloseButtonEdit: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.purple,
    justifyContent: "center",
    alignItems: "center",
  },
  couchScrollView: {
    maxHeight: 400,
  },
  couchScrollContent: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
  },
  couchOption: {
    width: "45%",
    marginBottom: theme.spacing.md,
    alignItems: "center",
    position: "relative",
  },
  couchOptionSelected: {
    backgroundColor: theme.colors.primary,
    borderWidth: 2,
    borderColor: theme.colors.textInverse,
  },
  couchPurpleSquare: {
    width: "100%",
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.purple,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  couchPurpleSquareSelected: {
    borderWidth: 2,
    borderColor: theme.colors.textInverse,
  },
  couchInfoButton: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.purple,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    elevation: 10, // For Android
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  couchImageTouchable: {
    width: "100%",
    flex: 1,
  },
  couchImageContainer: {
    width: "100%",
    height: 120,
    borderRadius: theme.borderRadius.sm,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  couchPreviewImage: {
    width: "100%",
    height: "100%",
  },
  couchOptionText: {
    color: theme.colors.textInverse,
    fontSize: 14,
    fontWeight: "600",
  },
  editModalScrollView: {
    maxHeight: 400,
  },
  editModalScrollContent: {
    paddingVertical: theme.spacing.sm,
  },
  editFurnitureOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.purple,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  editFurnitureOptionSelected: {
    backgroundColor: theme.colors.purple,
    borderColor: theme.colors.textInverse,
    borderWidth: 2,
    opacity: 0.9,
  },
  editFurnitureText: {
    color: theme.colors.textInverse,
    fontSize: 16,
    fontWeight: "600",
  },
  infoModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10000,
    elevation: 10000, // For Android - ensure it's on top
  },
  infoModalOverlayAbsolute: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10000,
    elevation: 10000, // For Android - ensure it's on top
  },
  infoModalContent: {
    width: "80%",
    maxWidth: 400,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.purple,
    zIndex: 10001,
    elevation: 10001, // For Android - ensure it's on top
  },
  infoModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.2)",
  },
  infoModalTitle: {
    color: theme.colors.textInverse,
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
  },
  infoModalCloseButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.purple,
    justifyContent: "center",
    alignItems: "center",
  },
  infoModalBody: {
    paddingVertical: theme.spacing.sm,
  },
  infoModalText: {
    color: theme.colors.textInverse,
    fontSize: 14,
    lineHeight: 20,
  },
  infoRow: {
    marginBottom: theme.spacing.md,
  },
  infoLabel: {
    color: theme.colors.purple,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: theme.spacing.xs,
  },
  infoValue: {
    color: theme.colors.textInverse,
    fontSize: 18,
    fontWeight: "bold",
  },
  infoDescription: {
    color: theme.colors.textInverse,
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.9,
  },
  infoLink: {
    color: theme.colors.purple,
    fontSize: 14,
    textDecorationLine: "underline",
  },
  captureConfirmationText: {
    color: theme.colors.textInverse,
    fontSize: 16,
    marginBottom: theme.spacing.lg,
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: theme.spacing.md,
  },
  goToGalleryButton: {
    backgroundColor: theme.colors.purple,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    minWidth: 150,
    alignItems: "center",
    justifyContent: "center",
  },
  goToGalleryButtonText: {
    color: theme.colors.textInverse,
    fontSize: 16,
    fontWeight: "600",
  },
  tapToPlaceContainer: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 200,
  },
  tapToPlaceText: {
    color: theme.colors.purple,
    fontSize: 36,
    fontWeight: "bold",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  onePieceModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  onePieceModalContent: {
    width: "85%",
    maxWidth: 400,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  onePieceModalText: {
    color: theme.colors.textInverse,
    fontSize: 16,
    textAlign: "center",
    marginBottom: theme.spacing.xl,
    lineHeight: 24,
  },
  modalSecondaryButton: {
    backgroundColor: theme.colors.grayBlack,
    borderWidth: 2,
    borderColor: theme.colors.purple,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    minWidth: 150,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  modalSecondaryButtonText: {
    color: theme.colors.textInverse,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ARFurniturePlacer;
