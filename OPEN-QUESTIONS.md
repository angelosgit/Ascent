# Open questions & known gaps

Everything here is waiting on the client. Nothing in this list is a bug in the
prototype — they are the places where the prototype knowingly differs from the
brief, and why.

## Blocking

### 1. ~~The artwork carries an Adobe Stock watermark~~ — fixed in hand-off 2
`SISIFO (1).psd` is clean: the watermark is gone from both `mountain` and `bg`.
The build now reads from that file. The whole composition is also mirrored, so
the climb runs up and to the *right*; `RIDGE_SLOPE` is negative to match.

**But do not use the loose PNGs that arrived with it.** `arm1.png`, `bg.jpg`,
`body.png`, `leg1.png`, `leg2.png`, `mountain.png`, `stone.png` and
`sisifo complete.png` are Fiverr marketplace previews with the site's watermark
tiled across every one of them — worse than what they replace. The set is also
missing an arm: five body parts in the PSD, four PNGs. Everything is extracted
from the PSD instead.

### 2. The layers are not separated enough to parallax
**Unchanged by hand-off 2.** The brief promises "terracotta mountains and
shifting clouds" scrolling at different speeds. In the PSD, the sky, the clouds,
the Acropolis, the whole city, the distant hills and the sea are one flattened
`bg` layer. There is no cloud layer at all.

**Needed:** `bg` split into sky / clouds / city / far hills as separate layers.

### 3. Nothing is tileable, so the climb cannot actually scroll
**Unchanged by hand-off 2.** This is the big one, and it is why `Scene.js` holds
the slope still.

The rock is a wedge — solid below the ridge, empty above it — drawn once, for a
poster. Its ridge is a straight 45.3° line, so sliding a second copy *along* that
line does keep the silhouette continuous; that part works. What does not work is
the body of the rock: every copy runs out of pixels at its own bottom edge, and
the tile arriving from up-slope sits a full period higher, so the sky shows
through a triangular hole in the mountain. Padding the wedge downwards, adding
more copies, and mirroring the foot of it each traded that hole for a different
artifact — a second ridge running the wrong way, or a hard vertical seam.

So the prototype does not fake it. The slope holds the composition the artist
drew, and the motion is carried by the sky's parallax drift and by the boulder
and climber surging up-slope on each heave. The moment seamless layers arrive
this becomes a few lines of diagonal scroll — the geometry is already in
`RIDGE_SLOPE` and the discarded approach is documented in `Scene.js`.

**Needed:** each scrolling layer horizontally tileable — left edge meeting right
edge. The Acropolis in particular cannot simply repeat; it needs either a
repeatable middle-distance band or to be pinned as a static landmark.

### 4. The character cannot be animated properly yet
**Unchanged by hand-off 2.** Every limb in the new PSD is a pixel-identical
mirror of the old one — same dimensions, zero differing pixels — so the artwork
was flipped, not re-cut. Both problems below still stand.

The five parts (`aem1`, `aarm2`, `body+`, `leg2`, `leg1`) are rigged in
`Sisyphus.js` and do animate — but two things hold the motion back:

- **The limbs are cut flush at the joints.** `body+` ends flat at the hips and
  shoulders; `leg1` is a full leg with a rounded stump on top. Rotate a limb more
  than about six degrees and the cut edge slides out from under the torso and you
  can see through the shoulder. Swing amplitudes in `art.js` are capped for this
  reason, which is why the push currently reads as a strain rather than a stride.
- **Each limb is one rigid piece.** No elbow, no knee, so arms and legs can only
  swing as straight bars.

**Needed:** limbs extended to overlap under the torso, and split at the elbow and
knee — or the push cycle supplied as frames instead.

## Decisions

### 5. ~~Slope angle: 33° or 45°?~~ — answered: **33°**
Set in `SLOPE_ANGLE_DEG`. Note that the artwork disagrees: its ridge measures
45.4°. The constant drives the elevation maths only, never the visuals, so
nothing breaks — the picture is simply steeper than the number.

### 6. ~~Pace~~ — answered: **"attached to the progress he is making"**
Taken as a design constraint rather than a number, so the rate is derived from
the animation instead of set by hand. `SLOPE_FEET_PER_HEAVE = 2` — two feet of
ground per heave, about what a person leaning into a boulder actually moves it —
and at 33° that is roughly thirteen inches of height each time he strains.

One heave every 2.4s gives 1500 an hour, so:

| session | elevation |
| ------- | --------- |
| 25 min  | 0.12894 MI |
| 45 min  | 0.23209 MI |
| 60 min  | 0.30945 MI |

Near enough the `0.12450 MI` worked through in the brief, and now for a reason
the user can watch. Change `SLOPE_FEET_PER_HEAVE` to retune; everything else
follows.

### 7. ~~Price for Pay to Exit~~ — answered: **$1**
Set in `EXIT_TOLL_PRICE`, for display only. The real figure must be read from the
store at runtime once the consumable IAP exists, because Apple and Google
localise it — hard-coding a dollar sign fails review for non-US users.

### 8. ~~Sound~~ — answered: **silent, no audio at all**
No audio or haptics anywhere. `SILENT` records the decision.

### 9. Does forfeiting wipe *lifetime* elevation, or just the session?
`ABANDON_RESETS_LIFETIME` is currently `true`, which reads the brief literally:
paying "preserves their current lifetime elevation", forfeiting means starting
"over from scratch". That is harsh — a year of climbing gone for one slip — and
it is the single design decision most likely to be regretted after launch.
Worth an explicit yes.

## Known limitations

### 10. Answering a phone call currently counts as leaving
The client's rule is that phone calls are forgiven and nothing else is. The app
listens to `AppState` and treats `background` as leaving, which correctly catches
app-switching, the home gesture and screen-lock. It deliberately ignores
`inactive`, which covers the incoming-call banner and Control Centre.

But *answering* a call does background the app, so it is currently penalised.
Telling a call apart from a deliberate app-switch needs a native observer
(CallKit on iOS, `PhoneStateListener` on Android) and a development build.

### 11. The 5 second rule trusts the device clock
Timings come from `Date.now()`, so a user who changes their system clock can
defeat the grace window. Fine for a self-discipline app; worth knowing.

### 12. Payments are stubbed
`src/payments.js` always succeeds. Real IAP needs a development build, a
consumable product configured in App Store Connect and Play Console, and
developer accounts in the client's name. The call site already treats it as async
and failable, so swapping the body out is the whole job.
