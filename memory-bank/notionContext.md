# 🗂️ Notion Workspace Context for Gorlea Notes Project

This file documents all critical information about the connected Notion workspace, databases, and integration. It ensures future AI agents can immediately understand the Notion environment and automate workflows effectively.

---

## Workspace Details
- **Workspace Name:** Drifter Supremo’s Notion
- **Primary User:** Drifter Supremo
- **User Email:** maddsencere@gmail.com
- **User ID:** `1d0d872b-594c-81ae-9b29-00022622ce1f`

## Notion Integration (Bot)
- **Integration Name:** Cline
- **Bot User ID:** `2ee8e9d4-33af-4c73-83a9-903a164a2851`
- **MCP Server Name:** `github.com/pashpashpash/mcp-notion-server`
- **Permissions:** The "Cline" integration must be explicitly invited to all relevant databases and pages to enable full access.

## Key Databases
- **Projects Database**
  - **Name:** Projects
  - **Database ID:** `1d0b02f8-173d-81c7-adbd-cd037c7e47a0`
- **Tasks Database**
  - **Name:** Tasks
  - **Database ID:** `1d0b02f8-173d-8130-92d8-e64becbb9e43`

## Key Project Page
- **Project:** Gorlea Notes + Docs
- **Page ID:** `1d0b02f8-173d-8146-b175-c6f09641cb31`

## Known Task Properties
- **Status:** Options include Not started, In progress, In Review, Done, Archive
- **Assign:** People (assignable via User ID)
- **Date:** Due date
- **Projects:** Relation to Projects database

## Usage Notes
- When creating or updating tasks, use the User ID `1d0d872b-594c-81ae-9b29-00022622ce1f` to assign to Drifter Supremo.
- Link new tasks to the Gorlea Notes + Docs project using its page ID.
- Set due dates as ISO8601 strings (e.g., `"2025-04-10"`).
- The MCP server exposes tools for creating, updating, querying, and commenting on Notion content.
- The integration token is stored securely in the MCP server environment variables.

## Last Updated
April 9, 2025

---

This file should be updated whenever:
- New databases or projects are added
- User IDs or integration tokens change
- The workspace structure evolves
