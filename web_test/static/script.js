(function () {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  const weaponPanel = document.getElementById('weapon-panel');
  const accessoryPanel = document.getElementById('accessory-panel');
  const messagePanel = document.getElementById('message-panel');
  const messageTitleEl = document.getElementById('message-title');
  const messageTextEl = document.getElementById('message-text');

  const hudWeaponEl = document.getElementById('hud-weapon');
  const hudLevelEl = document.getElementById('hud-level');
  const hudWeaponLevelEl = document.getElementById('hud-weapon-level');
  const hudHpTextEl = document.getElementById('hud-hp-text');
  const hudHpBarEl = document.getElementById('hud-hp-bar');
  const hudExpTextEl = document.getElementById('hud-exp-text');
  const hudExpBarEl = document.getElementById('hud-exp-bar');
  const hudWaveEl = document.getElementById('hud-wave');
  const hudAccEl = document.getElementById('hud-acc');
  const hudAccSlotsEl = document.getElementById('hud-acc-slots');
  const accSlotCountEl = document.getElementById('acc-slot-count');

  const accButtons = Array.from(
    accessoryPanel.querySelectorAll('button[data-choice-index]')
  );

  const groundHeight = 90;
  const groundY = canvas.height - groundHeight;

  const BASE_MOVE_SPEED = 260;
  const BASE_JUMP_SPEED = -700;
  const GRAVITY = 1800;

  // 악세서리 정의
  const ACCESSORIES = [
    {
      id: 'proj_multi',
      label: '투사체 추가',
      brief: '+1 투사체 (마법/활 전용)',
      rangedOnly: true
    },
    {
      id: 'atk_power',
      label: '공격력 강화',
      brief: '공격력 +25% (중첩)',
      rangedOnly: false
    },
    {
      id: 'atk_speed',
      label: '공격 속도',
      brief: '공격 쿨타임 -12% (최대 60%)',
      rangedOnly: false
    },
    {
      id: 'move_speed',
      label: '이동 속도',
      brief: '이동 속도 +15%',
      rangedOnly: false
    },
    {
      id: 'max_hp',
      label: '체력 강화',
      brief: '최대 체력 +20, 즉시 회복',
      rangedOnly: false
    },
    {
      id: 'life_steal',
      label: '흡혈',
      brief: '입힌 피해의 일부 회복',
      rangedOnly: false
    },
    {
      id: 'crit',
      label: '치명타',
      brief: '치명타 확률/배율 증가',
      rangedOnly: false
    },
    {
      id: 'shield',
      label: '보호막',
      brief: '받는 피해 감소',
      rangedOnly: false
    }
  ];

  // 적 타입 정의
  const ENEMY_TYPES = {
    grunt: {
      name: '고블린',
      color: '#38bdf8',
      width: 28,
      height: 38,
      baseHp: 32,
      hpPerWave: 7,
      speed: 70,
      contactDamage: 8,
      xp: 5
    },
    runner: {
      name: '러너',
      color: '#22c55e',
      width: 26,
      height: 34,
      baseHp: 26,
      hpPerWave: 6,
      speed: 120,
      contactDamage: 10,
      xp: 6
    },
    tank: {
      name: '탱커',
      color: '#fb923c',
      width: 40,
      height: 46,
      baseHp: 70,
      hpPerWave: 14,
      speed: 45,
      contactDamage: 16,
      xp: 9
    },
    shooter: {
      name: '헌터',
      color: '#e5e7eb',
      width: 30,
      height: 40,
      baseHp: 40,
      hpPerWave: 10,
      speed: 55,
      contactDamage: 7,
      xp: 7,
      projectileDamage: 10
    },
    flyer: {
      name: '플라이어',
      color: '#a855f7',
      width: 30,
      height: 30,
      baseHp: 28,
      hpPerWave: 6,
      speed: 80,
      contactDamage: 9,
      xp: 6
    }
  };

  const state = {
    mode: 'weaponSelect', // weaponSelect | playing | accessory | gameOver
    lastTime: 0,
    timeElapsed: 0,
    player: null,
    enemies: [],
    bullets: [],
    particles: [],
    stars: [],
    weapon: null,
    keys: {},
    wave: 1,
    killsThisWave: 0,
    killsForNextWave: 8,
    inBossFight: false,
    enemySpawnTimer: 0,
    enemySpawnInterval: 1500, // ms
    accessories: {
      levels: {}, // {id: level}
      slotsUsed: 0,
      maxSlots: 5
    },
    accessoryChoices: []
  };

  // --------- 유틸 & 공통 ----------

  function weaponName(weapon) {
    if (weapon === 'sword') return '검';
    if (weapon === 'magic') return '마법';
    if (weapon === 'bow') return '활';
    return '-';
  }

  function isRangedWeapon() {
    return state.weapon === 'magic' || state.weapon === 'bow';
  }

  function showMessage(title, text) {
    messageTitleEl.textContent = title;
    messageTextEl.textContent = text;
    messagePanel.classList.remove('hidden');
  }

  function hideMessage() {
    messagePanel.classList.add('hidden');
  }

  function getAccLevel(id) {
    return state.accessories.levels[id] || 0;
  }

  // --------- 초기화 ----------

  function initBackground() {
    state.stars = [];
    for (let i = 0; i < 50; i++) {
      state.stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * (groundY - 80),
        size: 1 + Math.random() * 2,
        speed: 10 + Math.random() * 30
      });
    }
  }

  function resetGame() {
    state.mode = 'weaponSelect';
    state.lastTime = 0;
    state.timeElapsed = 0;
    state.player = null;
    state.enemies = [];
    state.bullets = [];
    state.particles = [];
    state.weapon = null;
    state.wave = 1;
    state.killsThisWave = 0;
    state.killsForNextWave = 8;
    state.inBossFight = false;
    state.enemySpawnTimer = 0;
    state.enemySpawnInterval = 1500;
    state.accessories = {
      levels: {},
      slotsUsed: 0,
      maxSlots: 5
    };
    state.accessoryChoices = [];

    initBackground();
    weaponPanel.classList.remove('hidden');
    accessoryPanel.classList.add('hidden');
    hideMessage();
    updateHUD();
  }

  function initPlayer() {
    state.player = {
      x: canvas.width * 0.2,
      y: groundY - 48,
      width: 32,
      height: 48,
      vx: 0,
      vy: 0,
      onGround: false,
      hp: 100,
      maxHp: 100,
      attackCooldown: 0, // ms
      invincibleTimer: 0, // s
      level: 1,
      exp: 0,
      expToNext: 15,
      weaponLevel: 1
    };
  }

  function startGameWithWeapon(weapon) {
    state.weapon = weapon;
    weaponPanel.classList.add('hidden');
    accessoryPanel.classList.add('hidden');
    hideMessage();

    state.timeElapsed = 0;
    state.enemies = [];
    state.bullets = [];
    state.particles = [];
    state.wave = 1;
    state.killsThisWave = 0;
    state.killsForNextWave = 8;
    state.inBossFight = false;
    state.enemySpawnTimer = 0;
    state.enemySpawnInterval = 1500;

    initPlayer();
    state.mode = 'playing';
    updateHUD();
  }

  // --------- HUD ----------

  function updateHUD() {
    hudWeaponEl.textContent = weaponName(state.weapon);
    const p = state.player;

    if (p) {
      const hp = Math.max(0, Math.round(p.hp));
      hudHpTextEl.textContent = hp + ' / ' + p.maxHp;
      const hpRatio = Math.max(0, Math.min(1, p.hp / p.maxHp));
      hudHpBarEl.style.width = (hpRatio * 100) + '%';

      hudLevelEl.textContent = p.level;
      hudWeaponLevelEl.textContent = p.weaponLevel;

      hudExpTextEl.textContent = Math.floor(p.exp) + ' / ' + p.expToNext;
      const expRatio = Math.max(0, Math.min(1, p.exp / p.expToNext));
      hudExpBarEl.style.width = (expRatio * 100) + '%';
    } else {
      hudHpTextEl.textContent = '0 / 0';
      hudHpBarEl.style.width = '0%';
      hudLevelEl.textContent = '-';
      hudWeaponLevelEl.textContent = '-';
      hudExpTextEl.textContent = '- / -';
      hudExpBarEl.style.width = '0%';
    }

    hudWaveEl.textContent = state.wave;

    const acc = state.accessories;
    const parts = [];
    const lvProj = getAccLevel('proj_multi');
    const lvDmg = getAccLevel('atk_power');
    const lvSpd = getAccLevel('atk_speed');
    const lvMove = getAccLevel('move_speed');
    const lvHp = getAccLevel('max_hp');
    const lvLs = getAccLevel('life_steal');
    const lvCrit = getAccLevel('crit');
    const lvShield = getAccLevel('shield');

    if (lvProj > 0) parts.push('투사체 +' + lvProj);
    if (lvDmg > 0) parts.push('공격력 +' + (lvDmg * 25) + '%');
    if (lvSpd > 0) parts.push('공속 +' + (lvSpd * 12) + '%');
    if (lvMove > 0) parts.push('이속 +' + (lvMove * 15) + '%');
    if (lvHp > 0) parts.push('HP +' + (lvHp * 20));
    if (lvLs > 0) parts.push('흡혈 Lv.' + lvLs);
    if (lvCrit > 0) parts.push('치명타 Lv.' + lvCrit);
    if (lvShield > 0) parts.push('보호막 Lv.' + lvShield);

    hudAccEl.textContent = parts.length ? parts.join(', ') : '없음';
    hudAccSlotsEl.textContent = acc.slotsUsed + ' / ' + acc.maxSlots;
    accSlotCountEl.textContent = acc.slotsUsed;
  }

  // --------- 입력 ----------

  function handleInput(dt) {
    const p = state.player;
    if (!p) return;

    p.vx = 0;
    const moveSpeed = getMoveSpeed();

    if (state.keys['ArrowLeft'] || state.keys['KeyA']) {
      p.vx = -moveSpeed;
    }
    if (state.keys['ArrowRight'] || state.keys['KeyD']) {
      p.vx = moveSpeed;
    }

    // 점프
    if ((state.keys['ArrowUp'] || state.keys['KeyW'] || state.keys['Space']) && p.onGround) {
      p.vy = BASE_JUMP_SPEED;
      p.onGround = false;
    }

    // 공격
    if (state.keys['KeyJ']) {
      tryAttack();
    }
  }

  // --------- 스탯 계산 ----------

  function getMoveSpeed() {
    const level = getAccLevel('move_speed');
    return BASE_MOVE_SPEED * (1 + level * 0.15);
  }

  function getAttackCooldown() {
    const base = 500; // ms
    const level = getAccLevel('atk_speed');
    const reduction = Math.min(0.6, level * 0.12); // 최고 60% 감소
    return base * (1 - reduction);
  }

  function getProjectileCount() {
    if (!isRangedWeapon()) return 1;
    const level = getAccLevel('proj_multi');
    return 1 + level;
  }

  function getDamage() {
    const p = state.player;
    if (!p) return 10;

    let baseDamage = 12;
    if (state.weapon === 'sword') baseDamage = 14;
    if (state.weapon === 'bow') baseDamage = 11;
    if (state.weapon === 'magic') baseDamage = 13;

    const weaponBonus = 1 + (p.weaponLevel - 1) * 0.3; // 무기 레벨당 30%
    const dmgAccLevel = getAccLevel('atk_power');
    const accBonus = 1 + dmgAccLevel * 0.25; // 레벨당 25%

    // 치명타
    const critLevel = getAccLevel('crit');
    const baseCritChance = 0.05;
    const critChance = baseCritChance + critLevel * 0.05;
    const critDamageMult = 1.5 + critLevel * 0.2;

    let damage = baseDamage * weaponBonus * accBonus;
    let crit = false;
    if (Math.random() < critChance) {
      crit = true;
      damage *= critDamageMult;
    }

    return { damage, crit };
  }

  // --------- 공격 ----------

  function tryAttack() {
    const p = state.player;
    if (!p) return;
    if (p.attackCooldown > 0) return;

    p.attackCooldown = getAttackCooldown();

    if (state.weapon === 'sword') {
      performSwordAttack();
    } else {
      shootProjectileWeapon();
    }
  }

  function shootProjectileWeapon() {
    const p = state.player;
    if (!p) return;

    const { damage } = getDamage();
    const count = getProjectileCount();

    const spread = state.weapon === 'bow' ? 0.25 : 0.2;
    const speed = state.weapon === 'bow' ? 700 : 550;

    for (let i = 0; i < count; i++) {
      const t = (count === 1) ? 0 : (i / (count - 1) - 0.5); // -0.5 ~ 0.5
      const angle = t * spread;
      const dirX = Math.cos(angle);
      const dirY = Math.sin(angle);

      const b = createBullet(
        p.x + p.width,
        p.y + p.height * 0.5,
        speed * dirX,
        speed * dirY,
        damage,
        true
      );
      state.bullets.push(b);
    }
  }

  function performSwordAttack() {
    const p = state.player;
    if (!p) return;

    const res = getDamage();
    const damage = res.damage;
    const range = 64;

    for (let i = 0; i < state.enemies.length; i++) {
      const e = state.enemies[i];
      if (e.dead) continue;
      const inFront = e.x > p.x && e.x < p.x + range;
      const verticalClose = Math.abs((e.y + e.height / 2) - (p.y + p.height / 2)) < p.height;
      if (inFront && verticalClose) {
        e.hp -= damage;
        spawnHitParticles(e.x + e.width / 2, e.y + e.height / 2, e.color, 8);
        onDamageEnemy(damage);
        if (e.hp <= 0 && !e.dead) {
          killEnemy(e);
        }
      }
    }
  }

  function createBullet(x, y, vx, vy, damage, fromPlayer) {
    return {
      x,
      y,
      width: fromPlayer ? 12 : 8,
      height: 4,
      vx,
      vy,
      damage,
      fromPlayer,
      life: fromPlayer ? 1.4 : 2.0,
      dead: false
    };
  }

  // --------- 플레이어 & 물리 ----------

  function updatePlayer(dt) {
    const p = state.player;
    if (!p) return;

    // 쿨다운
    if (p.attackCooldown > 0) {
      p.attackCooldown -= dt * 1000;
      if (p.attackCooldown < 0) p.attackCooldown = 0;
    }

    if (p.invincibleTimer > 0) {
      p.invincibleTimer -= dt;
      if (p.invincibleTimer < 0) p.invincibleTimer = 0;
    }

    // 물리
    p.vy += GRAVITY * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    // 땅 충돌
    if (p.y + p.height >= groundY) {
      p.y = groundY - p.height;
      p.vy = 0;
      p.onGround = true;
    } else {
      p.onGround = false;
    }

    // 화면 경계
    if (p.x < 10) p.x = 10;
    if (p.x + p.width > canvas.width - 10) p.x = canvas.width - p.width - 10;
  }

  function rectsOverlap(a, b) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  function damagePlayer(amount) {
    const p = state.player;
    if (!p) return;
    if (p.invincibleTimer > 0) return;

    let dmg = amount;
    const shieldLvl = getAccLevel('shield');
    if (shieldLvl > 0) {
      const reduction = Math.min(0.6, shieldLvl * 0.12);
      dmg *= (1 - reduction);
    }

    p.hp -= dmg;
    p.invincibleTimer = 0.7;

    spawnHitParticles(p.x + p.width / 2, p.y + p.height / 2, '#f97316', 10);

    if (p.hp <= 0) {
      p.hp = 0;
      state.mode = 'gameOver';
      showMessage('게임 종료', 'R 키를 눌러 다시 시작하세요.');
    }
  }

  // --------- 적 생성 & 업데이트 ----------

  function pickEnemyType() {
    const w = state.wave;
    const r = Math.random();
    if (w <= 1) {
      return 'grunt';
    } else if (w === 2) {
      if (r < 0.6) return 'grunt';
      return 'runner';
    } else if (w === 3) {
      if (r < 0.45) return 'grunt';
      if (r < 0.75) return 'runner';
      return 'tank';
    } else if (w === 4) {
      if (r < 0.35) return 'grunt';
      if (r < 0.6) return 'runner';
      if (r < 0.8) return 'tank';
      return 'shooter';
    } else {
      if (r < 0.25) return 'grunt';
      if (r < 0.45) return 'runner';
      if (r < 0.65) return 'tank';
      if (r < 0.85) return 'shooter';
      return 'flyer';
    }
  }

  function spawnEnemy() {
    const type = pickEnemyType();
    const tpl = ENEMY_TYPES[type];
    const wave = state.wave;

    const width = tpl.width;
    const height = tpl.height;
    const hp = tpl.baseHp + tpl.hpPerWave * (wave - 1) * (0.9 + Math.random() * 0.2);
    const speed = tpl.speed + wave * 3;

    const enemy = {
      type,
      name: tpl.name,
      color: tpl.color,
      x: canvas.width + Math.random() * 200,
      y: type === 'flyer' ? groundY - height - 110 - Math.random() * 40 : groundY - height,
      width,
      height,
      vx: -speed,
      vy: 0,
      hp,
      maxHp: hp,
      isBoss: false,
      dead: false,
      contactDamage: tpl.contactDamage,
      xp: tpl.xp,
      projectileDamage: tpl.projectileDamage || 0,
      shootCooldown: 0,
      phase: Math.random() * Math.PI * 2,
      aiTimer: 0
    };

    state.enemies.push(enemy);
  }

  function spawnBoss() {
    state.inBossFight = true;
    const size = 100;
    const wave = state.wave;
    const hp = 260 + wave * 110;

    const boss = {
      type: 'boss',
      name: '보스',
      color: '#dc2626',
      x: canvas.width + 80,
      y: groundY - size,
      width: size,
      height: size,
      vx: -(40 + wave * 5),
      vy: 0,
      hp,
      maxHp: hp,
      isBoss: true,
      dead: false,
      contactDamage: 24,
      xp: 25 + wave * 6,
      projectileDamage: 14 + wave * 1.5,
      shootCooldown: 2,
      aiTimer: 0,
      jumpCooldown: 5
    };

    state.enemies.push(boss);
  }

  function spawnEnemies(dt) {
    if (state.inBossFight) return;

    state.enemySpawnTimer += dt * 1000;

    const difficultyByTime = 1 + state.timeElapsed / 45;
    const p = state.player;
    let difficultyByPosition = 1;
    if (p) {
      difficultyByPosition += (p.x / canvas.width) * 0.8;
    }

    const difficulty = difficultyByTime * difficultyByPosition;
    const interval = state.enemySpawnInterval / difficulty;

    if (state.enemySpawnTimer >= interval) {
      state.enemySpawnTimer = 0;
      spawnEnemy();
    }
  }

  function updateEnemyAI(e, dt) {
    const p = state.player;
    if (!p) return;

    if (e.type === 'runner') {
      // 플레이어 위치로 빠르게 돌진 + 약간의 흔들기
      const dir = p.x < e.x ? -1 : 1;
      e.vx = -Math.abs(e.vx) * dir;
      e.aiTimer += dt * 4;
      e.y += Math.sin(e.aiTimer * 8) * 10 * dt;
    } else if (e.type === 'tank') {
      // 그냥 천천히 걸어옴, 특별 AI 없음
    } else if (e.type === 'flyer') {
      // 공중에서 파도치듯 이동
      e.phase += dt * 2;
      const baseY = groundY - e.height - 130;
      e.y = baseY + Math.sin(e.phase) * 26;
    } else if (e.type === 'shooter') {
      // 일정 위치에서 멈추고 플레이어에게 사격
      const stopX = canvas.width * 0.65;
      if (e.x < stopX && e.vx < 0) {
        e.vx = 0;
      }
      if (e.vx === 0) {
        e.shootCooldown -= dt;
        if (e.shootCooldown <= 0) {
          e.shootCooldown = 2.0 - Math.min(1.0, state.wave * 0.08);
          const dx = p.x - e.x;
          const dy = (p.y + p.height / 2) - (e.y + e.height / 2);
          const len = Math.max(10, Math.hypot(dx, dy));
          const speed = 260;
          const vx = (dx / len) * speed;
          const vy = (dy / len) * speed;
          const b = createBullet(
            e.x,
            e.y + e.height / 2,
            vx,
            vy,
            e.projectileDamage,
            false
          );
          state.bullets.push(b);
        }
      }
    } else if (e.isBoss) {
      // 보스 AI: 정면에서 멈춰서 탄막 + 가끔 점프
      const targetX = canvas.width - e.width - 40;
      if (e.x < targetX) {
        e.x = targetX;
        e.vx = 0;
      }

      e.shootCooldown -= dt;
      e.jumpCooldown -= dt;

      if (e.shootCooldown <= 0) {
        e.shootCooldown = 1.4 - Math.min(0.6, state.wave * 0.05);
        // 부채꼴 탄막
        const centerAngle = Math.atan2(
          (p.y + p.height / 2) - (e.y + e.height / 2),
          (p.x + p.width / 2) - (e.x + e.width / 2)
        );
        const count = 5 + Math.min(3, state.wave);
        const spread = 0.7;
        const speed = 260 + state.wave * 10;

        for (let i = 0; i < count; i++) {
          const t = (count === 1) ? 0 : (i / (count - 1) - 0.5);
          const angle = centerAngle + t * spread;
          const vx = Math.cos(angle) * speed;
          const vy = Math.sin(angle) * speed;
          const b = createBullet(
            e.x,
            e.y + e.height / 2,
            vx,
            vy,
            e.projectileDamage,
            false
          );
          state.bullets.push(b);
        }
      }

      // 점프 공격 (단순히 위로 튀었다 떨어지면서 충돌만)
      if (e.jumpCooldown <= 0) {
        e.jumpCooldown = 5 + Math.random() * 3;
        e.vy = -600;
      }

      e.vy += GRAVITY * dt;
      e.y += e.vy * dt;
      if (e.y + e.height >= groundY) {
        e.y = groundY - e.height;
        e.vy = 0;
      }
    }
  }

  function onBossKilled() {
    state.inBossFight = false;
    state.wave += 1;
    state.killsThisWave = 0;
    state.killsForNextWave += 5;
    state.enemySpawnInterval = Math.max(500, state.enemySpawnInterval * 0.9);
    openAccessoryPanel();
  }

  function awardExp(enemy) {
    const p = state.player;
    if (!p || state.mode === 'gameOver') return;

    const base = enemy.xp || (enemy.isBoss ? 25 : 5);
    const waveBonus = (state.wave - 1) * 1.8;
    const amount = base + waveBonus;
    addExp(amount);
  }

  function addExp(amount) {
    const p = state.player;
    if (!p) return;
    p.exp += amount;

    while (p.exp >= p.expToNext) {
      p.exp -= p.expToNext;
      levelUp();
    }
    updateHUD();
  }

  function levelUp() {
    const p = state.player;
    if (!p) return;

    p.level += 1;
    p.weaponLevel += 1;
    p.expToNext = Math.floor(p.expToNext * 1.35);

    // 레벨업 시 체력 조금 회복
    p.hp = Math.min(p.maxHp, p.hp + 15);

    spawnHitParticles(p.x + p.width / 2, p.y + p.height / 2, '#facc15', 30);
    updateHUD();
    showMessage(
      '레벨 업!',
      '무기가 강화되어 공격력이 올랐습니다.\n현재 레벨: ' +
        p.level +
        ' / 무기 Lv.' +
        p.weaponLevel
    );
  }

  function killEnemy(enemy) {
    if (enemy.dead) return;
    enemy.dead = true;
    spawnHitParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color, 15);
    awardExp(enemy);

    if (enemy.isBoss) {
      onBossKilled();
    } else {
      state.killsThisWave += 1;
      if (state.killsThisWave >= state.killsForNextWave && !state.inBossFight) {
        spawnBoss();
      }
    }
  }

  function updateEnemies(dt) {
    const p = state.player;

    for (let i = 0; i < state.enemies.length; i++) {
      const e = state.enemies[i];
      if (e.dead) continue;

      // 기본 이동
      if (!e.isBoss || e.type !== 'boss') {
        e.x += e.vx * dt;
        e.y += e.vy * dt;
      }

      updateEnemyAI(e, dt);

      if (p && rectsOverlap(e, p)) {
        damagePlayer(e.contactDamage || (e.isBoss ? 24 : 10));
      }
    }

    // 화면 밖 + 죽은 적 제거
    state.enemies = state.enemies.filter(e => !e.dead && (e.x + e.width > -120));
  }

  // --------- 투사체 업데이트 ----------

  function onDamageEnemy(damageAmount) {
    const p = state.player;
    if (!p) return;
    const lsLevel = getAccLevel('life_steal');
    if (lsLevel <= 0) return;

    const ratio = 0.04 + lsLevel * 0.03; // 4% + 3% / lv
    const heal = damageAmount * ratio;
    p.hp = Math.min(p.maxHp, p.hp + heal);
  }

  function updateBullets(dt) {
    for (let i = 0; i < state.bullets.length; i++) {
      const b = state.bullets[i];
      if (b.dead) continue;

      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;

      if (
        b.life <= 0 ||
        b.x > canvas.width + 80 ||
        b.x + b.width < -80 ||
        b.y > canvas.height + 80 ||
        b.y + b.height < -80
      ) {
        b.dead = true;
        continue;
      }

      if (b.fromPlayer) {
        for (let j = 0; j < state.enemies.length; j++) {
          const e = state.enemies[j];
          if (e.dead) continue;
          if (rectsOverlap(b, e)) {
            e.hp -= b.damage;
            spawnHitParticles(b.x, b.y, e.color, 6);
            onDamageEnemy(b.damage);
            b.dead = true;
            if (e.hp <= 0 && !e.dead) {
              killEnemy(e);
            }
            break;
          }
        }
      } else {
        const p = state.player;
        if (p && rectsOverlap(b, p)) {
          damagePlayer(b.damage || 10);
          b.dead = true;
        }
      }
    }

    state.bullets = state.bullets.filter(b => !b.dead);
  }

  // --------- 파티클 ----------

  function spawnHitParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 140;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      state.particles.push({
        x,
        y,
        vx,
        vy,
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.4 + Math.random() * 0.3,
        color,
        size: 2 + Math.random() * 3
      });
    }
  }

  function updateParticles(dt) {
    for (let i = 0; i < state.particles.length; i++) {
      const p = state.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 600 * dt; // 약간 아래로 떨어지게
      p.life -= dt;
    }
    state.particles = state.particles.filter(p => p.life > 0);
  }

  // --------- 악세서리 선택 ----------

  function getAvailableAccessoryDefs() {
    const ranged = isRangedWeapon();
    return ACCESSORIES.filter(def => !(def.rangedOnly && !ranged));
  }

  function generateAccessoryChoices() {
    const pool = getAvailableAccessoryDefs().slice();
    // 셔플
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const choices = pool.slice(0, Math.min(3, pool.length));
    state.accessoryChoices = choices;

    choices.forEach((def, idx) => {
      const btn = accButtons[idx];
      const level = getAccLevel(def.id);
      const nextLv = level + 1;
      btn.dataset.accId = def.id;
      btn.textContent = `${def.label} (Lv.${level} → Lv.${nextLv})`;
      btn.title = def.brief;
    });
  }

  function openAccessoryPanel() {
    if (state.mode === 'gameOver') return;
    generateAccessoryChoices();
    state.mode = 'accessory';
    accessoryPanel.classList.remove('hidden');
    updateHUD();
  }

  function chooseAccessoryById(id) {
    const acc = state.accessories;
    const currentLevel = acc.levels[id] || 0;

    if (currentLevel === 0 && acc.slotsUsed >= acc.maxSlots) {
      showMessage(
        '장착 불가',
        '악세서리는 최대 5종류까지 장착할 수 있습니다.\n이미 가진 악세서리만 계속 강화할 수 있습니다.'
      );
      return;
    }

    if (currentLevel === 0) {
      acc.slotsUsed += 1;
    }
    acc.levels[id] = currentLevel + 1;

    // 즉시 적용되는 것들
    if (id === 'max_hp' && state.player) {
      state.player.maxHp += 20;
      state.player.hp += 20;
    }

    accessoryPanel.classList.add('hidden');
    hideMessage();
    state.mode = 'playing';
    updateHUD();
  }

  // --------- 메인 업데이트 ----------

  function update(dt) {
    if (!state.player) return;

    state.timeElapsed += dt;

    handleInput(dt);
    updatePlayer(dt);
    spawnEnemies(dt);
    updateEnemies(dt);
    updateBullets(dt);
    updateParticles(dt);
    updateHUD();
  }

  // --------- 그리기 ----------

  function drawBackground() {
    // 하늘 그라디언트
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#020617');
    gradient.addColorStop(0.3, '#1d2445');
    gradient.addColorStop(0.7, '#0b1120');
    gradient.addColorStop(1, '#020617');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 별 파라ラック스
    for (const s of state.stars) {
      const offsetX = (state.timeElapsed * s.speed) % (canvas.width + 40);
      let x = s.x - offsetX;
      if (x < -20) x += canvas.width + 40;
      ctx.globalAlpha = 0.5 + Math.random() * 0.5;
      ctx.fillStyle = '#f9fafb';
      ctx.fillRect(x, s.y, s.size, s.size);
    }
    ctx.globalAlpha = 1;

    // 먼 산
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.moveTo(0, groundY - 80);
    ctx.lineTo(140, groundY - 150);
    ctx.lineTo(260, groundY - 90);
    ctx.lineTo(420, groundY - 170);
    ctx.lineTo(600, groundY - 100);
    ctx.lineTo(780, groundY - 160);
    ctx.lineTo(960, groundY - 80);
    ctx.lineTo(960, groundY);
    ctx.lineTo(0, groundY);
    ctx.closePath();
    ctx.fill();

    // 가까운 언덕
    ctx.fillStyle = '#0b1120';
    ctx.beginPath();
    ctx.moveTo(0, groundY - 30);
    ctx.quadraticCurveTo(220, groundY - 80, 420, groundY - 40);
    ctx.quadraticCurveTo(680, groundY, 960, groundY - 40);
    ctx.lineTo(960, groundY);
    ctx.lineTo(0, groundY);
    ctx.closePath();
    ctx.fill();

    // 땅
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, groundY, canvas.width, groundHeight);
  }

  function draw() {
    drawBackground();

    // Wave 표시
    ctx.fillStyle = 'rgba(15,23,42,0.75)';
    ctx.fillRect(canvas.width / 2 - 72, 10, 144, 28);
    ctx.fillStyle = '#e5e7eb';
    ctx.font = '14px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Wave ' + state.wave, canvas.width / 2, 29);

    // 플레이어
    const p = state.player;
    if (p) {
      ctx.save();
      if (p.invincibleTimer > 0 && Math.floor(Date.now() / 100) % 2 === 0) {
        ctx.globalAlpha = 0.4;
      }

      let color = '#e5e7eb';
      if (state.weapon === 'sword') color = '#10b981';
      else if (state.weapon === 'magic') color = '#6366f1';
      else if (state.weapon === 'bow') color = '#f97316';

      // 본체
      ctx.fillStyle = color;
      ctx.fillRect(p.x, p.y, p.width, p.height);
      // 머리
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(p.x + 6, p.y - 10, p.width - 12, 10);

      ctx.restore();

      // HP 바(머리 위)
      const hpRatio = p.hp / p.maxHp;
      const barW = p.width;
      ctx.fillStyle = '#020617';
      ctx.fillRect(p.x, p.y - 9, barW, 4);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(p.x, p.y - 9, barW * hpRatio, 4);
    }

    // 적
    ctx.textAlign = 'left';
    for (const e of state.enemies) {
      ctx.fillStyle = e.color || '#38bdf8';
      ctx.fillRect(e.x, e.y, e.width, e.height);
      // 눈
      ctx.fillStyle = '#020617';
      ctx.fillRect(e.x + 4, e.y + 6, 4, 4);
      ctx.fillRect(e.x + e.width - 8, e.y + 6, 4, 4);

      // HP 바
      const r = e.hp / e.maxHp;
      ctx.fillStyle = '#020617';
      ctx.fillRect(e.x, e.y - 6, e.width, 4);
      ctx.fillStyle = e.isBoss ? '#f97316' : '#22c55e';
      ctx.fillRect(e.x, e.y - 6, e.width * r, 4);
    }

    // 투사체
    for (const b of state.bullets) {
      if (b.fromPlayer) {
        const grad = ctx.createLinearGradient(b.x, b.y, b.x + b.width, b.y + b.height);
        grad.addColorStop(0, '#facc15');
        grad.addColorStop(1, '#fb923c');
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = '#e5e7eb';
      }
      ctx.fillRect(b.x, b.y, b.width, b.height);
    }

    // 파티클
    for (const pt of state.particles) {
      const t = pt.life / pt.maxLife;
      ctx.globalAlpha = Math.max(0, t);
      ctx.fillStyle = pt.color || '#facc15';
      ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
    }
    ctx.globalAlpha = 1;

    // 상태 텍스트
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e5e7eb';
    if (state.mode === 'weaponSelect') {
      ctx.font = '20px system-ui';
      ctx.fillText('무기를 선택해서 시작하세요', canvas.width / 2, canvas.height / 2 - 120);
    } else if (state.mode === 'accessory') {
      ctx.font = '18px system-ui';
      ctx.fillText('보스 처치! 악세서리를 선택하세요', canvas.width / 2, canvas.height / 2 - 120);
    } else if (state.mode === 'gameOver') {
      ctx.font = '36px system-ui';
      ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);
      ctx.font = '18px system-ui';
      ctx.fillText('R 키를 눌러 다시 시작', canvas.width / 2, canvas.height / 2 + 12);
    }
  }

  // --------- 루프 ----------

  function gameLoop(timestamp) {
    if (!state.lastTime) state.lastTime = timestamp;
    let dt = (timestamp - state.lastTime) / 1000;
    if (dt > 0.05) dt = 0.05; // 프레임 튐 방지
    state.lastTime = timestamp;

    if (state.mode === 'playing') {
      update(dt);
    }

    draw();
    window.requestAnimationFrame(gameLoop);
  }

  // --------- 이벤트 ----------

  weaponPanel.addEventListener('click', evt => {
    const btn = evt.target.closest('button[data-weapon]');
    if (!btn) return;
    const weapon = btn.getAttribute('data-weapon');
    startGameWithWeapon(weapon);
  });

  accessoryPanel.addEventListener('click', evt => {
    const btn = evt.target.closest('button[data-choice-index]');
    if (!btn) return;
    const accId = btn.dataset.accId;
    if (!accId) return;
    chooseAccessoryById(accId);
  });

  messagePanel.addEventListener('click', () => {
    hideMessage();
  });

  document.addEventListener('keydown', event => {
    const code = event.code;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(code)) {
      event.preventDefault();
    }
    state.keys[code] = true;

    if (state.mode === 'gameOver' && code === 'KeyR') {
      resetGame();
    }
  });

  document.addEventListener('keyup', event => {
    state.keys[event.code] = false;
  });

  // --------- 시작 ----------

  resetGame();
  window.requestAnimationFrame(gameLoop);
})();
