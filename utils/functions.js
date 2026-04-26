import { db } from "#db/db.js";
import { DateTime } from 'luxon';

export function humanString(string) {
    let parts = string.split(/[-_]/);
    parts = parts.map((part)=>{
        return part.slice(0,1).toUpperCase() + part.slice(1, part.length + 1)
    });
    return parts.join(' ');
}

export async function getSinceTime(option) {
    let dt = DateTime.utc();
    if (option === 'last-hour') {
        dt = dt.minus({hours: 1});
    }
    else if (option === 'today') {
        dt = dt.startOf('day');
    }
    else if (option === 'this-week') {
        dt = dt.startOf('week');
    }
    else if (option === 'this-month') {
        dt = dt.startOf('month');
    }
    else {
        dt = dt.minus({years: 50});
    }

    return dt.toFormat("yyyy-MM-dd HH:mm:ss");
}

export async function createSnailCountMessageString(client, guildId, duration) {    
    const since = await getSinceTime(duration);

    let queryString = `SELECT reactee_id, count(*) AS count FROM reaction_log WHERE emoji = ? AND created_at > ? AND guild_id = ? AND reactee_id != reacter_id`;
    queryString += `group by reactee_id ORDER BY count(*) desc`;

    const snails = db.prepare(queryString).all("🐌", since, guildId);

    if (snails.length === 0 ) {
        return ['No snails 😮', {}];
    }

    let replyString = "```\n";
    replyString += `${humanString(duration)}'s snail counts\n`;

    const guild = client.guilds.cache.get(guildId);
    let counts = {};

    for (let snail of snails) {
        const member = await guild.members.fetch(snail.reactee_id);
        const name = member.displayName;
        counts[name] = snail.count;
        replyString += `${name}: ${snail.count}\n`;
    }
    replyString += "```";
    return [replyString, counts];
}

export function randomMessage() {
    let queryString = "SELECT message FROM dialog";
    const messages = db.prepare(queryString).all();

    return messages[Math.floor(Math.random() * messages.length)]?.message;
}
