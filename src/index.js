/***********************************************************************/
/** VARIABLES GLOBALES
/***********************************************************************/
var player;
var clavier;
var carteDuNiveau;
var calque_plateformes;
var chronoText;
var monTimer;
var chrono = 0;
var bouton_stop_resume;
var bouton_reset;
var stopped = false;
var instructionsText;
var spawnX = 100;
var spawnY = 200;
var alerteTimer;
var alerteText;
var nombreDeSauts = 0;
var meilleurScore = 0;
var scoreText;
var zoneFin;


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

  
  player = this.physics.add.sprite(spawnX, spawnY, "img_perso");
  player.setBounce(0);
  player.setCollideWorldBounds(true);

  zoneFin = this.add.zone(1700, 200, 120, 100);
this.physics.world.enable(zoneFin);
zoneFin.body.setAllowGravity(false);
zoneFin.body.setImmovable(true);

this.physics.add.overlap(player, zoneFin, niveauTermine, null, this);


var debugZone = this.add.rectangle(1700, 200, 60, 80, 0x00ff00, 0.4);



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
  /*********** Chronomètre ***********/
chronoText = this.add.text(16, 16, "Chrono: 0", {
  fontSize: "24px",
  fill: "#FFFFFF"
});

chronoText.setScrollFactor(0);

scoreText = this.add.text(16, 70, "Meilleur score: --", {
  fontSize: "20px",
  fill: "#FFD700"
});
scoreText.setScrollFactor(0);

monTimer = this.time.addEvent({
  delay: 1000,
  callback: compteUneSeconde,
  callbackScope: this,
  loop: true
});

instructionsText = this.add.text(16, 40,
"S : stopper / relancer le chrono\nR : reinitialiser le chrono",
{
  fontSize: "20px",
  fill: "#FFFFFF"
});

instructionsText.setScrollFactor(0);

bouton_stop_resume = this.input.keyboard.addKey("S");
bouton_reset = this.input.keyboard.addKey("R");

alerteText = this.add.text(250, 80, "", {
  fontSize: "28px",
  fill: "#FF0000"
});

alerteText.setScrollFactor(0);

alerteTimer = this.time.addEvent({
  delay: 10000,
  callback: afficherAlerte,
  callbackScope: this,
  loop: true
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

 if (Phaser.Input.Keyboard.JustDown(clavier.up) && nombreDeSauts < 2) {

  player.setVelocityY(-300);
  nombreDeSauts++;

}

if (player.body.blocked.down) {
  nombreDeSauts = 0;
}  

  // reset du chrono (bouton R)
if (Phaser.Input.Keyboard.JustDown(bouton_reset)) {

  chrono = 0;
  chronoText.setText("Chrono: " + chrono);

  monTimer.reset({
    delay: 1000,
    callback: compteUneSeconde,
    callbackScope: this,
    loop: true
  });

}


// pause / reprise (bouton S)
if (Phaser.Input.Keyboard.JustDown(bouton_stop_resume)) {

  if (stopped == false) {

    monTimer.reset({ paused: true });
    stopped = true;

  } else {

    monTimer.reset({
      delay: 1000,
      callback: compteUneSeconde,
      callbackScope: this,
      loop: true
    });

    stopped = false;

  }

}

if (player.y > carteDuNiveau.heightInPixels) {
  mortJoueur();
}

// Sortie par la gauche ou la droite → respawn
if (player.x < 0 || player.x > carteDuNiveau.widthInPixels) {
  mortJoueur();
}

// Sortie par le haut (très rare mais possible)
if (player.y < 0) {
  player.setVelocityY(0);
}

} 

function compteUneSeconde() {

  chrono = chrono + 1;

  chronoText.setText("Chrono: " + chrono);

}

function mortJoueur() {
  // Calcul du score : plus le chrono est bas, plus le score est élevé
  if (chrono > 0) {
    var score = Math.max(0, 1000 - chrono * 10);
    if (score > meilleurScore) {
      meilleurScore = score;
      scoreText.setText("Meilleur score: " + meilleurScore);
    }
  }

  player.setVelocity(0, 0);

  setTimeout(() => {
    player.setPosition(spawnX, spawnY);
    // Reset du chrono à la mort
    chrono = 0;
    chronoText.setText("Chrono: 0");
  }, 500);
}

function afficherAlerte() {

  alerteText.setText("⚠ Attention ! Le temps passe...");

  setTimeout(() => {
    alerteText.setText("");
  }, 3000);

}

function niveauTermine() {
  // Stoppe le chrono
  monTimer.remove();

  // Calcul du score final
  var score = Math.max(0, 1000 - chrono * 10);
  if (score > meilleurScore) {
    meilleurScore = score;
  }

  // Stoppe le joueur
  player.setVelocity(0, 0);
  player.setActive(false);
  player.setVisible(false);

  // Message de victoire
  var texteVictoire = this.add.text(250, 250,
    "🎉 Niveau terminé !\nTemps : " + chrono + "s\nScore : " + score,
    {
      fontSize: "32px",
      fill: "#FFD700",
      align: "center"
    }
  );
  texteVictoire.setScrollFactor(0);
}