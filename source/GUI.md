```cpp
sprite GUI {
    // 함수(내 블록):
        void setScroll(int length, int& scroll, int x, int& scroll_length, int& count) {
            if (length > 20) {
                move(scroll, x, 180)
                scroll_length = tile_size * (length - 20)
            }
            else {
                move(scroll, 240, 180)
                scroll_length = 0
            }
            if (length > 21) {
                count = 22
            }
            else {
                count = length
            }
        }
        void showViewport(int type) {
            clear()
            showViewport(0, , , , -232, (132 + (tileset_scrollY_length *(tileset_scrollY / 100))), 0, tilesetY, 8, tilesetY_count)
            int local_map_scrollX = -72 - (map_scrollX_length * (map_scrollX / 100))
            int local_map_scrollY = 132 + (map_scrollY_length * (map_scrollY / 100))
            if (type == 1) {
                showViewport(type, 0, , , local_map_scrollX, local_map_scrollY, mapX, mapY, mapX_count, mapY_count)
            }
            else {
                if (type == 2) {
                    showViewport(type, -25, 0, , local_map_scrollX, local_map_scrollY, mapX, mapY, mapX_count, mapY_count)
                }
                else {
                    if (type == 3) {
                        showViewport(type, -50, -25, 0, local_map_scrollX, local_map_scrollY, mapX, mapY, mapX_count, mapY_count)
                    }
                    else {
                        showViewport(type, 0, 0, 0, local_map_scrollX, local_map_scrollY, mapX, mapY, mapX_count, mapY_count)
                    }
                }
            }
        }
        void showViewport(int type, int br1, int br2, int br3, int x, int y, int i, int j, int x_count, int y_count) {
            int x = x
            int y = y
            for (int j = j, j < y_count, j++) {
                for (int i = i, i < x_count, i++) {
                    move(x + (i * tile_size), y - (j * tile_size))
                    if (type == 0) {
                        showTile(j * x_count + i, 0)
                    }
                    else {
                        int index = j * map.width + i + 1
                        showTile(map_layer1[index], br1)
                        if (type > 1) {
                            showTile(map_layer2[index], br2)
                            if (type > 2) {
                                showTile(map_layer3[index], br3)
                            }
                        }
                    }
                }
            }
        }
        void showTile(int i, int brightness) {
            setBrightness(brightness)
            selectSkin(myself, tileset.name + "{i}")
            stamp()
        }
    // 멤버변수(전역):
    int map_layer = 4
    int tile_size = 16
    int map_scrollX = 0
    int map_scrollX_length
    int map_scrollX_temp = map_scrollX
    int mapX = 0
    int mapX_count
    int mapX_temp = mapX
    int map_scrollY = 0
    int map_scrollY_length
    int map_scrollY_temp = map_scrollY
    int mapY = 0
    int mapY_count
    int mapY_temp = mapY
    int tileset_scrollY = 0
    int tileset_scrollY_length
    int tileset_scrollY_temp = tileset_scrollY
    int tilesetY = 0
    int tilesetY_count
    int tilesetY_temp = tilesetY
    // 멤버함수(방송하기):
    void method() {
        if (method_command == "setScroll") { // void setScroll()
            setScroll(tileset.height, tileset_scrollY, -250, tileset_scrollY_length, tilesetY_count)
            setScroll(map.width, map_scrollX, -77, map_scrollX_length, mapX_count)
            setScroll(map.height, map_scrollY, 85, map_scrollY_length, mapY_count)
        }
        if (method_command == "showViewport") { // void showViewport()
            showViewport(map_layer)
        }
        if (method_command == "run") {
            if(tileset_scrollY == tileset_scrollY_temp) {
                if (map_scrollX == map_scrollX_temp) {
                    if (map_scrollY == map_scrollY_temp) {

                    }
                    else {
                        map_Y = floor((map_scrollY / 100) * (map.height - 21))
                        showViewport(map_layer)
                        mapY_temp = mapY
                        map_scrollY_temp = map_scrollY
                    }
                }    
                else {
                    mapX = floor((map_scrollX / 100) * (map.width - 21))
                    showViewport(map_layer)
                    mapX_temp = mapX
                    map_scrollX_temp = map_scrollX
                }
            }
            else {
                tilesetY = floor((tileset_scrollY / 100) * (tileset.height - 21))
                showViewport(map_layer)
                tilesetY_temp = tilesetY
                tileset_scrollY_temp = tileset_scrollY
            }
        }
    }
}
```