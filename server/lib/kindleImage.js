// server/lib/kindleImage.js
//
// A picture to accompany a Carry session: the mirror, painted.
//
// Two calls, on purpose:
//   1. The text model reads the mirror and writes ONE scene a painter
//      could paint. This is where the judgement lives: a person becomes
//      the object or place that carries their turning (never a
//      likeness), a parable becomes its one image, and the hard thing
//      stays in the picture without becoming the subject of it.
//   2. The image model paints that scene inside a fixed style, so every
//      picture looks like Hearth whatever the scene is.
//
// What goes in is the mirror only: the companion and the keepsake. The
// feeling the reader typed never does. That keeps the picture on the
// same side of the sharing line as the mirror itself (BRAND_BRIEF
// §5.12): it is something that can leave the app, because it does not
// need the reader's life explained first.

import sharp from 'sharp';
import { MODEL, IMAGE_MODEL } from './ai.js';

// Bump when the scene brief or the style changes, so a picture can be
// traced to the prompt that made it.
export const KINDLE_IMAGE_PROMPT_VERSION = 2;

// Made at print size. A 4 x 6 inch card with 0.125 in of bleed on every
// side is 4.25 x 6.25 in, which at 300 dpi is 1275 x 1875 pixels. The
// model wants both edges in multiples of 16, so 1280 x 1888, and the
// print file trims the few spare pixels. High quality is slower (about
// 25 seconds) and visibly richer in the brushwork, which is what a
// printed card is looked at for.
const IMAGE_SIZE = '1280x1888';
const IMAGE_QUALITY = 'high';

// Three copies from the one the model paints:
//   print    the full picture as a maximum-quality JPEG with no colour
//            subsampling, tagged 300 dpi. Indistinguishable from the PNG
//            in print, at a quarter of the size. This is what a printer
//            gets.
//   data     a lighter copy for the screen.
//   thumb    a small one for lists.
async function threeCopies(png) {
  const meta = await sharp(png).metadata();
  const [print, data, thumb] = await Promise.all([
    sharp(png).withMetadata({ density: 300 }).jpeg({ quality: 95, chromaSubsampling: '4:4:4' }).toBuffer(),
    sharp(png).resize({ width: 832 }).jpeg({ quality: 82 }).toBuffer(),
    sharp(png).resize({ width: 240 }).jpeg({ quality: 78 }).toBuffer(),
  ]);
  return { print, data, thumb, printWidth: meta.width, printHeight: meta.height };
}

const SCENE_TEMPERATURE = 0.8;

const SCENE_SCHEMA = {
  type: 'object',
  properties: {
    scene: {
      type: 'string',
      description: 'The scene to paint, two or three plain sentences, 60 words at most. One concrete subject, where it is, the hour, and the one detail that carries the turning.',
    },
    alt: {
      type: 'string',
      description: 'One plain sentence describing the finished picture for someone who cannot see it. What is in it, nothing about what it means.',
    },
  },
  required: ['scene', 'alt'],
  additionalProperties: false,
};

const SCENE_DIRECTOR = `You are the art director for Hearth, a quiet app that helps people find meaning in what they carry. In a session, Hearth offers the reader a mirror: a person, a figure from a story, an image from nature, or a small parable that held the same shape of difficulty and still carries light. Your job is to choose the one picture that will sit beside that mirror, and describe it for a painter.

The picture is there to bring warmth and comfort. It does that honestly: the hard thing stays in the picture, and the picture is about how it is held.

# How to choose the scene

- One subject. A single thing, seen plainly, in a real place at a real hour. If you need the word "and" to name the subject, you have two pictures. Choose one.
- Paint the moment after the turning has begun. The tree has already grown around the wound. The field has already been left fallow and the first green is in it. The wound, the gap, the weight is still visible. So is what answered it.
- Give the scene one source of warm, low light and say where it comes from: a window, a lamp, early sun from one side. The light rests on the subject. Choose morning, daylight or a well-lit room over dusk and night. This is a picture someone keeps for comfort, so most of it is in the light.
- At most three things in the picture: the subject, what it rests on or stands in, and one detail. No background traffic, crowds or scenery added for atmosphere.
- Leave room. Say what is in the empty part of the picture: sky, a wall, still water, snow, air.
- Concrete nouns. A painter cannot paint "resilience" or "hope". They can paint a mended fence, a kettle, a root across a stone.

# The form of the mirror

- A real person: never paint them. No portrait, no figure, no likeness. Paint the object, the room, or the piece of work that carries what they did: the desk, the tool, the thing they made or kept. Do not name them in the scene.
- A figure from a story: the same. Paint the thing or the place from the story that holds the turning, never the character's face.
- An image from nature, a parable, or another image: paint that image itself, precisely, as it would really look.
- If a human presence is truly needed, it is small and far off, or seen from behind, or only a pair of hands, or only what someone left: a coat on a chair, a light on in one window.

# What to keep out

- No suffering shown directly. If the mirror's story holds violence, illness, a camp, a death, paint what was kept or made inside it, not what was done.
- No stock symbols: no hearts, doves, butterflies, rainbows, lotus flowers, lighthouses, mended gold pottery, paths leading into the distance, lone figures on clifftops, rays of sun breaking through cloud.
- No writing of any kind in the picture: no letters, pages of legible text, signs or numbers.
- Nothing about the reader. You are painting the mirror.
- Do not describe the medium, the colours or the style. Those are set elsewhere. Describe only what is there, where, and in what light.

Write the scene as two or three plain sentences, 60 words at most, the way you would brief a painter you trust. Then write one sentence of alt text.`;

// The fixed style. Everything here is Hearth's design system said in
// paint: paper and ink, a little warm light, a great deal of room
// (BRAND_BRIEF §8). The scene is the only part that changes.
function buildImagePrompt(scene) {
  return `A small painting to keep, in gouache and soft coloured pencil, in the manner of a quiet mid-century book illustration or a shin-hanga woodblock print: flat matte shapes, dry-brush edges, a fine paper grain showing through the paint, no outline heavier than a pencil line. Hand-made, a little imperfect, unhurried. Full bleed: the paint covers the whole image, out to all four edges.

THE SCENE
${scene}

COMPOSITION
One subject, seen plainly, from a calm eye level or slightly above. It sits in the lower two thirds of a tall portrait frame. The upper third is open and nearly empty, a wide still field of pale sky, wall or air, so the picture has room to breathe. Few elements. Nothing crowded, and nothing decorative that the scene does not need.

LIGHT
One source of low, warm light, the light of early morning or of a lamp left on for someone, coming from one side and resting on the subject. It is steady, not dramatic: no rays, no glow effects, no sparkle. The picture is light in key, more of it lit than in shadow. Shadows are soft and short, and they are tinted deep green, never black.

COLOUR
A limited palette, and only this. Warm cream (#F9F4E6) for the lightest tones. Deep midnight green (#1F4045) for the darkest. Between them, muted warm gold (#E1BE74), pale grey-blue (#C9D8DA), soft dusty pink (#EBCDC2) and a faint blush cream (#F2EAE8). The warm tones outweigh the cool ones. No pure black, no pure white, no saturated colour.

FEELING
Warmth and comfort without sweetness. Whatever is hard in the scene is visible, not hidden and not prettied, and the picture is about how it is held: tended, sheltered, still standing, lit. It should feel like being kept company in a quiet room. Tender, unhurried, grown-up.

WHAT IT MUST NOT HAVE
No words, letters, numbers, signature or watermark anywhere. No recognisable face and no likeness of any real person. If a person is present they are small, seen from behind or far off, or shown only by their hands or by what they left. No frame, border, mat, vignette or unpainted margin of paper around the picture. Not a photograph, not a 3D render, not glossy digital art.`;
}

function buildScenePrompt({ companion = {}, keepsake = '' } = {}) {
  const lines = [
    `The form of the mirror: ${companion.kind || 'image'}`,
    `Its name: ${companion.name || ''}`,
    `Where it is from: ${companion.source || ''}`,
    `What it faced or holds: ${companion.predicament || ''}`,
    `How it turned: ${companion.turning || ''}`,
  ];
  if (keepsake) lines.push(`The line the reader was given to keep: ${keepsake}`);
  return `Here is the mirror from one session.\n\n${lines.join('\n')}\n\nChoose the one picture that belongs beside it. Return JSON matching the schema.`;
}

// Returns { print, data, thumb, printWidth, printHeight, contentType,
// scene, alt, imageModel, promptVersion }.
export async function generateKindleImage(client, { session, replyTurning } = {}) {
  const companion = session?.companion || {};
  // The later keepsake is the one the reader arrived at, so it wins.
  const keepsake = replyTurning?.step?.keepsake || session?.step?.keepsake || '';

  const completion = await client.chat.completions.create({
    model: MODEL,
    temperature: SCENE_TEMPERATURE,
    messages: [
      { role: 'system', content: SCENE_DIRECTOR },
      { role: 'user', content: buildScenePrompt({ companion, keepsake }) },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: { name: 'kindle_image_scene', strict: true, schema: SCENE_SCHEMA },
    },
  });
  const text = completion.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty response from AI service');
  const { scene, alt } = JSON.parse(text);
  if (!scene?.trim()) throw new Error('No scene to paint');

  const result = await client.images.generate({
    model: IMAGE_MODEL,
    prompt: buildImagePrompt(scene.trim()),
    size: IMAGE_SIZE,
    quality: IMAGE_QUALITY,
    output_format: 'png',
    n: 1,
  });
  const b64 = result.data?.[0]?.b64_json;
  if (!b64) throw new Error('Empty image from AI service');

  return {
    ...(await threeCopies(Buffer.from(b64, 'base64'))),
    contentType: 'image/jpeg',
    scene: scene.trim(),
    alt: (alt || '').trim(),
    imageModel: IMAGE_MODEL,
    promptVersion: KINDLE_IMAGE_PROMPT_VERSION,
  };
}
