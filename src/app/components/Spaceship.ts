import { Laser } from "./Laser";
import { settings } from "./settings";

export class Spaceship {
  x: number;
  y: number;
  rotation: number;
  velocity: { x: number; y: number };
  acceleration: number;
  maxSpeed: number;
  rotationSpeed: number;
  friction: number;
  image: HTMLImageElement;
  imageLoaded: boolean;
  devicePixelRatio: number;

  // Laser gun properties
  ammo: number;
  maxAmmo: number;
  ammoRechargeRate: number;
  lastShotTime: number;
  shotCooldown: number;
  laserSpeed: number;

  // Size properties
  size: number;

  constructor(x: number, y: number, devicePixelRatio = 1) {
    this.x = x;
    this.y = y;
    this.rotation = 0;
    this.velocity = { x: 0, y: 0 };
    this.acceleration = 0.2;
    this.maxSpeed = 5;
    this.rotationSpeed = 3;
    this.friction = 1.0;
    this.imageLoaded = false;
    this.devicePixelRatio = devicePixelRatio;

    // Load spaceship image
    this.image = new Image();
    this.image.onload = () => {
      this.imageLoaded = true;
    };
    this.image.src = "/spaceship.png";

    // Laser gun properties
    this.ammo = 100;
    this.maxAmmo = 100;
    this.ammoRechargeRate = 0.5;
    this.lastShotTime = 0;
    this.shotCooldown = 10; // Frames between shots
    this.laserSpeed = 10;

    // Size properties
    this.size = settings.game.ship_size;
  }

  update(canvas: HTMLCanvasElement): void {
    // No friction in space, so we don't need to apply it
    // this.velocity.x *= this.friction;
    // this.velocity.y *= this.friction;

    // Update position
    this.x += this.velocity.x;
    this.y += this.velocity.y;

    // Wrap around screen - use the CSS dimensions (visible area) instead of canvas dimensions
    const visibleWidth = canvas.width / this.devicePixelRatio;
    const visibleHeight = canvas.height / this.devicePixelRatio;

    if (this.x < 0) this.x = visibleWidth;
    if (this.x > visibleWidth) this.x = 0;
    if (this.y < 0) this.y = visibleHeight;
    if (this.y > visibleHeight) this.y = 0;

    // Recharge ammo when not shooting
    if (this.ammo < this.maxAmmo) {
      this.ammo = Math.min(this.maxAmmo, this.ammo + this.ammoRechargeRate);
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    if (this.imageLoaded) {
      // Draw spaceship image
      const imageSize = this.size * 2;
      ctx.drawImage(
        this.image,
        -imageSize / 2,
        -imageSize / 2,
        imageSize,
        imageSize
      );
    } else {
      // Fallback to triangle if image is not loaded
      ctx.beginPath();
      ctx.moveTo(this.size * 1.3, 0);
      ctx.lineTo(-this.size * 0.7, this.size * 0.7);
      ctx.lineTo(-this.size * 0.7, -this.size * 0.7);
      ctx.closePath();
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.strokeStyle = "#666";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Draw ammo bar
    const ammoBarWidth = this.size * 2;
    const ammoBarHeight = this.size * 0.3;
    const ammoPercentage = this.ammo / this.maxAmmo;

    // Background
    ctx.fillStyle = "#333";
    ctx.fillRect(-this.size, -this.size * 1.5, ammoBarWidth, ammoBarHeight);

    // Ammo level
    ctx.fillStyle = ammoPercentage > 0.3 ? "#0f0" : "#f00";
    ctx.fillRect(
      -this.size,
      -this.size * 1.5,
      ammoBarWidth * ammoPercentage,
      ammoBarHeight
    );

    ctx.restore();
  }

  accelerate(): void {
    const radians = this.rotation;
    this.velocity.x += Math.cos(radians) * this.acceleration;
    this.velocity.y += Math.sin(radians) * this.acceleration;

    // Limit speed
    const speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
    if (speed > this.maxSpeed) {
      this.velocity.x = (this.velocity.x / speed) * this.maxSpeed;
      this.velocity.y = (this.velocity.y / speed) * this.maxSpeed;
    }
  }

  decelerate(): void {
    // Instead of decelerating, we'll apply a reverse thrust
    const radians = this.rotation;
    this.velocity.x -= Math.cos(radians) * this.acceleration;
    this.velocity.y -= Math.sin(radians) * this.acceleration;
  }

  rotateLeft(): void {
    this.rotation -= (this.rotationSpeed * Math.PI) / 180;
  }

  rotateRight(): void {
    this.rotation += (this.rotationSpeed * Math.PI) / 180;
  }

  shoot(frameCount: number): Laser | null {
    // Check if we have ammo and cooldown has passed
    if (this.ammo > 0 && frameCount - this.lastShotTime >= this.shotCooldown) {
      this.ammo -= 10; // Use 10 ammo per shot
      this.lastShotTime = frameCount;

      // Calculate laser starting position (at the tip of the gun)
      const gunLength = this.size * 1.3;
      const laserX = this.x + Math.cos(this.rotation) * gunLength;
      const laserY = this.y + Math.sin(this.rotation) * gunLength;

      return new Laser(
        laserX,
        laserY,
        this.rotation,
        this.laserSpeed,
        this.devicePixelRatio
      );
    }

    return null;
  }
}
