# データベースマッピング表

## アプリケーション型とSupabase型の対応関係

### Task (タスク)
| アプリケーション型 | Supabase型 | 変換方法 | 備考 |
|---|---|---|---|
| `Task.id` | `tasks.id` | 直接対応 | UUID |
| `Task.title` | `tasks.title` | 直接対応 | |
| `Task.description` | `tasks.description` | 直接対応 | nullable |
| `Task.handler` | `tasks.handler` | 直接対応 | nullable |
| `Task.status` | `tasks.status` | 直接対応 | enum: not_started/in_progress/done |
| `Task.itemIds` | リレーション | `task_items.task_id`で関連アイテムを取得 | |
| `Task.createdAt` | `tasks.created_at` | 日付文字列に変換 | |

### Item (物品)
| アプリケーション型 | Supabase型 | 変換方法 | 備考 |
|---|---|---|---|
| `Item.id` | `task_items.id` | 直接対応 | UUID |
| `Item.taskId` | `task_items.task_id` | 直接対応 | |
| `Item.name` | `task_items.name` | 直接対応 | |
| `Item.quantity` | `task_items.quantity` | 直接対応 | |
| `Item.sourceName` | `task_items.source_name` | 直接対応 | |
| `Item.targetName` | `task_items.target_name` | 直接対応 | |
| `Item.handler` | `task_items.handler` | 直接対応 | nullable |
| `Item.status` | `task_items.status` | 直接対応 | enum: unplaced/moving/placed/issue |
| `Item.pin` | リレーション | `pickup_location_id`, `dropoff_location_id`から構築 | LocationPin型に変換 |
| `Item.photoIds` | リレーション | `task_item_photos.task_item_id`で関連写真を取得 | |

### ItemPhoto (写真)
| アプリケーション型 | Supabase型 | 変換方法 | 備考 |
|---|---|---|---|
| `ItemPhoto.id` | `task_item_photos.id` | 直接対応 | UUID |
| `ItemPhoto.itemId` | `task_item_photos.task_item_id` | 直接対応 | |
| `ItemPhoto.fileName` | `task_item_photos.storage_path`から抽出 | パスの最後の部分 | |
| `ItemPhoto.mimeType` | `task_item_photos.mime_type` | 直接対応 | |
| `ItemPhoto.size` | `task_item_photos.file_size` | 直接対応 | |
| `ItemPhoto.createdAt` | `task_item_photos.created_at` | 日付文字列に変換 | |
| `ItemPhoto.note` | `task_item_photos.caption` | 直接対応 | nullable |
| `ItemPhoto.hasBlob` | 計算値 | Storageに存在するかチェック | |
| `ItemPhoto.previewDataUrl` | Storage URL | 署名付きURLを生成 | |

### LogEvent (ログ)
| アプリケーション型 | Supabase型 | 変換方法 | 備考 |
|---|---|---|---|
| `LogEvent.id` | `activity_logs.id` | 直接対応 | number |
| `LogEvent.timestamp` | `activity_logs.created_at` | 日付文字列に変換 | |
| `LogEvent.actor` | `activity_logs.actor_name` | 直接対応 | |
| `LogEvent.eventType` | `activity_logs.event_type` | 直接対応 | enum |
| `LogEvent.taskId` | `activity_logs.task_id` | 直接対応 | nullable |
| `LogEvent.itemId` | `activity_logs.task_item_id` | 直接対応 | nullable |
| `LogEvent.details` | `activity_logs.details` | JSON解析 | |

### Issue (問題報告)
| アプリケーション型 | Supabase型 | 変換方法 | 備考 |
|---|---|---|---|
| `Issue.id` | `task_item_issues.id` | 直接対応 | UUID |
| `Issue.itemId` | `task_item_issues.task_item_id` | 直接対応 | |
| `Issue.kind` | `task_item_issues.kind` | 直接対応 | enum: lost/damaged/other |
| `Issue.reporter` | `task_item_issues.reporter` | 直接対応 | |
| `Issue.description` | `task_item_issues.description` | 直接対応 | |
| `Issue.status` | `task_item_issues.status` | 直接対応 | enum: open/in_progress/resolved |
| `Issue.reportedAt` | `task_item_issues.created_at` | 日付文字列に変換 | |

### Area/Floor (エリア/フロア)
| アプリケーション型 | Supabase型 | 変換方法 | 備考 |
|---|---|---|---|
| `Area.id` | `areas.id` | 直接対応 | UUID |
| `Area.name` | `areas.name` | 直接対応 | |
| `Area.floors` | リレーション | `floors.area_id`で関連フロアを取得 | |
| `Floor.id` | `floors.id` | 直接対応 | UUID |
| `Floor.name` | `floors.name` | 直接対応 | |
| `Floor.imageUrl` | `floors.floor_map_url` | 直接対応 | |

## 型変換ヘルパー関数の実装が必要

次のステップで `src/lib/data/mappers.ts` に以下の関数を実装する必要があります：

- `dbTaskToTask()`
- `taskToDbTask()`
- `dbItemToItem()`
- `itemToDbItem()` 
- `dbLogToLogEvent()`
- `logEventToDbLog()`
- `dbIssueToIssue()`
- `issueToDbIssue()`
- `dbPhotoToItemPhoto()`
- `itemPhotoToDbPhoto()`

## 型不一致の修正が必要

### LogEvent型の不一致
- **アプリケーション型**: `LogEvent.at` (string)
- **Supabase型**: `activity_logs.created_at` (string)
- **修正**: アプリケーション型を`timestamp`に変更するか、マッパーで`at`→`timestamp`に変換

### Issue型の不一致
- **アプリケーション型**: `Issue.at` (string) 
- **Supabase型**: `task_item_issues.created_at` (string)
- **修正**: アプリケーション型を`reportedAt`に変更済み、マッパーで対応

- **アプリケーション型**: `Issue.summary` (string)
- **Supabase型**: `task_item_issues.description` (string) 
- **修正**: マッパーで`summary`→`description`に変換

- **アプリケーション型**: `Issue.detail` (string)
- **Supabase型**: 該当カラムなし
- **修正**: `description`に統合するか、別カラム追加を検討

- **アプリケーション型**: `Issue.kind` → "loss" | "damage" | "other"
- **Supabase型**: `item_issue_kind` → "loss" | "damage" | "other"
- **一致**: OK

### Issue status の不一致
- **アプリケーション型**: "open" | "resolved"
- **Supabase型**: "open" | "resolved" 
- **一致**: OK

## 注意事項

1. **LocationPin の変換**: `pickup_location_id`と`dropoff_location_id`から`locations`→`floors`→`areas`を辿ってLocationPin型を構築する必要がある
2. **写真のStorage連携**: `storage_path`から署名付きURLを生成して`previewDataUrl`にセットする
3. **JSON フィールド**: `activity_logs.details`はJSON型なので、適切にパース/シリアライズが必要
4. **日付の扱い**: PostgreSQLのtimestampをJavaScriptのstring型に変換
5. **LogEvent型**: `at`フィールドを`timestamp`に統一する必要がある
6. **Issue型**: `summary`/`detail`フィールドの統合が必要