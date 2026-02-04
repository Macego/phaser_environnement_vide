/***********************************************************************/
/** VARIABLES GLOBALES
/***********************************************************************/
var groupe_plateformes;
var player;
var clavier;

var groupe_etoiles;
var score = 0;
var zone_texte_score;

var groupe_bombes;
var gameOver = false;

/***********************************************************************/
/** CONFIGURATION + LANCEMENT DU JEU
/***********************************************************************/
var config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 300 },
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
/** PRELOAD : chargement des assets
/***********************************************************************/
function preload() {
  // fond + plateformes
  this.load.image("img_ciel", "src/assets/sky.png");
  this.load.image("img_plateforme", "src/assets/platform.png");

  // perso (spritesheet)
  this.load.spritesheet("img_perso", "src/assets/dude.png", {
    frameWidth: 32,
    frameHeight: 48
  });

  // étoiles + bombes
  this.load.image("img_etoile", "src/assets/star.png");

   this.load.image("img_bombe", "src/assets/bomb.png");
}

/***********************************************************************/
/** CREATE : création de la scène
/***********************************************************************/
function create() {
  /********** Fond **********/
  this.add.image(400, 300, "img_ciel");

  /********** Plateformes (statique) **********/
  groupe_plateformes = this.physics.add.staticGroup();

  // sol (2 plateformes)
  groupe_plateformes.create(200, 584, "img_plateforme");
  groupe_plateformes.create(600, 584, "img_plateforme");

  // plateformes en l'air
  groupe_plateformes.create(50, 300, "img_plateforme");
  groupe_plateformes.create(600, 450, "img_plateforme");
  groupe_plateformes.create(750, 270, "img_plateforme");

  /********** Joueur **********/
  player = this.physics.add.sprite(100, 450, "img_perso");
  player.setBounce(0.2);
  player.setCollideWorldBounds(true);

  // collisions joueur / plateformes
  this.physics.add.collider(player, groupe_plateformes);

  /********** Clavier **********/
  clavier = this.input.keyboard.createCursorKeys();

  /********** Animations **********/
  this.anims.create({
    key: "anim_tourne_gauche",
    frames: this.anims.generateFrameNumbers("img_perso", { start: 0, end: 3 }),
    frameRate: 10,
    repeat: -1
  });

  this.anims.create({
    key: "anim_face",
    frames: [{ key: "img_perso", frame: 4 }],
    frameRate: 20
  });

  this.anims.create({
    key: "anim_tourne_droite",
    frames: this.anims.generateFrameNumbers("img_perso", { start: 5, end: 8 }),
    frameRate: 10,
    repeat: -1
  });

  /********** Etoiles **********/
  groupe_etoiles = this.physics.add.group();

  // 10 étoiles réparties sur x
  for (var i = 0; i < 10; i++) {
    var coordX = 70 + 70 * i;
    groupe_etoiles.create(coordX, 10, "img_etoile");
  }

  // collisions étoiles / plateformes
  this.physics.add.collider(groupe_etoiles, groupe_plateformes);

  // rebond aléatoire sur Y
  groupe_etoiles.children.iterate(function (etoile_i) {
    var coef_rebond = Phaser.Math.FloatBetween(0.4, 0.8);
    etoile_i.setBounceY(coef_rebond);
  });

  // overlap joueur / étoiles => ramasser
  this.physics.add.overlap(player, groupe_etoiles, ramasserEtoile, null, this);

  /********** Score **********/
  score = 0;
  zone_texte_score = this.add.text(16, 16, "score: 0", {
    fontSize: "32px",
    fill: "#000"
  });

  /********** Bombes **********/
  groupe_bombes = this.physics.add.group();

  // collisions bombes / plateformes
  this.physics.add.collider(groupe_bombes, groupe_plateformes);

  // collision joueur / bombes => game over
  this.physics.add.collider(player, groupe_bombes, chocAvecBombe, null, this);

  /********** Etat partie **********/
  gameOver = false;
}

/***********************************************************************/
/** UPDATE : boucle de jeu (déplacements)
/***********************************************************************/
function update() {
  if (gameOver) {
    return;
  }

  // gauche / droite + animations
  if (clavier.left.isDown) {
    player.setVelocityX(-160);
    player.anims.play("anim_tourne_gauche", true);
  } else if (clavier.right.isDown) {
    player.setVelocityX(160);
    player.anims.play("anim_tourne_droite", true);
  } else {
    player.setVelocityX(0);
    player.anims.play("anim_face");
  }

  // saut : espace (ou touche haut selon createCursorKeys)
  if (clavier.space.isDown && player.body.touching.down) {
    player.setVelocityY(-330);
  }
}

/***********************************************************************/
/** CALLBACK : ramasser une étoile
/***********************************************************************/
function ramasserEtoile(un_player, une_etoile) {
  // désactive l'étoile
  une_etoile.disableBody(true, true);

  // +10 points
  score += 10;
  zone_texte_score.setText("Score: " + score);

  // si plus d'étoiles actives => régénérer + ajouter bombe
  if (groupe_etoiles.countActive(true) === 0) {
    // réactiver toutes les étoiles
    groupe_etoiles.children.iterate(function (etoile_i) {
      etoile_i.enableBody(true, etoile_i.x, 0, true, true);
    });

    // ajouter une bombe, loin du joueur
    var x;
    if (player.x < 400) {
      x = Phaser.Math.Between(400, 800);
    } else {
      x = Phaser.Math.Between(0, 400);
    }

    var une_bombe = groupe_bombes.create(x, 16, "img_bombe");
    une_bombe.setBounce(1);
    une_bombe.setCollideWorldBounds(true);
    une_bombe.setVelocity(Phaser.Math.Between(-200, 200), 20);
    une_bombe.allowGravity = false;
  }
}

/***********************************************************************/
/** CALLBACK : choc avec une bombe => fin de partie
/***********************************************************************/
function chocAvecBombe(un_player, une_bombe) {
  this.physics.pause();
  player.setTint(0xff0000);
  player.anims.play("anim_face");
  gameOver = true;
}