```yaml
ideamark_version: 1
doc_id: "responder-bridge.background.v0.1.0"
doc_type: "background"
status: "draft"
created_at: "2026-02-09"
updated_at: "2026-02-09"
lang: "ja-JP"

project:
  name: responder-bridge
  repo: "CentimaniDevTeam/responder-bridge"
  license: "MIT"

intent: >
  Responder Bridge v0.1.0 の目的、責務分離、monorepo 構成、
  ならびに aiwf / FlowMark 連携の前提を記録する。
```
# Responder Bridge v0.1.0 背景（Background）

## Section 001 : 目的（なぜ Responder Bridge が必要か）

aiwf は「人間・AI・別AIの協調作業の中心」に位置づけられ、
FlowMark / IdeaMark などのツールは参加者（Responder/Actor）にとっての道具として提供される。

しかし現状の実証実験では、LLM に対して

- ツールの説明（describe）
- 正規化・生成方針（params）
- Materials（ローカルファイル/URL/チャットログ）

を与え、さらに

- ツールの validate 結果に基づいて修正依頼を行い、
- 最終成果物を artifact として保存する

という一連のループを、手作業で行っている。

Responder Bridge はこのループを **外付けツール**として実装し、
aiwf が `add tool` で取り込める形にすることで、

- 実験の再現性
- 反復速度
- 小型モデル適用可能性
- 多ツール横展開性

を高めることを目的とする。

---

## Section 002 : 設計原則（aiwf / FlowMark と分離する）

Responder Bridge は抽象的なレイヤーであり、以下を守る：

- aiwf に LLM エンジンを直付けしない（従来方針を維持）
- FlowMark / IdeaMark など個別ツールに LLM 呼び出しを持ち込まない
- Responder Bridge が **任意ツール**の describe/params と Materials を組み合わせて prompt を構築する
- validate の結果で修正プロンプトを生成し、反復する
- 成果物を aiwf が扱える artifact として保存できる形式で出力する

---

## Section 003 : 「Bridge」の意味（抽象IFと派生実装）

Responder Bridge は以下を分離する：

- **Core（抽象IF）**：prompt合成、validationループ、artifact出力、provider抽象化
- **Provider（派生）**：OpenAI互換APIやローカルLLMなど実際の呼び出し

v0.1.0 では OpenAI互換API Provider を最初の派生として実装する。

---

## Section 004 : monorepo 方針

リポジトリは monorepo とし、packages を分離する：

- `@hak2i/responder-bridge`（core）
- `@hak2i/responder-bridge-openai`（provider）

これにより、IF変更が頻繁な初期段階でも開発速度を保つ。

---

## Section 005 : v0.1.0 のスコープ（最小の成功条件）

v0.1.0 では「FlowMark生成実験」を最初の対象として、
以下ができることを最小成功条件とする：

1. `flowmark describe ...` と `flowmark params ...` の出力を system/context に取り込み
2. Materials（ローカルファイル）を読み込んで user context に展開
3. OpenAI互換APIを用いて生成（generate）
4. `flowmark validate` を実行
5. 失敗時は validate ログを元に修正プロンプトを生成し再実行
6. 最終出力とログを artifact として保存

---

## Section 006 : 将来（v0.2+ の方向性）

- Provider追加（ローカルLLM, Ollama, など）
- Web UI/サーバ（任意）
- Materials の多様化（URL, チャットログ, セッション入力）
- validate結果を構造化して差分修正の精度を上げる

---

*End of Background*
