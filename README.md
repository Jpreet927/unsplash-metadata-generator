# unsplash-uploader

A Bun CLI that:

1. fetches a user's most recent Unsplash photos,
2. finds photos missing a description or tags,
3. sends each candidate image to the OpenAI Responses API to generate metadata,
4. updates the photo through the Unsplash API.

## Requirements

- Bun
- An Unsplash application access key
- An Unsplash OAuth bearer token with the `write_photos` scope
- An OpenAI API key

## Environment variables

Copy `.env.example` into `.env` and fill in:

```bash
UNSPLASH_ACCESS_KEY=...
UNSPLASH_BEARER_TOKEN=...
OPENAI_API_KEY=...
```

Notes:

- `UNSPLASH_ACCESS_KEY` is used for reading public photo data.
- `UNSPLASH_BEARER_TOKEN` is used for `GET /me` and `PUT /photos/:id`.
- If you omit `--username`, the tool resolves the current Unsplash username from the bearer token.

## Install

```bash
bun install
```

## Usage

Dry run first:

```bash
bun run sync -- --count 10 --dry-run
```

> [!NOTE]
> Dry run will still send images to OpenAI to generate tags/descriptions, so tokens will be consumed. The process will stop before targetting the Unsplash Update endpoint.

Target a specific user:

```bash
bun run sync -- --username your_unsplash_username --count 25
```

Available flags:

- `--username <value>`: Unsplash username to inspect
- `--count <value>`: how many recent photos to inspect, default `10`
- `--openai-model <value>`: OpenAI model to use, default `gpt-5`
- `--max-tags <value>`: maximum generated tags per image, default `8`
- `--concurrency <value>`: parallel detail fetches against Unsplash, default `3`
- `--dry-run`: print proposed updates without writing to Unsplash

## Behavior

- The tool reads the recent photo list from `GET /users/:username/photos`.
- It fetches full photo details from `GET /photos/:id` before deciding whether metadata is missing.
- A photo is considered a candidate if it has no description, no tags, or both.
- Existing descriptions or tags are preserved; only missing metadata is filled in.

## Verification

Run:

```bash
bun run check
```
