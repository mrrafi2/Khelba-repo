export type CharacterKey = "adventurer" | "player" | "female" | "soldier" | "zombie" | "ninja" | "yamin" | "jumaa" | "dog" | "smith" | "robot" | "barbara" | "zuba" | "deadan" | "sonic" | "samu" | "sketch" ;

export type MapKey = "default" | "desert" | "arctic" | "bangu" | "haunted" | "forest" | "beach";

export const CHAR_LIST: { key: CharacterKey; label: string; preview: string; poses: { walk1: string; walk2: string; walk3: string; jump?: string; hurt?: string; idle?: string ;  gif?: string;     
  video?: string;  } }[] = [

  {
    key: "adventurer",
    label: "Zack",
    preview: "/assets/chars/Adventurer/Poses/adventurer_walk1.png",
    poses: {
      walk1: "/assets/chars/Adventurer/Poses/adventurer_walk1.png",
      walk2: "/assets/chars/Adventurer/Poses/adventurer_walk2.png",
      jump: "/assets/chars/Adventurer/Poses/adventurer_jump.png",
      hurt: "/assets/chars/Adventurer/Poses/adventurer_hurt.png",
      idle: "/assets/chars/Adventurer/Poses/adventurer_walk1.png",
    },
  },
  {
    key: "zuba",
    label: "Boltu",
    preview: "/assets/chars/Zuba/poses/character_maleAdventurer_jump.png",
    poses: {
      walk1: "/assets/chars/Zuba/poses/character_maleAdventurer_run0.png",
      walk2: "/assets/chars/Zuba/poses/character_maleAdventurer_run1.png",
      walk3: "/assets/chars/Zuba/poses/character_maleAdventurer_run2.png",
      jump: "/assets/chars/Zuba/poses/character_maleAdventurer_jump.png",
      hurt: "/assets/chars/Zuba/poses/character_maleAdventurer_hit.png",
    },
  },


  {
    key: "yamin",
    label: "Butcher",
    preview: "/assets/chars/Yamin/yamin-1.png",
    poses: {
      walk1: "/assets/chars/Yamin/yamin-1.png",
      walk2: "/assets/chars/Yamin/yamin-2.png",
      jump: "/assets/chars/Yamin/yamin-jump.png",
      hurt: "/assets/chars/Yamin/yamin-hurt.png",
      idle: "/assets/chars/Yamin/yamin-1.png",
      video: "/assets/chars/Yamin/yamin.webm",
    },
  },

  {
    key: "ninja",
    label: "Ninja",
    preview: "/assets/chars/ninja/ninja-walk1.png",
    poses: {
      walk1: "/assets/chars/ninja/ninja-walk1.png",
      walk2: "/assets/chars/ninja/ninja-walk2.png",
      jump: "/assets/chars/ninja/ninja-jump.png",
      hurt: "/assets/chars/ninja/ninja-hurt.png",
      idle: "/assets/chars/ninja/ninja-idle.png",
    },
  },
  {
    key: "sonic",
    label: "Sonic",
    preview: "/assets/chars/sonic/sonic-1.png",
    poses: {
      walk1: "/assets/chars/sonic/sonic-1.png",
      walk2: "/assets/chars/sonic/sonic-2.png",
      walk3: "/assets/chars/sonic/sonic-3.png",
      jump: "/assets/chars/sonic/sonic-jump.png",
      hurt: "/assets/chars/sonic/sonic-hurt.png",
      idle: "/assets/chars/sonic/sonic-idle.png",
      video: "/assets/chars/sonic/sonic.webm",
    },
  },

   {
    key: "jumaa",
    label: "Jumaa",
    preview: "/assets/chars/Juma/Poses/character_femaleAdventurer_run1.png",
    poses: {
      walk1: "/assets/chars/Juma/Poses/character_femaleAdventurer_run0.png",
      walk2: "/assets/chars/Juma/Poses/character_femaleAdventurer_run1.png",
      walk3: "/assets/chars/Juma/Poses/character_femaleAdventurer_run2.png",
      jump: "/assets/chars/Juma/Poses/character_femaleAdventurer_jump.png",
      hurt: "/assets/chars/Juma/Poses/character_femaleAdventurer_hit.png",
    },
  },

    {
    key: "robot",
    label: "Robot",
    preview: "/assets/chars/Robot/PNG/Poses/character_robot_jump.png",
    poses: {
      walk1: "/assets/chars/Robot/PNG/Poses/character_robot_run0.png",
      walk2: "/assets/chars/Robot/PNG/Poses/character_robot_run1.png",
      walk3: "/assets/chars/Robot/PNG/Poses/character_robot_run2.png",
      jump: "/assets/chars/Robot/PNG/Poses/character_robot_jump.png",
      hurt: "/assets/chars/Robot/PNG/Poses/character_robot_hit.png",
    },
  },

    {
    key: "samu",
    label: "Samurai",
    preview: "/assets/chars/samu/samu-1.png",
    poses: {
      walk1: "/assets/chars/samu/samu-1.png",
      walk2: "/assets/chars/samu/samu-2.png",
      walk3: "/assets/chars/samu/samu-3.png",
      jump: "/assets/chars/samu/samu-jump.png",
      hurt: "/assets/chars/samu/samu-hurt.png",
      idle: "/assets/chars/samu/samu-1.png",
      video: "/assets/chars/samu/samu.webm",
    },
  },


  {
    key: "dog",
    label: "Dog",
    preview: "/assets/chars/dog/dog-1.png",
    poses: {
      walk1: "/assets/chars/dog/dog-1.png",
      walk2: "/assets/chars/dog/dog-2.png",
      walk3: "/assets/chars/dog/dog-3.png",
      jump: "/assets/chars/dog/dog-jump.png",
      hurt: "/assets/chars/dog/dog-hurt.png",
      video: "/assets/chars/dog/dog.webm",
    },
  },

  {
    key: "barbara",
    label: "Barbara",
    preview: "/assets/chars/Barbara/Poses/character_femalePerson_jump.png",
    poses: {
      walk1: "/assets/chars/Barbara/Poses/character_femalePerson_run0.png",
      walk2: "/assets/chars/Barbara/Poses/character_femalePerson_run1.png",
      walk3: "/assets/chars/Barbara/Poses/character_femalePerson_run2.png",
      jump: "/assets/chars/Barbara/Poses/character_femalePerson_jump.png",
      hurt: "/assets/chars/Barbara/Poses/character_femalePerson_hit.png",
    },
  },


    {
    key: "smith",
    label: "Smith",
    preview: "/assets/chars/biks/Poses/character_malePerson_run1.png",
    poses: {
      walk1: "/assets/chars/biks/Poses/character_malePerson_run0.png",
      walk2: "/assets/chars/biks/Poses/character_malePerson_run1.png",
      walk3: "/assets/chars/biks/Poses/character_malePerson_run2.png",
      jump: "/assets/chars/biks/Poses/character_malePerson_jump.png",
      hurt: "/assets/chars/biks/Poses/character_malePerson_hit.png",
    },
  },

    {
    key: "deadan",
    label: "Zombie",
    preview: "/assets/chars/Bekus/Poses/character_zombie_hit.png",
    poses: {
      walk1: "/assets/chars/Bekus/Poses/character_zombie_run0.png",
      walk2: "/assets/chars/Bekus/Poses/character_zombie_run1.png",
      walk3: "/assets/chars/Bekus/Poses/character_zombie_run2.png",
      jump: "/assets/chars/Bekus/Poses/character_zombie_jump.png",
      hurt: "/assets/chars/Bekus/Poses/character_zombie_hit.png",
    },
  },

    {
    key: "sketch",
    label: "Invisible Lady",
    preview: "/assets/chars/sketch/sketch-1.png",
    poses: {
      walk1: "/assets/chars/sketch/sketch-1.png",
      walk2: "/assets/chars/sketch/sketch-2.png",
      walk3: "/assets/chars/sketch/sketch-3.png",
      jump: "/assets/chars/sketch/sketch-jump.png",
      hurt: "/assets/chars/sketch/sketch-hurt.png",
      video: "/assets/chars/sketch/sketch.webm",
    },
  },

 {
    key: "soldier",
    label: "Soldier",
    preview: "/assets/chars/soldier-2/soldier-1.png",
    poses: {
      walk1: "/assets/chars/soldier-2/soldier-1.png",
      walk2: "/assets/chars/soldier-2/soldier-2.png",
      walk3: "/assets/chars/soldier-2/soldier-3.png",
      jump: "/assets/chars/soldier-2/soldier-jump.png",
      hurt: "/assets/chars/soldier-2/soldier-hurt.png",
      video: "/assets/chars/soldier-2/soldier.webm",
    },
  },


];

export const MAP_LIST: { key: MapKey; label: string; short: string; preview: string; bg: string ; bgVideo?: string; bgPoster?: string }[] = [

  { key: "default", label: "Clovara", short: "Classic grassy run", preview: "/assets/bg/meadowa.jpg", bg: "/assets/bg/meadows.jpg" },

  { key: "desert", label: "Jarhanpur", short: "Sand, cacti, sandstorm", preview: "/assets/bg/desert-2.jpg", bg: "/assets/bg/desert-2.jpg", },

  { key: "arctic", label: "Siberia", short: "Snow, spruce, snowfall", preview: "/assets/bg/arctic bg.jpg", bg: "/assets/bg/arctic.jpg",  },

  { key: "bangu", label: "Banguland", short: "Broken City, bangus, BAL", preview: "/assets/bg/bangu bg.jpg", bg: "/assets/bg/bangu bg.jpg" },

  { key: "haunted", label: "Tortuga", short: "Fog, dead trees, shadows", preview: "/assets/bg/haunted bg.jpg", bg: "/assets/bg/haunted.png" },

  { key: "forest", label: "Verdantis", short: "Dense forest — moss, mushrooms, leaf litter", preview: "/assets/bg/forest2.jpg", bg: "/assets/bg/forest2.jpg" },

{ key: "beach", label: "Seabreak", short: "Sandy shore — waves, shells, palms", preview: "/assets/bg/beach.jpg", bg: "/assets/bg/beach.jpg",  },
];

