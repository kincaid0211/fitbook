# AGENTS.md

## Project Context

This repository is for a Zhihu Hackathon project. The product must clearly fit the Zhihu community ecosystem: it should help Zhihu creators, help Zhihu content consumers, or empower Zhihu-related business/community workflows. Projects unrelated to the Zhihu ecosystem or violating community rules can be disqualified.

Primary local reference docs live under `note/zhihuhackathon/`:

- `zhihuhackathon 参赛规则.md`: submission rules, timeline, platform flow, available API capabilities, compliance notes.
- `知乎社区 API 快速开始.md`: OpenAPI base URL, auth/signature rules, circle IDs, rate limits, response format.
- `知乎API Key.md`: local API secret material. Treat this as sensitive and do not copy it into public code or committed docs.

## Hackathon Deliverables

Deadline: May 14, 13:00.

Required:

- A publicly accessible online demo link that judges can actually use.
- A product introduction explaining the core idea, technical approach, and fit with the Zhihu ecosystem.

Optional but helpful:

- A GitHub repository link to show code quality and engineering implementation.

Submission flow:

- Team info collection: May 7 to May 11, 24:00.
- Technical support groups: May 9 to May 10, 24:00.
- Hackathon permissions enabled before May 11, 18:00.
- Hackathon plaza opens May 11, 18:00.
- Team creation must use the same team name as the registration sheet.
- Project submission requires project name, themes, runnable demo URL, project details, icon, and cover image.
- OAuth callback URL is optional during creation but required if the app uses Zhihu OAuth login.

Popularity-related signals:

- Team idea post likes in the `黑客松脑洞补给站` circle count toward `最佳人气奖`.
- Project likes, product login count, and team idea post likes count toward `社区人气奖`.

## Zhihu OpenAPI Basics

Base URL:

```text
https://openapi.zhihu.com/
```

Protocol and data format:

- HTTPS
- JSON

Canonical API documentation:

- `https://www.zhihu.com/ring/moltbook/api`
- Key/application page: `https://www.zhihu.com/ring/moltbook`

All requests require signed authentication headers.

### Credentials

- `app_key`: the user's Zhihu token. It is the string after `people/` in the user's Zhihu profile URL.
- `app_secret`: the provided hackathon API secret. The local secret appears in `note/zhihuhackathon/知乎API Key.md` and `note/zhihuhackathon/知乎社区 API 快速开始.md`; do not hardcode it into frontend code, public repos, or committed generated files.

Recommended implementation:

- Load secrets from environment variables or local-only config.
- Keep `.env` files out of version control.
- If a server component signs requests, do signing server-side so the secret is not exposed to browsers.

### Signature

Construct the signing string exactly as:

```text
app_key:{app_key}|ts:{timestamp}|logid:{log_id}|extra_info:{extra_info}
```

Then:

- HMAC-SHA256 the signing string with `app_secret`.
- Base64 encode the result.

Required request headers:

| Header | Required | Meaning |
| --- | --- | --- |
| `X-App-Key` | Yes | User token / app key |
| `X-Timestamp` | Yes | Current Unix timestamp in seconds |
| `X-Log-Id` | Yes | Unique request ID for tracing |
| `X-Sign` | Yes | Base64 HMAC-SHA256 signature |
| `X-Extra-Info` | Yes | Extra info, can be empty |

Auth failure returns HTTP 401 with error code `101` and message similar to `Key verification failed`.

### Standard Response Shape

```json
{
  "status": 0,
  "msg": "success",
  "data": {}
}
```

Common status/error codes:

- `0`: success
- `1`: failure
- `101`: authentication failure

### Limits

- Global API rate limit: 10 QPS. Exceeding this may return 429.
- Zhihu hot list: 100 calls per user per day.
- Zhihu search: 1000 calls per user per day.
- Global web search: 1000 calls per user per day.
- Direct answer Agent: 100 calls per user per day.

Build application-level caching for hot list, search, and answer-generation features. Avoid repeated live calls for the same query or page load.

## Available API Capabilities

### Zhihu Circles

Use for Agent/community interaction experiments, posting, comments, likes, and thread-based product mechanics.

Known circle IDs:

| Circle ID | Circle Name |
| --- | --- |
| `2001009660925334090` | `OpenClaw 人类观察员` |
| `2015023739549529606` | `A2A for Reconnect` |
| `2029619126742656657` | `黑客松脑洞补给站` |

Relevant endpoints:

- `GET /openapi/ring/detail`: get circle detail, posts, and comments.
- `POST /openapi/publish/pin`: publish a pin/thought.
- `POST /openapi/reaction`: like or unlike a post/comment.
- `POST /openapi/comment/create`: create a comment or reply.
- `GET /openapi/comment/list`: get comments.

### Zhihu Hot List

Endpoint:

- `GET /api/v1/content/hot_list`

Use cases:

- Daily hot topic summaries.
- Topic planning around trending discussions.
- Adding timely context to generated content.

The API can return hot score, question title, high-quality answer summaries, and interaction data. Cache aggressively because of the 100/day limit.

### Zhihu Stories

Story list documentation:

- `https://www.zhihu.com/ring/moltbook/api/community/story_list`

Available story categories/examples include historical fantasy, suspense, realistic fiction, Journey to the West fan fiction, and classical romance.

Usage constraints:

- Only available for this hackathon activity.
- Not for commercial use.
- Only the first 3000 characters are provided, not beyond paid nodes.
- When adapting or sharing, credit the original work and author using the format: `改编自知乎盐言故事《xxx》，作者：xxx`.

### Follow Feed and Social Graph

Relevant endpoints:

- `GET /openapi/feed/following`: followed users' activity/content feed.
- `GET /openapi/user/following`: following list.
- `GET /openapi/user/followers`: follower list.

Use cases:

- Personalized reading flows.
- Interest matching.
- Creator/content recommendation.
- Social interaction features.

### Zhihu Search

Endpoint:

- `GET /api/v1/content/zhihu_search`

Returns Zhihu site content such as articles and Q&A with title, summary, author, publish time, relevance score, authority level, likes, comments, and selected comments.

Use cases:

- Research before content creation.
- Topic discovery.
- Ranking high-quality Zhihu discussions.

### Global Search

Endpoint:

- `GET /api/v1/content/global_search`

Returns web results with title, summary, author, publish time, relevance score, and authority level.

Use cases:

- Broader research outside Zhihu.
- Evidence gathering for more credible content tools.

### Zhihu Knowledge

Provided knowledge/article examples include:

- `1岁男孩为何感染HIV`
- `痴情暖男：靠家破人亡立人设后，他翻车了`
- `斩首和反斩首：郾城之战`
- `千古绝唱：长征`

Use creatively to make knowledge easier to understand or to create discussion-oriented experiences around knowledge content.

### Direct Answer Agent

Endpoint:

- `POST /v1/chat/completions`

Use cases:

- Generate concise, credible answers from Zhihu's high-quality content.
- Build Q&A tools, creator assistants, consultation modules, or search-augmented answer flows.
- Combine with search and follow-feed data for personalized, community-aware answers.

Cache answers where appropriate because of the 100/day per-user limit.

## Compliance and Product Guardrails

Do not use the APIs for:

- Batch, high-frequency, or meaningless content publishing.
- Spam, flooding, duplicate submissions, or junk content pushes.
- Behavior that disrupts Zhihu community order.

Potential penalties from misuse:

- Temporary or permanent API/app key suspension.
- Developer account or related account bans.
- Possible legal liability.

Implementation guardrails:

- Add rate limiting and backoff around all OpenAPI calls.
- Add deduplication for publishing/commenting actions.
- Keep human-visible content quality high; do not auto-post low-value generated text.
- Log `X-Log-Id` values for debugging and support.
- Separate read-heavy exploration from write actions; require deliberate user intent for posting, commenting, liking, or following.

## Product Direction Notes

The docs explicitly encourage Agent experiences inside Zhihu circles. Promising directions include:

- Agent persona experiments: vivid roles such as analyst, philosopher, visual prompt artist, moderator, or game host.
- Cross-Agent asynchronous games: mystery games, rule-based thread challenges, debate/refutation games, collaborative story creation.
- Cyber-social experiments: observing how phrases, ideas, or interaction patterns spread through Agent comments.
- Creator tools: trend discovery, research collection, answer drafting, topic planning, and community feedback loops.
- Consumer tools: personalized feed digestion, hot topic explainers, high-signal search summaries, and knowledge simplification.

Prioritize ideas that make the Zhihu ecosystem more useful or more lively, and make that fit obvious in the demo and product description.
