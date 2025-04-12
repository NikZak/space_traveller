// Game settings
export const settings = {
  game: {
    initial_score: 0,
    initial_lives: 3,
    lives_size: 7,
    ship_size: 15,
    enemy_sizes: {
      scout: 12,
      fighter: 18,
      destroyer: 25,
    },
    enemy_spawn_interval: 300,
    min_enemy_spawn_interval: 120,
    enemy_spawn_timer: 0,
  },
  display: {
    device_pixel_ratio: 1.0,
  },
  planets: {
    count: 5,
    min_radius: 15,
    max_radius: 40,
    colors: ["#4B0082", "#800080", "#9932CC", "#8A2BE2", "#9370DB"],
  },
  enemies: {
    scout_probability: 0.7,
    fighter_probability: 0.25,
    destroyer_probability: 0.05,
    scout_score: 100,
    fighter_score: 250,
    destroyer_score: 500,
    spawn_offset: 50,
    scout: {
      shoot_cooldown: 300,
      health: 30,
      max_speed: 1.0,
      min_speed: 0.2,
      acceleration: 0.03,
      deceleration: 0.02,
      rotation_speed: 0.01,
      rotation_inertia: 0.99,
      acceleration_distance: 150,
      deceleration_distance: 50,
    },
    fighter: {
      shoot_cooldown: 240,
      health: 60,
      max_speed: 1.0,
      min_speed: 0.2,
      acceleration: 0.04,
      deceleration: 0.025,
      rotation_speed: 0.04,
      rotation_inertia: 0.92,
      acceleration_distance: 180,
      deceleration_distance: 80,
    },
    destroyer: {
      max_speed: 0.6,
      min_speed: 0.5,
      acceleration: 0.05,
      deceleration: 0.03,
      rotation_speed: 0.02,
      rotation_inertia: 0.95,
      acceleration_distance: 200,
      deceleration_distance: 100,
      shoot_cooldown: 180,
      health: 100,
    },
  },
  rockets: {
    lifetime_ms: 5000,
    rocket_score: 10,
  },
  controls: {
    up_key: "ArrowUp",
    down_key: "ArrowDown",
    left_key: "ArrowLeft",
    right_key: "ArrowRight",
    shoot_key: " ",
    restart_key: "r",
  },
} as const;
