import { db } from "#db/db.js";
import config from "#config" with { type: "json" };
import { humanString } from '#utils/functions.js';
import { DateTime } from 'luxon';

const events = new Map();

events.set("clientReady", readyEvent);
events.set("messageReactionAdd", addReactionEvent);
events.set("interactionCreate", slashCommandEvent);
events.set("messageReactionRemove", removedReactionEvent);

async function readyEvent(client) {
  console.log(`Ready! Logged in as ${client.user.tag}`);
}

async function slashCommandEvent(client, interaction) {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.commandName;
  const guild = client.guilds.cache.get(config.GUILD_ID);

  if (command === "snail_count") {
    const selectedDuration = interaction.options.get('duration')?.value ?? 'all-time';
    const since = await getSinceTime(selectedDuration);

    let queryString = `SELECT reactee_id, count(*) AS count FROM reaction_log WHERE emoji = ? AND created_at > ?`;
    queryString += `group by reactee_id ORDER BY count(*) desc`;

    const snails = db.prepare(queryString).all("🐌", since);

    if (snails.length === 0 ) {
        interaction.reply('No snails 😮');
        return;
    }

    let replyString = "```\n";
    replyString += `${humanString(selectedDuration)}'s snail counts\n`;

    for (let snail of snails) {
      const member = await guild.members.fetch(snail.reactee_id);
      const name = member.displayName;
      replyString += `${name}: ${snail.count}\n`;
    }
    replyString += "```";

    interaction.reply(replyString);
  }
}

async function getSinceTime(option) {
    const dt = DateTime.now();
    if (option === 'today') {
        dt.startOf('day');
    }
    else if (option === 'this-week') {
        dt.startOf('week');
    }
    else if (option === 'this-month') {
        dt.startOf('month');
    }
    else {
        return 0;
    }

    return dt.toMillis();
}

async function addReactionEvent(client, reaction, user) {
  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (error) {
      console.error("Something went wrong when fetching the message:", error);
      return;
    }
  }

  if (reaction.emoji.name === "🐌") {
    console.log(reaction);
    addReactionLog(
      reaction.message.author.id,
      user.id,
      reaction.emoji.name,
      reaction.message.id,
    );
  }
}

async function removedReactionEvent(client, reaction, user) {
  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (error) {
      console.error("Something went wrong when fetching the message:", error);
      return;
    }
  }
  if (reaction.emoji.name === "🐌") {
    removeReactionLog(
      reaction.message.author.id,
      user.id,
      reaction.emoji.name,
      reaction.message.id,
    );
  }
}

function addReactionLog(reacterId, reacteeId, emoji, messageId) {
  const insert = db.prepare(
    "INSERT INTO reaction_log (reactee_id, reacter_id, emoji, message_id) VALUES (?, ?, ?, ?)",
  );

  insert.run([reacterId, reacteeId, emoji, messageId]);
}

function removeReactionLog(reacterId, reacteeId, emoji, messageId) {
  const deleteStatement = db.prepare(
    "DELETE FROM reaction_log WHERE reactee_id = ? AND reacter_id = ? AND emoji = ? AND message_id = ?",
  );

  deleteStatement.run([reacterId, reacteeId, emoji, messageId]);
}

export default function registerEventHandlers(client) {
  for (let [name, func] of events) {
    client.on(name, async (...args) => {
      await func(client, ...args);
    });
  }
}
