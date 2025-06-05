#!/usr/bin/env node
import 'dotenv/config';
import log from './src/log.mjs';
import { registerExceptionHandlers } from './src/exceptions.mjs';
import { loadLocales } from './src/locales.mjs';
import { loadAndRegisterCommands } from './src/commands.mjs';
import { createAndLoginDiscordClient } from './src/discord.mjs';
import { setupShutdownHandlers } from './src/shutdown.mjs';
import { loadLogChannelsAndLocales } from './src/custom/logchannels.mjs';
(async () => {
  try {
    log.debug('Starting app initialization...');
    registerExceptionHandlers();
    log.debug('Registered exception handlers...');
    loadLocales();
    log.debug('Locales loaded successfully...');
    const result = await loadLogChannelsAndLocales();
    global.logChannels = result.logChannels;
    global.guildLocales = result.guildLocales;
    log.debug('Global logChannels and guildLocales initialized...');
    global.commands = await loadAndRegisterCommands();
    log.debug('Commands loaded and registered successfully...');
    global.client = await createAndLoginDiscordClient();
    log.debug('Discord client created and logged in successfully...');
    setupShutdownHandlers({ client: global.client });
    log.debug('Shutdown handlers set up successfully...');
  } catch (err) {
    log.error('Fatal error during app initialization:', err);
    process.exit(1);
  }
})();
