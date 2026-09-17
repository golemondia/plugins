# Lemondia plugins

Plugins for Claude Code, Claude, ChatGPT and Codex. They connect to the Lemondia business MCP
at `https://admin.lemondia.com/api/business/mcp`, a read-only server that people sign in to with
their Google account. Access is granted per person in the Lemondia backoffice; nothing here
contains credentials.

| Plugin | What it does |
|---|---|
| `lemondia` | Business data tools (read-only SQL, table browsing, enums) and the `inquiry-venue-enrichment` skill, which researches the venues selected for an inquiry on the web and reports where stored capacity and contact data disagree with what venues publish. It never writes to Lemondia. |

## Install

### ChatGPT and Codex (desktop app)

Once a workspace admin has imported this repository (Admin > Plugins > import marketplace from
GitHub), open **Plugins**, pick the workspace tab, install **Lemondia**, and sign in with Google
when prompted.

Without the workspace import: `codex plugin marketplace add golemondia/plugins`, then install
`lemondia` from the plugin browser.

### Claude Code

```
/plugin marketplace add golemondia/plugins
/plugin install lemondia@lemondia
/mcp
```

Choose `lemondia-business` under `/mcp` and authenticate in the browser.

### Claude Desktop and claude.ai

Ask an organization admin to add the connector URL
`https://admin.lemondia.com/api/business/mcp` under organization settings. It appears in your
connectors list; connect and sign in. The skill is available in Claude Code and Codex only.

## Sign-in fails?

Your email must be listed on the backoffice page **MCP access**. Ask an operator to add you, or
to reset your sign-in binding if you changed accounts.

## Layout

```
plugins/lemondia/            the plugin (manifests, MCP config, skills/)
.claude-plugin/marketplace.json   Claude Code marketplace
.agents/plugins/marketplace.json  Codex / ChatGPT marketplace
```
