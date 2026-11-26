// Name: Image Loader
// ID: TilesetLoader
// Description: 로컬 폴더에서 이미지를 BitmapSkin으로 직접 등록합니다 (base64 없음)
// By: (커스텀)

(function (Scratch) {
  'use strict';
  if (!Scratch.extensions.unsandboxed) {
    throw new Error('TilesetLoader는 비샌드박스 모드로 실행해야 합니다');
  }

  const vm      = Scratch.vm;
  const runtime = vm.runtime;
  const render  = vm.renderer;
  const { BitmapSkin } = render.exports;

  // ══════════════════════════════════════════════════════════════
  // 내부 상태
  // ══════════════════════════════════════════════════════════════

  let dirHandle = null;

  // 스킨 슬롯 배열. 인덱스 그대로 접근.
  // [0] = null(공기), [1~9999] = 타일셋, [10000~] = 그 외
  const skins = new Array(10000).fill(null);

  // 이미지 메타 정보
  // { 이미지이름: { index: number, length: number, path: string } }
  const imageInfo = {};

  // 편집기 전용 보정 리스트
  // [ { name: string, offset: number }, ... ]
  const correctionList = [];

  // 그 외 범위(10000~) 다음 빈 슬롯 위치를 동적으로 계산
  // correctionList 마지막 항목 기준: 해당 이미지의 index + length
  // 이미지가 없으면 10000
  function getNextOtherIndex() {
    if (correctionList.length === 0) return 10000;
    const last = correctionList[correctionList.length - 1];
    const info = imageInfo[last.name];
    return info ? info.index + info.length : 10000;
  }

  // 마지막 로드 성공 여부
  let lastLoadOk = false;

  // ══════════════════════════════════════════════════════════════
  // 유틸
  // ══════════════════════════════════════════════════════════════

  async function openFile(path) {
    const parts = String(path).split('/').filter(Boolean);
    let dir = dirHandle;
    for (let i = 0; i < parts.length - 1; i++) {
      dir = await dir.getDirectoryHandle(parts[i]);
    }
    const fh = await dir.getFileHandle(parts[parts.length - 1]);
    return fh.getFile();
  }

  async function fileToImageBitmap(path) {
    const file   = await openFile(path);
    const buffer = await file.arrayBuffer();
    const ext    = String(path).split('.').pop().toLowerCase();
    const mime   = { png:'image/png', jpg:'image/jpeg', jpeg:'image/jpeg',
                     webp:'image/webp', bmp:'image/bmp', gif:'image/gif' }[ext] || 'image/png';
    const blob   = new Blob([buffer], { type: mime });
    return createImageBitmap(blob);
  }

  function putSkin(slotIndex, bitmap) {
    const old = skins[slotIndex];
    if (old !== null && old !== undefined) render.destroySkin(old);
    const skinId = render._nextSkinId++;
    const skin   = new BitmapSkin(skinId, render);
    skin.setBitmap(bitmap, 1);
    render._allSkins[skinId] = skin;
    skins[slotIndex] = skinId;
    return skinId;
  }

  function destroyRange(startIndex, length) {
    for (let i = startIndex; i < startIndex + length; i++) {
      const id = skins[i];
      if (id !== null && id !== undefined) {
        if (render._allSkins[id]) render.destroySkin(id);
        skins[i] = null;
      }
    }
  }

  // 이미 로드된 경로인지 확인 (타일셋 포함)
  function isPathDuplicate(path) {
    for (const info of Object.values(imageInfo)) {
      if (info.path === path) return true;
    }
    return false;
  }

  // ══════════════════════════════════════════════════════════════
  // 확장 클래스
  // ══════════════════════════════════════════════════════════════

  class TilesetLoader {
    getInfo() {
      return {
        id:    'TilesetLoader',
        name:  '이미지 로더',
        color1: '#2a7de1',
        color2: '#1a5db0',
        blocks: [

          // ── 폴더 ──────────────────────────────────────────────
          {
            opcode: 'pickFolder',
            blockType: Scratch.BlockType.COMMAND,
            text: '폴더 선택'
          },
          {
            opcode: 'isReady',
            blockType: Scratch.BlockType.BOOLEAN,
            text: '폴더 연결됨?'
          },

          '---',

          // ── 로드 ──────────────────────────────────────────────
          {
            opcode: 'loadTileset',
            blockType: Scratch.BlockType.COMMAND,
            text: '타일셋 __tileset__ [PATH] 로드 (가로 [TW] 세로 [TH])',
            arguments: {
              PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'tileset.png' },
              TW:   { type: Scratch.ArgumentType.NUMBER, defaultValue: 16 },
              TH:   { type: Scratch.ArgumentType.NUMBER, defaultValue: 16 }
            }
          },
          {
            opcode: 'loadSpriteSheet',
            blockType: Scratch.BlockType.COMMAND,
            text: '스프라이트 시트 [NAME] [PATH] 로드 (열 [COLS] 행 [ROWS])',
            arguments: {
              NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'hero' },
              PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'hero.png' },
              COLS: { type: Scratch.ArgumentType.NUMBER, defaultValue: 4 },
              ROWS: { type: Scratch.ArgumentType.NUMBER, defaultValue: 4 }
            }
          },
          {
            opcode: 'loadImage',
            blockType: Scratch.BlockType.COMMAND,
            text: '단일 이미지 [NAME] [PATH] 로드',
            arguments: {
              NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'bg' },
              PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'bg.png' }
            }
          },
          {
            opcode: 'getLastLoadOk',
            blockType: Scratch.BlockType.BOOLEAN,
            text: '마지막 로드 성공?'
          },

          '---',

          // ── 삭제 ──────────────────────────────────────────────
          {
            opcode: 'unloadImage',
            blockType: Scratch.BlockType.COMMAND,
            text: '이미지 [NAME] 삭제',
            arguments: {
              NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'hero' }
            }
          },

          '---',

          // ── 조회 ──────────────────────────────────────────────
          {
            opcode: 'getIndex',
            blockType: Scratch.BlockType.REPORTER,
            text: '[NAME] 의 시작 인덱스',
            arguments: {
              NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'hero' }
            }
          },
          {
            opcode: 'getLength',
            blockType: Scratch.BlockType.REPORTER,
            text: '[NAME] 의 스킨 길이',
            arguments: {
              NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'hero' }
            }
          },
          {
            opcode: 'getWidth',
            blockType: Scratch.BlockType.REPORTER,
            text: '[NAME] 의 가로 크기',
            arguments: {
              NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'hero' }
            }
          },
          {
            opcode: 'getHeight',
            blockType: Scratch.BlockType.REPORTER,
            text: '[NAME] 의 세로 크기',
            arguments: {
              NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'hero' }
            }
          },
          {
            opcode: 'isImageLoaded',
            blockType: Scratch.BlockType.BOOLEAN,
            text: '[NAME] 로드됨?',
            arguments: {
              NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'hero' }
            }
          },
          {
            opcode: 'getImageList',
            blockType: Scratch.BlockType.REPORTER,
            text: '로드된 이미지 목록'
          },

          '---',

          // ── 편집기 전용: 보정 ──────────────────────────────────
          {
            opcode: 'getSaveIndex',
            blockType: Scratch.BlockType.REPORTER,
            text: '[NAME] 의 저장용 인덱스 (보정 적용)',
            arguments: {
              NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'hero' }
            }
          },

          '---',

          // ── 스킨 적용 ──────────────────────────────────────────
          {
            opcode: 'setSkinByIndex',
            blockType: Scratch.BlockType.COMMAND,
            text: '[TARGET] 에 스킨 인덱스 [IDX] 적용',
            arguments: {
              TARGET: { type: Scratch.ArgumentType.STRING, menu: 'targetMenu' },
              IDX:    { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 }
            }
          },
          {
            opcode: 'restoreSkin',
            blockType: Scratch.BlockType.COMMAND,
            text: '[TARGET] 원래 코스튬 복원',
            arguments: {
              TARGET: { type: Scratch.ArgumentType.STRING, menu: 'targetMenu' }
            }
          }
        ],
        menus: {
          targetMenu: {
            acceptReporters: true,
            items: '_getTargets'
          }
        }
      };
    }

    // ── 폴더 선택 ────────────────────────────────────────────────
    async pickFolder() {
      try {
        dirHandle = await window.showDirectoryPicker({ mode: 'read' });
      } catch (e) {
        dirHandle = null;
      }
    }
    isReady() { return dirHandle !== null; }

    // ── 타일셋 로드 (1번~9999, 오직 하나) ───────────────────────
    async loadTileset(args) {
      lastLoadOk = false;
      if (!dirHandle) return;

      const path = String(args.PATH);
      const tw   = Math.max(1, Math.floor(Number(args.TW)));
      const th   = Math.max(1, Math.floor(Number(args.TH)));
      const name = '__tileset__';

      // 이름 중복 (이미 타일셋 있음)
      if (imageInfo[name]) return;
      // 경로 중복
      if (isPathDuplicate(path)) return;

      let sheet;
      try { sheet = await fileToImageBitmap(path); }
      catch (e) { console.warn('[TilesetLoader] 타일셋 로드 실패:', e); return; }

      const cols  = Math.floor(sheet.width  / tw);
      const rows  = Math.floor(sheet.height / th);
      const total = cols * rows;
      if (total === 0) { sheet.close(); return; }

      const tasks = [];
      for (let i = 0; i < total; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        tasks.push(
          createImageBitmap(sheet, col * tw, row * th, tw, th)
            .then(tile => { putSkin(i + 1, tile); tile.close(); })
        );
      }
      await Promise.all(tasks);
      sheet.close();

      imageInfo[name] = { index: 1, length: total, path, tw, th };
      lastLoadOk = true;
    }

    // ── 스프라이트 시트 로드 (10000번~) ─────────────────────────
    async loadSpriteSheet(args) {
      lastLoadOk = false;
      if (!dirHandle) return;

      const name = String(args.NAME);
      const path = String(args.PATH);
      const cols = Math.max(1, Math.floor(Number(args.COLS)));
      const rows = Math.max(1, Math.floor(Number(args.ROWS)));

      // 이름 중복
      if (imageInfo[name]) return;
      // 경로 중복
      if (isPathDuplicate(path)) return;

      let sheet;
      try { sheet = await fileToImageBitmap(path); }
      catch (e) { console.warn('[TilesetLoader] 시트 로드 실패:', e); return; }

      const total = cols * rows;
      const tw = Math.floor(sheet.width  / cols);
      const th = Math.floor(sheet.height / rows);
      if (total === 0) { sheet.close(); return; }

      const startSlot = getNextOtherIndex();
      while (skins.length < startSlot + total) skins.push(null);

      const tasks = [];
      for (let i = 0; i < total; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        tasks.push(
          createImageBitmap(sheet, col * tw, row * th, tw, th)
            .then(tile => { putSkin(startSlot + i, tile); tile.close(); })
        );
      }
      await Promise.all(tasks);
      sheet.close();

      imageInfo[name] = { index: startSlot, length: total, path, tw, th };
      // 바로 앞 항목의 offset을 이어받음 (중간 삭제 보정 누적값 승계)
      const prevOffset = correctionList.length > 0
        ? correctionList[correctionList.length - 1].offset : 0;
      correctionList.push({ name, offset: prevOffset });
      lastLoadOk = true;
    }

    // ── 단일 이미지 로드 (10000번~) ─────────────────────────────
    async loadImage(args) {
      lastLoadOk = false;
      if (!dirHandle) return;

      const name = String(args.NAME);
      const path = String(args.PATH);

      // 이름 중복
      if (imageInfo[name]) return;
      // 경로 중복
      if (isPathDuplicate(path)) return;

      let bitmap;
      try { bitmap = await fileToImageBitmap(path); }
      catch (e) { console.warn('[TilesetLoader] 이미지 로드 실패:', e); return; }

      const slot = getNextOtherIndex();
      while (skins.length < slot + 1) skins.push(null);

      const tw = bitmap.width;
      const th = bitmap.height;
      putSkin(slot, bitmap);
      bitmap.close();

      imageInfo[name] = { index: slot, length: 1, path, tw, th };
      // 바로 앞 항목의 offset을 이어받음 (중간 삭제 보정 누적값 승계)
      const prevOffset = correctionList.length > 0
        ? correctionList[correctionList.length - 1].offset : 0;
      correctionList.push({ name, offset: prevOffset });
      lastLoadOk = true;
    }

    getLastLoadOk() { return lastLoadOk; }

    isImageLoaded(args) {
      return String(args.NAME) in imageInfo;
    }

    // ── 삭제 ────────────────────────────────────────────────────
    unloadImage(args) {
      this._removeOtherImage(String(args.NAME));
    }

    _removeOtherImage(name) {
      const info = imageInfo[name];
      if (!info) return;

      destroyRange(info.index, info.length);
      delete imageInfo[name];

      // 보정 리스트 갱신
      const idx = correctionList.findIndex(e => e.name === name);
      if (idx === -1) return;
      for (let i = idx + 1; i < correctionList.length; i++) {
        correctionList[i].offset += info.length;
      }
      correctionList.splice(idx, 1);
    }

    // ── 조회 ────────────────────────────────────────────────────
    getWidth(args) {
      const info = imageInfo[String(args.NAME)];
      return info ? info.tw : 0;
    }

    getHeight(args) {
      const info = imageInfo[String(args.NAME)];
      return info ? info.th : 0;
    }

    getIndex(args) {
      const info = imageInfo[String(args.NAME)];
      return info ? info.index : -1;
    }

    getLength(args) {
      const info = imageInfo[String(args.NAME)];
      return info ? info.length : 0;
    }

    getImageList() {
      // __tileset__ 은 별도 표기, 나머지는 이름만
      const result = [];
      for (const name of Object.keys(imageInfo)) {
        if (name === '__tileset__') result.push('__tileset__');
        else result.push(name);
      }
      return JSON.stringify(result);
    }

    // ── 편집기 전용: 보정 ────────────────────────────────────────
    getSaveIndex(args) {
      const name = String(args.NAME);
      const info = imageInfo[name];
      if (!info) return -1;
      const entry = correctionList.find(e => e.name === name);
      const offset = entry ? entry.offset : 0;
      return info.index - offset;
    }

    // ── 스킨 적용 ────────────────────────────────────────────────
    setSkinByIndex(args, util) {
      const idx    = Math.floor(Number(args.IDX));
      const target = this._getTargetFromMenu(String(args.TARGET), util);
      if (!target) return;
      const skinId = skins[idx];
      if (skinId === null || skinId === undefined) return;
      render.updateDrawableSkinId(target.drawableID, skinId);
    }

    restoreSkin(args, util) {
      const target = this._getTargetFromMenu(String(args.TARGET), util);
      if (target) target.updateAllDrawableProperties();
    }

    // ── 내부 헬퍼 ────────────────────────────────────────────────
    _getTargets() {
      const items = [
        { text: '자신', value: '_myself_' },
        { text: '스테이지', value: '_stage_' }
      ];
      for (const t of runtime.targets) {
        if (t.isOriginal) items.push({ text: t.getName(), value: t.getName() });
      }
      return items;
    }

    _getTargetFromMenu(name, util) {
      if (name === '_myself_') return util.target;
      if (name === '_stage_') return runtime.getTargetForStage();
      return runtime.getSpriteTargetByName(name);
    }
  }

  Scratch.extensions.register(new TilesetLoader());
})(Scratch);
