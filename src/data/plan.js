// Workout plan data. Edit this file to change exercises, sets, reps or cues.
//
// Item shapes:
//   block(name, detail, demoQuery)       one timed activity, no sets (cardio)
//   warm(name, sets, target, demoQuery)  a warm-up move, uses the warm-up rest
//   { group: [...] }                     lifting; 2+ entries form a superset (A1/A2)
//   { circuit: true, group: [...] }      rotate through all entries each round

const block = (name, detail, q) => ({ block: { name, detail, q } })
const warm = (n, s, t, q) => ({ warm: true, group: [{ n, s, t, q }] })
const lift = (n, s, t) => ({ group: [{ n, s, t }] })
const superset = (a, b) => ({
  group: [
    { tag: a.tag, n: a.n, s: a.s, t: a.t },
    { tag: b.tag, n: b.n, s: b.s, t: b.t },
  ],
})

export const DAYS = [
  ['mon', 'Mon'],
  ['tue', 'Tue'],
  ['wed', 'Wed'],
  ['thu', 'Thu'],
  ['fri', 'Fri'],
  ['sat', 'Sat'],
  ['sun', 'Sun'],
]
export const JS_DAY_TO_KEY = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
export const FULL_DAY = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
}

const WARM_LOWER = [
  block('Treadmill walk', '5 min, easy pace (about 3 mph, 0% incline). Raise your heart rate gradually.', 'treadmill walking warm up'),
  warm('90/90 Hip Switches', 2, '6 each side', '90/90 hip switch'),
  warm('Hip Flexor Stretch', 2, '20–30 sec each side', 'kneeling hip flexor stretch'),
  warm('Butterfly Stretch', 1, '20–30 sec', 'butterfly stretch'),
  warm('Cat-Cow', 1, '8 slow reps', 'cat cow stretch'),
  warm('Dead Hang', 2, '30 sec', 'dead hang from pull up bar'),
  warm('Glute Bridge (2 sec squeeze)', 2, '10 reps', 'glute bridge exercise'),
  warm('Banded Lateral Walk', 1, '10 steps each direction', 'banded lateral walk'),
  warm('Dead Bug', 2, '6 each side', 'dead bug exercise'),
  warm('Bird Dog', 2, '6 each side', 'bird dog exercise'),
]

const WARM_UPPER = [
  block('Treadmill walk', '5 min, easy pace (about 3 mph, 0% incline). Raise your heart rate gradually.', 'treadmill walking warm up'),
  warm('90/90 Hip Switches', 1, '6 each side', '90/90 hip switch'),
  warm('Cat-Cow', 1, '8 slow reps', 'cat cow stretch'),
  warm('Butterfly Stretch', 1, '20–30 sec', 'butterfly stretch'),
  warm('Arm Circles', 1, '10 each direction', 'arm circles warm up'),
  warm('Band Pull-Aparts', 2, '12 reps', 'band pull apart'),
  warm('Dead Hang', 2, '30 sec', 'dead hang from pull up bar'),
  warm('Dead Bug', 2, '6 each side', 'dead bug exercise'),
  warm('Bird Dog', 2, '6 each side', 'bird dog exercise'),
]

export const PLAN = {
  mon: {
    title: 'Lower A + Core',
    sections: [
      { title: 'Warm-up', items: WARM_LOWER },
      {
        title: 'Strength',
        items: [
          lift('Glute Bridge', 4, '10–12 reps'),
          superset(
            { tag: 'A1', n: 'Step-Ups', s: 3, t: '10 each leg' },
            { tag: 'A2', n: 'Banded Lateral Walk', s: 3, t: '12 steps each direction' },
          ),
          superset(
            { tag: 'B1', n: 'Bulgarian Split Squat', s: 3, t: '8–10 each leg' },
            { tag: 'B2', n: 'Hamstring Curl', s: 3, t: '12–15 reps' },
          ),
          lift('Cable Kickbacks', 3, '15 each leg'),
          lift('Wall Sit', 2, '40–45 sec'),
        ],
      },
      {
        title: 'Core',
        items: [lift('Front Plank', 3, '45–60 sec'), lift('Side Plank', 2, '25–30 sec each side')],
      },
      {
        title: 'Finisher',
        items: [block('Treadmill walk', '10 min, moderate steady pace, about 3–3.4 mph at 0–3% incline.', 'treadmill walking')],
      },
    ],
  },
  tue: {
    title: 'Upper + Conditioning',
    sections: [
      { title: 'Warm-up', items: WARM_UPPER },
      {
        title: 'Strength',
        items: [
          superset(
            { tag: 'A1', n: 'Lat Pulldown', s: 3, t: '10–12 reps' },
            { tag: 'A2', n: 'Dumbbell Bench Press', s: 3, t: '10 reps' },
          ),
          superset(
            { tag: 'B1', n: 'Seated Cable Row', s: 3, t: '10–12 reps' },
            { tag: 'B2', n: 'Supported Shoulder Press', s: 3, t: '10 reps' },
          ),
          superset(
            { tag: 'C1', n: 'Face Pulls', s: 3, t: '15 reps' },
            { tag: 'C2', n: 'Lateral Raises', s: 3, t: '12–15 reps' },
          ),
          lift('Knee Push-Ups', 2, '8–10 reps'),
          lift('Dip Support Hold', 2, '15–25 sec'),
          lift('Scapular Dips', 2, '6–10 reps'),
        ],
      },
      {
        title: 'Core',
        items: [lift('Pallof Press', 3, '10–12 each side'), lift('Front Plank', 2, '45–60 sec')],
      },
      {
        title: 'Conditioning',
        items: [
          block(
            'Treadmill incline intervals',
            '5 min easy walk. Then 8 rounds of 30 sec at 8–10% incline and 90 sec easy at 2–3%. Keep the speed at 3–3.4 mph. 5 min cooldown walk.',
            'incline treadmill walking intervals',
          ),
        ],
      },
    ],
  },
  thu: {
    title: 'Lower B + Core',
    sections: [
      { title: 'Warm-up', items: WARM_LOWER },
      {
        title: 'Strength',
        items: [
          superset(
            { tag: 'A1', n: 'Reverse Lunges', s: 3, t: '10 each leg' },
            { tag: 'A2', n: 'Hamstring Curl', s: 3, t: '12–15 reps' },
          ),
          superset(
            { tag: 'B1', n: 'Glute Bridge (2 sec squeeze)', s: 3, t: '12–15 reps' },
            { tag: 'B2', n: 'Hip Abduction (band or side-lying)', s: 3, t: '15 each leg' },
          ),
          lift('Cable Kickbacks', 3, '15 each leg'),
          lift('Step-Ups', 2, '12 each leg'),
          lift('Wall Sit', 2, '40–45 sec'),
        ],
      },
      {
        title: 'Core',
        items: [lift('Front Plank', 3, '50–60 sec'), lift('Side Plank', 2, '25–30 sec each side')],
      },
      {
        title: 'Finisher',
        items: [block('Incline treadmill walk', '12–15 min at 5–8% incline, 3–3.4 mph.')],
      },
    ],
  },
  fri: {
    title: 'Full Body Circuit',
    sections: [
      { title: 'Warm-up', items: WARM_LOWER },
      {
        title: 'Circuit · 3 rounds',
        items: [
          {
            circuit: true,
            group: [
              { n: 'Glute Bridge', s: 3, t: '12 reps' },
              { n: 'Lat Pulldown', s: 3, t: '12 reps' },
              { n: 'Step-Ups', s: 3, t: '10 each leg' },
              { n: 'Dumbbell Bench Press', s: 3, t: '10 reps' },
              { n: 'Cable Kickbacks', s: 3, t: '12 each leg' },
              { n: 'Face Pulls', s: 3, t: '15 reps' },
            ],
          },
        ],
      },
      {
        title: 'Core',
        items: [lift('Front Plank', 2, '50–60 sec'), lift('Pallof Press', 2, '10 each side')],
      },
      {
        title: 'Conditioning',
        items: [
          block(
            'Treadmill walk',
            '15–20 min steady, about 3–3.4 mph at 3–5% incline. No hard intervals today.',
            'incline treadmill walking',
          ),
        ],
      },
    ],
  },
}

export const isTraining = (day) => Object.hasOwn(PLAN, day)

/** Short form cues, keyed by exercise name. */
export const CUES = {
  '90/90 Hip Switches': 'Sit tall and rotate both knees from side to side, using your hands for balance. Move slowly.',
  'Hip Flexor Stretch': 'Half-kneeling, tuck your pelvis under and shift forward gently. Do not arch your lower back.',
  'Butterfly Stretch': 'Soles of the feet together, sit tall and let the knees relax. Do not force the stretch.',
  'Cat-Cow': 'On hands and knees, move slowly and gently between rounding and arching. Stay pain-free.',
  'Dead Hang': 'Hang from the bar with relaxed shoulders. Stop if you feel any pain in your back or shoulders.',
  'Arm Circles': 'Arms out to the sides, make smooth circles, start small and get bigger.',
  'Band Pull-Aparts': 'Arms straight in front, pull the band apart to chest level and squeeze the shoulder blades.',
  'Dead Bug': 'Back flat on the floor, lower the opposite arm and leg slowly. Keep your ribs down.',
  'Bird Dog': 'On hands and knees, reach the opposite arm and leg out. Keep your hips level and back still.',
  'Glute Bridge': 'Feet hip-width apart, ribs down. Squeeze glutes and stop when hips line up with knees and shoulders. No arching.',
  'Glute Bridge (2 sec squeeze)': 'Hold the top for 2 seconds, ribs down, no arching of the lower back.',
  'Step-Ups': 'Low box, whole foot on the step. Drive through the heel, lower slowly, keep your torso tall.',
  'Banded Lateral Walk': 'Band above the knees, slight knee bend, small steps. Toes forward, hips level.',
  'Bulgarian Split Squat': 'Stay upright and use a light load. Lower straight down, front knee over the toes.',
  'Hamstring Curl': 'Hips pressed into the pad. Curl smoothly and take 2 seconds on the way back.',
  'Cable Kickbacks': 'Hold the frame, small hip hinge. Kick back with the glute and keep your lower back still.',
  'Wall Sit': 'Back flat on the wall, thighs near parallel, knees over ankles. Pain-free depth only.',
  'Front Plank': 'Elbows under shoulders, straight line from head to heels. Squeeze glutes and abs, keep breathing.',
  'Side Plank': 'Elbow under shoulder, hips stacked and lifted. Straight line from head to feet.',
  'Lat Pulldown': 'Chest up, pull the bar to your upper chest. Elbows go down and back, no big lean.',
  'Dumbbell Bench Press': 'Feet flat, shoulder blades pinched. Lower to chest level and press without arching.',
  'Seated Cable Row': 'Tall spine, pull to the lower ribs, squeeze shoulder blades. Do not rock.',
  'Supported Shoulder Press': 'Back against the support. Press overhead without flaring the ribs.',
  'Face Pulls': 'Rope at eye level, elbows high. Pull apart and squeeze the rear shoulders.',
  'Lateral Raises': 'Light weights, raise to shoulder height with a slight elbow bend. No swinging.',
  'Knee Push-Ups': 'Straight line from knees to head. Lower chest to just above the floor.',
  'Dip Support Hold': 'Arms locked, shoulders pushed down away from your ears. Lift your body slightly.',
  'Scapular Dips': 'Arms straight. Let the shoulders rise and sink without bending the elbows.',
  'Pallof Press': 'Stand side-on to the cable. Press straight out and resist the rotation.',
  'Reverse Lunges': 'Step back, drop the back knee straight down, torso upright. Push through the front heel.',
  'Hip Abduction (band or side-lying)': 'Hips stacked, lift the top leg from the side of the hip. Do not roll backward.',
}
