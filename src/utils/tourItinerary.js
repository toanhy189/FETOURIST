export const ITINERARY_BLOCK_TYPES = {
  paragraph: "paragraph",
  image: "image",
  caption: "caption",
};

export function createEmptyItineraryBlock(type = ITINERARY_BLOCK_TYPES.paragraph) {
  if (type === ITINERARY_BLOCK_TYPES.image) {
    return {
      type: ITINERARY_BLOCK_TYPES.image,
      url: "",
      alt: "",
    };
  }

  return {
    type:
      type === ITINERARY_BLOCK_TYPES.caption ? ITINERARY_BLOCK_TYPES.caption : ITINERARY_BLOCK_TYPES.paragraph,
    text: "",
  };
}

export function extractPlainTextFromBlocks(blocks) {
  return (Array.isArray(blocks) ? blocks : [])
    .map((block) => {
      if (block?.type === ITINERARY_BLOCK_TYPES.image) {
        return "";
      }

      return typeof block?.text === "string" ? block.text.trim() : "";
    })
    .filter(Boolean)
    .join("\n\n");
}

function normalizeItineraryBlock(block) {
  const type = typeof block?.type === "string" ? block.type : ITINERARY_BLOCK_TYPES.paragraph;

  if (type === ITINERARY_BLOCK_TYPES.image) {
    return {
      type: ITINERARY_BLOCK_TYPES.image,
      url: typeof block?.url === "string" ? block.url : "",
      alt: typeof block?.alt === "string" ? block.alt : "",
    };
  }

  return {
    type: type === ITINERARY_BLOCK_TYPES.caption ? ITINERARY_BLOCK_TYPES.caption : ITINERARY_BLOCK_TYPES.paragraph,
    text: typeof block?.text === "string" ? block.text : "",
  };
}

export function normalizeItineraryBlocks(blocks, legacyDescription = "") {
  const normalizedBlocks = (Array.isArray(blocks) ? blocks : []).map(normalizeItineraryBlock);

  if (normalizedBlocks.length > 0) {
    return normalizedBlocks;
  }

  if (typeof legacyDescription === "string" && legacyDescription.trim()) {
    return [
      {
        type: ITINERARY_BLOCK_TYPES.paragraph,
        text: legacyDescription,
      },
    ];
  }

  return [];
}

export function createEmptyItineraryStep(day) {
  return {
    day,
    title: "",
    blocks: [createEmptyItineraryBlock()],
  };
}

export function normalizeItinerarySteps(itinerary) {
  const source = Array.isArray(itinerary) ? itinerary : [];

  return source.map((step, index) => {
    const blocks = normalizeItineraryBlocks(step?.blocks, step?.description);

    return {
      day: index + 1,
      title: typeof step?.title === "string" ? step.title : "",
      description: extractPlainTextFromBlocks(blocks) || (typeof step?.description === "string" ? step.description : ""),
      blocks,
    };
  });
}

export function summarizeItineraryStep(step) {
  const blocks = normalizeItineraryBlocks(step?.blocks, step?.description);
  const plainText = extractPlainTextFromBlocks(blocks);

  return plainText.split("\n").map((item) => item.trim()).find(Boolean) || "";
}
