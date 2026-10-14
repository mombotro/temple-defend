// UI, HUD, Minimap Radar & Upgrade Shop Manager

export class UIManager {
  constructor(player, enemyManager, alliedForces, fortress) {
    this.player = player;
    this.enemyManager = enemyManager;
    this.allies = alliedForces;
    this.fortress = fortress;

    // Minimap Canvas
    this.minimapCanvas = document.getElementById('minimap-canvas');
    this.minimapCtx = this.minimapCanvas ? this.minimapCanvas.getContext('2d') : null;

    // HUD Elements
    this.playerHpBar = document.getElementById('player-hp-bar');
    this.playerHpText = document.getElementById('player-hp-text');
    this.playerStaminaBar = document.getElementById('player-stamina-bar');
    this.playerStaminaText = document.getElementById('player-stamina-text');
    this.denariiDisplay = document.getElementById('denarii-display');
    this.pilaIcons = document.getElementById('pila-icons');

    this.wallHpBar = document.getElementById('wall-hp-bar');
    this.wallHpText = document.getElementById('wall-hp-text');
    this.gateHpBar = document.getElementById('gate-hp-bar');
    this.gateHpText = document.getElementById('gate-hp-text');

    this.waveDisplay = document.getElementById('wave-display');
    this.enemiesDisplay = document.getElementById('enemies-display');

    // Tactical cooldowns
    this.cmdArrows = document.getElementById('cmd-arrows');
    this.cdArrows = document.getElementById('cd-arrows');
    this.cmdTestudo = document.getElementById('cmd-testudo');
    this.cdTestudo = document.getElementById('cd-testudo');
    this.cmdWarcry = document.getElementById('cmd-warcry');
    this.cdWarcry = document.getElementById('cd-warcry');

    // Prompt
    this.promptEl = document.getElementById('interaction-prompt');
    this.promptText = document.getElementById('prompt-text');

    // Announcement
    this.banner = document.getElementById('announcement-banner');
    this.bannerTitle = document.getElementById('announcement-title');
    this.bannerSub = document.getElementById('announcement-sub');

    // Modals
    this.upgradeModal = document.getElementById('upgrade-modal');
    this.shopDenarii = document.getElementById('shop-denarii');
    this.victoryModal = document.getElementById('victory-modal');
    this.gameOverModal = document.getElementById('gameover-modal');

    this.setupShopButtons();
  }

  showAnnouncement(title, subtitle) {
    if (!this.banner) return;
    this.bannerTitle.textContent = title;
    this.bannerSub.textContent = subtitle;
    this.banner.classList.add('show');
    setTimeout(() => {
      this.banner.classList.remove('show');
    }, 3500);
  }

  showInteractionPrompt(text) {
    if (!this.promptEl) return;
    this.promptText.textContent = text;
    this.promptEl.style.display = 'flex';
  }

  hideInteractionPrompt() {
    if (!this.promptEl) return;
    this.promptEl.style.display = 'none';
  }

  showUpgradeShop(denarii) {
    if (this.upgradeModal) {
      this.shopDenarii.textContent = denarii;
      this.upgradeModal.style.display = 'flex';
      if (document.exitPointerLock) document.exitPointerLock();
    }
  }

  hideUpgradeShop() {
    if (this.upgradeModal) {
      this.upgradeModal.style.display = 'none';
    }
  }

  setupShopButtons() {
    const buy = (cost, onBuy) => {
      if (this.player.denarii >= cost) {
        this.player.denarii -= cost;
        this.shopDenarii.textContent = this.player.denarii;
        onBuy();
      }
    };

    document.getElementById('buy-sword')?.addEventListener('click', (e) => {
      buy(80, () => {
        this.player.upgrades.gladiusDamageMult += 0.25;
        this.player.upgrades.attackSpeedMult += 0.15;
        e.target.disabled = true;
        e.target.textContent = 'MASTERED';
      });
    });

    document.getElementById('buy-shield')?.addEventListener('click', (e) => {
      buy(70, () => {
        this.player.upgrades.shieldDefense = 1.0;
        this.player.upgrades.shieldStunDuration = 2.0;
        e.target.disabled = true;
        e.target.textContent = 'UPGRADED';
      });
    });

    document.getElementById('buy-pila')?.addEventListener('click', (e) => {
      buy(90, () => {
        this.player.upgrades.flamingPila = true;
        e.target.disabled = true;
        e.target.textContent = 'CONSECRATED';
      });
    });

    document.getElementById('buy-repairs')?.addEventListener('click', () => {
      buy(60, () => {
        this.fortress.gateHealth = Math.min(100, this.fortress.gateHealth + 50);
        this.fortress.wallHealth = Math.min(100, this.fortress.wallHealth + 50);
      });
    });

    document.getElementById('buy-archers')?.addEventListener('click', (e) => {
      buy(100, () => {
        this.allies.addExtraArchers(2);
        e.target.disabled = true;
        e.target.textContent = 'STATIONED';
      });
    });

    document.getElementById('buy-health')?.addEventListener('click', () => {
      buy(50, () => {
        this.player.maxHealth += 25;
        this.player.health = this.player.maxHealth;
        this.player.staminaRegenRate += 8;
      });
    });
  }

  update(wallHp, gateHp) {
    // 1. Player HP & Stamina Bars
    if (this.playerHpBar) {
      const hpPct = Math.max(0, (this.player.health / this.player.maxHealth) * 100);
      this.playerHpBar.style.width = `${hpPct}%`;
      this.playerHpText.textContent = `${Math.ceil(this.player.health)} / ${this.player.maxHealth}`;
    }

    if (this.playerStaminaBar) {
      const staPct = Math.max(0, (this.player.stamina / this.player.maxStamina) * 100);
      this.playerStaminaBar.style.width = `${staPct}%`;
      this.playerStaminaText.textContent = `${Math.ceil(this.player.stamina)} / ${this.player.maxStamina}`;
    }

    if (this.denariiDisplay) {
      this.denariiDisplay.textContent = this.player.denarii;
    }

    // 2. Pilum Ammo Display
    if (this.pilaIcons) {
      const icons = this.pilaIcons.children;
      for (let i = 0; i < icons.length; i++) {
        if (i < this.player.pilaCount) {
          icons[i].classList.remove('empty');
        } else {
          icons[i].classList.add('empty');
        }
      }
    }

    // 3. Wall & Gate Bars
    if (this.wallHpBar) {
      this.wallHpBar.style.width = `${Math.max(0, wallHp)}%`;
      this.wallHpText.textContent = `${Math.ceil(wallHp)}%`;
    }
    if (this.gateHpBar) {
      this.gateHpBar.style.width = `${Math.max(0, gateHp)}%`;
      this.gateHpText.textContent = `${Math.ceil(gateHp)}%`;
    }

    // 4. Wave Info
    if (this.waveDisplay) {
      const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI'];
      this.waveDisplay.textContent = `WAVE ${romanNumerals[this.enemyManager.currentWave - 1] || this.enemyManager.currentWave}`;
      this.enemiesDisplay.textContent = `ENEMIES: ${this.enemyManager.waveEnemiesRemaining} / ${this.enemyManager.waveTotalEnemies}`;
    }

    // 5. Tactical Cooldowns
    const updateCd = (btn, textEl, cd) => {
      if (!btn || !textEl) return;
      if (cd > 0) {
        btn.classList.add('on-cooldown');
        textEl.textContent = Math.ceil(cd);
      } else {
        btn.classList.remove('on-cooldown');
      }
    };

    updateCd(this.cmdArrows, this.cdArrows, this.player.cooldowns.arrows);
    updateCd(this.cmdTestudo, this.cdTestudo, this.player.cooldowns.testudo);
    updateCd(this.cmdWarcry, this.cdWarcry, this.player.cooldowns.warcry);

    // 6. Minimap Radar Render
    this.renderMinimap();
  }

  renderMinimap() {
    if (!this.minimapCtx) return;
    const ctx = this.minimapCtx;
    const w = this.minimapCanvas.width;
    const h = this.minimapCanvas.height;
    const center = w / 2;
    const scale = 1.35; // World units to pixels

    ctx.clearRect(0, 0, w, h);

    // Background circle
    ctx.fillStyle = '#140f0c';
    ctx.beginPath();
    ctx.arc(center, center, center - 2, 0, Math.PI * 2);
    ctx.fill();

    // Radar rings
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.2)';
    ctx.lineWidth = 1;
    [25, 50, 70].forEach(r => {
      ctx.beginPath();
      ctx.arc(center, center, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Wall line at Z = 2.0 (rotated relative to player)
    // Minimap coordinates: +Z is Up in world space, +X is Right
    const worldToMap = (x, z) => {
      // Offset from center: (x=0, z=0 is center of wall)
      return {
        mx: center + x * scale,
        my: center - z * scale // Invert Z so battlefield (+Z) is Top
      };
    };

    // Draw Temple Wall
    const pWallL = worldToMap(-42, 2.0);
    const pWallR = worldToMap(42, 2.0);
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(pWallL.mx, pWallL.my);
    ctx.lineTo(pWallR.mx, pWallR.my);
    ctx.stroke();

    // Draw Gate
    const pGate = worldToMap(0, 2.0);
    ctx.fillStyle = '#e67e22';
    ctx.fillRect(pGate.mx - 4, pGate.my - 3, 8, 6);

    // Draw Assault Ladders
    this.enemyManager.ladders.forEach(ladder => {
      if (ladder.isPushedDown) return;
      const pLad = worldToMap(ladder.x, ladder.z);
      ctx.fillStyle = '#a0522d';
      ctx.fillRect(pLad.mx - 3, pLad.my - 3, 6, 6);
    });

    // Draw Greek Enemies (Red dots)
    this.enemyManager.enemies.forEach(enemy => {
      if (enemy.state === 'dead') return;
      const p = worldToMap(enemy.position.x, enemy.position.z);
      ctx.fillStyle = enemy.type === 'boss' ? '#ff0000' : (enemy.type === 'archer' ? '#ff9900' : '#e74c3c');
      const size = enemy.type === 'boss' ? 5 : 2.5;
      ctx.beginPath();
      ctx.arc(p.mx, p.my, size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Battering Rams
    this.enemyManager.batteringRams.forEach(ram => {
      if (ram.isDestroyed) return;
      const p = worldToMap(ram.position.x, ram.position.z);
      ctx.fillStyle = '#8b0000';
      ctx.fillRect(p.mx - 4, p.my - 4, 8, 8);
    });

    // Draw Roman Allies (Green dots)
    this.allies.allies.forEach(ally => {
      const p = worldToMap(ally.position.x, ally.position.z);
      ctx.fillStyle = '#2ecc71';
      ctx.beginPath();
      ctx.arc(p.mx, p.my, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Player Centurion (Golden arrow)
    const pPlayer = worldToMap(this.player.position.x, this.player.position.z);
    ctx.save();
    ctx.translate(pPlayer.mx, pPlayer.my);
    ctx.rotate(-this.player.yaw); // Rotate by view yaw

    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(4, 5);
    ctx.lineTo(0, 3);
    ctx.lineTo(-4, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
