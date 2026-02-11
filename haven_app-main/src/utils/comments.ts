import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Comment {
  id: string;
  author: string;
  message: string;
  timestamp: number;
  imageUri?: string; // Optional image URI for photo comments - links comment to specific image
  position?: { x: number; y: number }; // Optional position for comment bubble on image (0-1 range, percentage)
  reply?: Comment; // Optional nested reply to this comment
  resolved?: boolean; // Whether this comment has been resolved
  unread?: boolean; // Whether this comment has been viewed (for demo purposes)
}

const COMMENTS_KEY_PREFIX = "@haven_comments_";

// Get comments for a specific project
export const getProjectComments = async (
  projectId: string
): Promise<Comment[]> => {
  try {
    const key = `${COMMENTS_KEY_PREFIX}${projectId}`;
    const commentsJson = await AsyncStorage.getItem(key);
    if (commentsJson) {
      return JSON.parse(commentsJson);
    }
    return [];
  } catch (error) {
    console.error("Error loading comments:", error);
    return [];
  }
};

// Save comments for a specific project
export const saveProjectComments = async (
  projectId: string,
  comments: Comment[]
): Promise<void> => {
  try {
    const key = `${COMMENTS_KEY_PREFIX}${projectId}`;
    await AsyncStorage.setItem(key, JSON.stringify(comments));
  } catch (error) {
    console.error("Error saving comments:", error);
  }
};

// Add a comment to a project
export const addProjectComment = async (
  projectId: string,
  comment: Comment
): Promise<void> => {
  const comments = await getProjectComments(projectId);
  comments.push(comment);
  await saveProjectComments(projectId, comments);
};

// Load and merge comments for a project (loads persisted comments and merges with mock data)
export const loadProjectComments = async (
  projectId: string,
  projectName?: string,
  projectImages?: string[]
): Promise<Comment[]> => {
  try {
    // Load persisted comments from AsyncStorage
    const persistedComments = await getProjectComments(projectId);

    // Get mock comments for demo projects
    const mockComments = getMockComments(projectName, projectImages);

    // If no persisted comments exist, use mock comments (for demo projects only)
    if (persistedComments.length === 0) {
      if (mockComments.length > 0) {
        // Save mock comments to AsyncStorage so they persist
        await saveProjectComments(projectId, mockComments);
        return mockComments;
      }
      return [];
    }

    // Merge persisted comments with mock comments
    // Preserve unread state from persisted comments (don't reset during session)
    const persistedMap = new Map<string, Comment>();
    persistedComments.forEach((comment) => {
      persistedMap.set(comment.id, comment);
    });

    // Merge: for each mock comment, use persisted version if it exists (preserve unread state)
    const mergedComments: Comment[] = [];

    mockComments.forEach((mockComment) => {
      const persistedComment = persistedMap.get(mockComment.id);
      if (persistedComment) {
        mergedComments.push({
          ...mockComment,
          unread: persistedComment.unread,
          resolved: persistedComment.resolved,
          reply: persistedComment.reply,
        });
        persistedMap.delete(mockComment.id);
      } else {
        mergedComments.push(mockComment);
      }
    });

    // Add any other persisted comments that aren't in mock (e.g., user-added comments)
    // Preserve their unread state
    persistedMap.forEach((comment) => {
      mergedComments.push(comment);
    });

    // Sort by timestamp (oldest first, but share message should be first if it exists)
    mergedComments.sort((a, b) => {
      if (a.id === "original-share-message") return -1;
      if (b.id === "original-share-message") return 1;
      return a.timestamp - b.timestamp;
    });

    return mergedComments;
  } catch (error) {
    console.error("Error loading project comments:", error);
    // Fallback to mock comments if error
    return getMockComments(projectName, projectImages);
  }
};

// Get mock comments (for demo purposes) - only for specific demo projects
export const getMockComments = (
  projectName?: string,
  projectImages?: string[]
): Comment[] => {
  // Normalize project name - handle different apostrophe characters and whitespace
  let normalizedName = projectName || "";

  // Replace ALL apostrophe/quotation mark variants with straight apostrophe (U+0027)
  // This includes: ' (U+0027), ' (U+2018), ' (U+2019), ' (U+201B), ' (U+201C), ' (U+201D)
  normalizedName = normalizedName
    .replace(/[\u0027\u2018\u2019\u201B\u201C\u201D]/g, "'") // Replace all apostrophe variants with straight apostrophe
    .replace(/[\s\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000\uFEFF]+/g, " "); // Replace all whitespace with single space

  // Aggressive trim - remove ALL whitespace from start and end
  normalizedName = normalizedName.replace(
    /^[\s\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000\uFEFF]+|[\s\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000\uFEFF]+$/g,
    ""
  );

  // Simple comparison - normalize apostrophes and compare lowercase
  const cleanName = normalizedName.toLowerCase();

  // Normalize apostrophes - should already be done above, but double-check
  // Replace ALL apostrophe variants for comparison
  const normalizedCleanName = cleanName.replace(
    /[\u0027\u2018\u2019\u201B\u201C\u201D]/g,
    "'"
  );
  const targetGreg = "greg's house".replace(
    /[\u0027\u2018\u2019\u201B\u201C\u201D]/g,
    "'"
  );
  const targetSera = "sera's room".replace(
    /[\u0027\u2018\u2019\u201B\u201C\u201D]/g,
    "'"
  );

  // Use flexible matching - check if name contains key words (handles apostrophe variants better)
  const isGregsHouse =
    normalizedCleanName.includes("greg") &&
    normalizedCleanName.includes("house") &&
    normalizedCleanName.length <= 20; // Reasonable length check

  const isSerasRoom =
    normalizedCleanName.includes("sera") &&
    normalizedCleanName.includes("room") &&
    normalizedCleanName.length <= 20; // Reasonable length check

  if (!isGregsHouse && !isSerasRoom) {
    return [];
  }

  // Mock comments for "Greg's House"
  if (isGregsHouse) {
    return [
      {
        id: "greg-1",
        author: "Laura Palmer",
        message: "Looks great so far. Can we see some tables options?",
        timestamp: Date.now() - 86400000, // 1 day ago
        position: { x: 0.3, y: 0.4 }, // 30% from left, 40% from top
        unread: true,
      },
      {
        id: "greg-2",
        author: "Nancy Drew",
        message:
          "With the lamp there, you could put some artwork to fill the blank wallspace here.",
        timestamp: Date.now() - 7200000, // 2 hours ago
        imageUri:
          projectImages && projectImages.length > 0
            ? projectImages[0]
            : undefined,
        position: { x: 0.6, y: 0.3 }, // 60% from left, 30% from top
        unread: true,
      },
      {
        id: "greg-3",
        author: "Michael Jordan",
        message: "Great work! The room layout is very well thought out.",
        timestamp: Date.now() - 3600000, // 1 hour ago
        position: { x: 0.5, y: 0.6 }, // 50% from left, 60% from top
        unread: true,
      },
      {
        id: "greg-4",
        author: "Kevin Hart",
        message:
          "I'd reccomend maybe shifting the couch here so it's not in front of the window. What do you think?",
        timestamp: Date.now() - 1800000, // 30 minutes ago
        imageUri:
          projectImages && projectImages.length > 1
            ? projectImages[1]
            : undefined,
        position: { x: 0.7, y: 0.5 }, // 70% from left, 50% from top
        unread: true,
      },
      {
        id: "greg-5",
        author: "Nancy Drew",
        message:
          "This is a nice size, but maybe a more modern lamp would be better.",
        timestamp: Date.now() - 900000, // 15 minutes ago
        imageUri:
          projectImages && projectImages.length > 0
            ? projectImages[0]
            : undefined,
        position: { x: 0.2, y: 0.7 }, // 20% from left, 70% from top
        unread: true,
      },
      {
        id: "greg-6",
        author: "Laura Palmer",
        message:
          "This lamp takes up too much space. Maybe a smaller one would be better.",
        timestamp: Date.now() - 600000, // 10 minutes ago
        imageUri:
          projectImages && projectImages.length > 0
            ? projectImages[0]
            : undefined,
        position: { x: 0.4, y: 0.4 }, // 80% from left, 60% from top
        unread: true,
      },
      {
        id: "greg-7",
        author: "Kevin Hart",
        message: "I really like the color scheme with this this couch.",
        timestamp: Date.now() - 300000, // 5 minutes ago
        imageUri:
          projectImages && projectImages.length > 1
            ? projectImages[1]
            : undefined,
        position: { x: 0.3, y: 0.45 }, // 40% from left, 30% from top
        unread: true,
      },
    ];
  }

  // Mock comments for "Sera's Room"
  if (isSerasRoom) {
    return [
      {
        id: "sera-1",
        author: "Bob Johnson",
        message:
          "Well designed. Let's check out some couch options. Can you share some options?",
        timestamp: Date.now() - 172800000, // 2 days ago
        position: { x: 0.4, y: 0.5 }, // 40% from left, 50% from top
        unread: true,
      },
      {
        id: "sera-2",
        author: "Jane Smith",
        message: "I love this piece! It fits really well with your room.",
        timestamp: Date.now() - 10800000, // 3 hours ago
        imageUri:
          projectImages && projectImages.length > 0
            ? projectImages[0]
            : undefined,
        position: { x: 0.5, y: 0.4 }, // 50% from left, 40% from top
        unread: true,
      },
      {
        id: "sera-3",
        author: "John Doe",
        message: "I don't love the alignment. Maybe shift it more to the left?",
        timestamp: Date.now() - 5400000, // 1.5 hours ago
        imageUri:
          projectImages && projectImages.length > 1
            ? projectImages[1]
            : undefined,
        position: { x: 0.3, y: 0.6 }, // 30% from left, 60% from top
        unread: true,
      },
      {
        id: "sera-4",
        author: "Alice Williams",
        message:
          "I like the theme but maybe a large art piece above your bed would fit better.",
        timestamp: Date.now() - 2700000, // 45 minutes ago
        imageUri:
          projectImages && projectImages.length > 0
            ? projectImages[0]
            : undefined,
        position: { x: 0.7, y: 0.5 }, // 70% from left, 50% from top
        unread: true,
      },
      {
        id: "sera-5",
        author: "Jane Smith",
        message:
          "I don't think this piece matches the theme of the one over your bed. Try a gold frame?",
        timestamp: Date.now() - 1200000, // 20 minutes ago
        imageUri:
          projectImages && projectImages.length > 1
            ? projectImages[1]
            : undefined,
        position: { x: 0.6, y: 0.3 }, // 60% from left, 30% from top
        unread: true,
      },
    ];
  }

  return [];
};
