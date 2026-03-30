import { Client, Events, GatewayIntentBits, Partials } from 'discord.js';
import registerEventHandlers from './events/eventHandler.js';
import config from '#config' with { type: "json" };

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions], partials: [Partials.Message, Partials.Channel, Partials.Reaction] });

registerEventHandlers(client);

client.login(config.TOKEN);
