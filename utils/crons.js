import {
  createSnailCountMessageString,
} from "#utils/functions.js";
import cron from "node-cron";
import config from "#config" with { type: "json" };

export function weeklyCount(client, schedule) {
  cron.schedule(schedule, async () => {
    for (let guild of config.GUILDS) {
      const { id: guildId, channel: channelId } = guild;
      const [replyString, counts] = await createSnailCountMessageString(
        client,
        guildId,
        "this-week",
      );
      const channel = client.channels.cache.get(channelId);
      channel.send(replyString);
    }
  });
}

export function monthlyCount(client, schedule) {
  cron.schedule(schedule, async () => {
    for (let guild of config.GUILDS) {
      const { id: guildId, channel: channelId } = guild;
      const [replyString, counts] = await createSnailCountMessageString(
        client,
        guildId,
        "this-month",
      );
      const channel = client.channels.cache.get(channelId);
      channel.send(replyString);
    }
  });
}

export function yearlyCount(client, schedule) {
  cron.schedule(schedule, async () => {
    for (let guild of config.GUILDS) {
      const { id: guildId, channel: channelId } = guild;
      const [replyString, counts] = await createSnailCountMessageString(
        client,
        guildId,
        "this-year",
      );
      const channel = client.channels.cache.get(channelId);
      channel.send(replyString);
    }
  });
}

export function heavySnailCountCheck(client, schedule) {
  cron.schedule(schedule, async () => {
    for (let guild of config.GUILDS) {
      const { id: guildId, channel: channelId } = guild;
      const [replyString, counts] = await createSnailCountMessageString(
        client,
        guildId,
        "last-hour",
      );
      if (Object.keys(counts).length === 0) {
        return;
      }

      const [maxKey, maxValue] = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? [a, counts[a]] : [b, counts[b]]);

      if (maxValue < 8) {
        return;
      } 

      const channel = client.channels.cache.get(channelId);
      channel.send(`${maxKey} is getting so snailed right now guys ${maxValue} in one hour!`);
    }
  });
}
