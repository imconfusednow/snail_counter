import { db } from "#db/db.js";
import { createSnailCountMessageString, getDialog } from '#utils/functions.js';
import { weeklyCount, monthlyCount, yearlyCount, heavySnailCountCheck } from '#utils/crons.js';
import { MessageFlags, AttachmentBuilder } from 'discord.js';


const events = new Map();

events.set("clientReady", readyEvent);
events.set("messageReactionAdd", addReactionEvent);
events.set("interactionCreate", slashCommandEvent);
events.set("messageReactionRemove", removedReactionEvent);

async function readyEvent(client) {
  console.log(`Ready! Logged in as ${client.user.tag}`); 
  weeklyCount(client, '0 23 * * 0');
  monthlyCount(client, '0 23 * * 0');
  yearlyCount(client, '0 0 28 * *');
  heavySnailCountCheck(client, '59 * * * *');
}

async function slashCommandEvent(client, interaction) {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.commandName; 

  if (command === "snail_count") {
    const selectedDuration = interaction.options.get('duration')?.value ?? 'all-time';
    const ephemeral = interaction.options.get('ephemeral')?.value ?? false;
    const [replyString, counts] = await createSnailCountMessageString(client, interaction.guildId, selectedDuration);

    if (ephemeral) {
      interaction.reply({content: replyString, flags: MessageFlags.Ephemeral});
    }
    else {
      interaction.reply(replyString);
    }
  }
  if (command === 'random_message') {
    const index = interaction.options.get('index')?.value;
    const dialog_row = getDialog(index);
    if (dialog_row.file) {
      const file = new AttachmentBuilder(`./images/message/${dialog_row.file}`);
      interaction.reply({content: dialog_row.message, files: [file]});
    }
    else {
      interaction.reply(dialog_row.message);
    }
    
  }
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
    addReactionLog(
      reaction.message.guildId,
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
      reaction.message.guildId,
      reaction.message.author.id,
      user.id,
      reaction.emoji.name,
      reaction.message.id,
    );
  }
}

function addReactionLog(guildId, reacterId, reacteeId, emoji, messageId) {
  const insert = db.prepare(
    "INSERT INTO reaction_log (guild_id, reactee_id, reacter_id, emoji, message_id) VALUES (?, ?, ?, ?, ?)",
  );

  insert.run([guildId, reacterId, reacteeId, emoji, messageId]);
}

function removeReactionLog(guildId, reacterId, reacteeId, emoji, messageId) {
  const deleteStatement = db.prepare(
    "DELETE FROM reaction_log WHERE guild_id = ? AND reactee_id = ? AND reacter_id = ? AND emoji = ? AND message_id = ?",
  );

  deleteStatement.run([guildId, reacterId, reacteeId, emoji, messageId]);
}

export default function registerEventHandlers(client) {
  for (let [name, func] of events) {
    client.on(name, async (...args) => {
      await func(client, ...args);
    });
  }
}
