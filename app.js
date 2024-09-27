document.addEventListener("DOMContentLoaded", () => {
    const attendanceForm = document.getElementById("attendanceForm");
    const studentIdInput = document.getElementById("studentId");
    const attendanceList = document.getElementById("attendanceList");
    const startScannerButton = document.getElementById("startScanner");
    const scannerContainer = document.getElementById("scanner-container");


    // 出席記録を保存する配列
    let attendanceRecords = [];


    // 出席を記録
    attendanceForm.addEventListener("submit", (e) => {

        e.preventDefault(); // デフォルトのフォーム送信を防ぐ

        // 入力された学籍番号を取得
        const studentId = document.getElementById('studentId').value.trim();

        // 学籍番号が既に記録されているか確認
        if (attendanceRecords.includes(studentId)) {
            alert(`学籍番号 ${studentId} は既に記録されています。`);
        } else {
            // 学籍番号を出席記録に追加
            attendanceRecords.push(studentId);

            // Google Sheetsに出席を記録
            recordAttendanceInGoogleSheets(studentId);

            // 出席リストを更新
            updateAttendanceList(studentId);


        }

        // 入力フィールドをクリア
        document.getElementById('studentId').value = '';
    });

    // QuaggaJSでバーコードスキャンを開始
    startScannerButton.addEventListener("click", () => {
        const barcodeValueElement = document.getElementById('barcodeValue');

        // Quaggaの初期化
        Quagga.init({
            inputStream: {
                name: "Live",
                type: "LiveStream",
                target: document.querySelector('#scanner-container'), // カメラのストリームを表示するコンテナ
                constraints: {
                    facingMode: "environment", // 背面カメラを使用（スマートフォン）
                    width: { ideal: 1280 },  // 幅の理想的な値
                    height: { ideal: 720 }   // 高さの理想的な値
                },
                area: { // スキャンエリアを指定
                    top: "0%",    // 上端
                    right: "0%",  // 右端
                    left: "0%",   // 左端
                    bottom: "0%" // 下端
                }
            },
            decoder: {
                readers: ["code_128_reader", "ean_reader", "upc_reader"] // 複数のリーダーを指定
            }
        }, function (err) {
            if (err) {
                console.error(err);
                return;
            }
            console.log("Quagga initialization succeeded");
            Quagga.start(); // バーコードスキャン開始
        });
        let lastDetectedTime = 0; // 最後に検出した時間を保持
        let lastDetectedCode = ''; // 最後に検出されたバーコード

        Quagga.onDetected(function (result) {
            const code = result.codeResult.code;
            const currentTime = Date.now();

            // ここでは3秒 (3000ms) の間隔を設定し、かつ前回と同じバーコードの場合は無視
            if (currentTime - lastDetectedTime > 3000 && code !== lastDetectedCode) {
                lastDetectedTime = currentTime;
                lastDetectedCode = code; // 最後に検出されたコードを更新

                // 学籍番号が既に記録されているか確認
                if (attendanceRecords.includes(code)) {
                    alert(`学籍番号 ${code} は既に記録されています。`);
                } else {
                    // 学籍番号を出席記録に追加
                    attendanceRecords.push(code);

                    // 出席リストを更新
                    updateAttendanceList(code);
                }

                barcodeValueElement.textContent = code; // 読み取ったバーコードを表示
            }
        });


    });




    // 出席リストをページ上に表示する関数
    function updateAttendanceList(studentId) {
        let date = new Date(); // 日付取得
        const listItem = document.createElement('li');
        listItem.textContent = `学籍番号: ${studentId} - ${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}時${date.getMinutes()}分 出席`;

        const attendanceList = document.getElementById('attendanceList'); // 出席リスト要素を取得

        // 一番上に挿入する
        if (attendanceList.firstChild) {
            attendanceList.insertBefore(listItem, attendanceList.firstChild);
        } else {
            attendanceList.appendChild(listItem); // リストが空の場合
        }
    }


    // Google Sheetsに出席を記録する関数
    function recordAttendanceInGoogleSheets(studentId) {
        fetch('https://script.google.com/a/macros/st.kobedenshi.ac.jp/s/AKfycbzgVXQ8d2Ho0FeBFACwu__drHJOE6ljOOLzV29dELnDED6kJc-3tbkvHHOihGLM8bWs/exec', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `studentId=${encodeURIComponent(studentId)}`
        })
            .then(response => {
                if (response.ok) {
                    console.log('出席が正常に記録されました。');
                } else {
                    console.error('出席の記録に失敗しました。');
                }
            })
            .catch(error => console.error('エラー:', error));
    }

});

