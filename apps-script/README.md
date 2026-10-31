# Apps Script：錯題寫入 Google Sheet

網站（GitHub Pages）POST JSON → 本 Web App → 工作表 `ErrorLog` 追加一列（**每次提交聚合一行**，`wrong_ids`／`wrong_types` 用分號分隔，對齊 `data/errors.csv`）。

## 欄位（ErrorLog）

| 欄 | 說明 |
|----|------|
| timestamp | ISO 時間 |
| class | 班別 |
| student_id | 學號 |
| student_name | 姓名 |
| homework_id | 作業標籤 |
| wrong_ids | 分號分隔題 id |
| wrong_types | 分號分隔題型 |
| lang | zh / en |
| source | 例如 github-pages |

## 部署步驟

1. 開 [Google Sheets](https://sheets.google.com) → 新增空白試算表（例如「HW Error Log」）。
2. **擴充功能 → Apps Script**，刪預設碼，貼上本資料夾 `Code.gs` 全文 → 儲存。
3. （可選）喺編輯器跑 `testAppendSample`，確認工作表出現 `ErrorLog` 同示範列。
4. **Deploy → New deployment → 類型選 Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. 授權後複製 **Web app URL**（以 `/exec` 結尾）。
6. 貼去 repo 嘅 `web/config.js`：

```js
window.ERROR_BOOK_CONFIG = {
  webAppUrl: "https://script.google.com/macros/s/XXXX/exec",
  defaultHomeworkId: "",
};
```

7. GitHub Pages 指向 `web/`（或把 `web/` 內容放到 Pages 根目錄）。改 `config.js` 後要重新 publish／commit。

## 前端 POST 注意

瀏覽器 CORS：前端用 `Content-Type: text/plain;charset=utf-8` + `JSON.stringify(body)`（Apps Script Web App 常見做法），避免 preflight 失敗。回應 JSON 睇 `ok` 欄。

## 之後出卷

Sheet → 檔案 → 下載 → CSV，再：

```bat
python scripts\sync_errors_from_sheet.py --sheet-csv 下載嘅.csv --out data\errors.csv
python scripts\hw_cli.py generate_errorbook --errors data\errors.csv --lang zh --per-type 4
```
