(function (Scratch) {
  'use strict';

  if (!Scratch.extensions.unsandboxed) {
    throw new Error('이 익스텐션은 unsandboxed 모드에서만 동작합니다.');
  }

  class MouseMoveExtension {
    constructor(runtime) {
      this.runtime = runtime;

      this._prevX = null;
      this._prevY = null;
      this._moved = false;
      this._deltaX = 0;
      this._deltaY = 0;

      // 캔버스 요소 찾기
      this._canvas = runtime.renderer && runtime.renderer.canvas
        ? runtime.renderer.canvas
        : document.querySelector('canvas');

      // JS 네이티브 mousemove 이벤트 등록
      document.addEventListener('mousemove', (e) => {
        const rect = this._canvas ? this._canvas.getBoundingClientRect() : null;
        if (!rect) return;

        // 캔버스 기준 좌표로 변환 (스크래치 좌표계)
        const scaleX = (rect.width > 0) ? (480 / rect.width) : 1;
        const scaleY = (rect.height > 0) ? (360 / rect.height) : 1;
        const currentX = (e.clientX - rect.left) * scaleX - 240;
        const currentY = -((e.clientY - rect.top) * scaleY - 180);

        // 스테이지 범위 밖이면 무시
        if (currentX < -240 || currentX > 240 || currentY < -180 || currentY > 180) {
          this._prevX = null;
          this._prevY = null;
          return;
        }

        // 이동량 계산 (이전 위치가 스테이지 내부였을 때만)
        if (this._prevX !== null) {
          this._deltaX = currentX - this._prevX;
          this._deltaY = currentY - this._prevY;
        } else {
          this._deltaX = 0;
          this._deltaY = 0;
        }

        this._prevX = currentX;
        this._prevY = currentY;
        this._moved = true;

        // HAT 블록 트리거
        this.runtime.startHats('mousemoveext_whenMouseMoved');
      });
    }

    getInfo() {
      return {
        id: 'mousemoveext',
        name: '마우스 이동',
        blocks: [
          {
            opcode: 'whenMouseMoved',
            blockType: Scratch.BlockType.HAT,
            text: '마우스가 움직였을 때',
          },
          {
            opcode: 'getDeltaX',
            blockType: Scratch.BlockType.REPORTER,
            text: '마우스 X 이동량',
          },
          {
            opcode: 'getDeltaY',
            blockType: Scratch.BlockType.REPORTER,
            text: '마우스 Y 이동량',
          },
        ],
      };
    }

    whenMouseMoved() {
      const result = this._moved;
      this._moved = false;
      return result;
    }

    getDeltaX() {
      return Math.round(this._deltaX);
    }

    getDeltaY() {
      return Math.round(this._deltaY);
    }
  }

  Scratch.extensions.register(new MouseMoveExtension(Scratch.vm.runtime));
})(Scratch);
