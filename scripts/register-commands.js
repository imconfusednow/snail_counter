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
        
    }
];

const rest = new REST().setToken(config.TOKEN);

(async () => {
    try {
        console.log('Registering commands...');
        await rest.put(
            Routes.applicationGuildCommands(config.CLIENT_ID, config.GUILD_ID),
            {
                body: commands
            }
        );
        console.log('Registration complete');
    } catch (error) {
        console.log(error);
    }
})();