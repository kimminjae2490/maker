```cpp
sprite Main {
    //전역변수(스프라이트 내 멤버함수의 매개변수에 인자값 전달을 위함)
    string method_command
    ? param // ? 자료형은 어떤 자료형을 담게 될 지 알 수 없음
    //함수(내 블록):
    void map_method(string command, ? param) {
        method_command = command
        method_param = param
        wait map.method() // wait sprite.method()는 방송하고 기다리기
    }
    void tileset_method(string command, ? param) {
        method_command = command
        method_param = param
        wait tileset.method()
    }
    void GUI_method(string command, ? param) {
        method_command = command
        method_param = param
        wait GUI.method()
    }
    //실행:
    map_method("setWidth", 20)
    map_method("setHeight", 15)
    tileset_method("setName", "002-Woods")
    tileset_method("loadTileset", )
    tileset("setMap", )
    GUI_method("setScroll", )
    GUI_method("showViewport", )
    loop(true) {
        GUI_method("run", )
    }
}
```
