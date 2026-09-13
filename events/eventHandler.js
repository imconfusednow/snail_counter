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
  monthlyCount(client, '0 0 28 * *');
  yearlyCount(client, '0 0 31 12 *');
  heavySnailCountCheck(client, '59 * * * *');
}

async function slashCommandEvent(client, interaction) {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.commandName;
  const guildId = interaction.guildId;

  if (command === 'ping') {
    await interaction.reply({content: 'Pong!', flags: MessageFlags.Ephemeral});
  }

  if (command === "snail_count") {
    const selectedDuration = interaction.options.get('duration')?.value ?? 'all-time';
    const ephemeral = interaction.options.get('ephemeral')?.value ?? false;
    const [replyString, counts] = await createSnailCountMessageString(client, guildId, selectedDuration);

    if (ephemeral) {
      interaction.reply({content: replyString, flags: MessageFlags.Ephemeral});
    }
    else {
      interaction.reply(replyString);
    }
  }
  else if (command === 'random_message') {
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
  else if (command === 'snail_check') {
    const message1Id = interaction.options.get('message_1_id')?.value;
    const message2Id = interaction.options.get('message_2_id')?.value;

    if (message1Id === message2Id) {
      return interaction.reply("That's the same message twice for snail's sake :unamused:");
    }

    const channel = interaction.channel;
    const message1 = await channel.messages.fetch(message1Id);
    const message2 = await channel.messages.fetch(message2Id);

    const guild = client.guilds.cache.get(guildId);
    const member1 = await guild.members.fetch(message1.author.id);
    const member2 = await guild.members.fetch(message2.author.id);

    if (member1.user.username === member2.user.username) {
      return interaction.reply(`Those are by the same person, don't waste my time \`${interaction.user.displayName}\` I'm a busy mollusc!`);
    }

    let [winner, loser, winningMessage] = message1.createdTimestamp < message2.createdTimestamp ? [member1, member2, message1] : [member2, member1, message2];

    // Problem with this in that you could expunge any random message when it's not appropriate
    //unsnailMessage(guildId, winningMessage.id);

    const difference = Math.abs(message1.createdTimestamp - message2.createdTimestamp) / 1000;

    return interaction.reply(`## Comparing messages:\n* ${member1.displayName}: ${message1.content}\n* ${member2.displayName}: ${message2.content}
## Verdict\n${winner.displayName} was first by ${difference} seconds, so ${loser.displayName} is to be snailed. Snucks to be you, my snailsision is final!`);
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

function unsnailMessage(guildId, messageId) {
  const deleteStatement = db.prepare(
    "DELETE FROM reaction_log WHERE guild_id = ? AND message_id = ? AND emoji = ?",
  );

  deleteStatement.run([guildId, messageId, "🐌"]);
}

export default function registerEventHandlers(client) {
  for (let [name, func] of events) {
    client.on(name, async (...args) => {
      await func(client, ...args);
    });
  }
}
