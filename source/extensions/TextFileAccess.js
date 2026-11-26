(function (Scratch) {
    'use strict';
    if (!Scratch.extensions.unsandboxed) {
        throw new Error('비샌드박스(Unsandboxed)로 불러와야 합니다');
    }

    let dirHandle = null;
    let lastWriteOk = false;

    async function openFile(path) {
        const parts = String(path).split('/').filter(Boolean);
        let dir = dirHandle;
        for (let i = 0; i < parts.length - 1; i++) {
            dir = await dir.getDirectoryHandle(parts[i]);
        }
        const fh = await dir.getFileHandle(parts[parts.length - 1]);
        return fh.getFile();
    }

    // 쓰기용: 파일이 없으면 만들고, 중간 폴더가 없으면 폴더도 만든다
    async function openFileForWrite(path) {
        const parts = String(path).split('/').filter(Boolean);
        if (parts.length === 0) throw new Error('경로가 비어 있습니다');
        let dir = dirHandle;
        for (let i = 0; i < parts.length - 1; i++) {
            dir = await dir.getDirectoryHandle(parts[i], { create: true });
        }
        return dir.getFileHandle(parts[parts.length - 1], { create: true });
    }

    class TextFileAccess {
        getInfo() {
            return {
                id: 'TextFileAccess',
                name: '텍스트 파일 접근',
                blocks: [
                    {
                        opcode: 'pick',
                        blockType: Scratch.BlockType.COMMAND,
                        text: '폴더 선택'
                    },
                    {
                        opcode: 'ready',
                        blockType: Scratch.BlockType.BOOLEAN,
                        text: '폴더 연결됨?'
                    },
                    {
                        opcode: 'read',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '[PATH] 텍스트 읽기',
                        arguments: {
                            PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'test/text1.txt' }
                        }
                    },
                    {
                        opcode: 'write',
                        blockType: Scratch.BlockType.COMMAND,
                        text: '[PATH] 에 [TEXT] 덮어쓰기',
                        arguments: {
                            PATH: { type: Scratch.ArgumentType.STRING, defaultValue: 'test/text1.txt' },
                            TEXT: { type: Scratch.ArgumentType.STRING, defaultValue: '내용' }
                        }
                    },
                    {
                        opcode: 'writeOk',
                        blockType: Scratch.BlockType.BOOLEAN,
                        text: '쓰기 성공?'
                    }
                ]
            };
        }
        async pick() {
            try {
                dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
            } catch (e) {
                dirHandle = null;
            }
        }
        ready() {
            return dirHandle !== null;
        }
        async read(args) {
            try {
                const file = await openFile(args.PATH);
                return await file.text();
            } catch (e) {
                return '';
            }
        }
        async write(args) {
            lastWriteOk = false;
            try {
                const fh = await openFileForWrite(args.PATH);
                const writable = await fh.createWritable();
                await writable.write(String(args.TEXT));
                await writable.close();
                lastWriteOk = true;
            } catch (e) {
                lastWriteOk = false;
            }
        }
        writeOk() {
            return lastWriteOk;
        }
    }

    Scratch.extensions.register(new TextFileAccess());
})(Scratch);