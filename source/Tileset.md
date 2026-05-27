```cpp
sprite Tileset {
    // 병렬연산(복제하기):
    void clone() { // 생성된 복제본은 자신만의 지역변수를 가지며, 앞서 멤버함수 내에 생성된 변수들이 지역변수에 해당
        loop(3 - length(i)) { // int length(string)는 해당 문자열 길이 반환
            url += "0"
        }
        loadSkinFromURL(name + "{i}", url + "{i}" + ".png") // void loadSkinFromURL(name, url)는 해당 주소에서 스킨을 불러온 뒤 name에 해당하는 이름을 붙여서 접근하도록 함
        if (!IsLoadSkin(name + "{i}")) { // bool IsLoadSkin(name)는 해당 이름의 스킨을 불러왔는지 확인해 참/거짓을 반환함
            print(name + "{i}" + ".png 파일을 불러오는데 실패했습니다"
            stop() // void stop()은 프로그램 종료함
        }
        DeleteClone() // void DeleteClone()은 해당 복제본을 삭제함. 삭제된 이후에는 해당 복제본을 사용할 수 없음
    }
    // 멤버변수(전역):
    string name // 타일셋 이름
    int count // 불러온 타일셋 내 타일의 개수 
    int height // 불러온 타일셋의 세로길이(가로길이는 8로 고정)
    // 멤버함수(방송하기):
    void method() {
        if (method_command == "setName") { // string setName()
            name = method_param
        }
        if (method_command == "loadTileset") {
            string url = "https://raw.githubusercontent.com/kimminjae2490/tile_chip/refs/heads/main/" + name // string + 연산자는 두 문자열을 결합해 문자열 반환
            count = get(url + "/num.txt") // ? get(url)는 해당 주소로 요청해 다양한 종류의 데이터를 반환
            url += "/tile"
            for (int i = 0, i < count, i++) {
                clone() // void clone()은 복제본을 생성함
            }
            for (int i = 0, i < count, i++) {
                wait (IsIoadSkin(name + "{i}")) // string {?} 연산자는 해당 변수를 문자열로 변환해 반환. void wait(bool)은 해당 논리식이 참이 될 때까지 기다림
            }
            loadSkin(499, name + "499") // void loadSkin(name, shape)은 해당 스프라이트 내 모양에서 스킨을 불러온 뒤 name에 해당하는 이름을 붙여서 접근하도록 함
            print("모든 .png 파일을 불러오는데 성공했습니다")
        }
    }
}
```
