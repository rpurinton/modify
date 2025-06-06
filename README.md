# Modify Discord App

A modern, open-source Discord moderation app powered by OpenAI Moderation API. Automatically scans messages and images for harmful content, logs violations, and provides powerful admin tools for keeping your community safe and compliant.

- **Project website:** [https://modify.purinton.us](https://modify.purinton.us)
- **Invite the official Modify app to your server:** [Invite Modify to your Discord server](https://discord.com/oauth2/authorize?client_id=1351917584613638235)
- **Support Server:** [Join the Modify Support Server](https://discord.gg/vYuTwaZ999)

---

## Features

- **Automated Moderation:**
  - Scans all messages and image attachments in real time using OpenAI Moderation API.
  - Flags and logs unsafe, harmful, or unwanted content (text and images).
  - Sends detailed violation reports to a configurable log channel.
- **Admin Tools:**
  - Bulk message purge with advanced filters.
  - Manual message evaluation for moderation review.
  - Easy log channel setup.
- **Localization:**
  - Multi-language support via JSON locale files.
- **Logging:**
  - All moderation actions and errors are logged (Winston).
- **Database Integration:**
  - Persistent log channel and locale settings.
- **Extensible:**
  - Easily add new commands, events, and locales.

---

## Command Reference

- `/purge [amount] [user] [contains] [apps] [embeds]`  
  Bulk-delete up to 100 messages, with filters for user, content, apps, and embeds. Requires Manage Messages permission.
- `/log_channel`  
  Set the current channel as the moderation log channel. Requires administrator.
- `/help`  
  Show help text (localized).
- `/Evaluate`  
  Manually evaluate a message (text or image) for moderation, with category breakdowns.

---

## Setup Guide

1. **Create a Discord Application**

   - Go to the [Discord Developer Portal](https://discord.com/developers/applications) and click "New Application".
   - Name your app and save.
   - Go to the **Bot** tab and click "Add Bot".
   - Under **Privileged Gateway Intents**, enable **Message Content Intent**.
   - Under **OAuth2 > URL Generator**, select the following scopes and permissions:
     - **Scopes:** `bot`, `applications.commands`
     - **Bot Permissions:** `Send Messages`, `Read Message History`, and any others you need.
   - Copy your **Client ID** and **Token** from the portal for use in the next step.

2. **Configure Environment**

   ```sh
   cp .env.example .env
   # Edit .env with your Discord client ID, token, OpenAI key, and DB info
   ```

3. **Install Dependencies**

   ```sh
   npm install
   ```

4. **Run Tests (Optional)**

   ```sh
   npm test
   ```

5. **Import Database Schema**

   ```sh
   # Example using MySQL
   mysql -u <user> -p <db_name> < schema.sql
   ```

6. **Set Up as a Systemd Service (Linux, optional)**

   - Edit `modify.service` to match your paths and user.
   - Copy to systemd and enable:

     ```sh
     sudo cp modify.service /usr/lib/systemd/system/modify.service
     sudo systemctl daemon-reload
     sudo systemctl enable modify.service
     sudo systemctl start modify.service
     sudo systemctl status modify.service
     ```

7. **Start the App**

   ```sh
   node modify.mjs
   ```

---

## Folder Structure

```text
src/
  commands/    # Command definitions and handlers
  events/      # Event handlers
  locales/     # Locale JSON files
  custom/      # Custom logic (moderation, log channel loading)
  *.mjs        # Core logic (commands, events, logging, etc.)
README.md
modify.mjs     # Main entry point
modify.service # Systemd service template
schema.sql     # Database schema
.env.example   # Example environment config
```

---

## Customization & Extending

- **Add Commands:**
  - Drop a JSON definition and a `.mjs` handler in `src/commands/`.
- **Add Events:**
  - Add a new file in `src/events/` named after the Discord event.
- **Update Locale Text:**
  - Edit or add JSON files in `src/locales/` for new languages or text.
- **Add Features:**
  - Extend with new moderation logic, logging, or integrations as needed.

---

## License

[MIT](LICENSE)

## Support

- Email: <russell.purinton@gmail.com>
- Discord: laozi101
