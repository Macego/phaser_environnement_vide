/***********************************************************************/
/** VARIABLES GLOBALES
/***********************************************************************/
var player;
var clavier;
var carteDuNiveau;
var calque_plateformes;

/***********************************************************************/
/** CONFIGURATION
/***********************************************************************/
var config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 500 },
      debug: false
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

new Phaser.Game(config);

/***********************************************************************/
/** PRELOAD
/***********************************************************************/
function preload() {


  this.load.image("tuiles_de_jeu", "src/assets/tuilesJeu.png");

  
  this.load.tilemapTiledJSON("carte", "src/assets/map.json");

  
  this.load.spritesheet("img_perso", "src/assets/dude.png", {
    frameWidth: 32,
    frameHeight: 48
  });
}

/***********************************************************************/
/** CREATE
/***********************************************************************/
function create() {

  /*********** Carte ***********/
  carteDuNiveau = this.make.tilemap({ key: "carte" });

  const tileset = carteDuNiveau.addTilesetImage(
    "tuilesJeu",   
    "tuiles_de_jeu"
  );

  
  carteDuNiveau.createLayer("calque_plateformes", tileset, 0, 0);
  carteDuNiveau.createLayer("calque_background", tileset, 0, 0);
  calque_plateformes = carteDuNiveau.createLayer("calque_background_2", tileset, 0, 0);

  
  calque_plateformes.setCollisionByProperty({ estSolide: true });

  
  player = this.physics.add.sprite(100, 200, "img_perso");
  player.setBounce(0);
  player.setCollideWorldBounds(true);

  this.physics.add.collider(player, calque_plateformes);

  
  this.physics.world.setBounds(0, 0, carteDuNiveau.widthInPixels, carteDuNiveau.heightInPixels);
  this.cameras.main.setBounds(0, 0, carteDuNiveau.widthInPixels, carteDuNiveau.heightInPixels);
  this.cameras.main.startFollow(player);

  
  clavier = this.input.keyboard.createCursorKeys();


  this.anims.create({
    key: "anim_gauche",
    frames: this.anims.generateFrameNumbers("img_perso", { start: 0, end: 3 }),
    frameRate: 10,
    repeat: -1
  });

  this.anims.create({
    key: "anim_idle",
    frames: [{ key: "img_perso", frame: 4 }],
    frameRate: 20
  });

  this.anims.create({
    key: "anim_droite",
    frames: this.anims.generateFrameNumbers("img_perso", { start: 5, end: 8 }),
    frameRate: 10,
    repeat: -1
  });
}


/***********************************************************************/
/** UPDATE
/***********************************************************************/
function update() {

  if (clavier.left.isDown) {
    player.setVelocityX(-200);
    player.anims.play("anim_gauche", true);
  }
  else if (clavier.right.isDown) {
    player.setVelocityX(200);
    player.anims.play("anim_droite", true);
  }
  else {
    player.setVelocityX(0);
    player.anims.play("anim_idle", true);
  }

  if (clavier.up.isDown && player.body.blocked.down) {
    player.setVelocityY(-300);
  }
} 