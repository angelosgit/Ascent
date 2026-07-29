/**
 * Sprite atlas extracted from SISIFO.psd. Coordinates are in "document space"
 * (the PSD canvas scaled to 0.75); the scene scales that whole space to cover
 * the screen, so every layer stays in the composition the artist drew.
 *
 * Regenerate with tools/build_assets.py after any art hand-off.
 */
import manifest from '../assets/art/manifest.json';

export const DOC_W = manifest.doc[0] * manifest.scale;
export const DOC_H = manifest.doc[1] * manifest.scale;

/**
 * Ridge-line gradient measured off the mountain layer: 45.33 degrees, negative
 * because the second hand-off mirrored the artwork and the climb now runs up and
 * to the right. Travelling one point right means travelling RIDGE_SLOPE points
 * vertically, so this doubles as the direction of travel.
 */
export const RIDGE_SLOPE = -1.0114;

export const SKY = { ...manifest.bg, source: require('../assets/art/sky.png') };
export const SLOPE = { ...manifest.mountain, source: require('../assets/art/slope.png') };
export const BOULDER = { ...manifest.stone, source: require('../assets/art/boulder.png') };

const SOURCES = {
  leg1: require('../assets/art/char/leg1.png'),
  leg2: require('../assets/art/char/leg2.png'),
  body: require('../assets/art/char/body.png'),
  aarm2: require('../assets/art/char/aarm2.png'),
  aem1: require('../assets/art/char/aem1.png'),
};

/**
 * Draw order is back-to-front. `pivot` is normalised within each part's own box
 * and marks the joint it swings from.
 *
 * These are mirrored from the first hand-off: the second PSD flipped the whole
 * composition, and the limbs in it are pixel-identical mirrors of the originals
 * rather than re-drawn. So every pivot's x became 1 - x, and every swing was
 * negated — a mirrored figure has to rotate the other way to make the same
 * physical movement.
 *
 * The limbs are still cut flush at the joints with no overlap under the torso,
 * so the amplitudes stay deliberately small — past roughly six degrees the cut
 * edge slides out and you can see through the shoulder. Widen these once the
 * client sends limbs that extend under the body.
 */
export const CHARACTER = {
  origin: manifest.character.origin,
  size: manifest.character.size,
  parts: [
    { key: 'leg2', pivot: [0.05, 0.06], swing: -4.0, phase: Math.PI },
    { key: 'aem1', pivot: [0.03, 0.20], swing: -3.0, phase: 0.4 },
    { key: 'body', pivot: [0.50, 0.95], swing: -1.6, phase: 0 },
    { key: 'leg1', pivot: [0.50, 0.03], swing: -5.0, phase: 0 },
    { key: 'aarm2', pivot: [0.80, 0.96], swing: -3.5, phase: 0.2 },
  ].map((part) => ({
    ...part,
    ...manifest.character.parts[part.key],
    source: SOURCES[part.key],
  })),
};
