import { PerServerEventHandlers } from "./types"
import { EventHandlers } from "@robbot/robbot-core/dist/handlers"
import R from "ramda"
import { produce } from "immer"

export const createServerFilterMiddleware = (
  configuration: PerServerEventHandlers
): EventHandlers => {
  const defaultEventHandlers = R.clone(configuration.defaultEventHandlers)

  return produce(defaultEventHandlers, (draft) => {
    draft.message = (message) => {
      if (message.guild) {
        const guildSnowflake = message.guild.id
        const messageHandler = configuration[guildSnowflake]?.message

        if (messageHandler) {
          messageHandler(message)
        } else {
          defaultEventHandlers.message(message)
        }
      }
    }
  })
}

export * from "./types"
