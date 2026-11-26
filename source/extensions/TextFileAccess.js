(function (Scratch) {
    'use strict';

    if (!Scratch.extensions.unsandboxed) {
        throw new Error('비샌드박스(Unsandboxed)로 불러와야 합니다');
    }

    let dirHandle = null;
    let lastWriteOk = false;
    let lastDeleteOk = false;

    async function openFile(path) {
        const parts = String(path).split('/').filter(Boolean);
        let dir = dirHandle;

        for (let i = 0; i < parts.length - 1; i++) {
            dir = await dir.getDirectoryHandle(parts[i]);
        }

        const fh = await dir.getFileHandle(parts[parts.length - 1]);
        return fh.getFile();
    }

    // 경로의 상위 폴더와 파일명을 반환한다.
    async function getParentDirectory(path) {
        const parts = String(path).split('/').filter(Boolean);

        if (parts.length === 0) {
            throw new Error('경로가 비어 있습니다');
        }

        let dir = dirHandle;

        for (let i = 0; i < parts.length - 1; i++) {
            dir = await dir.getDirectoryHandle(parts[i]);
        }

        return {
            dir,
            fileName: parts[parts.length - 1]
        };
    }

    // 쓰기용: 파일이 없으면 생성하고 중간 폴더도 생성한다.
    async function openFileForWrite(path) {
        const parts = String(path).split('/').filter(Boolean);

        if (parts.length === 0) {
            throw new Error('경로가 비어 있습니다');
        }

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
                            PATH: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: 'test/text1.txt'
                            }
                        }
                    },
                    {
                        opcode: 'write',
                        blockType: Scratch.BlockType.COMMAND,
                        text: '[PATH] 에 [TEXT] 덮어쓰기',
                        arguments: {
                            PATH: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: 'test/text1.txt'
                            },
                            TEXT: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: '내용'
                            }
                        }
                    },
                    {
                        opcode: 'writeOk',
                        blockType: Scratch.BlockType.BOOLEAN,
                        text: '쓰기 성공?'
                    },
                    {
                        opcode: 'exists',
                        blockType: Scratch.BlockType.BOOLEAN,
                        text: '[PATH] 파일이 존재하는가?',
                        arguments: {
                            PATH: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: 'test/text1.txt'
                            }
                        }
                    },
                    {
                        opcode: 'delete',
                        blockType: Scratch.BlockType.COMMAND,
                        text: '[PATH] 파일 삭제',
                        arguments: {
                            PATH: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: 'test/text1.txt'
                            }
                        }
                    },
                    {
                        opcode: 'deleteOk',
                        blockType: Scratch.BlockType.BOOLEAN,
                        text: '삭제 성공?'
                    }
                ]
            };
        }

        async pick() {
            try {
                dirHandle = await window.showDirectoryPicker({
                    mode: 'readwrite'
                });
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

        // 파일 존재 여부 확인
        async exists(args) {
            try {
                const { dir, fileName } =
                    await getParentDirectory(args.PATH);

                await dir.getFileHandle(fileName);

                return true;
            } catch (e) {
                return false;
            }
        }

        // 지정한 경로의 파일 삭제
        async delete(args) {
            lastDeleteOk = false;

            try {
                const { dir, fileName } =
                    await getParentDirectory(args.PATH);

                await dir.removeEntry(fileName);

                lastDeleteOk = true;
            } catch (e) {
                lastDeleteOk = false;
            }
        }

        // 마지막 삭제 작업의 성공 여부
        deleteOk() {
            return lastDeleteOk;
        }
    }

    Scratch.extensions.register(new TextFileAccess());

})(Scratch);
