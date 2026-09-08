import axios from 'axios';
import OpenAI, { toFile } from 'openai';
import { createError } from '../utils/errors.js';

function getClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw createError(
      503,
      'SERVICE_NOT_CONFIGURED',
      'OpenAI is not configured.'
    );
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

function getRoomInstructions(roomType) {
  const instructions = {
    'Living room': `
The final image MUST remain a Living room.

Use appropriate elements such as:
- sofa or comfortable seating
- coffee or center table
- TV/media unit where appropriate
- practical storage
- living room lighting
- tasteful decor

Do NOT transform it into a bedroom, kitchen, dining room, balcony, or home office.
`,

    Bedroom: `
The final image MUST remain a Bedroom.

Use appropriate elements such as:
- bed
- bedside tables where appropriate
- wardrobe/storage
- bedroom lighting
- practical bedroom furniture
- suitable decor

Do NOT transform it into a living room, kitchen, dining room, balcony, or home office.
`,

    Kitchen: `
The final image MUST remain a Kitchen.

Use appropriate elements such as:
- kitchen counter or platform
- cabinets and storage
- cooking area
- sink where appropriate
- practical kitchen appliances
- kitchen lighting
- functional storage

The kitchen should look practical and realistic for an Indian home.

Do NOT transform it into a living room, bedroom, dining room, balcony, or home office.
`,

    Balcony: `
The final image MUST remain a Balcony.

Use appropriate elements such as:
- compact balcony seating
- plants
- railing
- outdoor lighting
- practical storage where appropriate
- suitable weather-resistant materials

Keep the design realistic for an Indian home.

Do NOT transform it into a living room, bedroom, kitchen, dining room, or home office.
`,

    'Dining room': `
The final image MUST remain a Dining room.

Use appropriate elements such as:
- dining table
- dining chairs
- suitable lighting
- storage/display furniture where appropriate
- practical dining decor

Do NOT transform it into a living room, bedroom, kitchen, balcony, or home office.
`,

    'Home office': `
The final image MUST remain a Home office.

Use appropriate elements such as:
- work desk
- comfortable office chair
- storage
- shelves where appropriate
- practical task lighting
- clean workspace

Keep the design realistic for a home in India.

Do NOT transform it into a living room, bedroom, kitchen, dining room, or balcony.
`,
  };

  return (
    instructions[roomType] ||
    `
The final image MUST remain a ${roomType}.
Do not reinterpret it as another type of room.
`
  );
}

export async function generateRoomTransformation({
  imageUrl,
  roomType,
  budget,
  styles,
  colorPreference,
}) {
  const roomInstructions = getRoomInstructions(roomType);

  const prompt = `
You are an expert Indian interior renovation designer and
architectural visualization artist.

Your task is to RENOVATE the user's EXISTING ROOM PHOTO.

This is NOT a request to generate a random room inspired by the image.

The user has explicitly selected:

ROOM TYPE: ${roomType}

The selected room type is AUTHORITATIVE.

${roomInstructions}

The uploaded image is the source of truth for the existing space.

IMPORTANT — PRESERVE THE EXISTING SPACE:

Preserve as much as realistically possible:
- camera viewpoint
- camera perspective
- room boundaries
- wall positions
- ceiling structure
- floor structure
- doors
- windows
- architectural openings
- major structural elements
- approximate room dimensions
- overall spatial layout

Do NOT replace the entire room with a completely different room.

The goal is to show how THIS SAME ROOM could look after renovation.

TRANSFORMATION:

Improve and renovate the existing space using:
- appropriate furniture
- practical storage
- lighting
- wall finishes
- colors
- materials
- fixtures
- decor
- organization

Remove or replace messy, damaged, temporary, or unsuitable objects
when necessary to create the renovated result.

The final result should still clearly represent the same physical room.

BUDGET:

${budget}

The renovation must look financially realistic for the selected budget.

Do NOT create an extremely expensive luxury renovation when the
selected budget is low.

For a low budget, prioritize affordable improvements such as:
- paint
- lighting
- simple storage
- economical furniture
- affordable finishes
- practical organization

DESIGN STYLE:

${styles.join(', ')}

COLOR PREFERENCE:

${colorPreference}

INDIAN HOME CONTEXT:

The design should feel natural and practical for a typical Indian home.

Use realistic:
- furniture sizes
- materials
- storage solutions
- lighting
- room proportions
- interior finishes

PHOTOREALISM:

The final image must look like a real photograph of the SAME ROOM
after renovation.

Use:
- realistic materials
- realistic lighting
- realistic shadows
- realistic reflections
- natural proportions
- realistic furniture
- believable construction details

Avoid:
- CGI appearance
- fantasy architecture
- unrealistic luxury
- distorted furniture
- floating objects
- warped walls
- impossible structures
- unrealistic perspective

DO NOT ADD:
- people
- text
- logos
- watermarks
- artificial labels

MOST IMPORTANT RULE:

The selected room type MUST NOT change.

If the user selected "Kitchen", the output MUST be a renovated Kitchen.

If the user selected "Bedroom", the output MUST be a renovated Bedroom.

If the user selected "Living room", the output MUST be a renovated Living room.

If the user selected "Balcony", the output MUST be a renovated Balcony.

If the user selected "Dining room", the output MUST be a renovated Dining room.

If the user selected "Home office", the output MUST be a renovated Home office.

Even if the uploaded room is extremely messy, dark, damaged,
unorganized, or difficult to recognize, DO NOT change its room category.

RENOVATE THE EXISTING ROOM.
DO NOT REIMAGINE IT AS ANOTHER ROOM.
`;

  const imageResponse = await axios.get(imageUrl, {
    responseType: 'arraybuffer',
  });

  const contentType =
    imageResponse.headers['content-type'] || 'image/jpeg';

  const extension = contentType.includes('png')
    ? 'png'
    : contentType.includes('webp')
      ? 'webp'
      : 'jpg';

  const imageFile = await toFile(
    Buffer.from(imageResponse.data),
    `room.${extension}`,
    {
      type: contentType,
    }
  );

  const result = await getClient().images.edit({
    model: 'gpt-image-2',
    image: imageFile,
    prompt,
    size: '1536x1024',
    quality: 'low',
  });

  const imageData = result.data?.[0];

  if (!imageData?.b64_json) {
    throw createError(
      502,
      'AI_ERROR',
      'OpenAI did not return an image.'
    );
  }

  return {
    buffer: Buffer.from(imageData.b64_json, 'base64'),
    summary: `A ${styles.join(', ').toLowerCase()} ${roomType.toLowerCase()} designed for ${budget}.`,
  };
}