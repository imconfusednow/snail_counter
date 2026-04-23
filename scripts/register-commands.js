import config  from '#config' with { type: "json" };
import { REST, Routes, ApplicationCommandOptionType } from "discord.js";

const commands = [
    {
        name: 'ping',
        description: 'basic ping command'
    },
    {
        name: 'snail_count',
        description: "Get count of how much everyone has gotten 🐌'd",
        options: [
            {
                name: 'duration',
                description: 'The count since when?',
                type: ApplicationCommandOptionType.String,
                choices: [
                    {
                        name: 'All Time',
                        value: 'all-time'
                    },
                    {
                        name: 'Last Hour',
                        value: 'last-hour'
                    },
                    {
                        name: 'This Week',
                        value: 'this-week'
                    },
                    {
                        name: 'This Month',
                        value: 'this-month'
                    },
                    {
                        name: 'Today',
                        value: 'today'
                    }
                ]
            }
        ]
    },
    {
        name: 'random_message',
        description: 'Random message from snail bot'
    },
];

const rest = new REST().setToken(config.TOKEN);

(async () => {
    try {
        for (let guild of config.GUILDS) {
            const {name, id:guildId} = guild;
            console.log(`Registering commands for ${name}`);
            await rest.put(
                Routes.applicationGuildCommands(config.CLIENT_ID, guildId),
                {
                    body: commands
                }
            );
        }
        console.log('Registration complete');
    } catch (error) {
        console.log(error);
    }
})();