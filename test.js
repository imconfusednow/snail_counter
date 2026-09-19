

import {
  createSnailCountMessageString,
} from "#utils/functions.js";
import config from "#config" with { type: "json" };


const counts = {"nen normal nips": 10}

function heavySnailCountCheck() {
    for (let guild of config.GUILDS) {
      const { id: guildId, channel: channelId } = guild;

      if (Object.keys(counts).length === 0) {
        return;
      }

      console.log(Object.keys(counts))

      const maxKey = Object.keys(counts).reduce((a, b) =>
        counts[a] > counts[b] ? a : b,
      );
      const maxValue = counts[maxKey]
      console.log(`${maxKey} is getting so snailed right now guys ${maxValue} in one hour!`);
    }
}

heavySnailCountCheck()