# Modify
Modify is a free Discord bot that uses AI to detect and remove harmful messages from your server.  It can filter out hate speech, threats, self-harm, and sexual, violent, and graphic content.  Modify helps your community stays safe and in compliance with Discord TOS.

# Usage/Installation
## Option 1: Use Our Bot (Easiest)
Just add our bot to your discord server using [this link](https://discord.com/api/oauth2/authorize?client_id=1094509798277529702&permissions=9216&scope=bot)

## Option 2: Run Your Own Bot (Harder)
1. Create a new app and bot in the Discord Developers Portal.
2. Install Linux with PHP 8.2+ ZTS 
3. Install/Compile the parallel extension for PHP
4. Install RabbitMQ server
5. Create a RabbitMQ user/password
6. Create queues named `modify_inbox` and `modify_outbox`
7. `git clone https://github.com/rpurinton/modify.git <install-dir>`
8. Edit the files in `<install-dir>/src/conf.d/`
9. Create a CRON job to `<install-dir>/src/cron.d/logrotate.php`
10. `ln -s <install-dir>/modify /usr/bin/modify`

### Commands
`modify start`
`modify stop`
`modify restart`
`modify status`
