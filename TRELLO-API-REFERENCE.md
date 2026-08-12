# Trello API Reference

APIs required for the workflow: **create board → create list → create card → update card → clean up.**

Base URL: `https://api.trello.com/1`

---

## Authentication

Trello uses an API key + user token. No username/password endpoint.

| Credential | Where to get it |
| --- | --- |
| Key | <https://trello.com/power-ups/admin> → create a Power-Up → **API Key** tab |
| Token | `https://trello.com/1/authorize?expiration=never&scope=read,write&response_type=token&name=AutomationChallenge&key=YOUR_KEY` → click Allow |

Pass them either way:

```
# query string
?key={apiKey}&token={apiToken}

# header (preferred — keeps the token out of logs and reports)
Authorization: OAuth oauth_consumer_key="{apiKey}", oauth_token="{apiToken}"
```

Token options: `expiration` = `1hour` \| `1day` \| `30days` \| `never`; `scope` = `read`, `write`, `account`.

---

## Required endpoints

| # | Step | Method | Endpoint | Required params |
| --- | --- | --- | --- | --- |
| 0 | Auth check | `GET` | `/members/me` | — |
| 1 | Create board | `POST` | `/boards/` | `name` |
| 2 | Create list | `POST` | `/lists` | `name`, `idBoard` |
| 3 | Create card | `POST` | `/cards` | `idList` |
| 4 | Update card | `PUT` | `/cards/{id}` | — |
| 5 | Delete card | `DELETE` | `/cards/{id}` | — |
| 6 | Archive list | `PUT` | `/lists/{id}/closed` | `value=true` |
| 7 | Delete board | `DELETE` | `/boards/{id}` | — |

Verification reads: `GET /boards/{id}`, `GET /boards/{id}/lists`, `GET /lists/{id}/cards`, `GET /cards/{id}`.

---

## 1. `POST /boards/` — create board

| Param | Type | Notes |
| --- | --- | --- |
| `name` | string | **required**, 1–16384 chars |
| `desc` | string | description |
| `defaultLists` | boolean | **default `true`** — adds To Do / Doing / Done |
| `defaultLabels` | boolean | **default `true`** — adds 6 labels |
| `idOrganization` | id | workspace |
| `idBoardSource` | id | copy an existing board |
| `keepFromSource` | string | `cards` \| `none` |
| `prefs_permissionLevel` | string | `private` \| `org` \| `public` |
| `prefs_comments` | string | `disabled`, `members`, `observers`, `org`, `public` |
| `prefs_voting` | string | as above |
| `prefs_selfJoin` | boolean | |
| `prefs_cardCovers` | boolean | |
| `prefs_background` | string | colour name or background id |

> **Gotcha:** pass `defaultLists=false` and `defaultLabels=false` or every new board arrives with 3 lists and 6 labels — any assertion on counts will be wrong.

> **Gotcha:** create uses `prefs_permissionLevel` (underscore); update uses `prefs/permissionLevel` (slash). Wrong form = silently ignored.

Response: board object with `id`, `name`, `desc`, `closed`, `url`, `shortUrl`, `shortLink`, `prefs`, `labelNames`.

---

## 2. `POST /lists` — create list

| Param | Type | Notes |
| --- | --- | --- |
| `name` | string | **required** |
| `idBoard` | id | **required** |
| `pos` | string \| number | `top`, `bottom`, or a float |
| `idListSource` | id | copy an existing list |

Response: `{ id, name, closed, pos, idBoard, subscribed, softLimit }`

---

## 3. `POST /cards` — create card (the "task")

| Param | Type | Notes |
| --- | --- | --- |
| `idList` | id | **required** |
| `name` | string | card title |
| `desc` | string | description |
| `pos` | string \| number | `top`, `bottom`, float |
| `due` | ISO 8601 date | due date |
| `start` | ISO 8601 date | start date |
| `dueComplete` | boolean | |
| `idMembers` | id[] | assignees |
| `idLabels` | id[] | labels |
| `idCardSource` | id | copy an existing card |
| `keepFromSource` | string | `all` or `attachments,checklists,comments,due,labels,members,stickers` |
| `urlSource` | url | create from a URL |

Response: card object with `id`, `name`, `desc`, `idList`, `idBoard`, `due`, `dueComplete`, `closed`, `pos`, `badges`, `url`, `shortUrl`, `dateLastActivity`.

---

## 4. `PUT /cards/{id}` — update card

| Param | Notes |
| --- | --- |
| `name` | rename |
| `desc` | new description |
| `closed` | `true` = archive |
| `idList` | **move to another list** — the Kanban transition |
| `idBoard` | move to another board |
| `pos` | reorder |
| `due` / `start` | dates |
| `dueComplete` | tick the due checkbox |
| `idLabels` | replace labels |
| `idMembers` | replace assignees |
| `subscribed` | watch the card |
| `cover` | `{color, brightness, url, idAttachment, size}` |

---

## 5. Cleanup

| Method | Endpoint | Notes |
| --- | --- | --- |
| `DELETE` | `/cards/{id}` | permanent |
| `PUT` | `/lists/{id}/closed?value=true` | **lists cannot be deleted, only archived** |
| `DELETE` | `/boards/{id}` | permanent; also removes its lists and cards |

`PUT /boards/{id}?closed=true` only *archives* a board — it still counts against plan limits. Tests must `DELETE`.

Safety net for orphans from crashed runs:
```
GET    /members/me/boards?fields=id,name
DELETE /boards/{id}     for each name matching your test prefix
```

---

## Supporting endpoints

### Boards
| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/boards/{id}` | read board (`fields`, `lists`, `cards`, `members`, `labels`, `actions`) |
| `PUT` | `/boards/{id}` | update (`name`, `desc`, `closed`, `prefs/*`, `labelNames/*`) |
| `GET` | `/boards/{id}/lists` | lists on board (`filter`, `cards`, `fields`) |
| `GET` | `/boards/{id}/cards` | open cards on board |
| `GET` | `/boards/{id}/labels` | board labels |
| `GET` | `/boards/{id}/members` | board members |
| `GET` | `/boards/{id}/actions` | audit trail |
| `GET` | `/boards/{id}/{field}` | single field, e.g. `/name` |

### Lists
| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/lists/{id}` | read list |
| `PUT` | `/lists/{id}` | update (`name`, `closed`, `idBoard`, `pos`, `subscribed`) |
| `GET` | `/lists/{id}/cards` | cards in list |
| `GET` | `/lists/{id}/board` | parent board |
| `PUT` | `/lists/{id}/idBoard` | move list to another board |
| `POST` | `/lists/{id}/archiveAllCards` | bulk archive |
| `POST` | `/lists/{id}/moveAllCards` | bulk move (`idBoard`, `idList`) |

### Cards
| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/cards/{id}` | read card |
| `GET` | `/cards/{id}/{field}` | single field |
| `POST` | `/cards/{id}/actions/comments` | add comment (`text`) |
| `GET` | `/cards/{id}/actions` | card history |
| `POST` | `/cards/{id}/idLabels` | attach label (`value`) |
| `DELETE` | `/cards/{id}/idLabels/{idLabel}` | remove label |
| `POST` | `/cards/{id}/idMembers` | assign member (`value`) |
| `POST` | `/cards/{id}/attachments` | add attachment |
| `POST` | `/cards/{id}/checklists` | add checklist (`name`) |
| `GET` | `/cards/{id}/board` \| `/list` | parents |

### Labels
| Method | Endpoint | Required |
| --- | --- | --- |
| `POST` | `/labels` | `name`, `color`, `idBoard` |
| `GET` / `PUT` / `DELETE` | `/labels/{id}` | — |

Colours: `green`, `yellow`, `orange`, `red`, `purple`, `blue`, `sky`, `lime`, `pink`, `black`, `null`.

### Members / search / batch
| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/members/me` | auth smoke test |
| `GET` | `/members/me/boards` | all boards — used by cleanup safety net |
| `GET` | `/search?query=` | search (eventually consistent — poll, don't assert once) |
| `GET` | `/batch?urls=` | up to **10 GET** requests in one call |

---

## Status codes

| Code | Meaning |
| --- | --- |
| `200` | Success |
| `400` | Bad request — missing/invalid fields |
| `401` | Unauthorized — bad key/token or insufficient permission |
| `403` | Forbidden — e.g. plan resource limits |
| `404` | Not found — bad route or deleted resource |
| `409` | Conflict with current state |
| `429` | Rate limit exceeded |
| `449` | Sub-request failed (batch) |
| `500` / `503` / `504` | Server error / unavailable / GET exceeded 30s |

> Trello returns **plain-text** bodies for most 4xx responses (`invalid id`, `unauthorized permission requested`), not JSON. Don't call `.json()` on them.

---

## Rate limits

| Limit | Value |
| --- | --- |
| Per API key | 300 requests / 10 seconds |
| Per API token | **100 requests / 10 seconds** ← the binding one |
| `/members/*` | 100 requests / 900 seconds |

`429` body: `{"error": "API_TOKEN_LIMIT_EXCEEDED", "message": "Rate limit exceeded"}`

Response headers on every call:

```
x-rate-limit-api-key-interval-ms    x-rate-limit-api-token-interval-ms
x-rate-limit-api-key-max            x-rate-limit-api-token-max
x-rate-limit-api-key-remaining      x-rate-limit-api-token-remaining
```

Keep sustained traffic under ~10 req/s.

---

## Sources

- [Boards](https://developer.atlassian.com/cloud/trello/rest/api-group-boards/) · [Lists](https://developer.atlassian.com/cloud/trello/rest/api-group-lists/) · [Cards](https://developer.atlassian.com/cloud/trello/rest/api-group-cards/) · [Labels](https://developer.atlassian.com/cloud/trello/rest/api-group-labels/) · [Batch](https://developer.atlassian.com/cloud/trello/rest/api-group-batch/)
- [Authorization](https://developer.atlassian.com/cloud/trello/guides/rest-api/authorization/) · [Rate Limits](https://developer.atlassian.com/cloud/trello/guides/rest-api/rate-limits/) · [Status Codes](https://developer.atlassian.com/cloud/trello/guides/rest-api/status-codes/)
