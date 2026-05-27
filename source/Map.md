```cpp
sprite Map {
    // 멤버변수(전역):
    int width // 맵 가로길이
    int height // 맵 세로길이
    int list map_layer1 // 맵 레이어 1층의 데이터를 저장하기 위한 리스트
    int list map_layer2 // 맵 레이어 2층의 데이터를 저장하기 위한 리스트
    int list map_layer3 // 맵 레이어 3층의 데이터를 저장하기 위한 리스트
    // 멤버변수(방송하기):
    void method() {
        if (method_command == "setWidth") { // int setWidth()
            width = method_param
        }
        if (method_command == "setHeight") { // int setHeight()
            height = method_param
        }
        if (method_comand == "setMap") { // void setMap()
            clear(map_data) // void clear(list)는 해당 리스트의 항목 모두 삭제
            clear(map_layer1)
            cleer(map_layer2)
            clear(map_layer3)
            loop(width * height) { // void loop(count)는 해당 횟수만큼 반복
                add(map_layer1, 0) // void add(list, value)는 해당 리스트의 마지막 항목에 해당 값(0: 불러온 타일셋의 첫번째 타일, 499: 투명 타일) 추가
                add(map_layer2, 499)
                add(map_layer3, 499)
            }
        }
    }
}
```

