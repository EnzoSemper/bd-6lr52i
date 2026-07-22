/* ============================================================
   ALTIMIT OS — content & lore
   Static seed data for the desktop apps. Everything here is
   in-universe flavor from "The World R:2" (.hack//G.U.).
   ============================================================ */

const ALTIMIT_DATA = {

  system: {
    version: "Altimit OS  Ver. 2.11",
    build: "cc-corp / build 20170703",
    copyright: "© CC Corporation. All Rights Reserved.",
  },

  /* ---- MAIL ---- inbox for the local account ---- */
  mail: [
    {
      id: "m9",
      from: "Aina",
      subject: "He woke up",
      date: "07/16",
      unread: true,
      body:
`{USER},

Ender opened his eyes this morning. The doctors don't understand it. Six
days gone and then, just like that, awake.

But he won't talk right. Before he'd say anything to me he asked for a pen
and wrote three words down and made me promise no one would ever enter
them as a keyword. He wouldn't say why. He just kept looking at the window
like something outside was looking back.

I'm not sending you the words. I'm sorry. I don't think they're mine to
give anymore.

Thank you for looking for him. You were the only one who did.

— Aina`,
    },
    {
      id: "m10",
      from: "Kuhn",
      subject: "the pattern holds",
      date: "07/15",
      unread: true,
      body:
`Fearless leader.

I did the thing you told me not to do. I mapped it. Every player who went
under cleared an area whose third keyword isn't in any list CC Corp ever
published. Not rare words. Impossible ones. The server shouldn't accept
them, and it does, every time, and it always builds the same kind of place:
deep, dark, and waiting.

Plot the areas on the server map and the coordinates aren't random. They
point at something. One location, under everything.

Meet me in Mac Anu, back canal, tonight. Come alone. Don't bring this to
the Raid Team, they already know, and knowing is exactly the problem.

— Kuhn`,
    },
    {
      id: "m1",
      from: "Atoli",
      subject: "About yesterday...",
      date: "07/14",
      unread: true,
      body:
`{USER},

I'm sorry about how the raid ended. I know you don't like it when I heal
instead of falling back, but I couldn't just leave you standing in the
open like that.

Sakaki asked about you again. I told him you weren't interested in the
Moon Tree. I hope that was alright.

Log on tonight? Just the two of us. No PKers, I promise.

— Atoli`,
    },
    {
      id: "m2",
      from: "Ovan",
      subject: "You are looking in the wrong place",
      date: "07/13",
      unread: true,
      body:
`The power you want isn't at the top of the arena ladder.

You already carry it. You simply haven't been made to use it yet.

When the time comes, don't hesitate. Hesitation is how you lost her.

— Ovan`,
    },
    {
      id: "m3",
      from: "Kuhn",
      subject: "Canard business",
      date: "07/12",
      unread: false,
      body:
`Hey, our fearless Guild Master here.

Membership's up to nineteen. Silabus is handling the newbies, so don't
worry about the low-levels bugging you. I flagged three areas with weird
data readings — sending the keywords in a separate mail. Might be nothing.
Might be an AIDA nest. You know which one I'm hoping for.

Try not to PK anyone important this week.

— Kuhn, Steam Gunner`,
    },
    {
      id: "m4",
      from: "Pi  (Serpent of Lore)",
      subject: "[Project G.U.] Data request",
      date: "07/11",
      unread: false,
      body:
`Adept Rogue.

Raid Team wants your combat logs from the last three Doppelganger
encounters. Do not edit them this time. We know when you trim the
inconvenient parts.

Cooperate and Yata may authorize your access to the deeper zones.

— Pi`,
    },
    {
      id: "m5",
      from: "CC Corp Customer Support",
      subject: "Scheduled maintenance — Δ Server",
      date: "07/10",
      unread: false,
      body:
`Dear Player,

The Δ (Delta) server will undergo scheduled maintenance:
  07/17  02:00 – 06:00

During this window The World R:2 will be inaccessible. We apologize for
the inconvenience. Recent reports of "unregistered phenomena" during
combat are under investigation; please continue to submit ticket data
through the in-client reporter.

Thank you for playing The World.

— CC Corp Customer Support`,
    },
    {
      id: "m7",
      from: "Gaspard",
      subject: "have you seen Ender?",
      date: "07/12",
      unread: true,
      body:
`{USER},

Ender hasn't logged in for six days. That's not like him, he plays more
than anyone. His sister messaged the guild. She says he won't wake up.
The hospital doesn't know why.

The last thing he did in The World was clear a Δ area with a red "!" on
it. I know Silabus says not to worry the newbies but you've seen things.
Is this real? Please tell me it's just a coincidence.

— Gaspard`,
    },
    {
      id: "m8",
      from: "Yata  (Project G.U.)",
      subject: "You will keep this to yourself",
      date: "07/11",
      unread: false,
      body:
`We are aware of the comas. We are aware you are aware.

The phenomenon has a name we do not use on open channels. It is not a
bug. It is not a virus. It behaves as though it is looking for something
inside the players it takes, and it is getting better at finding it.

Continue your hunts. Log everything. Tell no one outside the team. If
you see a wave of black where there should be none, you log out. You do
not investigate. That is not a request.

— Yata`,
    },
    {
      id: "m6",
      from: "unknown@????",
      subject: "................",
      date: "--/--",
      unread: true,
      corrupt: true,
      body:
`can y u he r me
th e wave is c o ming
sh e is st il l in her e, in the fragm ent
do not  wa ke  the eig h th
                                    [DATA CORRUPTED]`,
    },
  ],

  /* ---- NEWS ---- The World R:2 official news feed ---- */
  news: [
    {
      id: "n1",
      tag: "EVENT",
      title: "Demon Palace Arena — Holy Palace Qualifiers Open",
      date: "2017/07/15",
      body:
`Registration for the Holy Palace tournament is now open on all servers.
Teams of three may enter. The reigning Emperor, "Endrance," has confirmed
his title defense. New challengers are encouraged — glory (and rare item
drops) await the victors.`,
    },
    {
      id: "n2",
      tag: "NOTICE",
      title: "On Reports of Player Comas",
      date: "2017/07/13",
      body:
`CC Corp is aware of circulating rumors linking The World R:2 to a small
number of players who have not regained consciousness after logging out.
We wish to state clearly: there is no verified connection between our
service and these unfortunate cases. The World R:2 is safe. Please
disregard unofficial "AIDA" message-board speculation.`,
    },
    {
      id: "n3",
      tag: "UPDATE",
      title: "Ver. 2.11 Patch Notes",
      date: "2017/07/09",
      body:
`- Adjusted drop rates in Lv. 90+ fields.
- Fixed a Chim Chim duplication exploit near root towns.
- Guild warehouse capacity increased.
- Known issue: certain areas generate with unlisted keywords. Do not
  attempt to enter areas flagged with a red "!" symbol.`,
    },
    {
      id: "n4",
      tag: "EVENT",
      title: "Summer Login Campaign",
      date: "2017/07/01",
      body:
`Log in any day this month to receive a "Fireworks" item and bonus GP.
Celebrate the season in Mac Anu, Dol Dona, and Lumina Cloth!`,
    },
  ],

  /* ---- BBS ---- forum threads ---- */
  bbs: [
    {
      id: "b1",
      board: "The World / General",
      title: "Anyone else seeing the black spots?",
      author: "sakubo",
      replies: 47,
      posts: [
        { author: "sakubo", body: "Was farming in a Δ area and the whole screen kind of... inverted? For like half a second. Black mist. Then my char wouldn't respond. Anyone?" },
        { author: "GutsMaxx", body: "lag lol" },
        { author: "sakubo", body: "It wasn't lag. My friend saw it too from her own client. Same second." },
        { author: "quietone", body: "Don't post about it here. They watch this board." },
        { author: "GutsMaxx", body: "^ tinfoil" },
      ],
    },
    {
      id: "b2",
      board: "The World / Guilds",
      title: "[Recruiting] Canard — beginners welcome!",
      author: "Silabus",
      replies: 12,
      posts: [
        { author: "Silabus", body: "Canard is a small friendly guild for new players! No level requirement. We do daily quests and help with the arena. Come find me or Gaspard in Mac Anu!" },
        { author: "Gaspard", body: "It's true! We're very nice. Mostly." },
        { author: "Silabus", body: "Our Guild Master is... intense, but he's a good person underneath. Really." },
      ],
    },
    {
      id: "b3",
      board: "The World / PKing",
      title: "The Terror of Death is back??",
      author: "redWraith",
      replies: 88,
      posts: [
        { author: "redWraith", body: "Got jumped by an Adept Rogue near a Chaos Gate. Three hits. THREE. Data-drained me. Who even IS this guy" },
        { author: "bishop_04", body: "Haseo. He hunts PKers now. Ironic since he's basically the biggest PKer alive." },
        { author: "redWraith", body: "he can keep the title. i'm rolling a new char on the other server" },
      ],
    },
    {
      id: "b4",
      board: "The World / Help",
      title: "How do I beat my rival in the arena?",
      author: "newbie_A",
      replies: 5,
      posts: [
        { author: "newbie_A", body: "keep losing to the same team. tips?" },
        { author: "Kuhn", body: "Read the enemy's opening. Most players commit to a combo and can't cancel it. Bait the commit, sidestep, punish. Also: level up. There's no shortcut for level." },
      ],
    },
    {
      id: "b5",
      board: "The World / General",
      title: "list of players who haven't woken up (updated)",
      author: "watcher_zero",
      replies: 213,
      posts: [
        { author: "watcher_zero", body: "Keeping a running list. If you know a player who collapsed IRL after logging out, add their handle. I count 41 now across all servers. CC Corp says there's no connection. 41 says otherwise." },
        { author: "mod_delta", body: "This thread violates the terms of service. Speculation about player health is not permitted. Locking in 24h." },
        { author: "watcher_zero", body: "Every one of them cleared an area with a keyword combo that shouldn't generate. Ask yourself why the servers accept a word that isn't in any list." },
        { author: "quietone", body: "I told you they watch this board. Don't use your main to post here." },
        { author: "[deleted]", body: "[post removed by moderator]" },
      ],
    },
    {
      id: "b6",
      board: "The World / General",
      title: "watcher_zero's account was deleted. so was the list.",
      author: "quietone",
      replies: 156,
      posts: [
        { author: "quietone", body: "Account gone. Not banned. Deleted, like it never existed. The list thread is gone too. I saved a copy before it went. 41 became 47 this week." },
        { author: "Silabus", body: "Please, everyone, just be careful out there. Don't chase this. If an area generates with a word you didn't type, leave. Don't be brave about it." },
        { author: "quietone", body: "One of them woke up. Did anyone else hear? The kid in the north hospital. His sister posted for a day and then she went quiet too. He wrote down three words and made her burn the paper." },
        { author: "an_endrance_fan", body: "why three words. why is it always three words." },
        { author: "quietone", body: "Because that's how you open a door. You've all opened a thousand of them. You just never wondered what was on the other side listening." },
      ],
    },
  ],

  /* ---- MEDIA ---- player playlist (audio is synthesized live) ---- */
  media: [
    { id: "t1", title: "Altimit Ambient",       artist: "System",     seconds: 184, tone: "ambient"  },
    { id: "t2", title: "Mac Anu — Aqua Capital", artist: "The World",  seconds: 212, tone: "town"     },
    { id: "t3", title: "Chaos Gate",             artist: "The World",  seconds: 96,  tone: "gate"     },
    { id: "t4", title: "The Terror of Death",    artist: "The World",  seconds: 150, tone: "battle"   },
    { id: "t5", title: "Aura's Theme",           artist: "The World",  seconds: 240, tone: "aura"     },
  ],

  /* ---- DATA ---- save slots ---- */
  saves: [
    {
      slot: 1,
      character: "Haseo",
      klass: "Adept Rogue",
      level: 133,
      area: "Mac Anu",
      playtime: "142:19",
      gp: 48210,
    },
    {
      slot: 2,
      character: "(empty)",
      klass: "—",
      level: 0,
      area: "—",
      playtime: "00:00",
      gp: 0,
      empty: true,
    },
    {
      slot: 3,
      character: "(empty)",
      klass: "—",
      level: 0,
      area: "—",
      playtime: "00:00",
      gp: 0,
      empty: true,
    },
  ],

  /* ---- pre-boot POST / firmware lines ---- */
  postLog: [
    "CC-CORP FIRMWARE  v4.02",
    "CyberConnect System BIOS",
    "(C) CC Corporation",
    "",
    "Main Processor : Aureole Core @ 3.60 GHz",
    "Memory Testing : 16384M ...... OK",
    "",
    "Detecting CC-NET adapter ...... found",
    "Detecting primary storage [ALTIMIT] ...... found",
    "Detecting neural interface ...... OK",
    "",
    "Verifying boot signature ...... OK",
    "Starting Altimit Multi OS",
  ],

  /* ---- boot log lines ---- */
  bootLog: [
    "ALTIMIT MULTI OS  ...  OK",
    "checking system integrity ...  OK",
    "mounting /home/user ...  OK",
    "network interface  [CC-NET]  ...  established",
    "authenticating account ...  verified",
    "loading desktop environment ...",
    "restoring session ...",
    "WARNING: unregistered process detected  ...  [ignored]",
    "welcome.",
  ],
};

/* theme presets for Settings — the three canonical Altimit wallpapers.
   Each drives the desktop gradient, the UI accent, and shard tint. */
const ALTIMIT_THEMES = {
  blue: {
    name: "Altimit Blue",
    hi: "#1f8bff", hi2: "#0a5fd6", ink: "#0a2340",
    wall: "linear-gradient(105deg,#7fbcff 0%,#2f86ff 30%,#0f63f0 62%,#e9f2ff 100%)",
    band: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,.85) 7%, rgba(255,255,255,0) 15%)",
    shard: "255,255,255", hex: false,
  },
  orange: {
    name: "Altimit Orange",
    hi: "#ff8a1f", hi2: "#e0621a", ink: "#3a2410",
    wall: "linear-gradient(105deg,#ffb347 0%,#ff8f12 32%,#f57900 60%,#fff3e2 100%)",
    band: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,.8) 7%, rgba(255,255,255,0) 15%)",
    shard: "255,255,255", hex: false,
  },
  mono: {
    name: "Altimit Mono",
    // ink stays dark: menus/windows/taskbar are light surfaces; the dark
    // desktop's own labels are hardcoded white and don't use --ink.
    hi: "#7a828e", hi2: "#4b5560", ink: "#1b2129",
    wall: "linear-gradient(105deg,#141414 0%,#0a0a0a 40%,#000 100%)",
    band: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(120,120,120,.35) 6%, rgba(255,255,255,0) 14%)",
    shard: "220,225,230", hex: true,
  },
};

/* Chaos Gate area generation — three keywords deterministically pick an
   area's attributes, the way The World warps players by word. */
const AREA_GEN = {
  servers: ["Δ Delta", "θ Theta", "Λ Lambda", "Σ Sigma", "Ω Omega"],
  elements: ["Fire", "Aqua", "Thunder", "Earth", "Wood", "Dark", "Light"],
  weathers: ["Clear", "Rain", "Snow", "Fog", "Twilight", "Aurora", "Ashfall"],
  // field theme by third keyword bucket
  fields: [
    "Hidden Forbidden Grounds", "Buried Sea of Sand", "Quiet Frozen Vale",
    "Chosen Hopeless Nightfall", "Bursting Passed-Over Aqua Field",
    "Sombre Onslaught's Dawn", "Closed Wound-of-Sun", "Silent Sacred Marsh",
    "Beautiful Foolish Verdure", "Indiscreet Gluttonous Edge",
  ],
  // adjectives feeding the "danger read"
  reads: [
    "Nothing unusual detected.", "Trace data noise on the field.",
    "Minor unregistered activity.", "Distortion in the area readout.",
    "WARNING: unlisted keyword accepted.", "WARNING: area flagged with a red '!'.",
  ],
  monsters: [
    "Goblins, Headless clan", "Snaksh, Deinos packs", "Armor Golems",
    "Mirage colony", "Chim Chims (harmless)", "Data Bugs", "AIDA-type (unconfirmed)",
  ],
};
