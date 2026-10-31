# Web 錯題登記（GitHub Pages + Apps Script + Sheet）

流程：

```
學生／老師喺網站勾錯題
    → POST JSON 到 Apps Script Web App
    → Google Sheet「ErrorLog」追加一列（聚合 wrong_ids）
    → 下載 CSV
    → scripts/sync_errors_from_sheet.py → data/errors.csv
    → scripts/hw_cli.py generate_errorbook → 每人鞏固 PDF
```

## 本資料夾

| 檔 | 作用 |
|----|------|
| `index.html` | 記錯頁（班別／學號／語言／作業／勾 @hw id） |
| `config.js` | **填** `webAppUrl`（Apps Script `/exec`） |
| `questions-catalog.json` | 題庫 metadata（無題身）；用下面指令重生 |
| `assets/` | CSS／JS |
| `apps-script/` | `Code.gs` + 部署說明 |

## 重生題庫目錄

題庫有增刪後：

```bat
python scripts\build_questions_catalog.py
```

會寫 `web/questions-catalog.json`（zh／en 分開，`lang` 欄位）。

## GitHub Pages

1. 把本 repo push 去 GitHub。
2. Settings → Pages → Source：Deploy from branch；folder 選 `/web`（若 GitHub 支援），或把 `web/` 內容放到 `docs/`／根目錄按你慣用方式。
3. 開啟 Pages URL，確認能載入目錄同提交（需已填 `config.js`）。

**唔好**把服務帳密／OAuth token 寫入 repo。Web App URL 本身係「Anyone」連結，只應給校內使用；要收緊可改 Apps Script 權限或加共用密鑰（下一版）。

## Apps Script

見 [`apps-script/README.md`](apps-script/README.md)。

## 同步 + 出卷（Windows 本機）

```bat
cd C:\Users\acer\Desktop\hw-error-book

REM Sheet → 檔案 → 下載 → CSV 後：
python scripts\sync_errors_from_sheet.py --sheet-csv %USERPROFILE%\Downloads\ErrorLog.csv --out data\errors.csv

python scripts\hw_cli.py generate_errorbook --errors data\errors.csv --lang zh --per-type 4
```

`generate_errorbook` 會為每位學生產生：原錯題參考 + 同 type 隨機鞏固題（排除原錯 id）。
