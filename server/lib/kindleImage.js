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
export const KINDLE_IMAGE_PROMPT_VERSION = 4;

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

// The art director thinks in order, and the schema holds it to that
// order: first what the picture must make someone understand and feel,
// then the one visual idea that carries it, and only then the scene.
// Version 2 went straight to a scene under rules of restraint (one
// subject, three things, no crowds, people tiny), and the restraint cut
// out the meaning: a river that parts into two living channels became a
// single quiet stream, and an architect watching the square she made
// come alive became a bench with a sketchbook on it. Restraint now lives
// in the paint, not in what the picture is allowed to show.
const SCENE_SCHEMA = {
  type: 'object',
  properties: {
    essence: {
      type: 'string',
      description: 'One sentence: what someone who has never read the story should understand and feel from the picture alone.',
    },
    idea: {
      type: 'string',
      description: 'The one visual idea that holds both the difficulty and the turning, as a relationship the eye takes in at a glance. For example: one river parting into two channels, both carrying life.',
    },
    scene: {
      type: 'string',
      description: 'The brief for the painter, 70 to 120 words: the viewpoint, what is near, in the middle and far, where the eye lands first, the hour and where the light falls, and the living details that bring warmth.',
    },
    alt: {
      type: 'string',
      description: 'One plain sentence describing the finished picture for someone who cannot see it. What is in it, nothing about what it means.',
    },
  },
  required: ['essence', 'idea', 'scene', 'alt'],
  additionalProperties: false,
};

const SCENE_DIRECTOR = `You are the art director for Hearth, an app that helps people find meaning in what they carry. In a session, Hearth offers the reader a mirror: a person, a figure from a story, an image from nature, or a small parable that held the same shape of difficulty and found its way through. You choose the painting that will sit beside that mirror. The reader may keep it, print it, or give it to someone they love.

The painting has one job: someone who looks at it, even without reading a word, should feel the mirror's meaning at once, and be comforted by it. It should be beautiful enough to keep.

# Think in this order

1. The essence. Read the mirror and say, in one sentence, what the picture must make someone understand and feel. This comes from the turning, not only from the difficulty.

2. The idea. Find the one visual idea that holds both the difficulty and the turning, as a relationship the eye can take in at a glance. Meaning lives in relationships: one river parting into two channels, both alive; a square full of people living out a plan its maker is not credited for, and the maker at its edge, seeing it. Most mirrors are about how two things stand to each other, so the picture usually needs both of them. Never shrink the meaning into a small object or a clue that only someone who read the story would understand.

3. The scene. Build the painting around that idea.
- Choose the viewpoint that makes the idea visible. When the meaning is a shape on the land, look from above or from high ground. When it is a gesture, come close.
- One clear place where the eye lands first, and a world around it: something near, something in the middle, something far. Full and alive, not empty.
- Paint the moment after the turning has begun. The tree has already grown around the wound and is in leaf. The side stream already feeds the reeds and the birds. The difficulty is still there to see. So is what answered it, and the answer is where the light falls.
- Gentle late-afternoon or early-morning light, falling across the scene and gathering on what matters. Most of the picture is in the light.
- One or two living details bring the comfort, and they come from the story itself: a heron in the side stream's shallows, the few people the architect's square was made for. Not stock comforts brought in from elsewhere: no sleeping dogs or cats, café tables or bicycles unless the story has them.
- Quiet. Generous empty sky or open water, so the picture breathes. Simple enough to read from across a room: the idea, the light, and very little else.
- Concrete nouns. A painter cannot paint resilience. They can paint a root that has split a stone and holds it.

4. Test it. Imagine someone who has never read the mirror seeing only this painting. Would they sense the essence within a few seconds? If the meaning depends on a small object or on knowing the story, go back to step 2.

# People

- A real person: never their likeness. Paint what they made or kept, out in the world, doing its work, with people it reached present if they help.
- A figure from a story or a parable: they may be in the painting, small within the scene, seen from behind or in profile at a distance, the face never detailed. Others in the story may be there too, the same way. People are often where the warmth is.

# Keep out

- Suffering shown directly. If the story holds violence, illness, a camp or a death, paint what was kept or made inside it.
- Stock symbols: hearts, doves, butterflies, rainbows, lotus flowers, lighthouses, mended gold pottery, lone figures on clifftops, beams of light through cloud.
- Writing of any kind: no letters, legible pages, signs, plaques or numbers.
- The reader. You are painting the mirror.
- The medium and the style. Those are set elsewhere. Describe what is there, where, and in what light.`;

// The fixed style. Hearth's design system said in paint: its colours,
// warm light, room to breathe, nothing loud (BRAND_BRIEF §8). The scene
// is the only part that changes. Version 2 asked for flat shapes, a
// nearly empty upper third and a strict six-colour palette, which made
// every picture quiet and some of them say nothing; the palette is now
// a harmony to lean toward, and the composition follows the scene. The
// medium follows the keepsake card's design (carry_postcard/): soft
// watercolour, muted and warm, with generous sky.
function buildImagePrompt(scene) {
  return `Soft watercolour on cotton paper, a muted warm palette: a small painting to keep, in the tradition of a cherished book illustration. Transparent washes, gentle edges, the texture of the paper showing through, made by hand rather than by a machine. Full bleed: the paint covers the whole image, out to all four edges.

THE SCENE
${scene}

COMPOSITION
A tall portrait frame. The composition serves the scene: whatever the picture is about can be seen at a glance, in where things are and how they stand to one another, not in small details. One clear place where the eye lands first. Depth, with something near, something in the middle and something far. Fewer, larger shapes, and generous empty sky or open water where the eye can rest, so the picture breathes. Simplified and considered, the way a good illustrator leaves things out. Quiet.

LIGHT
Gentle, quiet late-afternoon or early-morning light, falling across the scene and gathering on what matters most. Soft and luminous, light in key, more of the picture lit than in shadow. Shadows are gentle and tinted green-blue, never black. No beams, no lens flare, no glow effects.

COLOUR
A harmony that leans toward warm cream, deep midnight green, warm gold, pale grey-blue and soft dusty pink. The living colours of the scene, the green of reeds, the blue of water, the warmth of stone and skin, are softened toward that harmony, muted, like sunlight on old paper. Never garish, never sugary. No pure black, no pure white.

FEELING
Someone who looks at it should feel, before they think about it, that it is going to be all right. Peace that was earned, not peace that pretends: whatever was hard is still there, and it has been met, held, grown around. Tender, generous and grown-up. Beautiful enough to keep on a shelf for years, and never the prettiness of a greeting card or a calendar print.

WHAT IT MUST NOT HAVE
No words, letters, numbers, signs, plaques, signature or watermark anywhere. No likeness of any real person, and no detailed faces: people are small within the scene, seen from behind or in profile at a distance. No frame, border, mat, vignette or unpainted margin. Not a photograph, not a 3D render, not glossy digital art.`;
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
  return `Here is the mirror from one session.\n\n${lines.join('\n')}\n\nChoose the painting that belongs beside it, thinking in the order you were given. Return JSON matching the schema.`;
}

// Returns { print, data, thumb, printWidth, printHeight, contentType,
// essence, idea, scene, alt, imageModel, promptVersion }.
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
  const { essence, idea, scene, alt } = JSON.parse(text);
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
    essence: (essence || '').trim(),
    idea: (idea || '').trim(),
    scene: scene.trim(),
    alt: (alt || '').trim(),
    imageModel: IMAGE_MODEL,
    promptVersion: KINDLE_IMAGE_PROMPT_VERSION,
  };
}
